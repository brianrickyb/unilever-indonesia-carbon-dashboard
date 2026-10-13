// Tampilan halaman. Prinsip: satu layar dashboard menjawab "bagaimana situasinya?",
// detail (definisi, bukti, metode) ada di balik tooltip ⓘ atau tombol "Detail".
// Grafik digambar terpisah lewat chartSpecs() setelah lebar kontainer diketahui.

import { YEARS, INDICATORS, OBSERVATIONS, REPORTS, STATUS, YEAR_CONTEXT, REPORT_INDEX, RETRIEVED, BASELINE_2015, REPORTED_REDUCTION_CLAIMS, value, primaryObservation, sourceUrl } from '../data/official.mjs';
import { yoy, derived, locationBasedEstimate, alertsFor, ALERT_RULES, THRESHOLDS, insights, RECOMMENDATIONS, scenario } from '../lib/analysis.mjs';
import { SOURCE_GROUPS, UNITS, INVENTORY_YEARS, REFS, GWP, ASSUMPTIONS, biodieselBlend, resolveFactor, sourceGroup } from '../data/factors.mjs';
import { summarise, activityWarnings, computeActivity } from '../lib/calculator.mjs';
import { lineChart, columnChart, groupedBars } from './charts.mjs';
import { esc, num, val, change, unitLabel, compact } from './format.mjs';

export const PAGES = Object.freeze({
  dashboard: 'Dashboard',
  analisis: 'Analisis tren',
  aksi: 'Temuan & aksi',
  peringatan: 'Peringatan',
  kalkulator: 'Kalkulator',
  data: 'Data & metode',
});
// Tautan lama tetap berfungsi.
export const ALIASES = Object.freeze({ ringkasan: 'dashboard', tren: 'analisis', temuan: 'aksi', rekomendasi: 'aksi' });

const C = { blue: 'var(--s1)', orange: 'var(--s2)', aqua: 'var(--s3)', yellow: 'var(--s4)', magenta: 'var(--s5)' };

// ---------- komponen kecil ----------
export const src = (report, page, text) => report
  ? `<a class="src" href="${sourceUrl(report, page)}" target="_blank" rel="noopener noreferrer">${esc(text ?? `Laporan ${report}, hlm. ${page}`)}</a>`
  : '';
const srcObs = (o, text) => (o?.report ? src(o.report, o.page, text) : '');
const tag = (kind, text) => `<span class="tag tag-${kind}">${esc(text ?? { resmi: 'Data resmi', hitung: 'Hasil hitung', estimasi: 'Estimasi', usulan: 'Usulan', asumsi: 'Asumsi', kalkulator: 'Hasil kalkulator' }[kind])}</span>`;
const info = (text, label = 'Penjelasan') => `<button type="button" class="info" data-tip="${esc(text)}" aria-label="${esc(label)}: ${esc(text)}">i</button>`;
const SEV_ICON = { tinggi: '▲', sedang: '■', rendah: '●' };

export function yearSwitch(state) {
  return `<div class="segmented" role="group" aria-label="Pilih tahun laporan">${YEARS.map(y => `<button type="button" data-year="${y}" aria-pressed="${y === state.year}">${y}</button>`).join('')}</div>`;
}

function pageHead(title, lead, state, { yearPicker = true, actions = '' } = {}) {
  return `<header class="page-head">
    <div class="page-head-text"><h1>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>
    <div class="page-head-tools">${yearPicker ? `<span class="tool-label">Tahun</span>${yearSwitch(state)}` : ''}${actions}</div>
  </header>`;
}

const expandBtn = title => `<button type="button" class="expand-btn" data-expand aria-label="Perbesar grafik: ${esc(title)}" title="Perbesar">⤢</button>`;

function card(title, body, { sub = '', id = '', cls = '', foot = '', expand = false } = {}) {
  return `<section class="card ${cls}${expand ? ' viz' : ''}" ${id ? `id="${id}"` : ''}>
    <header class="card-head${expand ? ' with-tool' : ''}"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${expand ? expandBtn(title) : ''}</header>
    ${expand ? `<div class="expand-body">${body}</div>` : body}
    ${foot ? `<footer class="card-foot">${foot}</footer>` : ''}
  </section>`;
}

const chartBox = id => `<div class="chart-box" data-chart="${id}"></div>`;

const ANNOTATIONS = [
  { year: 2020, mark: 'R', tip: '2020: angka hasil revisi laporan 2021–2022 (batas ditambah logistik dan kantor).' },
  { year: 2023, mark: 'B', tip: '2023: definisi batas logistik berubah; energi gudang turun 58%.' },
  { year: 2025, mark: 'B', tip: '2025: gudang 3 → 11; pabrik es krim hanya Januari–November.' },
];
const annotKey = '<span class="annot-key">R</span> angka revisi · <span class="annot-key">B</span> batas pelaporan berubah';

function missingText(indicator, year) {
  const o = primaryObservation(indicator, year);
  if (!o) return 'tidak tersedia';
  return `${STATUS[o.status].toLowerCase()}${o.report ? ` (laporan ${o.report} hlm. ${o.page})` : ''}`;
}
const pts = indicator => YEARS.map(y => ({ year: y, v: value(indicator, y), missing: missingText(indicator, y) }));

function simpleTable(indicators, { years = YEARS } = {}) {
  return `<div class="table-wrap"><table><thead><tr><th scope="col">Indikator</th><th scope="col">Satuan</th>${years.map(y => `<th scope="col" class="num">${y}</th>`).join('')}</tr></thead><tbody>
    ${indicators.map(id => `<tr><th scope="row">${esc(INDICATORS[id].short)}</th><td class="unit-cell">${esc(unitLabel(INDICATORS[id].unit))}</td>${years.map(y => {
      const o = primaryObservation(id, y);
      return `<td class="num">${!o || o.value === null ? `<span class="na" title="${esc(STATUS[o?.status] ?? '')}">${o?.status === 'reported_dash' ? '“–”' : 'n/a'}</span>` : `<a class="cell-link" href="${sourceUrl(o.report, o.page)}" target="_blank" rel="noopener noreferrer" title="Laporan ${o.report} hlm. ${o.page}">${val(o.value, INDICATORS[id].unit)}</a>`}</td>`;
    }).join('')}</tr>`).join('')}
  </tbody></table></div>`;
}

