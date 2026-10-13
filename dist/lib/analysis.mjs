// Analisis turunan dari dataset resmi: perubahan tahunan, metrik hasil perhitungan,
// estimasi independen, red flag, insight dan rekomendasi.
// Semua yang dihitung di sini adalah HASIL PERHITUNGAN, bukan angka laporan.

import { YEARS, INDICATORS, OBSERVATIONS, YEAR_CONTEXT, BASELINE_2015, value, primaryObservation } from '../data/official.mjs';
import { resolveFactor } from '../data/factors.mjs';

export const GJ_PER_MWH = 3.6;

// Ambang batas alert (didokumentasikan di docs/data-quality-notes.md).
export const THRESHOLDS = Object.freeze({
  emissionRisePct: 5, // kenaikan Scope 1 / operasional per tahun
  refrigerantRisePct: 10, // kenaikan emisi refrigeran per tahun
  intensityRisePct: 5, // kenaikan intensitas emisi/energi manufaktur per tahun
  impliedFactorDeviationPct: 20, // faktor implisit vs median seri
  gridFactorDeviationPct: 25, // faktor implisit Scope 2 vs faktor ESDM
  conflictPct: 1, // selisih angka antar tabel/laporan untuk tahun yang sama
  sumTolerance: 0.05, // GJ, untuk deteksi penjumlahan ganda
});

export function yoy(indicator, year) {
  const a = value(indicator, year), b = value(indicator, year - 1);
  if (a === null || b === null || b === 0) return null;
  return (a - b) / b * 100;
}

const pct = (a, b) => (a === null || b === null || b === 0 ? null : a / b * 100);
const median = list => { const s = [...list].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Metrik turunan per tahun. null bila salah satu input tidak tersedia.
export function derived(year) {
  const s1 = value('s1', year), fuel = value('s1_fuel', year), ref = value('s1_refrigerant', year);
  const total = value('energy_total', year), rec = value('en_rec', year), grid = value('en_nonre_grid', year);
  const onsiteRe = value('en_biomass', year) === null ? null : value('en_biomass', year) + (value('en_solar', year) ?? 0);
  const purchasedGridGj = rec === null ? null : rec + (grid ?? 0);
  return {
    year,
    refrigerantShare: pct(ref, s1),
    fuelShare: pct(fuel, s1),
    componentGap: s1 === null || fuel === null || ref === null ? null : s1 - (fuel + ref),
    impliedFuelFactor: fuel === null || !value('en_nonre_onsite', year) ? null : fuel * 1000 / value('en_nonre_onsite', year), // kg CO2e/GJ
    renewableShareComputed: pct(value('energy_renewable', year), total),
    recShare: pct(rec, total),
    onsiteRenewableShare: pct(onsiteRe, total),
    fossilOnsiteShare: pct(value('en_nonre_onsite', year), total),
    purchasedGridGj,
    purchasedGridMwh: purchasedGridGj === null ? null : purchasedGridGj / GJ_PER_MWH,
    warehouseEnergyChange: yoy('energy_warehouse', year),
  };
}

// Estimasi independen Scope 2 location-based: listrik jaringan yang dibeli × faktor ESDM Jamali.
// Rentang: OM (0,80) s.d. CM ex-post (0,87). Bukan angka laporan.
export function locationBasedEstimate(year) {
  const d = derived(year);
  if (d.purchasedGridMwh === null) return null;
  const f = resolveFactor('s2_grid_jamali', year);
  const low = d.purchasedGridMwh * 0.80, central = d.purchasedGridMwh * f.value;
  return { year, mwh: d.purchasedGridMwh, factor: f.value, low, central, factorYear: 2019,
    formula: `(${fmtN(value('en_rec', year))} GJ REC${value('en_nonre_grid', year) ? ` + ${fmtN(value('en_nonre_grid', year))} GJ tanpa sertifikat` : ''}) ÷ 3,6 = ${fmtN(d.purchasedGridMwh, 0)} MWh × 0,87 t CO2/MWh`,
    multipleOfScope1: value('s1', year) ? central / value('s1', year) : null };
}

export function impliedGridFactor2020() {
  const s2 = value('s2_reported', 2020), gj = value('en_nonre_grid', 2020);
  return s2 === null || !gj ? null : s2 / (gj / GJ_PER_MWH);
}

export function decimalsFor(unit) { return unit === '%' ? 0 : unit === 'GJ/ton produk' ? 2 : 2; }
const fmtU = (v, unit) => fmtN(v, decimalsFor(unit)) + (unit === '%' ? '%' : '');
function fmtN(v, d = 2) { return v === null ? '—' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d }).format(v); }
const ref = (report, page) => ({ report, page });

