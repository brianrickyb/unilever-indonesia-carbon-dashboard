// Pembuat CSV/JSON. Dipakai oleh tombol unduh di dashboard dan oleh scripts/build-data.mjs,
// sehingga file di folder data/ selalu sama dengan yang ditampilkan.

import { COMPANY, YEARS, INDICATORS, OBSERVATIONS, REPORTS, STATUS, YEAR_CONTEXT, REPORT_INDEX, RETRIEVED, BASELINE_2015, REPORTED_REDUCTION_CLAIMS, primaryObservation, sourceUrl } from '../data/official.mjs';
import { derived, locationBasedEstimate, alertsFor, ALERT_RULES, THRESHOLDS } from './analysis.mjs';
import { summarise } from './calculator.mjs';
import { UNITS } from '../data/factors.mjs';

function cell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 1e6) / 1e6) : '';
  let text = String(v);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; // cegah formula injection di spreadsheet
  return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}
export const toCsv = rows => rows.map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';

const OFFICIAL_HEADER = ['company', 'year', 'indicator_id', 'indicator', 'value', 'unit', 'status', 'status_label', 'boundary', 'component_of', 'source_report_year', 'printed_page', 'pdf_page', 'source_url', 'source_table', 'note'];

function officialRow(o) {
  const ind = INDICATORS[o.indicator];
  return [COMPANY, o.year, o.indicator, ind.label, o.value, ind.unit, o.status, STATUS[o.status], ind.boundary, ind.componentOf ?? '', o.report ?? '', o.page ?? '', o.pdfPage ?? '', o.report ? sourceUrl(o.report, o.page) : REPORT_INDEX, o.table ?? '', o.note ?? ''];
}

// Seri utama: satu baris per indikator × tahun, nilai kosong tetap kosong.
export function officialRows() {
  const rows = [];
  for (const id of Object.keys(INDICATORS)) for (const y of YEARS) {
    const o = primaryObservation(id, y);
    if (o) rows.push(o);
  }
  return rows;
}
export function officialCsv() { return toCsv([OFFICIAL_HEADER, ...officialRows().map(officialRow)]); }

export function versionsCsv() {
  return toCsv([['use', ...OFFICIAL_HEADER], ...OBSERVATIONS.map(o => [o.use, ...officialRow(o)])]);
}

// Metrik hasil perhitungan dashboard (bukan angka laporan).
export const DERIVED_DEFS = Object.freeze({
  refrigerantShare: { label: 'Porsi refrigeran dari Scope 1', unit: '%', formula: 's1_refrigerant ÷ s1 × 100' },
  fuelShare: { label: 'Porsi gas & light fuel dari Scope 1', unit: '%', formula: 's1_fuel ÷ s1 × 100' },
  componentGap: { label: 'Selisih Scope 1 − (gas & light fuel + refrigeran)', unit: 't CO2e', formula: 's1 − (s1_fuel + s1_refrigerant)' },
  impliedFuelFactor: { label: 'Faktor implisit bahan bakar on-site', unit: 'kg CO2e/GJ', formula: 's1_fuel × 1000 ÷ en_nonre_onsite' },
  renewableShareComputed: { label: 'Porsi energi terbarukan (dihitung)', unit: '%', formula: 'energy_renewable ÷ energy_total × 100' },
  recShare: { label: 'Porsi listrik dicakup REC dari energi total', unit: '%', formula: 'en_rec ÷ energy_total × 100' },
  onsiteRenewableShare: { label: 'Porsi energi terbarukan on-site (biomassa + PV)', unit: '%', formula: '(en_biomass + en_solar) ÷ energy_total × 100' },
  fossilOnsiteShare: { label: 'Porsi bahan bakar fosil on-site', unit: '%', formula: 'en_nonre_onsite ÷ energy_total × 100' },
  purchasedGridMwh: { label: 'Listrik jaringan yang dibeli', unit: 'MWh', formula: '(en_rec + en_nonre_grid bila dilaporkan) ÷ 3,6' },
});