// =====================================================================
// DASHBOARD — satu layar: masalah, peringatan, KPI, tren, insight, scope, kontribusi
// =====================================================================

function kpi({ label, def, valueHtml, unit, deltaHtml = '', note = '', obs, state = '' }) {
  return `<article class="kpi ${state}">
    <div class="kpi-top"><span class="kpi-label">${label}</span>${info(def, label)}</div>
    <p class="kpi-num">${valueHtml}${unit ? `<span class="kpi-unit">${esc(unitLabel(unit))}</span>` : ''}</p>
    <p class="kpi-foot">${deltaHtml}${note ? `<span class="kpi-note">${note}</span>` : ''}</p>
    ${obs?.report ? `<a class="kpi-src" href="${sourceUrl(obs.report, obs.page)}" target="_blank" rel="noopener noreferrer">Laporan ${obs.report} · hlm. ${obs.page}</a>` : ''}
  </article>`;
}

function deltaPill(c, year, goodWhenDown = true) {
  if (c === null) return `<span class="pill neutral">Tidak ada pembanding</span>`;
  const good = goodWhenDown ? c < 0 : c > 0;
  return `<span class="pill ${good ? 'good' : 'bad'}">${c < 0 ? '▼' : '▲'} ${num(Math.abs(c), 1)}%</span><span class="kpi-note">vs ${year - 1}</span>`;
}

export function dashboard(state) {
  const y = state.year, d = derived(y), est = locationBasedEstimate(y);
  const s1 = primaryObservation('s1', y), s2 = primaryObservation('s2_reported', y), s3 = primaryObservation('s3', y);
  const alerts = alertsFor(y);
  const top = alerts.filter(a => a.severity === 'tinggi').slice(0, 3);
  const shown = top.length ? top : alerts.slice(0, 2);

  return `
  <section class="intro">
    <div class="intro-text">
      <p class="eyebrow">PT Unilever Indonesia Tbk · sustainability report 2020–2025</p>
      <h1>Emisi turun, data jejak karbon belum lengkap</h1>
      <p class="problem"><strong>Masalah yang dijawab:</strong> Scope 1 Unilever Indonesia turun tajam, tetapi Scope 2 hanya dilaporkan dengan sertifikat (market-based) dan Scope 3 tidak dipublikasikan sejak 2021. Seberapa jauh angka ini bisa dipakai untuk keputusan?</p>
    </div>
    <div class="intro-year"><span class="tool-label">Tahun laporan</span>${yearSwitch(state)}</div>
  </section>

  <a class="flagbar ${alerts.some(a => a.severity === 'tinggi') ? 'has-high' : ''}" href="#peringatan">
    <span class="flag-count"><strong>${alerts.length}</strong> peringatan ${y}</span>
    <span class="flag-list">${shown.map(a => `<span class="flag sev-${a.severity}"><i aria-hidden="true">${SEV_ICON[a.severity]}</i>${esc(a.title)}</span>`).join('') || '<span class="flag">Tidak ada peringatan</span>'}</span>
    <span class="flag-more">Lihat semua →</span>
  </a>

  <section class="kpi-row" aria-label="Indikator utama ${y}">
    ${kpi({ label: 'Scope 1', def: INDICATORS.s1.definition, valueHtml: num(s1.value, 0), unit: 't CO2e', deltaHtml: deltaPill(yoy('s1', y), y), obs: s1 })}
    ${kpi({ label: 'Scope 2 dilaporkan', def: 'Tabel utama laporan menulis “–” (bukan nol). Listrik yang dibeli diklaim terbarukan dengan sertifikat REC/I-REC, sehingga tidak dihitung (market-based). Angka location-based tidak diungkapkan.',
      valueHtml: s2.value === null ? '–' : num(s2.value, 0), unit: s2.value === null ? '' : 't CO2e', state: s2.value === null ? 'is-muted' : '',
      deltaHtml: `<span class="pill neutral">${s2.value === null ? 'Tanda “–”, bukan nol' : 'Listrik tanpa sertifikat'}</span>`, note: est ? `Estimasi location-based ≈ ${compact(est.low)}–${compact(est.central)} t` : '', obs: s2 })}
    ${kpi({ label: 'Scope 3', def: INDICATORS.s3.definition, valueHtml: s3.value === null ? 'Tidak dilaporkan' : num(s3.value, 0), unit: s3.value === null ? '' : 't CO2e', state: s3.value === null ? 'is-missing' : '',
      deltaHtml: s3.value === null ? `<span class="pill warn">${s3.status === 'not_published' ? 'Belum dipublikasikan' : 'Tidak tercantum'}</span>` : deltaPill(yoy('s3', y), y), note: s3.value === null ? 'Angka terakhir: 2021' : '', obs: s3 })}
    ${kpi({ label: 'Intensitas emisi', def: INDICATORS.ei_mfg.definition, valueHtml: num(value('ei_mfg', y), 2), unit: 'kg CO2e/ton produk', deltaHtml: deltaPill(yoy('ei_mfg', y), y), obs: primaryObservation('ei_mfg', y) })}
    ${kpi({ label: 'Energi terbarukan', def: INDICATORS.energy_renewable_share.definition, valueHtml: num(value('energy_renewable_share', y), 0) + '%', unit: '',
      deltaHtml: `<span class="pill neutral">${num(d.recShare, 0)}% dari sertifikat</span>`, note: `on-site ${num(d.onsiteRenewableShare, 0)}%`, obs: primaryObservation('energy_renewable_share', y) })}
  </section>

  <div class="dash-grid">
    ${card('Tren emisi operasional', chartBox('ops'), { expand: true, cls: 'span-2', sub: 'Scope 1+2 yang dilaporkan, t CO₂e', foot: `${annotKey} · arahkan kursor ke titik untuk angka` })}
    ${card('Insight utama', `<ol class="insight-box">${insights().map((i, n) => `<li>
        <span class="ib-n">${n + 1}</span>
        <div><h3>${esc(i.headline)}</h3><p class="ib-stat">${esc(i.stat)} <span>${esc(i.statUnit)}</span></p><p class="ib-text">${esc(i.short)}</p></div>
      </li>`).join('')}</ol>`, { cls: 'insight-card', foot: '<a href="#aksi">Bukti & rekomendasi →</a>' })}
  </div>

  <div class="dash-grid two">
    ${card(`Perbandingan scope ${y}`, scopeBars(y), { expand: true, sub: 't CO₂e · batang arsir = estimasi independen, bukan angka laporan' })}
    ${card(`Kontribusi sumber ${y}`, contribution(y), { expand: true, sub: 'Porsi dari total masing-masing' })}
  </div>

  <p class="dash-note">Angka resmi dari sustainability report PT Unilever Indonesia Tbk; perubahan tahunan dan estimasi adalah hasil hitung dashboard. Data kosong tidak diisi nol. <a href="#data">Sumber & metode</a></p>`;
}