// ---------------- Red flags ----------------
// type: 'kinerja' (kinerja emisi) | 'kualitas' (kualitas data). severity: 'tinggi' | 'sedang' | 'rendah'.

const RULES = [
  {
    id: 'emission-rise', type: 'kinerja', rule: `Scope 1 atau emisi operasional naik > ${THRESHOLDS.emissionRisePct}% dari tahun sebelumnya.`,
    evaluate(year) {
      const hits = ['ops_s12', 's1'].map(k => ({ k, c: yoy(k, year) })).filter(x => x.c !== null && x.c > THRESHOLDS.emissionRisePct);
      if (!hits.length) return null;
      const boundary = YEAR_CONTEXT[year]?.boundaryChange;
      return { severity: 'tinggi', title: `Emisi operasional naik ${fmtN(hits[0].c, 1)}% pada ${year}`,
        problem: 'Emisi Scope 1 meningkat dibanding tahun sebelumnya.',
        evidence: hits.map(h => `${INDICATORS[h.k].short}: ${fmtN(value(h.k, year - 1))} → ${fmtN(value(h.k, year))} t CO2e (${fmtN(h.c, 1)}%).`).join(' '),
        impact: boundary ? 'Sebagian kenaikan dapat berasal dari perubahan batas pelaporan; besarnya tidak dapat dipisahkan dari data publik.' : 'Menjauhkan lintasan dari target nol emisi operasional 2030.',
        action: 'Rinci kenaikan per pabrik dan per bahan bakar; bandingkan dengan volume produksi dan perubahan batas sebelum menetapkan penyebab.',
        sources: [primaryObservation('s1', year), primaryObservation('s1', year - 1)].map(o => ref(o.report, o.page)) };
    },
  },
  {
    id: 'refrigerant-rise', type: 'kinerja', rule: `Emisi refrigeran naik > ${THRESHOLDS.refrigerantRisePct}% per tahun; tinggi bila terjadi dua tahun berturut-turut.`,
    evaluate(year) {
      const c = yoy('s1_refrigerant', year);
      if (c === null || c <= THRESHOLDS.refrigerantRisePct) return null;
      const prev = yoy('s1_refrigerant', year - 1);
      const consecutive = prev !== null && prev > 0;
      return { severity: consecutive ? 'tinggi' : 'sedang', title: `Emisi refrigeran naik ${fmtN(c, 1)}%${consecutive ? ', kenaikan berturut-turut' : ''}`,
        problem: 'Kebocoran atau isi ulang refrigeran meningkat sementara total Scope 1 turun.',
        evidence: `${fmtN(value('s1_refrigerant', year - 1))} → ${fmtN(value('s1_refrigerant', year))} t CO2e. Porsi dari Scope 1: ${fmtN(derived(year).refrigerantShare, 1)}%.${consecutive ? ` Tahun sebelumnya juga naik ${fmtN(prev, 1)}%.` : ''}`,
        impact: 'Satu kilogram HFC umum setara ratusan hingga ribuan kg CO2e. Porsinya kecil, tetapi naik saat sumber lain turun.',
        action: 'Rekonsiliasi log isi ulang per chiller dengan stok refrigeran; catat jenis gas dan GWP; prioritaskan uji kebocoran pada aset dengan isi ulang terbesar.',
        sources: [ref(primaryObservation('s1_refrigerant', year).report, primaryObservation('s1_refrigerant', year).page)] };
    },
  },
  {
    id: 'intensity-rise', type: 'kinerja', rule: `Intensitas emisi atau energi manufaktur naik > ${THRESHOLDS.intensityRisePct}% per tahun.`,
    evaluate(year) {
      const hits = ['ei_mfg', 'energy_intensity_mfg'].map(k => ({ k, c: yoy(k, year) })).filter(x => x.c !== null && x.c > THRESHOLDS.intensityRisePct);
      if (!hits.length) return null;
      return { severity: 'sedang', title: `Intensitas manufaktur naik pada ${year}`,
        problem: 'Emisi atau energi per ton produk meningkat.',
        evidence: hits.map(h => `${INDICATORS[h.k].short}: ${fmtN(value(h.k, year - 1))} → ${fmtN(value(h.k, year))} ${INDICATORS[h.k].unit} (${fmtN(h.c, 1)}%).`).join(' '),
        impact: 'Penurunan emisi absolut bisa berasal dari volume produksi, bukan efisiensi. Intensitas yang naik menandakan efisiensi memburuk.',
        action: 'Analisis per lini produksi: utilisasi, campuran produk dan pemakaian energi per batch.',
        sources: hits.map(h => ref(primaryObservation(h.k, year).report, primaryObservation(h.k, year).page)) };
    },
  },
  {
    id: 'scope3-missing', type: 'kualitas', rule: 'Scope 3 tahun terpilih tidak tersedia (tidak tercantum atau belum dipublikasikan).',
    evaluate(year) {
      const o = primaryObservation('s3', year);
      if (o.value !== null) return null;
      const share2021 = value('s3', 2021) / value('full_value_chain', 2021) * 100;
      return { severity: 'tinggi', title: `Scope 3 ${year} tidak tersedia`,
        problem: o.status === 'not_published' ? 'Laporan menyatakan Scope 3 belum dapat dipublikasikan.' : 'Laporan tidak memuat angka atau pernyataan Scope 3.',
        evidence: `Status: ${o.status === 'not_published' ? 'belum dipublikasikan' : 'tidak tercantum'}. ${o.note} Angka terakhir: ${fmtN(value('s3', 2021), 0)} t CO2e (2021), ${fmtN(share2021, 1)}% dari total rantai nilai.`,
        impact: `Total jejak karbon ${year} tidak dapat dihitung. Dashboard tidak menampilkan total Scope 1–3 untuk tahun ini.`,
        action: 'Lihat rekomendasi 3: bangun ulang inventaris Scope 3 dan publikasikan status per kategori.',
        sources: [ref(o.report, o.page)] };
    },
  },
  {
    id: 'boundary-change', type: 'kualitas', rule: 'Laporan mencatat perubahan batas, periode atau metode pada tahun terpilih.',
    evaluate(year) {
      const ctx = YEAR_CONTEXT[year];
      if (!ctx?.boundaryChange) return null;
      const extra = year === 2025 ? ` Energi gudang naik ${fmtN(yoy('energy_warehouse', 2025), 0)}% (${fmtN(value('energy_warehouse', 2024))} → ${fmtN(value('energy_warehouse', 2025))} GJ).` : '';
      return { severity: 'sedang', title: `Perubahan batas pelaporan ${year}`,
        problem: 'Angka tahun ini tidak sepenuhnya sebanding dengan tahun sebelumnya.',
        evidence: ctx.events.map(e => e.text).join(' ') + extra,
        impact: { 2025: 'Penambahan gudang menambah emisi/energi; periode es krim 11 bulan menguranginya. Efek bersih pada perubahan 2024→2025 tidak dapat dipisahkan.',
          2023: 'Penurunan energi logistik 2022→2023 kemungkinan besar akibat perubahan definisi batas, bukan efisiensi. Perbandingan energi total 2022→2023 tidak like-for-like.',
          2020: 'Seri 2020 adalah revisi dengan batas baru; angka asli laporan 2020 tidak dapat dibandingkan langsung.' }[year] ?? 'Perbandingan dengan tahun sebelumnya tidak like-for-like.',
        action: 'Minta atau susun ulang angka dengan batas yang sama (like-for-like) sebelum menyimpulkan tren.',
        sources: ctx.events.map(e => ref(e.report, e.page)) };
    },
  },
  {
    id: 'scope2-basis', type: 'kualitas', rule: 'Scope 2 tabel utama “–” sementara listrik dibeli dan dicakup REC (basis market-based tidak dinyatakan eksplisit).',
    evaluate(year) {
      const o = primaryObservation('s2_reported', year);
      if (o.status !== 'reported_dash' || !value('en_rec', year)) return null;
      const zero = OBSERVATIONS.find(r => r.indicator === 's2_reported' && r.year === year && r.value === 0);
      const est = locationBasedEstimate(year);
      return { severity: 'tinggi', title: 'Basis Scope 2 tidak dinyatakan; location-based tidak diungkapkan',
        problem: 'Tabel utama menulis “–”, bukan angka. Listrik fisik tetap dibeli dari jaringan PLN dan diklaim terbarukan melalui sertifikat REC/I-REC.',
        evidence: `Listrik dicakup REC: ${fmtN(value('en_rec', year))} GJ (${fmtN(derived(year).recShare, 0)}% energi total).${zero ? ` Tabel pengurangan emisi laporan ${zero.report} menulis 0 untuk tahun yang sama.` : ''} Estimasi independen location-based: ${fmtN(est.low, 0)}–${fmtN(est.central, 0)} t CO2.`,
        impact: '“–” tidak boleh dibaca sebagai nol emisi fisik. Total operasional yang dilaporkan hanya mencerminkan basis market-based.',
        action: 'Laporkan Scope 2 dua basis (location-based dan market-based) sesuai GHG Protocol Scope 2 Guidance, dengan kWh per sistem jaringan.',
        sources: [ref(o.report, o.page)].concat(zero ? [ref(zero.report, zero.page)] : []) };
    },
  },
  {
    id: 'implied-factor', type: 'kualitas', rule: `Faktor implisit (emisi ÷ energi) menyimpang > ${THRESHOLDS.impliedFactorDeviationPct}% dari median seri, atau faktor implisit Scope 2 menyimpang > ${THRESHOLDS.gridFactorDeviationPct}% dari faktor ESDM.`,
    evaluate(year) {
      const out = [];
      const series = YEARS.map(y => derived(y).impliedFuelFactor).filter(v => v !== null);
      const m = median(series), f = derived(year).impliedFuelFactor;
      if (f !== null && Math.abs(f - m) / m * 100 > THRESHOLDS.impliedFactorDeviationPct) {
        out.push(`Gas & light fuel ÷ energi fosil on-site = ${fmtN(f, 1)} kg CO2e/GJ, sedangkan median 2020–2025 ${fmtN(m, 1)} kg CO2e/GJ (gas alam IPCC: 56,2).`);
      }
      if (year === 2020) {
        const g = impliedGridFactor2020();
        if (g !== null && Math.abs(g - 0.80) / 0.80 * 100 > THRESHOLDS.gridFactorDeviationPct) {
          out.push(`Scope 2 ÷ listrik tanpa sertifikat = ${fmtN(g, 2)} t CO2e/MWh, jauh di bawah faktor ESDM Jamali 2019 (OM 0,80; CM 0,87).`);
        }
      }
      if (!out.length) return null;
      return { severity: 'sedang', title: `Faktor emisi implisit ${year} tidak wajar`,
        problem: 'Rasio emisi terhadap energi yang dilaporkan tidak cocok dengan faktor bahan bakar atau jaringan yang lazim.',
        evidence: out.join(' '),
        impact: 'Kemungkinan perbedaan campuran bahan bakar, satuan, faktor yang dipakai, atau batas antara tabel emisi dan tabel energi. Perubahan tahunan yang melibatkan tahun ini kurang andal.',
        action: 'Minta rincian bahan bakar (GJ per jenis) dan faktor yang dipakai; rekonsiliasi tabel emisi dengan tabel energi.',
        sources: [ref(primaryObservation('s1_fuel', year).report, primaryObservation('s1_fuel', year).page), ref(primaryObservation('en_nonre_onsite', year).report, primaryObservation('en_nonre_onsite', year).page)] };
    },
  },
  {
    id: 'conflicting-values', type: 'kualitas', rule: `Angka yang sama tercetak berbeda > ${THRESHOLDS.conflictPct}% di tabel/laporan lain untuk tahun yang sama.`,
    evaluate(year) {
      const rows = OBSERVATIONS.filter(r => r.year === year && r.use === 'conflicting' && r.value !== null && r.value !== 0).map(r => {
        const p = value(r.indicator, year);
        return p === null ? null : { r, p, diff: (r.value - p) / p * 100 };
      }).filter(x => x && Math.abs(x.diff) > THRESHOLDS.conflictPct);
      if (!rows.length) return null;
      return { severity: rows.some(x => Math.abs(x.diff) > 10) ? 'tinggi' : 'sedang', title: `${rows.length} angka ${year} tidak konsisten antar tabel`,
        problem: 'Laporan mencetak angka berbeda untuk indikator dan tahun yang sama.',
        evidence: rows.map(x => `${INDICATORS[x.r.indicator].short}: dipakai ${fmtU(x.p, INDICATORS[x.r.indicator].unit)}${INDICATORS[x.r.indicator].unit === '%' ? '' : ' ' + INDICATORS[x.r.indicator].unit}; versi lain ${fmtU(x.r.value, INDICATORS[x.r.indicator].unit)} (laporan ${x.r.report} hlm. ${x.r.page}, ${x.diff > 0 ? '+' : ''}${fmtN(x.diff, 1)}%).`).join(' '),
        impact: 'Pembaca yang mengambil tabel berbeda akan mendapat kesimpulan berbeda. Dashboard memakai versi yang komponennya menjumlah dengan benar atau revisi terakhir.',
        action: 'Konfirmasi angka final ke tim pelaporan keberlanjutan; minta errata atau catatan revisi.',
        sources: rows.map(x => ref(x.r.report, x.r.page)) };
    },
  },
  {
    id: 'double-count', type: 'kualitas', rule: `Sebuah angka total sama dengan (±${THRESHOLDS.sumTolerance} GJ) penjumlahan total energi dengan angka lain di tahun yang sama.`,
    evaluate(year) {
      const all = OBSERVATIONS.filter(r => r.year === year && r.value !== null && INDICATORS[r.indicator].unit === 'GJ');
      const totals = all.filter(r => r.indicator === 'energy_total');
      const hits = [], seen = new Set();
      for (const target of all.filter(r => r.use !== 'primary')) {
        for (const t of totals) for (const other of all) {
          if (t === target || other === target || other === t) continue;
          const key = [target.value, ...[t.value, other.value].sort()].join('|');
          if (seen.has(key)) continue;
          if (Math.abs(t.value + other.value - target.value) <= THRESHOLDS.sumTolerance) {
            seen.add(key);
            hits.push(`${fmtN(target.value)} GJ (${INDICATORS[target.indicator].short}, laporan ${target.report} hlm. ${target.page}) = ${fmtN(t.value)} + ${fmtN(other.value)} (${INDICATORS[other.indicator].short}).`);
          }
        }
      }
      const unique = [...new Set(hits)];
      if (!unique.length) return null;
      return { severity: 'tinggi', title: `Indikasi penghitungan ganda energi ${year}`,
        problem: 'Angka di tabel “Konsumsi energi” sama persis dengan total energi ditambah angka lain, sehingga energi dihitung dua kali.',
        evidence: unique.slice(0, 3).join(' '),
        impact: 'Bila dipakai, konsumsi energi 2024 tampak dua kali lipat. Dashboard tidak memakai angka ini.',
        action: 'Jangan menjumlahkan subtotal dengan komponennya. Pakai tabel organisasi atau revisi laporan 2025.',
        sources: [ref(2024, 192)] };
    },
  },
  {
    id: 'restatement', type: 'kualitas', rule: `Laporan lebih baru merevisi angka tahun ini lebih dari ${THRESHOLDS.conflictPct}%.`,
    evaluate(year) {
      const rows = OBSERVATIONS.filter(r => r.year === year && r.use === 'superseded' && r.value !== null).map(r => {
        const p = primaryObservation(r.indicator, year);
        return p?.value ? { r, p, diff: (p.value - r.value) / r.value * 100 } : null;
      }).filter(x => x && Math.abs(x.diff) > THRESHOLDS.conflictPct);
      if (!rows.length) return null;
      return { severity: 'rendah', title: `Angka ${year} direvisi di laporan berikutnya`,
        problem: 'Nilai yang pertama kali dipublikasikan berubah di laporan yang lebih baru.',
        evidence: rows.map(x => `${INDICATORS[x.r.indicator].short}: ${fmtN(x.r.value)} (laporan ${x.r.report}) → ${fmtN(x.p.value)} (laporan ${x.p.report}), ${x.diff > 0 ? '+' : ''}${fmtN(x.diff, 1)}%.`).join(' '),
        impact: 'Dashboard memakai revisi terakhir. Analisis yang memakai laporan lama akan berbeda.',
        action: 'Gunakan seri revisi terakhir dan sebutkan laporan sumbernya; lihat tabel revisi di halaman Data & sumber.',
        sources: rows.map(x => ref(x.p.report, x.p.page)) };
    },
  },
  {
    id: 'gas-coverage', type: 'kualitas', rule: 'Laporan tahun terpilih menyatakan cakupan gas/basis tahun dasar yang bertentangan dengan tabelnya.',
    evaluate(year) {
      if (![2024, 2025].includes(year)) return null;
      const items = [];
      if (year === 2024) items.push('Hlm. 186 menyatakan “komponen yang termasuk dalam perhitungan emisi adalah CO2”, tetapi tabel memakai t CO2e dan memuat refrigeran (HFC).');
      items.push(`Baseline 2015 dicetak dua versi: Scope 1 ${fmtN(BASELINE_2015[0].s1)} / Scope 2 ${fmtN(BASELINE_2015[0].s2)} (tabel pengurangan) dan ${fmtN(BASELINE_2015[1].s1)} / ${fmtN(BASELINE_2015[1].s2)} (tabel jumlah emisi).`);
      return { severity: 'sedang', title: 'Cakupan gas dan baseline 2015 tidak konsisten',
        problem: 'Definisi metrik tidak seragam di dalam laporan.',
        evidence: items.join(' '),
        impact: `Klaim penurunan terhadap 2015 (mis. ${year === 2025 ? '94,34%' : '92%'}) bergantung pada baseline yang dipakai. Dashboard tidak menghitung ulang klaim tersebut.`,
        action: 'Minta definisi resmi gas yang dicakup (CO2 saja atau CO2e Kyoto) dan baseline 2015 final.',
        sources: year === 2024 ? [ref(2024, 186), ref(2024, 187)] : [ref(2025, 184), ref(2025, 186)] };
    },
  },
];