export function derivedRows() {
  const rows = [];
  for (const y of YEARS) {
    const d = derived(y);
    for (const [k, def] of Object.entries(DERIVED_DEFS)) rows.push({ year: y, id: k, ...def, value: d[k], type: 'hasil_perhitungan' });
    const est = locationBasedEstimate(y);
    rows.push({ year: y, id: 'scope2_location_estimate', label: 'Estimasi independen Scope 2 location-based (CM ESDM 2019, Jamali)', unit: 't CO2', formula: 'purchasedGridMwh × 0,87', value: est?.central ?? null, type: 'estimasi_independen' });
    rows.push({ year: y, id: 'scope2_location_estimate_low', label: 'Estimasi independen Scope 2 location-based, batas bawah (OM ESDM 2019, Jamali)', unit: 't CO2', formula: 'purchasedGridMwh × 0,80', value: est?.low ?? null, type: 'estimasi_independen' });
  }
  return rows;
}
export function derivedCsv() {
  return toCsv([['company', 'year', 'metric_id', 'metric', 'value', 'unit', 'data_type', 'formula'], ...derivedRows().map(r => [COMPANY, r.year, r.id, r.label, r.value, r.unit, r.type, r.formula])]);
}

// CSV gabungan untuk Tableau: satu tabel panjang, data_type membedakan resmi vs hitungan,
// `sum_safe` = FALSE untuk baris yang tumpang tindih (subtotal, komponen, persentase).
export function tableauCsv() {
  const header = ['company', 'year', 'data_type', 'metric_id', 'metric', 'metric_group', 'value', 'unit', 'status', 'is_missing', 'sum_safe', 'boundary', 'source_report_year', 'printed_page', 'pdf_page', 'source_url', 'note'];
  const official = officialRows().map(o => {
    const ind = INDICATORS[o.indicator];
    const sumSafe = ['s1_fuel', 's1_refrigerant', 's2_reported'].includes(o.indicator) || ['en_biomass', 'en_solar', 'en_rec', 'en_nonre_onsite', 'en_nonre_grid'].includes(o.indicator);
    return [COMPANY, o.year, 'resmi_laporan', o.indicator, ind.label, ind.group, o.value, ind.unit, o.status, o.value === null ? 'TRUE' : 'FALSE', sumSafe ? 'TRUE' : 'FALSE', ind.boundary, o.report ?? '', o.page ?? '', o.pdfPage ?? '', o.report ? sourceUrl(o.report, o.page) : REPORT_INDEX, o.note];
  });
  const calc = derivedRows().map(r => [COMPANY, r.year, r.type, r.id, r.label, 'turunan', r.value, r.unit, r.value === null ? 'not_computable' : 'computed', r.value === null ? 'TRUE' : 'FALSE', 'FALSE', '', '', '', '', '', r.formula]);
  return toCsv([header, ...official, ...calc]);
}

export function alertsCsv() {
  const rows = [['year', 'alert_id', 'type', 'severity', 'title', 'problem', 'evidence', 'impact', 'action', 'rule']];
  for (const y of YEARS) for (const a of alertsFor(y)) rows.push([y, a.id, a.type, a.severity, a.title, a.problem, a.evidence, a.impact, a.action, a.rule]);
  return toCsv(rows);
}

export function datasetJson() {
  return {
    meta: { company: COMPANY, scope: 'PT Unilever Indonesia Tbk saja; tidak memuat data Unilever global.', years: YEARS, retrieved: RETRIEVED, reportIndex: REPORT_INDEX,
      rules: ['null = tidak tersedia, bukan nol; lihat status', 'seri utama = revisi terakhir yang konsisten secara internal', 'jangan menjumlahkan subtotal dengan komponennya', 'intensitas hanya manufaktur'] },
    reports: REPORTS, statuses: STATUS, indicators: INDICATORS,
    series: officialRows(), versions: OBSERVATIONS, yearContext: YEAR_CONTEXT,
    baseline2015: BASELINE_2015, reportedReductionClaims: REPORTED_REDUCTION_CLAIMS,
    derived: derivedRows(), alertRules: ALERT_RULES, thresholds: THRESHOLDS,
  };
}

export function calculatorCsv(rows, year) {
  const s = summarise(rows, year);
  const out = [['inventory_year', 'scope', 'scope3_category', 'name', 'source_group', 'quantity', 'unit', 'factor_value', 'factor_unit', 'factor_region', 'factor_valid_for', 'factor_sources', 'assumptions', 'formula', 't_co2e', 'memo_t', 'memo_label', 'data_type']];
  for (const r of s.results) {
    out.push([year, r.scope, r.group.category ?? '', r.name, r.group.label, r.quantity, UNITS[r.unit].label, r.factor.value, r.factor.unit, r.factor.region, r.factor.validFor,
      r.factor.sources.map(x => `${x.label} (${x.url})`).join(' | '), r.factor.assumptions.join(' '), r.formula, r.tonnes, r.memoTonnes, r.memoLabel ?? '', 'hasil_kalkulator_pengguna']);
  }
  return toCsv(out);
}