function scopeBars(y) {
  const est = locationBasedEstimate(y);
  const rows = [
    { label: 'Scope 1', v: value('s1', y), cls: 'b-s1' },
    { label: 'Scope 2 dilaporkan', v: value('s2_reported', y), cls: 'b-s2', empty: 'Tanda “–” di laporan' },
    { label: 'Scope 2 location-based', v: est?.central ?? null, cls: 'b-est', tagged: true, empty: 'Tidak dapat diestimasi' },
    { label: 'Scope 3', v: value('s3', y), cls: 'b-s3', empty: primaryObservation('s3', y).status === 'not_published' ? 'Belum dipublikasikan' : 'Tidak tercantum' },
  ];
  const max = Math.max(...rows.map(r => r.v ?? 0));
  return `<div class="hbars">${rows.map(r => `<div class="hbar">
      <span class="hbar-label">${esc(r.label)}${r.tagged ? ' ' + tag('estimasi') : ''}</span>
      <div class="hbar-track">${r.v === null ? `<span class="hbar-empty">${esc(r.empty)}</span>` : `<span class="hbar-fill ${r.cls}" style="width:${Math.max(0.6, r.v / max * 80)}%" data-tip="${esc(`${r.label} ${y}: ${num(r.v, 0)} t CO₂e`)}"></span><span class="hbar-val">${compact(r.v)}</span>`}</div>
    </div>`).join('')}</div>
    ${value('s3', y) !== null ? '<p class="card-note">Scope 3 jauh lebih besar dari operasi, sehingga batang Scope 1 tampak sangat kecil.</p>' : '<p class="card-note">Total Scope 1–3 tidak ditampilkan karena Scope 3 tidak tersedia.</p>'}`;
}

function stackRow(title, parts, totalText) {
  const total = parts.reduce((s, p) => s + (p.v ?? 0), 0);
  const shown = parts.filter(p => p.v);
  return `<div class="stack">
    <div class="stack-head"><span>${title}</span><span class="muted">${totalText}</span></div>
    <div class="stack-bar">${shown.map(p => `<span style="width:${p.v / total * 100}%;background:${p.color}" data-tip="${esc(`${p.label}: ${num(p.v / total * 100, 1)}%`)}"></span>`).join('')}</div>
    <ul class="stack-legend">${shown.map(p => `<li><i style="background:${p.color}"></i>${esc(p.label)} <strong>${num(p.v / total * 100, p.v / total < 0.1 ? 1 : 0)}%</strong></li>`).join('')}</ul>
  </div>`;
}

function contribution(y) {
  return stackRow('Emisi Scope 1', [
    { label: 'Gas & light fuel', v: value('s1_fuel', y), color: C.blue },
    { label: 'Refrigeran', v: value('s1_refrigerant', y), color: C.orange },
  ], `${num(value('s1', y), 0)} t CO₂e`) + stackRow('Energi', [
    { label: 'Listrik + sertifikat REC', v: value('en_rec', y), color: C.blue },
    { label: 'Bahan bakar fosil', v: value('en_nonre_onsite', y), color: C.orange },
    { label: 'Biomassa', v: value('en_biomass', y), color: C.aqua },
    { label: 'PV surya', v: value('en_solar', y), color: C.yellow },
    { label: 'Listrik tanpa sertifikat', v: value('en_nonre_grid', y), color: C.magenta },
  ], `${compact(value('energy_total', y))} GJ`);
}

// =====================================================================
// ANALISIS TREN
// =====================================================================
export const TREND_METRICS = ['ops_s12', 's1', 's1_fuel', 's1_refrigerant', 's2_reported', 's3', 'energy_total', 'energy_renewable_share', 'ei_mfg', 'energy_intensity_mfg'];

