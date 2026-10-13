// Katalog faktor emisi untuk kalkulator. Setiap faktor diturunkan dari konstanta
// bersumber di bawah, sehingga angka dan rumusnya dapat ditelusuri dan diuji.
// Hasil kalkulator TIDAK pernah dicampur dengan data sustainability report.

export const INVENTORY_YEARS = Object.freeze([2020, 2021, 2022, 2023, 2024, 2025]);
export const DEFAULT_YEAR = 2025;

export const REFS = Object.freeze({
  ipcc2006: { label: 'IPCC 2006 Guidelines for National GHG Inventories, Vol. 2 Energy', url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol2.html', year: 2006 },
  ar5: { label: 'IPCC AR5 WG1, Bab 8, Tabel 8.7 & 8.A.1 (GWP 100 tahun)', url: 'https://www.ipcc.ch/report/ar5/wg1/', year: 2013 },
  esdm2019: { label: 'Kementerian ESDM, Ditjen Ketenagalistrikan: Faktor Emisi GRK Sistem Ketenagalistrikan Tahun 2019', url: 'https://gatrik.esdm.go.id/gatrik/gatrik-api/storage/migrasi/download_index/files/96d7c-nilai-fe-grk-sistem-ketenagalistrikan-tahun-2019.pdf', year: 2019 },
  esdmBiodiesel: { label: 'Kementerian ESDM: mandatori biodiesel B30 (2020), B35 (1 Feb 2023), B40 (Kepmen ESDM 341.K/EK.01/MEM.E/2024, 2025)', url: 'https://www.esdm.go.id/', year: 2024 },
  ghgp: { label: 'GHG Protocol Corporate Standard & Scope 2 Guidance', url: 'https://ghgprotocol.org/corporate-standard', year: 2015 },
});

// GWP 100 tahun IPCC AR5 (basis yang dipakai pelaporan Indonesia ke UNFCCC sesuai Paris rulebook).
export const GWP = Object.freeze({ CH4: 28, N2O: 265, 'HFC-32': 677, 'HFC-125': 3170, 'HFC-134a': 1300, 'HFC-143a': 4800, 'HCFC-22': 1760 });

// IPCC 2006 Vol. 2: NCV (Tabel 1.2, TJ/Gg = MJ/kg) dan faktor emisi (kg/TJ).
// Stasioner: Tabel 2.3 (industri manufaktur). Bergerak: Tabel 3.2.1 & 3.2.2 (jalan raya).
const FUELS = Object.freeze({
  naturalGas: { ncv: 48.0, co2: 56100, ch4: 1, n2o: 0.1 },
  dieselStationary: { ncv: 43.0, co2: 74100, ch4: 3, n2o: 0.6 },
  dieselRoad: { ncv: 43.0, co2: 74100, ch4: 3.9, n2o: 3.9 },
  gasolineRoad: { ncv: 44.3, co2: 69300, ch4: 25, n2o: 8.0 }, // kendaraan dengan katalis oksidasi
  lpg: { ncv: 47.3, co2: 63100, ch4: 1, n2o: 0.1 },
  wood: { ncv: 15.6, co2Biogenic: 112000, ch4: 30, n2o: 4 },
});

// Asumsi yang terlihat di UI. Densitas = nilai tengah rentang spesifikasi BBM Ditjen Migas.
export const ASSUMPTIONS = Object.freeze({
  dieselDensity: 0.84, // kg/L
  gasolineDensity: 0.74, // kg/L
  gasNcvPerGcv: 0.9, // IPCC 2006 Vol. 2 Bab 1: NCV gas alam ~10% lebih rendah dari GCV
  gjPerMmbtu: 1.055056,
});

export function biodieselBlend(year) {
  if (year >= 2025) return { share: 0.40, label: 'B40', note: 'B40 wajib sejak 2025 (masa transisi awal tahun).' };
  if (year >= 2023) return { share: 0.35, label: 'B35', note: year === 2023 ? 'B35 berlaku 1 Februari 2023; Januari 2023 masih B30 (diabaikan).' : 'B35.' };
  return { share: 0.30, label: 'B30', note: 'B30 sejak Januari 2020.' };
}

const perTJ = f => (f.co2 ?? 0) + f.ch4 * GWP.CH4 + f.n2o * GWP.N2O; // kg CO2e/TJ (CO2 fosil)

// ESDM 2019, kolom 7: combined margin ex-post (OM 0,5 / BM 0,5), t CO2/MWh.
// Satu-satunya publikasi resmi terbaru di indeks unduhan Ditjen Gatrik per 13 Okt 2026.
const GRIDS = Object.freeze([
  { id: 'jamali', name: 'Jawa-Madura-Bali', provinces: 'Banten, DKI Jakarta, Jawa Barat, Jawa Tengah, DIY, Jawa Timur, Bali', om: 0.80, bm: 0.94, cm: 0.87 },
  { id: 'sumatera', name: 'Sumatera', provinces: 'Aceh, Sumut, Sumbar, Riau, Jambi, Bengkulu, Sumsel, Lampung', om: 0.77, bm: 1.12, cm: 0.94 },
  { id: 'sulselbar', name: 'Sulselbar', provinces: 'Sulawesi Selatan & Barat', om: 0.73, bm: 1.17, cm: 0.95 },
  { id: 'sulutgo', name: 'Sulutgo', provinces: 'Sulawesi Utara & Gorontalo', om: 0.67, bm: 0.90, cm: 0.78 },
  { id: 'mahakam', name: 'Mahakam', provinces: 'Kalimantan Timur', om: 1.12, bm: 1.16, cm: 1.14 },
  { id: 'barito', name: 'Barito', provinces: 'Kalimantan Selatan & Tengah', om: 1.20, bm: 1.41, cm: 1.31 },
  { id: 'khatulistiwa', name: 'Khatulistiwa', provinces: 'Kalimantan Barat', om: 1.67, bm: 1.59, cm: 1.63 },
  { id: 'batam', name: 'Batam-Tanjung Pinang', provinces: 'Kepulauan Riau', om: 0.76, bm: 0.88, cm: 0.82 },
  { id: 'lombok', name: 'Lombok', provinces: 'Nusa Tenggara Barat', om: 1.27, bm: 1.96, cm: 1.61 },
]);
export const GRID_FACTOR_YEAR = 2019;

// Satuan kalkulator: konversi ke satuan dasar faktor.
export const UNITS = Object.freeze({
  GJ: { label: 'GJ (basis NCV)', toBase: 1, base: 'GJ' },
  MMBTU: { label: 'MMBTU (tagihan gas, basis GCV)', toBase: ASSUMPTIONS.gjPerMmbtu * ASSUMPTIONS.gasNcvPerGcv, base: 'GJ' },
  L: { label: 'liter', toBase: 1, base: 'L' },
  kL: { label: 'kiloliter', toBase: 1000, base: 'L' },
  kg: { label: 'kg', toBase: 1, base: 'kg' },
  t: { label: 'ton', toBase: 1000, base: 'kg' },
  kWh: { label: 'kWh', toBase: 1, base: 'kWh' },
  MWh: { label: 'MWh', toBase: 1000, base: 'kWh' },
});

const dieselGjPerL = ASSUMPTIONS.dieselDensity * FUELS.dieselStationary.ncv / 1000;
const gasolineGjPerL = ASSUMPTIONS.gasolineDensity * FUELS.gasolineRoad.ncv / 1000;

function dieselFactor(fuel, year, label) {
  const blend = biodieselBlend(year);
  const fossil = 1 - blend.share;
  const kgPerTJ = fuel.co2 * fossil + fuel.ch4 * GWP.CH4 + fuel.n2o * GWP.N2O;
  return {
    value: dieselGjPerL * kgPerTJ / 1000,
    perUnit: 'L',
    formula: `${fmt(ASSUMPTIONS.dieselDensity)} kg/L × ${fmt(fuel.ncv)} MJ/kg ÷ 1000 × (${fmt(fuel.co2)} × ${fmt(fossil)} + ${fmt(fuel.ch4)} × ${GWP.CH4} + ${fmt(fuel.n2o)} × ${GWP.N2O}) kg/TJ ÷ 1000`,
    region: 'Indonesia (mandatori biodiesel nasional)',
    validFor: `${year} · ${blend.label}`,
    refs: ['ipcc2006', 'ar5', 'esdmBiodiesel'],
    assumptions: [
      `${label}. Campuran ${blend.label}: hanya ${Math.round(fossil * 100)}% volume fosil yang dihitung sebagai CO2; CO2 biogenik FAME dilaporkan terpisah. ${blend.note}`,
      `Densitas ${fmt(ASSUMPTIONS.dieselDensity)} kg/L (nilai tengah spesifikasi). CH4 dan N2O dihitung pada seluruh volume dengan NCV solar (penyederhanaan konservatif).`,
      'Ganti dengan densitas/NCV dari sertifikat pemasok bila tersedia.',
    ],
  };
}

function fmt(v) { return String(v).replace('.', ','); }

// Katalog source group. `units` = satuan yang boleh dipilih. `available: false` = belum ada faktor andal.
export const SOURCE_GROUPS = Object.freeze([
  { id: 's1_natgas', scope: 1, section: 'Pembakaran stasioner', label: 'Gas alam (boiler, pemanas proses)', units: ['GJ', 'MMBTU'],
    factor: () => ({ value: perTJ(FUELS.naturalGas) / 1000, perUnit: 'GJ', formula: '(56.100 + 1 × 28 + 0,1 × 265) kg CO2e/TJ ÷ 1000', region: 'Default IPCC (berlaku global, Tier 1)', validFor: 'Semua tahun', refs: ['ipcc2006', 'ar5'],
      assumptions: ['Faktor pada basis NCV. Tagihan PGN umumnya MMBTU basis GCV: dikonversi × 1,055056 GJ/MMBTU × 0,9 (NCV/GCV).', 'Bila tagihan sudah dalam GJ NCV, pilih satuan GJ.'] }) },
  { id: 's1_diesel_stationary', scope: 1, section: 'Pembakaran stasioner', label: 'Biosolar untuk genset/boiler', units: ['L', 'kL'],
    factor: year => dieselFactor(FUELS.dieselStationary, year, 'Pembakaran stasioner (IPCC Tabel 2.3)') },
  { id: 's1_lpg', scope: 1, section: 'Pembakaran stasioner', label: 'LPG (kantin, forklift, pemanas)', units: ['kg', 't'],
    factor: () => ({ value: FUELS.lpg.ncv / 1000 * perTJ(FUELS.lpg) / 1000, perUnit: 'kg', formula: '47,3 MJ/kg ÷ 1000 × (63.100 + 1 × 28 + 0,1 × 265) kg CO2e/TJ ÷ 1000', region: 'Default IPCC', validFor: 'Semua tahun', refs: ['ipcc2006', 'ar5'],
      assumptions: ['Massa LPG dari pembelian tabung/bulk. Forklift LPG dianggap stasioner (selisih CH4/N2O kecil).'] }) },
  { id: 's1_biomass_wood', scope: 1, section: 'Pembakaran stasioner', label: 'Biomassa kayu/woodchip (boiler)', units: ['t', 'kg'],
    factor: () => ({ value: FUELS.wood.ncv * (FUELS.wood.ch4 * GWP.CH4 + FUELS.wood.n2o * GWP.N2O) / 1000 / 1000, perUnit: 'kg', formula: '15,6 MJ/kg ÷ 1000 × (30 × 28 + 4 × 265) kg CO2e/TJ ÷ 1000', region: 'Default IPCC', validFor: 'Semua tahun', refs: ['ipcc2006', 'ar5', 'ghgp'],
      memo: { label: 'CO2 biogenik (dilaporkan terpisah)', perUnit: 'kg', value: FUELS.wood.ncv * FUELS.wood.co2Biogenic / 1000 / 1000 },
      assumptions: ['Hanya CH4 dan N2O masuk Scope 1. CO2 biogenik (112.000 kg/TJ) ditampilkan sebagai memo, tidak dijumlahkan.', 'NCV 15,6 MJ/kg mengasumsikan kadar air default IPCC; cangkang sawit memerlukan NCV dari uji pemasok.'] }) },
  { id: 's1_diesel_mobile', scope: 1, section: 'Kendaraan milik/dikendalikan', label: 'Biosolar untuk kendaraan perusahaan', units: ['L', 'kL'],
    factor: year => dieselFactor(FUELS.dieselRoad, year, 'Pembakaran bergerak, jalan raya (IPCC Tabel 3.2.1–3.2.2)') },
  { id: 's1_gasoline_mobile', scope: 1, section: 'Kendaraan milik/dikendalikan', label: 'Bensin (Pertalite/Pertamax) untuk kendaraan perusahaan', units: ['L', 'kL'],
    factor: () => ({ value: gasolineGjPerL * perTJ(FUELS.gasolineRoad) / 1000, perUnit: 'L', formula: '0,74 kg/L × 44,3 MJ/kg ÷ 1000 × (69.300 + 25 × 28 + 8 × 265) kg CO2e/TJ ÷ 1000', region: 'Default IPCC', validFor: 'Semua tahun', refs: ['ipcc2006', 'ar5'],
      assumptions: ['Densitas 0,74 kg/L. CH4/N2O kendaraan berkatalis oksidasi. Kandungan etanol (mis. Pertamax Green) tidak dikurangkan.'] }) },
  ...[
    ['r134a', 'R-134a', { 'HFC-134a': 1 }],
    ['r32', 'R-32', { 'HFC-32': 1 }],
    ['r410a', 'R-410A (50% R-32, 50% R-125)', { 'HFC-32': 0.5, 'HFC-125': 0.5 }],
    ['r404a', 'R-404A (44% R-125, 52% R-143a, 4% R-134a)', { 'HFC-125': 0.44, 'HFC-143a': 0.52, 'HFC-134a': 0.04 }],
    ['r407c', 'R-407C (23% R-32, 25% R-125, 52% R-134a)', { 'HFC-32': 0.23, 'HFC-125': 0.25, 'HFC-134a': 0.52 }],
    ['r22', 'R-22 / HCFC-22 (memo, di luar Scope 1)', { 'HCFC-22': 1 }],
    ['r717', 'R-717 amonia', {}],
  ].map(([id, label, mix]) => ({
    id: `s1_ref_${id}`, scope: 1, section: 'Refrigeran (kebocoran/isi ulang)', label, units: ['kg', 't'], memoOnly: id === 'r22',
    factor: () => {
      const gwp = Object.entries(mix).reduce((s, [gas, w]) => s + w * GWP[gas], 0);
      return { value: gwp, perUnit: 'kg', formula: Object.keys(mix).length ? Object.entries(mix).map(([g, w]) => `${fmt(w)} × ${GWP[g]} (${g})`).join(' + ') + ' kg CO2e/kg' : 'GWP 0', region: 'Global (sifat gas)', validFor: 'Semua tahun', refs: ['ar5', 'ghgp'],
        assumptions: [
          'Isi dengan massa refrigeran yang bocor/ditambahkan dalam setahun, bukan kapasitas muatan peralatan.',
          id === 'r22' ? 'HCFC diatur Protokol Montreal. Sesuai GHG Protocol, dihitung sebagai memo dan TIDAK dijumlahkan ke Scope 1.' : id === 'r717' ? 'Amonia tidak memiliki GWP langsung; hasil 0 adalah nilai sebenarnya, bukan data kosong.' : 'GWP campuran = rata-rata tertimbang massa komponen (AR5).',
        ] };
    },
  })),
  ...GRIDS.map(g => ({
    id: `s2_grid_${g.id}`, scope: 2, section: 'Listrik PLN (location-based)', label: `Listrik PLN · sistem ${g.name}`, units: ['kWh', 'MWh'], grid: g,
    factor: year => ({ value: g.cm, perUnit: 'kWh', formula: `CM ex-post = 0,5 × OM ${fmt(g.om)} + 0,5 × BM ${fmt(g.bm)} ≈ ${fmt(g.cm)} t CO2/MWh = ${fmt(g.cm)} kg CO2/kWh`, region: `${g.name} (${g.provinces})`, validFor: `Faktor tahun ${GRID_FACTOR_YEAR}`, refs: ['esdm2019', 'ghgp'],
      periodMismatch: year > GRID_FACTOR_YEAR,
      assumptions: [
        `Faktor resmi terbaru yang dipublikasikan ESDM adalah tahun ${GRID_FACTOR_YEAR}; dipakai untuk tahun inventaris ${year}${year > GRID_FACTOR_YEAR ? ' sebagai pendekatan (periode tidak sama)' : ''}.`,
        'Combined margin dirancang ESDM untuk perhitungan mitigasi; dipakai karena tidak ada faktor rata-rata jaringan resmi. Hanya CO2.',
        'Location-based. Sertifikat REC/I-REC tidak mengurangi angka ini; hasil market-based perlu dilaporkan terpisah.',
      ] }),
  })),
  ...[['s3_cat4_diesel', 4, 'Angkutan barang masuk oleh pihak ketiga · Biosolar'], ['s3_cat9_diesel', 9, 'Distribusi hilir oleh pihak ketiga · Biosolar']].map(([id, cat, label]) => ({
    id, scope: 3, category: cat, section: `Scope 3 kategori ${cat}`, label, units: ['L', 'kL'],
    factor: year => { const f = dieselFactor(FUELS.dieselRoad, year, `Truk pihak ketiga, metode berbasis bahan bakar (GHG Protocol Scope 3 kategori ${cat})`); f.assumptions.push('Hanya emisi pembakaran (tank-to-wheel). Emisi hulu bahan bakar (well-to-tank) tidak termasuk.'); return f; },
  })),
  { id: 's3_tonne_km', scope: 3, section: 'Belum tersedia', label: 'Angkutan berbasis ton-km', units: [], available: false,
    reason: 'Belum ada faktor ton-km resmi untuk armada Indonesia. Minta data liter Biosolar dari transporter dan pilih grup berbasis bahan bakar.' },
  { id: 's3_purchased', scope: 3, section: 'Belum tersedia', label: 'Bahan baku & kemasan yang dibeli', units: [], available: false,
    reason: 'Butuh faktor per material dari data pemasok atau basis data LCA berlisensi; tidak dapat ditentukan dari nama dan kuantitas saja.' },
  { id: 's3_air_travel', scope: 3, section: 'Belum tersedia', label: 'Perjalanan dinas udara', units: [], available: false,
    reason: 'Butuh rute dan kelas penerbangan (mis. kalkulator ICAO). Faktor per penumpang-km resmi Indonesia tidak tersedia.' },
  { id: 's3_waste', scope: 3, section: 'Belum tersedia', label: 'Limbah operasional', units: [], available: false,
    reason: 'Faktor bergantung pada metode pengolahan (TPA, insinerasi, daur ulang) dan komposisi limbah; perlu data kontraktor limbah.' },
].map(Object.freeze));

export function sourceGroup(id) { return SOURCE_GROUPS.find(g => g.id === id) ?? null; }
export function groupsForScope(scope) { return SOURCE_GROUPS.filter(g => g.scope === Number(scope)); }

// Faktor lengkap untuk satu grup dan tahun, dengan metadata yang ditampilkan di UI.
export function resolveFactor(groupId, year = DEFAULT_YEAR) {
  const g = sourceGroup(groupId);
  if (!g || g.available === false) return null;
  const f = g.factor(Number(year));
  return { ...f, groupId, unit: `kg CO2e/${f.perUnit}`, sources: f.refs.map(r => REFS[r]) };
}

export function factorTable(year = DEFAULT_YEAR) {
  return SOURCE_GROUPS.filter(g => g.available !== false).map(g => ({ group: g, factor: resolveFactor(g.id, year) }));
}