export const ALERT_RULES = RULES.map(({ id, type, rule }) => ({ id, type, rule }));

export function alertsFor(year) {
  const order = { tinggi: 0, sedang: 1, rendah: 2 };
  return RULES.map(r => { const a = r.evaluate(year); return a ? { id: r.id, type: r.type, rule: r.rule, ...a } : null; })
    .filter(Boolean)
    .sort((a, b) => (a.type === b.type ? 0 : a.type === 'kinerja' ? -1 : 1) || order[a.severity] - order[b.severity]);
}

// ---------------- Insight ----------------

export function insights() {
  const s1a = value('s1', 2021), s1b = value('s1', 2025);
  const fuelA = value('en_nonre_onsite', 2021), fuelB = value('en_nonre_onsite', 2025);
  const est = locationBasedEstimate(2025), d25 = derived(2025);
  return [
    {
      id: 'I1', headline: 'Scope 1 turun 62% sejak 2021', stat: `${fmtN(s1a, 0)} → ${fmtN(s1b, 0)}`, statUnit: 't CO₂e (2021 → 2025)', short: 'Bahan bakar fosil on-site ikut turun 50%. Sisa Scope 1 hampir seluruhnya dari gas untuk panas proses.', title: 'Scope 1 turun 62% sejak puncak 2021, sejalan dengan berkurangnya bahan bakar fosil on-site',
      facts: [
        `Scope 1: ${fmtN(value('s1', 2020))} (2020) → ${fmtN(s1a)} (2021) → ${fmtN(s1b)} t CO2e (2025); turun ${fmtN((s1a - s1b) / s1a * 100, 1)}% dari 2021.`,
        `Gas & light fuel menyumbang ${fmtN(d25.fuelShare, 1)}% Scope 1 pada 2025.`,
        `Energi fosil on-site turun ${fmtN((fuelA - fuelB) / fuelA * 100, 1)}% (${fmtN(fuelA, 0)} → ${fmtN(fuelB, 0)} GJ); intensitas emisi manufaktur ${fmtN(value('ei_mfg', 2021))} → ${fmtN(value('ei_mfg', 2025))} kg CO2e/ton.`,
      ],
      interpretation: 'Penurunan tidak hanya akibat perubahan faktor emisi: volume energi fosil yang dibakar juga berkurang, dan emisi per ton produk ikut turun. Ruang pengurangan berikutnya tetap berada pada panas proses berbasis gas.',
      implication: 'Panas proses menentukan sisa Scope 1. Target nol emisi operasional 2030 bergantung pada penggantian sekitar 133 ribu GJ bahan bakar fosil per tahun.',
      limits: 'Volume produksi absolut tidak diungkapkan; pengaruh volume, portofolio (penghentian pengolahan sabun batangan 2024, es krim 11 bulan pada 2025) dan efisiensi tidak dapat dipisahkan. Faktor implisit 2021 (78 kg CO2e/GJ) jauh di atas tahun lain, sehingga puncak 2021 perlu dikonfirmasi.',
      sources: [ref(2021, 94), ref(2025, 184), ref(2023, 176), ref(2025, 189), ref(2025, 185)],
    },
    {
      id: 'I2', headline: `${fmtN(d25.recShare, 0)}% energi “terbarukan” berasal dari sertifikat REC`, stat: `≈ ${fmtN(est.low / 1000, 0)}–${fmtN(est.central / 1000, 0)} rb`, statUnit: 't CO₂ Scope 2 location-based 2025 (estimasi)', short: 'Tanpa sertifikat, listrik PLN menjadi sumber emisi operasional terbesar, sekitar 14× Scope 1.', title: `Klaim ${fmtN(value('energy_renewable_share', 2025), 0)}% energi terbarukan sebagian besar berasal dari sertifikat REC, bukan pembangkitan sendiri`,
      facts: [
        `2025: REC tanpa bundel ${fmtN(d25.recShare, 0)}% dari energi total; biomassa + PV surya on-site ${fmtN(d25.onsiteRenewableShare, 0)}%; bahan bakar fosil on-site ${fmtN(d25.fossilOnsiteShare, 0)}%.`,
        `Scope 2 tabel utama “–” pada 2021–2025; laporan 2024–2025 mengaitkan penurunan emisi dengan offset Scope 2 menggunakan I-REC.`,
        `Estimasi independen location-based 2025: ${fmtN(est.mwh, 0)} MWh × 0,80–0,87 t CO2/MWh ≈ ${fmtN(est.low, 0)}–${fmtN(est.central, 0)} t CO2, sekitar ${fmtN(est.multipleOfScope1, 0)} kali Scope 1.`,
      ],
      interpretation: 'Emisi operasional yang rendah sangat bergantung pada pembelian sertifikat. Tanpa sertifikat, listrik jaringan akan menjadi sumber emisi operasional terbesar.',
      implication: 'Risiko biaya dan kredibilitas: harga, ketersediaan dan kriteria kualitas sertifikat tanpa bundel dapat berubah, dan pemangku kepentingan makin meminta pengungkapan location-based.',
      limits: 'Estimasi memakai faktor ESDM 2019 (terbaru yang dipublikasikan), mengasumsikan seluruh listrik di sistem Jawa-Madura-Bali, dan hanya mencakup CO2. Ini bukan angka laporan.',
      sources: [ref(2025, 189), ref(2025, 190), ref(2025, 185), ref(2024, 188)],
    },
    {
      id: 'I3', headline: 'Scope 3 tidak dilaporkan sejak 2021', stat: '99,3%', statUnit: 'porsi Scope 3 dari total jejak 2021', short: 'Bagian terbesar jejak karbon (bahan baku, kemasan, penggunaan konsumen) tidak terpantau.', title: 'Scope 3 adalah >99% jejak karbon terakhir yang diungkapkan, tetapi tidak dipublikasikan sejak 2021',
      facts: [
        `2021: Scope 3 ${fmtN(value('s3', 2021), 0)} t CO2e dari total rantai nilai ${fmtN(value('full_value_chain', 2021), 0)} t CO2e (${fmtN(value('s3', 2021) / value('full_value_chain', 2021) * 100, 1)}%).`,
        `Kelompok terbesar 2021: bahan baku & kemasan ${fmtN(value('s3_ingredients_packaging', 2021) / value('s3', 2021) * 100, 0)}%, penggunaan konsumen ${fmtN(value('s3_consumer_use', 2021) / value('s3', 2021) * 100, 0)}%, distribusi & ritel ${fmtN(value('s3_distribution_retail', 2021) / value('s3', 2021) * 100, 0)}%.`,
        'Laporan 2022 tidak memuat Scope 3; laporan 2023–2025 menyatakan pendataan dan metode masih disusun.',
      ],
      interpretation: 'Upaya pengurangan yang terlihat di laporan (Scope 1–2) menyentuh kurang dari 1% jejak karbon yang terakhir diukur. Perbandingan 2020 → 2021 (−9,8%) belum bisa dilanjutkan.',
      implication: 'Prioritas dekarbonisasi tidak dapat ditetapkan berbasis data untuk bagian terbesar emisi, termasuk target global Unilever untuk Scope 3 energi & industri (42% pada 2030) yang dirujuk laporan 2025.',
      limits: 'Lima kelompok 2021 bukan pemetaan lengkap 15 kategori GHG Protocol. Angka 2021 tidak boleh dijumlahkan dengan operasi tahun lain.',
      sources: [ref(2021, 94), ref(2023, 168), ref(2024, 186), ref(2025, 184), ref(2025, 183)],
    },
  ];
}