export function analisis(state) {
  const m = state.metric;
  return pageHead('Analisis tren 2020–2025', 'Pilih indikator untuk melihat perubahannya. Tahun tanpa data tampil sebagai celah, bukan nol.', state, {
    actions: `<button class="btn" data-download="tableau">Unduh CSV Tableau</button>`,
  }) + `
  <section class="card viz">
    <header class="card-head row">
      <h2 class="sr-only">Tren: ${esc(INDICATORS[m].short)} (${esc(unitLabel(INDICATORS[m].unit))})</h2>
      <label class="metric-pick">Indikator <select id="metric-select">${TREND_METRICS.map(k => `<option value="${k}" ${k === m ? 'selected' : ''}>${esc(INDICATORS[k].short)} (${esc(unitLabel(INDICATORS[k].unit))})</option>`).join('')}</select></label>
      ${info(INDICATORS[m].definition + ' Batas: ' + INDICATORS[m].boundary, INDICATORS[m].short)}
      ${expandBtn('Tren ' + INDICATORS[m].short)}
    </header>
    <div class="expand-body">${chartBox('metric')}</div>
    <footer class="card-foot">${annotKey}</footer>
  </section>
  <div class="dash-grid two">
    ${card('Sumber Scope 1 per tahun', chartBox('scope1mix'), { expand: true, sub: 't CO₂e · gas & light fuel vs refrigeran' })}
    ${card('Bauran energi per tahun', chartBox('energymix'), { expand: true, sub: 'GJ · * listrik tanpa sertifikat bertanda “–”' })}
  </div>
  <div class="dash-grid two">
    ${card('Intensitas emisi', chartBox('ei'), { expand: true, sub: 'kg CO₂e per ton produk · hanya manufaktur' })}
    ${card('Intensitas energi', chartBox('enint'), { expand: true, sub: 'GJ per ton produk · hanya manufaktur' })}
  </div>
  <p class="callout">${tag('hitung')} 2021→2025 intensitas emisi turun ${num(Math.abs((value('ei_mfg', 2025) - value('ei_mfg', 2021)) / value('ei_mfg', 2021) * 100), 0)}%, intensitas energi hanya ${num(Math.abs((value('energy_intensity_mfg', 2025) - value('energy_intensity_mfg', 2021)) / value('energy_intensity_mfg', 2021) * 100), 0)}%. Penurunan emisi bukan hanya dari efisiensi energi, tetapi juga pergantian bahan bakar dan sertifikat.</p>
  ${card('Scope 3: 2020 vs 2021', chartBox('scope3'), { expand: true, sub: 't CO₂e · hanya dua tahun ini yang memiliki angka' })}
  <details class="card details-card" open><summary><h2>Tabel lengkap 2020–2025</h2><span class="muted">Klik angka untuk membuka halaman PDF sumber</span></summary>
    ${simpleTable(['ops_s12', 's1', 's1_fuel', 's1_refrigerant', 's2_reported', 's3', 'full_value_chain', 'ei_mfg', 'energy_total', 'energy_renewable_share', 'en_rec', 'en_biomass', 'en_solar', 'en_nonre_onsite', 'energy_mfg', 'energy_warehouse', 'energy_office', 'energy_intensity_mfg'])}
    <p class="card-note">“–” = tanda di tabel laporan · n/a = tidak tersedia · jangan menjumlahkan subtotal dengan komponennya.</p>
    <div class="btn-row"><button class="btn" data-download="official">Seri utama (CSV)</button><button class="btn" data-download="tableau">Tableau (CSV)</button><button class="btn" data-download="json">JSON</button></div>
  </details>`;
}

export function chartSpecs(state) {
  const y = state.year;
  return {
    ops: (w, h) => lineChart({ width: w, height: h ?? (w > 600 ? 360 : 270), years: YEARS, unit: 't CO2e', selectedYear: y, annotations: ANNOTATIONS, label: 'Emisi operasional Scope 1+2 2020–2025', series: [{ label: 'Operasional S1+2', color: C.blue, values: pts('ops_s12') }] }),
    metric: (w, h) => {
      const unit = INDICATORS[state.metric].unit;
      const maxV = Math.max(...YEARS.map(yr => value(state.metric, yr) ?? 0));
      const dec = unit === '%' ? 0 : ['t CO2e', 'GJ'].includes(unit) && maxV >= 1000 ? 0 : 2;
      return lineChart({ width: w, height: h ?? 270, years: YEARS, unit, selectedYear: y, decimals: dec, annotations: ANNOTATIONS, label: INDICATORS[state.metric].label, series: [{ label: INDICATORS[state.metric].short, color: C.blue, values: pts(state.metric) }] });
    },
    scope1mix: (w, h) => columnChart({ width: w, height: h ?? 270, years: YEARS, unit: 't CO2e', selectedYear: y, label: 'Komponen Scope 1 per tahun',
      stacks: [{ key: 'fuel', label: 'Gas & light fuel', color: C.blue }, { key: 'ref', label: 'Refrigeran', color: C.orange }],
      data: Object.fromEntries(YEARS.map(yr => [yr, { fuel: value('s1_fuel', yr), ref: value('s1_refrigerant', yr) }])) }),
    energymix: (w, h) => columnChart({ width: w, height: h ?? 270, years: YEARS, unit: 'GJ', selectedYear: y, label: 'Bauran energi per sumber 2020–2025',
      stacks: [{ key: 'rec', label: 'Listrik + REC', color: C.blue }, { key: 'fossil', label: 'Bahan bakar fosil', color: C.orange }, { key: 'bio', label: 'Biomassa', color: C.aqua }, { key: 'pv', label: 'PV surya', color: C.yellow }, { key: 'grid', label: 'Listrik tanpa sertifikat', color: C.magenta }],
      data: Object.fromEntries(YEARS.map(yr => [yr, { rec: value('en_rec', yr), fossil: value('en_nonre_onsite', yr), bio: value('en_biomass', yr), pv: value('en_solar', yr), grid: value('en_nonre_grid', yr) }])) }),
    ei: (w, h) => columnChart({ width: w, height: h ?? 270, years: YEARS, unit: 'kg CO2e/ton produk', selectedYear: y, decimals: 2, label: 'Intensitas emisi manufaktur', stacks: [{ key: 'v', label: 'Intensitas emisi', color: C.blue }], data: Object.fromEntries(YEARS.map(yr => [yr, { v: value('ei_mfg', yr) }])) }),
    enint: (w, h) => columnChart({ width: w, height: h ?? 270, years: YEARS, unit: 'GJ/ton produk', selectedYear: y, decimals: 2, label: 'Intensitas energi manufaktur', stacks: [{ key: 'v', label: 'Intensitas energi', color: C.blue }], data: Object.fromEntries(YEARS.map(yr => [yr, { v: value('energy_intensity_mfg', yr) }])) }),
    scope3: (w, h) => groupedBars({ width: w, barH: h ? 20 : 12, unit: 't CO2e', label: 'Scope 3 per kelompok 2020 dan 2021',
      keys: [{ key: 2020, label: '2020 (revisi)', color: C.aqua }, { key: 2021, label: '2021', color: C.blue }],
      rows: ['s3_ingredients_packaging', 's3_consumer_use', 's3_distribution_retail', 's3_disposal', 's3_inbound_transport'].map(k => ({ label: INDICATORS[k].short, 2020: value(k, 2020), 2021: value(k, 2021) })) }),
  };
}

// =====================================================================
// TEMUAN & AKSI — setiap temuan dipasangkan dengan rekomendasinya
// =====================================================================
export function aksi(state) {
  const ins = insights();
  return pageHead('Temuan & aksi', 'Tiga temuan dari data laporan, masing-masing dengan satu usulan tindakan. Usulan ini analisis independen, bukan rencana perusahaan.', state, { yearPicker: false }) +
    `<ol class="pairs">${ins.map((i, n) => {
      const r = RECOMMENDATIONS.find(x => x.insight === i.id);
      return `<li class="pair" id="${i.id}">
        <section class="pair-find">
          <p class="step">Temuan ${n + 1}</p>
          <h2>${esc(i.headline)}</h2>
          <p class="big-stat">${esc(i.stat)} <span>${esc(i.statUnit)}</span></p>
          <p>${esc(i.short)}</p>
          <details><summary>Bukti dari laporan</summary><ul>${i.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p class="src-line">${i.sources.map(s => src(s.report, s.page)).join(' · ')}</p></details>
          <details><summary>Artinya & keterbatasan</summary><p><strong>Interpretasi:</strong> ${esc(i.interpretation)}</p><p><strong>Implikasi bisnis:</strong> ${esc(i.implication)}</p><p class="muted"><strong>Keterbatasan:</strong> ${esc(i.limits)}</p></details>
        </section>
        <section class="pair-act">
          <p class="step">Aksi ${n + 1} ${tag('usulan')}</p>
          <h2>${esc(r.title)}</h2>
          <dl class="facts"><div><dt>Tim</dt><dd>${esc(r.owner)}</dd></div><div><dt>Prioritas</dt><dd><span class="pill bad">${esc(r.priority)}</span> ${esc(r.horizon)}</dd></div></dl>
          <ul class="checks">${r.actions.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
          <details><summary>KPI yang dipantau</summary><ul>${r.kpis.map(k => `<li>${esc(k)}</li>`).join('')}</ul></details>
          <details><summary>Langkah 30–90 hari</summary><ol>${r.first90.map(k => `<li>${esc(k)}</li>`).join('')}</ol></details>
          ${r.estimate ? `<details><summary>Rumus estimasi</summary><p><code>${esc(r.estimate.formula)}</code></p><p class="muted">${esc(r.estimate.note)}</p></details>` : ''}
        </section>
      </li>`;
    }).join('')}</ol>` + simulator(state);
}

function simulator(state) {
  const sc = scenario(state.year, state.fuelPct, state.refPct);
  return `<section class="card simulator" aria-labelledby="sim-title">
    <div>
      <h2 id="sim-title">Coba simulasi pengurangan Scope 1</h2>
      <p class="muted">Geser persentase untuk melihat dampaknya pada angka laporan. Mulai dari 0%; bukan target perusahaan.</p>
      <label class="field">Tahun dasar <select id="sim-year">${YEARS.map(y => `<option ${y === state.year ? 'selected' : ''}>${y}</option>`).join('')}</select></label>
      <label class="field" for="sim-fuel">Kurangi emisi gas & light fuel <output id="out-fuel">${state.fuelPct}%</output></label>
      <input id="sim-fuel" type="range" min="0" max="100" step="1" value="${state.fuelPct}">
      <label class="field" for="sim-ref">Kurangi emisi refrigeran <output id="out-ref">${state.refPct}%</output></label>
      <input id="sim-ref" type="range" min="0" max="100" step="1" value="${state.refPct}">
      <button class="btn" type="button" data-action="sim-reset">Reset</button>
    </div>
    <div class="sim-result" id="sim-result">${simulatorResult(sc)}</div>
  </section>`;
}

export function simulatorResult(sc) {
  if (!sc) return '<p>Data Scope 1 tidak tersedia untuk tahun ini.</p>';
  return `<p class="muted">Scope 1 ${sc.year}: ${num(sc.baseline, 0)} t CO₂e</p>
    <p class="big">${sc.avoided ? "−" : ""}${num(sc.avoided, 0)} <span>t CO₂e berkurang</span></p>
    <p>Menjadi <strong>${num(sc.projected, 0)} t CO₂e</strong>${sc.baseline ? ` (−${num(sc.avoided / sc.baseline * 100, 1)}%)` : ''}</p>
    <p class="card-note">${tag('hitung')} Scope 1 − gas × % − refrigeran × %. Emisi dari energi pengganti belum dihitung.</p>`;
}

// =====================================================================
// PERINGATAN
// =====================================================================
export function peringatan(state) {
  const y = state.year, alerts = alertsFor(y);
  const perf = alerts.filter(a => a.type === 'kinerja'), qual = alerts.filter(a => a.type === 'kualitas');
  const item = a => `<details class="alert sev-${a.severity}">
      <summary><span class="sev"><i aria-hidden="true">${SEV_ICON[a.severity]}</i> ${a.severity}</span><span class="alert-title">${esc(a.title)}</span><span class="alert-evi">${esc(a.evidence)}</span></summary>
      <dl class="alert-body"><div><dt>Masalah</dt><dd>${esc(a.problem)}</dd></div><div><dt>Dampak pada analisis</dt><dd>${esc(a.impact)}</dd></div><div><dt>Tindak lanjut</dt><dd>${esc(a.action)}</dd></div><div><dt>Aturan pemicu</dt><dd>${esc(a.rule)}</dd></div></dl>
      <p class="src-line">${a.sources.filter(s => s.report).map(s => src(s.report, s.page)).join(' · ')}</p>
    </details>`;
  const group = (title, desc, list) => `<section class="alert-group"><h2>${title} <span class="count">${list.length}</span></h2><p class="muted">${desc}</p>${list.length ? list.map(item).join('') : '<p class="empty">Tidak ada untuk tahun ini.</p>'}</section>`;
  const matrix = `<div class="table-wrap"><table class="matrix"><thead><tr><th>Aturan</th>${YEARS.map(yr => `<th class="num">${yr}</th>`).join('')}</tr></thead><tbody>
    ${ALERT_RULES.map(r => `<tr><th scope="row">${esc(r.rule)} <small>${r.type === 'kinerja' ? 'Kinerja emisi' : 'Kualitas data'}</small></th>${YEARS.map(yr => { const a = alertsFor(yr).find(x => x.id === r.id); return `<td class="num">${a ? `<span class="dot-${a.severity}" title="${esc(a.title)}">${SEV_ICON[a.severity]}</span>` : '<span class="muted">·</span>'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div>`;
  return pageHead(`Peringatan ${y}`, 'Klik peringatan untuk melihat dampak dan tindak lanjutnya.', state) + `
  <div class="alert-summary"><div><strong>${perf.length}</strong><span>Kinerja emisi</span></div><div><strong>${qual.length}</strong><span>Kualitas data</span></div><div><strong>${alerts.filter(a => a.severity === 'tinggi').length}</strong><span>Prioritas tinggi</span></div></div>
  ${group('Kinerja emisi', 'Emisi atau intensitas naik.', perf)}
  ${group('Kualitas data', 'Data kosong, tidak sebanding, tidak konsisten, atau berpotensi dihitung ganda.', qual)}
  <details class="card details-card"><summary><h2>Semua aturan & ambang</h2><span class="muted">▲ tinggi · ■ sedang · ● rendah</span></summary>${matrix}
    <p class="card-note">Ambang: emisi > ${THRESHOLDS.emissionRisePct}%, refrigeran > ${THRESHOLDS.refrigerantRisePct}%, intensitas > ${THRESHOLDS.intensityRisePct}%, faktor implisit > ${THRESHOLDS.impliedFactorDeviationPct}% dari median, selisih antar tabel > ${THRESHOLDS.conflictPct}%. Ambang ini aturan analisis, bukan standar regulasi.</p>
    <div class="btn-row"><button class="btn" data-download="alerts">Unduh peringatan (CSV)</button></div></details>`;
}

// =====================================================================
// KALKULATOR
// =====================================================================
export function kalkulator(state) {
  const c = state.calc;
  const groups = SOURCE_GROUPS.filter(g => g.scope === c.draft.scope);
  const sections = [...new Set(groups.map(g => g.section))];
  const g = sourceGroup(c.draft.group);
  let summary = null, error = null;
  try { summary = summarise(c.rows, c.year); } catch (e) { error = e.message; }
  return pageHead('Kalkulator emisi', 'Isi aktivitas Anda; faktor emisi dipilih otomatis. Hasilnya terpisah dan tidak mengubah angka laporan.', state, { yearPicker: false,
    actions: `<label class="inline-select">Tahun inventaris <select id="calc-year">${INVENTORY_YEARS.map(y => `<option ${y === c.year ? 'selected' : ''}>${y}</option>`).join('')}</select></label>` }) + `
  <div class="calc-grid">
    <form id="calc-form" class="card calc-form" novalidate>
      <h2>${c.editing ? 'Ubah aktivitas' : 'Tambah aktivitas'}</h2>
      <div class="scope-tabs" role="radiogroup" aria-label="Scope">${[1, 2, 3].map(s => `<label class="scope-tab"><input type="radio" name="scope" value="${s}" ${s === c.draft.scope ? 'checked' : ''}><span><strong>Scope ${s}</strong><small>${s === 1 ? 'Bahan bakar & refrigeran' : s === 2 ? 'Listrik PLN' : 'Rantai nilai'}</small></span></label>`).join('')}</div>
      <label class="field">Sumber emisi<select name="group">${sections.map(sec => `<optgroup label="${esc(sec)}">${groups.filter(x => x.section === sec).map(x => `<option value="${x.id}" ${x.id === c.draft.group ? 'selected' : ''} ${x.available === false ? 'disabled' : ''}>${esc(x.label)}${x.available === false ? ' — belum tersedia' : ''}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <div class="field-pair">
        <label class="field">Jumlah per tahun<input name="quantity" inputmode="decimal" value="${esc(c.draft.quantity)}" placeholder="contoh: 12500" autocomplete="off"></label>
        <label class="field">Satuan<select name="unit">${(g?.units ?? []).map(u => `<option value="${u}" ${u === c.draft.unit ? 'selected' : ''}>${esc(UNITS[u].label)}</option>`).join('')}</select></label>
      </div>
      <label class="field">Nama aktivitas<input name="name" maxlength="100" value="${esc(c.draft.name)}" placeholder="contoh: Boiler pabrik Cikarang" autocomplete="off"></label>
      <div class="factor-box" aria-live="polite">${factorPanel(g, g && g.available !== false ? resolveFactor(g.id, c.year) : null, c.year)}</div>
      <div id="calc-preview" class="calc-preview" aria-live="polite">${draftPreview(state)}</div>
      <div id="calc-warnings">${draftWarnings(state)}</div>
      <p class="form-error" id="calc-error" role="alert">${esc(c.error ?? '')}</p>
      <div class="btn-row"><button class="btn primary" type="submit">${c.editing ? 'Simpan perubahan' : 'Tambahkan'}</button>${c.editing ? '<button class="btn" type="button" data-action="calc-cancel">Batal</button>' : ''}</div>
    </form>
    <section class="card calc-results" aria-label="Hasil kalkulator">
      <header class="card-head row"><h2>Hasil Anda · ${c.year}</h2>${tag('kalkulator')}</header>
      ${error ? `<p class="form-error">${esc(error)}</p>` : ''}
      ${summary && summary.count ? `<div class="calc-totals">${[1, 2, 3].map(s => `<div><span>Scope ${s}</span><strong>${summary.scopesPresent.includes(s) ? num(summary.scopes[s], 2) : '—'}</strong></div>`).join('')}<div class="total"><span>Total</span><strong>${num(summary.total, 2)}</strong></div></div>
        <p class="card-note">t CO₂e · “—” berarti scope itu belum diisi, bukan nol.${summary.memo ? ` Memo di luar total: ${num(summary.memo, 2)} t.` : ''}</p>
        <ul class="calc-list">${summary.results.map(r => `<li>
          <div><strong>${esc(r.name)}</strong><span class="muted">Scope ${r.scope} · ${esc(r.group.label)} · ${num(r.quantity, r.quantity % 1 ? 2 : 0)} ${esc(UNITS[r.unit].label)}</span></div>
          <div class="calc-val">${r.tonnes === null ? `<span class="na">memo ${num(r.memoTonnes, 2)}</span>` : num(r.tonnes, 2)}<small>t CO₂e</small></div>
          <div class="calc-actions"><button class="btn small" type="button" data-action="calc-edit" data-id="${esc(r.id)}">Ubah</button><button class="btn small ghost" type="button" data-action="calc-delete" data-id="${esc(r.id)}" aria-label="Hapus ${esc(r.name)}">Hapus</button></div>
        </li>`).join('')}</ul>
        <div class="btn-row"><button class="btn" data-download="calculator">Unduh CSV</button><button class="btn ghost" type="button" data-action="calc-clear">Kosongkan</button></div>`
      : `<div class="empty-state"><p><strong>Belum ada aktivitas.</strong></p><p class="muted">Pilih scope dan sumber emisi, isi jumlah dan nama, lalu tekan Tambahkan.</p></div>`}
      <details class="mini-details"><summary>Daftar faktor emisi ${c.year}</summary>${factorCatalogTable(c.year)}</details>
    </section>
  </div>`;
}

export function factorPanel(g, f, year) {
  if (!g) return '';
  if (g.available === false) return `<p class="form-error"><strong>Faktor belum tersedia.</strong> ${esc(g.reason)}</p>`;
  return `<div class="factor-line"><span class="muted">Faktor emisi otomatis</span><strong>${num(f.value, f.value < 10 ? 4 : 2)}</strong><span class="muted">${esc(unitLabel(f.unit))}</span></div>
    <p class="factor-src">${esc(f.sources.map(s => s.label.split(':')[0].split(',')[0]).join(' + '))} · ${esc(f.validFor)}${f.periodMismatch ? ' · <span class="na">periode faktor ≠ tahun inventaris</span>' : ''}</p>
    <details class="mini-details"><summary>Sumber, tahun & asumsi</summary>
      <dl class="factor-meta">
        <div><dt>Sumber</dt><dd>${f.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join('<br>')}</dd></div>
        <div><dt>Wilayah</dt><dd>${esc(f.region)}</dd></div>
        <div><dt>Rumus faktor</dt><dd><code>${esc(f.formula)}</code></dd></div>
        <div><dt>Asumsi</dt><dd><ul>${f.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}</ul></dd></div>
        ${f.memo ? `<div><dt>Memo</dt><dd>${esc(f.memo.label)}: ${num(f.memo.value, 4)} kg/${esc(f.memo.perUnit)}</dd></div>` : ''}
      </dl></details>`;
}

export function draftPreview(state) {
  const c = state.calc, d = c.draft;
  if (d.quantity === '') return '<p class="muted">Isi jumlah untuk melihat hasil.</p>';
  try {
    const r = computeActivity({ ...d, name: d.name.trim() || 'pratinjau', id: 'preview' }, c.year);
    return `<span class="muted">Hasil</span><strong>${num(r.tonnes ?? r.memoTonnes, 3)}</strong><span>t CO₂e${r.tonnes === null ? ' (memo, tidak dijumlahkan)' : ''}</span><small class="muted">${esc(r.formula)}</small>`;
  } catch (e) {
    return e.code === 'name' ? '' : `<p class="form-error">${esc(e.message)}</p>`;
  }
}

export function draftWarnings(state) {
  const c = state.calc, d = c.draft;
  if (d.quantity === '' || !d.name.trim() || !sourceGroup(d.group) || sourceGroup(d.group).available === false) return '';
  const q = Number(String(d.quantity).replace(',', '.'));
  if (!Number.isFinite(q)) return '';
  const w = activityWarnings({ ...d, id: c.editing, quantity: q }, c.rows, c.year);
  return w.length ? `<ul class="warn-list">${w.map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>` : '';
}

function factorCatalogTable(year) {
  return `<div class="table-wrap"><table><thead><tr><th>Scope</th><th>Sumber emisi</th><th class="num">Faktor</th></tr></thead><tbody>
    ${SOURCE_GROUPS.map(g => { const f = g.available === false ? null : resolveFactor(g.id, year); return `<tr><td>${g.scope}</td><td>${esc(g.label)}<small>${f ? esc(f.sources.map(s => s.label.split(':')[0].split(',')[0]).join(' + ')) : esc(g.reason)}</small></td><td class="num">${f ? `${num(f.value, 4)} <small>${esc(unitLabel(f.unit))}</small>` : '<span class="na">belum tersedia</span>'}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}

// =====================================================================
// DATA & METODE
// =====================================================================
export function dataPage(state) {
  const revisions = OBSERVATIONS.filter(o => o.use !== 'primary');
  const sec = (title, body, open = false) => `<details class="card details-card" ${open ? 'open' : ''}><summary><h2>${title}</h2></summary>${body}</details>`;
  return pageHead('Data & metode', `Enam sustainability report resmi, diverifikasi ${RETRIEVED}. Setiap angka bisa ditelusuri ke halaman PDF-nya.`, state, { yearPicker: false }) + `
  <section class="card">
    <header class="card-head"><h2>Unduh dataset</h2><p>CSV UTF-8, titik desimal. Nilai kosong tetap kosong.</p></header>
    <div class="download-grid">
      <button class="dl" data-download="official"><strong>Seri utama</strong><span>CSV · 27 indikator × 6 tahun</span></button>
      <button class="dl" data-download="tableau"><strong>Tableau</strong><span>CSV · resmi + hasil hitung, kolom sum_safe</span></button>
      <button class="dl" data-download="versions"><strong>Semua versi</strong><span>CSV · termasuk revisi & konflik</span></button>
      <button class="dl" data-download="derived"><strong>Metrik turunan</strong><span>CSV · hasil hitung & estimasi</span></button>
      <button class="dl" data-download="json"><strong>Dataset lengkap</strong><span>JSON · dengan metadata</span></button>
      <button class="dl" data-download="alerts"><strong>Peringatan</strong><span>CSV · semua tahun</span></button>
    </div>
  </section>
  ${sec('Laporan sumber', `<div class="table-wrap"><table><thead><tr><th>Tahun</th><th>Dokumen</th><th class="num">Hlm. PDF</th><th>SHA-256</th></tr></thead><tbody>
    ${Object.values(REPORTS).map(r => `<tr><th scope="row">${r.year}</th><td><a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></td><td class="num">${r.pdfPages}</td><td><code>${r.sha256.slice(0, 12)}…</code></td></tr>`).join('')}
  </tbody></table></div><p class="card-note">Indeks resmi: <a href="${REPORT_INDEX}" target="_blank" rel="noopener noreferrer">unilever.co.id · Sustainability reports</a>. Halaman PDF = halaman cetak + 2. Hanya data PT Unilever Indonesia Tbk.</p>`, true)}
  ${sec('Aturan membaca data', `<ol class="rules">
    <li><strong>Revisi terakhir yang konsisten</strong> dipakai bila laporan lebih baru merevisi suatu tahun. Semua versi tetap tercatat.</li>
    <li><strong>2020 memakai angka revisi.</strong> Laporan 2020 hanya memuat “CO₂ dari energi” pabrik (24.776 t); Scope 1/2/3 2020 dari laporan 2021–2022.</li>
    <li><strong>Kosong ≠ nol.</strong> “–”, “tidak tercantum”, dan “belum dipublikasikan” dibedakan. Tidak ada interpolasi.</li>
    <li><strong>Subtotal tidak dijumlahkan dengan komponen.</strong> Total rantai nilai sudah memuat Scope 1–3.</li>
    <li><strong>Klaim penurunan terhadap 2015 tidak dihitung ulang</strong>; baseline 2015 dicetak dua versi (${BASELINE_2015.map(b => `Scope 1 ${num(b.s1)}`).join(' vs ')}). Klaim laporan: ${REPORTED_REDUCTION_CLAIMS.map(c => `${c.year} ${num(c.percent, 2)}%`).join(', ')}.</li>
  </ol>`)}
  ${sec(`Revisi & angka bertentangan (${revisions.length})`, `<div class="table-wrap"><table><thead><tr><th>Tahun</th><th>Indikator</th><th class="num">Versi ini</th><th class="num">Dipakai</th><th>Jenis</th><th>Sumber</th></tr></thead><tbody>
    ${revisions.map(o => { const p = primaryObservation(o.indicator, o.year); return `<tr><td>${o.year}</td><td>${esc(INDICATORS[o.indicator].short)}<small>${esc(o.note)}</small></td><td class="num">${val(o.value, INDICATORS[o.indicator].unit)}</td><td class="num">${p.value === null ? `<span class="na">${p.status === 'reported_dash' ? '“–”' : 'n/a'}</span>` : val(p.value, INDICATORS[o.indicator].unit)}</td><td>${o.use === 'superseded' ? 'Direvisi' : 'Bertentangan'}</td><td>${src(o.report, o.page)}</td></tr>`; }).join('')}
  </tbody></table></div>`)}
  ${sec('Data dictionary', `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Indikator</th><th>Satuan</th><th>Definisi & batas</th></tr></thead><tbody>
    ${Object.entries(INDICATORS).map(([id, i]) => `<tr><td><code>${id}</code></td><td>${esc(i.label)}</td><td class="unit-cell">${esc(unitLabel(i.unit))}</td><td>${esc(i.definition)}<small>${esc(i.boundary)}</small></td></tr>`).join('')}
  </tbody></table></div><p class="card-note">Status: ${Object.entries(STATUS).map(([k, v]) => `<code>${k}</code> ${esc(v)}`).join(' · ')}</p>`)}
  ${sec('Metode estimasi Scope 2 location-based', `<p>Listrik jaringan yang dibeli (GJ REC + GJ tanpa sertifikat) ÷ 3,6 = MWh, dikalikan faktor ESDM 2019 sistem Jawa-Madura-Bali: 0,80 (operating margin) sampai 0,87 t CO₂/MWh (combined margin). Asumsi seluruh lokasi di sistem Jamali; hanya CO₂; faktor 2019 adalah publikasi resmi terbaru.</p>
    <div class="table-wrap"><table><thead><tr><th>Tahun</th><th class="num">MWh</th><th class="num">Estimasi t CO₂</th><th class="num">× Scope 1</th></tr></thead><tbody>
    ${YEARS.map(y => { const e = locationBasedEstimate(y); return `<tr><th scope="row">${y}</th><td class="num">${num(e.mwh, 0)}</td><td class="num">${num(e.low, 0)}–${num(e.central, 0)}</td><td class="num">${num(e.multipleOfScope1, 1)}</td></tr>`; }).join('')}
    </tbody></table></div>`)}
  ${sec('Faktor emisi kalkulator', `<p>GWP IPCC AR5 (CH₄ ${GWP.CH4}, N₂O ${GWP.N2O}). Densitas solar ${String(ASSUMPTIONS.dieselDensity).replace('.', ',')} kg/L, bensin ${String(ASSUMPTIONS.gasolineDensity).replace('.', ',')} kg/L. Biodiesel B30/B35/B40 sesuai tahun.</p><ul>${Object.values(REFS).map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}</a></li>`).join('')}</ul>`)}`;
}

export const VIEWS = { dashboard, analisis, aksi, peringatan, kalkulator, data: dataPage };