// ---------------- Rekomendasi (usulan analisis independen) ----------------

export const RECOMMENDATIONS = Object.freeze([
  {
    id: 'R1', insight: 'I1', title: 'Program dekarbonisasi panas proses per pabrik',
    problem: `Gas & light fuel = ${fmtN(derived(2025).fuelShare, 1)}% Scope 1 2025 (${fmtN(value('s1_fuel', 2025))} t CO2e dari ${fmtN(value('en_nonre_onsite', 2025), 0)} GJ energi fosil on-site).`,
    actions: [
      'Audit kebutuhan panas per lini: suhu proses, jam operasi, kehilangan uap dan kondensat.',
      'Perluas solusi yang sudah disebut laporan (pompa panas, pemulihan panas, boiler modular, biomassa woodchip) ke lini dengan kebutuhan suhu rendah–menengah.',
      'Masukkan biaya karbon internal dan ketersediaan pasokan biomassa berkelanjutan ke studi kelayakan.',
    ],
    owner: 'Engineering & Utilities pabrik, didukung SHE dan Finance', priority: 'Tinggi', horizon: '0–24 bulan',
    kpis: ['GJ bahan bakar fosil on-site per tahun dan per ton produk', 't CO2e gas & light fuel', 'Faktor implisit kg CO2e/GJ (kontrol kualitas data)'],
    first90: ['30 hari: pasang/validasi meter gas per lini besar dan tetapkan baseline 2025 per pabrik.', '60 hari: rekonsiliasi angka 2021 (faktor implisit 78 kg CO2e/GJ) dengan data tagihan.', '90 hari: pilih satu lini percontohan dan susun studi kelayakan teknis.'],
    estimate: { formula: 'Pengurangan (t CO2e) = GJ gas yang digantikan × 56,15 kg CO2e/GJ ÷ 1000', note: 'Faktor gas alam IPCC 2006 + GWP AR5. Bila diganti listrik jaringan, tambahkan emisi location-based listrik baru; bila biomassa, tambahkan CH4/N2O biomassa.' },
  },
  {
    id: 'R2', insight: 'I2', title: 'Laporkan Scope 2 dua basis dan kurangi ketergantungan pada REC tanpa bundel',
    problem: `${fmtN(derived(2025).recShare, 0)}% energi 2025 diklaim terbarukan lewat sertifikat; Scope 2 location-based tidak diungkapkan.`,
    actions: [
      'Publikasikan Scope 2 location-based (kWh per sistem jaringan × faktor ESDM) berdampingan dengan market-based.',
      'Tetapkan kriteria kualitas sertifikat: tahun produksi sama, wilayah jaringan yang sama, registri yang dapat ditelusuri.',
      'Evaluasi opsi pembangkitan/kontrak yang menambah pasokan fisik: perluasan PV atap (2025: 17.800 GJ ≈ 4.944 MWh) dan skema energi terbarukan PLN yang tersedia.',
    ],
    owner: 'Sustainability & Finance (pelaporan), Procurement Energi, Engineering', priority: 'Tinggi', horizon: '0–12 bulan (pengungkapan); 12–36 bulan (pasokan fisik)',
    kpis: ['t CO2 Scope 2 location-based', '% listrik dari PV on-site atau kontrak dengan pasokan fisik', '% energi terbarukan dari sertifikat tanpa bundel'],
    first90: ['30 hari: kumpulkan kWh per meter PLN 2023–2025 dan petakan ke sistem jaringan.', '60 hari: hitung location-based 2023–2025 dengan faktor ESDM; uji sensitivitas OM vs CM.', '90 hari: inventarisasi sertifikat I-REC (volume, tahun, lokasi pembangkit) dan potensi atap untuk PV tambahan.'],
    estimate: { formula: 'Scope 2 location-based (t CO2) = MWh listrik jaringan × faktor ESDM (t CO2/MWh)', note: 'Estimasi dashboard 2025: lihat insight 2. Ganti dengan kWh meter aktual dan faktor sistem yang sesuai.' },
  },
  {
    id: 'R3', insight: 'I3', title: 'Bangun ulang inventaris Scope 3 dengan penyaringan 15 kategori',
    problem: 'Bagian terbesar jejak karbon tidak diukur sejak 2021.',
    actions: [
      'Petakan lima kelompok 2021 ke 15 kategori GHG Protocol dan tandai kategori yang belum dinilai.',
      'Kumpulkan data pemasok untuk bahan baku dan kemasan bervolume terbesar (kategori 1).',
      'Mulai dari data yang sudah dikelola: liter Biosolar transporter untuk kategori 4 dan 9 (kalkulator dashboard dapat dipakai untuk penyaringan awal).',
    ],
    owner: 'Procurement, Supply Chain & Logistics, Sustainability', priority: 'Tinggi', horizon: '0–18 bulan',
    kpis: ['Jumlah kategori Scope 3 yang dinilai (dari 15)', '% belanja bahan baku/kemasan dengan data spesifik pemasok', 'Scope 3 dipublikasikan di laporan berikutnya dengan status per kategori'],
    first90: ['30 hari: tetapkan pemilik data per kategori dan batas organisasi (pasca divestasi es krim).', '60 hari: kumpulkan data bahan bakar transporter dan volume material 2025.', '90 hari: hasilkan penyaringan awal per kategori dan rencana pengumpulan data pemasok.'],
    estimate: null,
  },
]);

// Simulasi pada angka laporan: hanya mengurangi dua komponen Scope 1 dengan persentase pengguna.
export function scenario(year, fuelPct, refPct) {
  for (const v of [fuelPct, refPct]) if (!Number.isFinite(v) || v < 0 || v > 100) throw new Error('Persentase harus 0–100.');
  const fuel = value('s1_fuel', year), refr = value('s1_refrigerant', year), base = value('s1', year);
  if (fuel === null || refr === null || base === null) return null;
  const fuelCut = fuel * fuelPct / 100, refCut = refr * refPct / 100;
  return { year, baseline: base, fuelCut, refCut, avoided: fuelCut + refCut, projected: base - fuelCut - refCut,
    gasGjAvoided: value('en_nonre_onsite', year) === null ? null : value('en_nonre_onsite', year) * fuelPct / 100 };
}
