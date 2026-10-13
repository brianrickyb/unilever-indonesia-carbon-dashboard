// Dataset resmi PT Unilever Indonesia Tbk, sustainability report 2020–2025.
// Ditranskripsi manual dari PDF resmi dan diperiksa ulang terhadap teks per halaman
// (lihat tools/verify_pdf_values.py). Halaman cetak dan halaman PDF dicatat terpisah;
// untuk keenam laporan, halaman PDF = halaman cetak + 2.
//
// Aturan nilai:
//   value === null tidak pernah berarti nol. Status menjelaskan alasannya.
//   Setiap kombinasi (indikator, tahun) punya tepat satu observasi `primary`.
//   Observasi lain adalah versi dari laporan lain (`superseded`) atau angka yang
//   bertentangan di laporan yang sama (`conflicting`). Keduanya hanya untuk audit.

export const REPORT_INDEX = 'https://www.unilever.co.id/en/investors/annual-financial-and-sustainability-report/sustainability-reports/';
export const RETRIEVED = '2026-10-13';
export const COMPANY = 'PT Unilever Indonesia Tbk';
export const YEARS = Object.freeze([2020, 2021, 2022, 2023, 2024, 2025]);

export const REPORTS = Object.freeze({
  2020: { year: 2020, title: 'Laporan Keberlanjutan 2020', url: 'https://www.unilever.co.id/files/c6eec177-e850-49f9-af7d-9ef9872e5109/sustainability-report-2020-pqldla.pdf', sha256: '356ad8636c75f6de2dfe0ebc84b2f5b2482755331cd1f7cc381b02c456b3ff55', bytes: 14201729, pdfPages: 164 },
  2021: { year: 2021, title: 'Laporan Keberlanjutan 2021', url: 'https://www.unilever.co.id/files/sustainability-report-2021-id.pdf', sha256: 'd56fa1cec2ae8b784985f620a8177d7ef8c1193c2064465d563b4d637d82a7ce', bytes: 13360907, pdfPages: 220 },
  2022: { year: 2022, title: 'Laporan Keberlanjutan 2022', url: 'https://www.unilever.co.id/files/indonesia-sustainability-report-2022.pdf', sha256: '0ec3075e99400c791a933617b6e4d18e3d541d98d9767293f3e509dfa2674999', bytes: 47243906, pdfPages: 218 },
  2023: { year: 2023, title: 'Laporan Keberlanjutan 2023', url: 'https://www.unilever.co.id/files/7a7fa3d4-b017-4943-95c4-ead368c8ed54/unilever-sustainability-report-2023-hires.pdf', sha256: '2141411dddc4b109720e569cdbae8c51d0d8ecb5320696fe946f6a7de9c553b5', bytes: 33020334, pdfPages: 316 },
  2024: { year: 2024, title: 'Laporan Keberlanjutan 2024', url: 'https://www.unilever.co.id/files/indonesia-sustainability-report-2024.pdf', sha256: '2d7608a96efd51b75713670f13c7c9c80e770594385ed210b2a8b5cca3afbd0b', bytes: 15962835, pdfPages: 312 },
  2025: { year: 2025, title: 'Laporan Keberlanjutan 2025', url: 'https://www.unilever.co.id/files/sustainability-report-2025.pdf', sha256: '8da1797d77b764790edead0508245a4afecd03b3e520d6901b5a9e6cc0070e4f', bytes: 8749016, pdfPages: 334 },
});

export const STATUS = Object.freeze({
  reported: 'Dilaporkan',
  restated: 'Dilaporkan ulang (revisi)',
  reported_dash: 'Tanda “–” di tabel',
  not_disclosed: 'Tidak tercantum di laporan',
  not_published: 'Belum dipublikasikan (dinyatakan laporan)',
});

const OPS_BOUNDARY = 'Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control.';
const MFG_ONLY = 'Hanya aktivitas manufaktur; tidak termasuk logistik dan kantor.';

// group: emisi | energi | intensitas | scope3
export const INDICATORS = Object.freeze({
  ops_s12: { label: 'Emisi operasional (Scope 1+2), subtotal dilaporkan', short: 'Operasional S1+2', unit: 't CO2e', group: 'emisi', boundary: OPS_BOUNDARY,
    definition: 'Baris “Operasional Unilever (Cakupan 1 dan 2)” atau total tabel pengurangan emisi. Angka dilaporkan, bukan hasil penjumlahan dashboard.' },
  s1: { label: 'Scope 1', short: 'Scope 1', unit: 't CO2e', group: 'emisi', boundary: OPS_BOUNDARY,
    definition: 'Emisi langsung dari pembakaran gas dan light fuel serta kebocoran refrigeran di lokasi yang dikendalikan perusahaan.' },
  s1_fuel: { label: 'Scope 1 · gas & light fuel', short: 'Gas & light fuel', unit: 't CO2e', group: 'emisi', boundary: OPS_BOUNDARY, componentOf: 's1',
    definition: 'Baris “Energi tidak terbarukan (emisi CO2 dari gas dan light fuel)”. Komponen Scope 1.' },
  s1_refrigerant: { label: 'Scope 1 · refrigeran', short: 'Refrigeran', unit: 't CO2e', group: 'emisi', boundary: OPS_BOUNDARY, componentOf: 's1',
    definition: 'Baris “Refrigerants”. Komponen Scope 1.' },
  s2_reported: { label: 'Scope 2, tabel utama (market-based)', short: 'Scope 2 dilaporkan', unit: 't CO2e', group: 'emisi', boundary: OPS_BOUNDARY,
    definition: 'Emisi listrik yang dibeli sebagaimana tercantum di tabel utama. Basis market-based: listrik yang dicakup sertifikat REC/I-REC tidak dihitung. Angka location-based tidak diungkapkan.' },
  s3: { label: 'Scope 3', short: 'Scope 3', unit: 't CO2e', group: 'scope3', boundary: 'Rantai nilai, lima kelompok yang dipakai laporan 2021.',
    definition: 'Emisi tidak langsung rantai nilai. Hanya tersedia untuk 2020 (dilaporkan ulang di laporan 2021) dan 2021.' },
  s3_ingredients_packaging: { label: 'Scope 3 · bahan baku & kemasan', short: 'Bahan baku & kemasan', unit: 't CO2e', group: 'scope3', componentOf: 's3', boundary: 'Rantai nilai.', definition: '“Ingredients and packaging”.' },
  s3_consumer_use: { label: 'Scope 3 · penggunaan oleh konsumen', short: 'Penggunaan konsumen', unit: 't CO2e', group: 'scope3', componentOf: 's3', boundary: 'Rantai nilai.', definition: '“Consumer use”.' },
  s3_distribution_retail: { label: 'Scope 3 · distribusi & ritel', short: 'Distribusi & ritel', unit: 't CO2e', group: 'scope3', componentOf: 's3', boundary: 'Rantai nilai.', definition: '“Distribution and retail”.' },
  s3_disposal: { label: 'Scope 3 · pembuangan', short: 'Pembuangan', unit: 't CO2e', group: 'scope3', componentOf: 's3', boundary: 'Rantai nilai.', definition: '“Disposal”.' },
  s3_inbound_transport: { label: 'Scope 3 · transportasi masuk', short: 'Transportasi masuk', unit: 't CO2e', group: 'scope3', componentOf: 's3', boundary: 'Rantai nilai.', definition: '“Inbound transport”.' },
  full_value_chain: { label: 'Total rantai nilai (Scope 1, 2, 3), dilaporkan', short: 'Total rantai nilai', unit: 't CO2e', group: 'scope3', boundary: 'Operasional + rantai nilai.',
    definition: 'Baris “Full value chain”. Sudah memuat Scope 1, 2 dan 3; jangan dijumlahkan lagi dengan Scope 3.' },
  co2_energy_mfg_2020basis: { label: 'CO2 dari energi, basis pasar (metrik laporan 2020)', short: 'CO2 energi (basis 2020)', unit: 't CO2', group: 'emisi', boundary: 'Pabrik saja (definisi laporan 2020).',
    definition: 'Satu-satunya angka emisi absolut di laporan 2020. Batas dan cakupan gas berbeda dari Scope 1+2; tidak dipakai di seri utama.' },
  ei_mfg: { label: 'Intensitas emisi manufaktur', short: 'Intensitas emisi', unit: 'kg CO2e/ton produk', group: 'intensitas', boundary: MFG_ONLY,
    definition: 'Emisi Scope 1+2 manufaktur dibagi ton produk (laporan 2025 hlm. 185). Pembilang tidak sama dengan emisi operasional organisasi.' },
  energy_total: { label: 'Konsumsi energi total', short: 'Energi total', unit: 'GJ', group: 'energi', boundary: OPS_BOUNDARY,
    definition: 'Konsumsi energi dalam organisasi (GRI 302-1): kantor, manufaktur dan gudang.' },
  energy_renewable: { label: 'Energi terbarukan', short: 'Energi terbarukan', unit: 'GJ', group: 'energi', boundary: OPS_BOUNDARY,
    definition: 'Biomassa on-site + PV surya on-site + listrik yang dicakup REC tanpa bundel (unbundled).' },
  energy_renewable_share: { label: 'Porsi energi terbarukan (dilaporkan)', short: '% terbarukan', unit: '%', group: 'energi', boundary: OPS_BOUNDARY,
    definition: 'Persentase yang tercetak di laporan. Lebih dari separuhnya berasal dari sertifikat REC tanpa bundel, bukan pembangkitan fisik on-site.' },
  en_biomass: { label: 'Energi · biomassa on-site', short: 'Biomassa on-site', unit: 'GJ', group: 'energi', componentOf: 'energy_renewable', boundary: OPS_BOUNDARY, definition: '“On-site renewable self-generation, biomass”.' },
  en_solar: { label: 'Energi · PV surya on-site', short: 'PV surya on-site', unit: 'GJ', group: 'energi', componentOf: 'energy_renewable', boundary: OPS_BOUNDARY, definition: '“On-site renewable self-generation, PV solar”.' },
  en_rec: { label: 'Energi · listrik dicakup REC (unbundled)', short: 'Listrik + REC', unit: 'GJ', group: 'energi', componentOf: 'energy_renewable', boundary: OPS_BOUNDARY,
    definition: '“Purchased renewable electricity: unbundled RECs bought in market”. Listrik fisik tetap dari jaringan PLN.' },
  en_nonre_onsite: { label: 'Energi · tak terbarukan on-site (gas, light fuel)', short: 'Bahan bakar fosil on-site', unit: 'GJ', group: 'energi', boundary: OPS_BOUNDARY, definition: '“On-site non-renewable energy (e.g. gas, light-fuel oil, gas-fired CHP)”.' },
  en_nonre_grid: { label: 'Energi · listrik jaringan tanpa sertifikat', short: 'Listrik jaringan tanpa REC', unit: 'GJ', group: 'energi', boundary: OPS_BOUNDARY, definition: '“Purchased non-renewable electricity”.' },
  energy_office: { label: 'Energi · kantor pusat', short: 'Kantor', unit: 'GJ', group: 'energi', boundary: 'Grha Unilever.', definition: 'Rincian konsumsi energi per jenis lokasi.' },
  energy_mfg: { label: 'Energi · manufaktur', short: 'Manufaktur', unit: 'GJ', group: 'energi', boundary: 'Pabrik.', definition: 'Rincian konsumsi energi per jenis lokasi.' },
  energy_warehouse: { label: 'Energi · gudang/logistik', short: 'Gudang', unit: 'GJ', group: 'energi', boundary: 'Gudang yang masuk cakupan (3 gudang s.d. 2024, 11 gudang pada 2025).', definition: 'Rincian konsumsi energi per jenis lokasi.' },
  electricity_total: { label: 'Konsumsi listrik', short: 'Listrik', unit: 'GJ', group: 'energi', boundary: OPS_BOUNDARY, definition: 'Tabel “Konsumsi energi” laporan 2025; sama dengan REC + PV surya pada 2023–2025.' },
  energy_intensity_mfg: { label: 'Intensitas energi manufaktur', short: 'Intensitas energi', unit: 'GJ/ton produk', group: 'intensitas', boundary: MFG_ONLY,
    definition: 'Konsumsi energi manufaktur per ton produk (GRI 302-3).' },
});

// Pembantu ringkas: o(indikator, tahun, nilai, status, laporan, halaman cetak, peran, catatan, tabel)
const o = (indicator, year, value, status, report, page, use = 'primary', note = '', table = '') =>
  ({ indicator, year, value, status, report, page, pdfPage: page === null ? null : page + 2, use, note, table });

const T_EM = 'Jumlah dan intensitas emisi berdasarkan jenis';
const T_RED = 'Pengurangan emisi CO2 dari tahun dasar';
const T_RE = 'Penggunaan energi terbarukan dan tidak terbarukan';
const T_ORG = 'Konsumsi energi dalam organisasi / perbandingan dari baseline';
const T_DESC = 'Konsumsi energi (deskripsi)';

export const OBSERVATIONS = Object.freeze([
  // ---------- 2020 ----------
  o('co2_energy_mfg_2020basis', 2020, 24776, 'reported', 2020, 120, 'primary', 'Metrik laporan 2020: CO2 dari energi (basis pasar), pabrik saja. Bukan Scope 1+2.', 'Energi & emisi CO2'),
  o('ops_s12', 2020, 29343.58, 'restated', 2022, 98, 'primary', 'Bertanda * “telah dihitung kembali”. Seri utama memakai revisi terakhir.', T_EM),
  o('ops_s12', 2020, 29343.63, 'restated', 2021, 94, 'superseded', 'Revisi pertama: menambah logistik dan kantor ke batas 2020.', T_EM),
  o('s1', 2020, 16518.17, 'restated', 2022, 98, 'primary', 'Dihitung ulang di laporan 2022. Komponen tetap 16.254,62 + 263,60 = 16.518,22 (selisih 0,05).', T_EM),
  o('s1', 2020, 16518.22, 'restated', 2021, 94, 'superseded', '', T_EM),
  o('s1_fuel', 2020, 16254.62, 'restated', 2022, 98, 'primary', 'Sama di laporan 2021 dan 2022.', T_EM),
  o('s1_fuel', 2020, 16254.62, 'restated', 2021, 94, 'superseded', '', T_EM),
  o('s1_refrigerant', 2020, 263.60, 'restated', 2022, 98, 'primary', 'Sama di laporan 2021 dan 2022.', T_EM),
  o('s1_refrigerant', 2020, 263.60, 'restated', 2021, 94, 'superseded', '', T_EM),
  o('s2_reported', 2020, 12825.41, 'restated', 2022, 98, 'primary', 'Baris “Energi listrik tidak terbarukan (electricity grid)”. Listrik yang dicakup REC tidak dihitung (market-based).', T_EM),
  o('s2_reported', 2020, 12825.41, 'restated', 2021, 94, 'superseded', '', T_EM),
  o('s3', 2020, 3154177.41, 'restated', 2021, 94, 'primary', 'Pertama kali muncul di laporan 2021; laporan 2020 tidak memuat Scope 3.', T_EM),
  o('s3_ingredients_packaging', 2020, 1297576.93, 'restated', 2021, 94, 'primary', '', T_EM),
  o('s3_consumer_use', 2020, 808107.64, 'restated', 2021, 94, 'primary', '', T_EM),
  o('s3_distribution_retail', 2020, 815215.34, 'restated', 2021, 94, 'primary', '', T_EM),
  o('s3_disposal', 2020, 203497.32, 'restated', 2021, 94, 'primary', '', T_EM),
  o('s3_inbound_transport', 2020, 29780.18, 'restated', 2021, 94, 'primary', '', T_EM),
  o('full_value_chain', 2020, 3183521.04, 'restated', 2021, 94, 'primary', '= Scope 3 + operasional 29.343,63 (versi laporan 2021).', T_EM),
  o('ei_mfg', 2020, 20.59, 'reported', 2021, 94, 'primary', 'Grafik laporan 2021–2025 konsisten 20,59.', 'Grafik intensitas emisi'),
  o('ei_mfg', 2020, 20.595, 'reported', 2020, 120, 'superseded', 'Laporan 2020 (metrik “CO2 dari energi, basis pasar”, kg/ton). Hlm. 3 membulatkan menjadi 20,60.', 'Energi & emisi CO2'),
  o('energy_total', 2020, 1034639.14, 'restated', 2022, 105, 'primary', 'Revisi laporan 2021: menambah gudang dan kantor. Tabel lain laporan 2022 hlm. 106: 1.034.639,16.', T_RE),
  o('energy_total', 2020, 1034639.16, 'restated', 2022, 106, 'conflicting', 'Jumlah kantor + manufaktur + logistik; selisih pembulatan 0,02 GJ.', T_ORG),
  o('energy_total', 2020, 1034639.14, 'restated', 2021, 98, 'superseded', '', T_RE),
  o('energy_total', 2020, 967314.32, 'reported', 2020, 120, 'superseded', 'Laporan 2020: pabrik saja, tidak termasuk solar/diesel logistik.', 'Energi & emisi CO2'),
  o('energy_renewable', 2020, 628015.36, 'restated', 2022, 105, 'primary', '', T_RE),
  o('energy_renewable_share', 2020, 61, 'restated', 2022, 105, 'primary', '', T_RE),
  o('en_biomass', 2020, 145488.09, 'restated', 2022, 105, 'primary', '', T_RE),
  o('en_solar', 2020, 868.70, 'restated', 2022, 105, 'primary', '', T_RE),
  o('en_rec', 2020, 481658.57, 'restated', 2022, 105, 'primary', '', T_RE),
  o('en_nonre_onsite', 2020, 291226.67, 'restated', 2022, 105, 'primary', '', T_RE),
  o('en_nonre_grid', 2020, 115397.11, 'restated', 2022, 105, 'primary', 'Satu-satunya tahun dengan listrik jaringan tanpa sertifikat.', T_RE),
  o('energy_office', 2020, 10856.02, 'restated', 2022, 106, 'primary', '', T_ORG),
  o('energy_mfg', 2020, 967314.32, 'restated', 2022, 106, 'primary', 'Sama dengan total energi di laporan 2020.', T_ORG),
  o('energy_warehouse', 2020, 56468.82, 'restated', 2022, 106, 'primary', 'Label tabel: “Total Energy Logistic”.', T_ORG),
  o('electricity_total', 2020, null, 'not_disclosed', null, null, 'primary', 'Tabel konsumsi listrik baru tersedia sejak laporan 2024/2025.'),
  o('energy_intensity_mfg', 2020, 0.804, 'reported', 2022, 106, 'primary', 'Laporan 2020 hlm. 120 juga 0,804; grafik membulatkan 0,80.', T_ORG),

  // ---------- 2021 ----------
  o('ops_s12', 2021, 20858.40, 'reported', 2021, 94, 'primary', 'Sama di laporan 2022 dan 2023.', T_EM),
  o('s1', 2021, 20858.40, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s1_fuel', 2021, 20626.82, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s1_refrigerant', 2021, 231.58, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s2_reported', 2021, null, 'reported_dash', 2021, 94, 'primary', 'Tabel utama “–”. Tabel pengurangan emisi laporan 2022 (hlm. 98) dan 2023 (hlm. 171) menulis 0.', T_EM),
  o('s2_reported', 2021, 0, 'reported', 2022, 98, 'conflicting', 'Tabel pengurangan emisi menulis 0 untuk tahun yang sama.', T_RED),
  o('s3', 2021, 2843661, 'reported', 2021, 94, 'primary', 'Lima kelompok rantai nilai menjumlah tepat ke angka ini.', T_EM),
  o('s3_ingredients_packaging', 2021, 1166878, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s3_consumer_use', 2021, 869312, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s3_distribution_retail', 2021, 591441, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s3_disposal', 2021, 189049, 'reported', 2021, 94, 'primary', '', T_EM),
  o('s3_inbound_transport', 2021, 26981, 'reported', 2021, 94, 'primary', '', T_EM),
  o('full_value_chain', 2021, 2864519.40, 'reported', 2021, 94, 'primary', '= Scope 3 + operasional 20.858,40.', T_EM),
  o('ei_mfg', 2021, 12.95, 'reported', 2021, 94, 'primary', '', 'Grafik intensitas emisi'),
  o('energy_total', 2021, 1006669.16, 'reported', 2023, 176, 'primary', 'Sama di laporan 2021 dan 2022. Tabel kantor/manufaktur/gudang: 1.006.669,11.', T_RE),
  o('energy_total', 2021, 1006669.11, 'reported', 2023, 172, 'conflicting', 'Penjumlahan per jenis lokasi; selisih 0,05 GJ.', T_ORG),
  o('energy_renewable', 2021, 742614.39, 'reported', 2023, 176, 'primary', '', T_RE),
  o('energy_renewable_share', 2021, 74, 'reported', 2023, 176, 'primary', '', T_RE),
  o('en_biomass', 2021, 158579.45, 'reported', 2023, 175, 'primary', '', T_RE),
  o('en_solar', 2021, 890.20, 'reported', 2023, 175, 'primary', '', T_RE),
  o('en_rec', 2021, 583144.74, 'reported', 2023, 176, 'primary', '', T_RE),
  o('en_nonre_onsite', 2021, 264054.77, 'reported', 2023, 176, 'primary', '', T_RE),
  o('en_nonre_grid', 2021, null, 'reported_dash', 2023, 176, 'primary', 'Tanda “–”; persentase dilaporkan 0%.', T_RE),
  o('energy_office', 2021, 11183.09, 'reported', 2023, 172, 'primary', '', T_ORG),
  o('energy_mfg', 2021, 938209.87, 'reported', 2023, 172, 'primary', '', T_ORG),
  o('energy_warehouse', 2021, 57276.15, 'reported', 2023, 172, 'primary', '', T_ORG),
  o('electricity_total', 2021, null, 'not_disclosed', null, null, 'primary', ''),
  o('energy_intensity_mfg', 2021, 0.83, 'reported', 2023, 172, 'primary', 'Laporan 2022 hlm. 106 menulis 0,825.', T_ORG),

  // ---------- 2022 ----------
  o('ops_s12', 2022, 16516.70, 'reported', 2022, 98, 'primary', 'Sama di laporan 2023 dan 2024.', T_EM),
  o('s1', 2022, 16516.70, 'reported', 2022, 98, 'primary', '', T_EM),
  o('s1_fuel', 2022, 15994.39, 'reported', 2022, 98, 'primary', '', T_EM),
  o('s1_refrigerant', 2022, 522.31, 'reported', 2022, 98, 'primary', '', T_EM),
  o('s2_reported', 2022, null, 'reported_dash', 2022, 98, 'primary', 'Tabel utama “–”; tabel pengurangan emisi di halaman yang sama menulis 0.', T_EM),
  o('s2_reported', 2022, 0, 'reported', 2022, 98, 'conflicting', '', T_RED),
  o('s3', 2022, null, 'not_disclosed', 2022, 98, 'primary', 'Tabel emisi 2022 hanya memuat Scope 1 dan 2; tidak ada pernyataan Scope 3 di laporan.', T_EM),
  o('full_value_chain', 2022, null, 'not_disclosed', 2022, 98, 'primary', ''),
  o('ei_mfg', 2022, 15.56, 'reported', 2022, 98, 'primary', '', 'Grafik intensitas emisi'),
  o('energy_total', 2022, 955063.81, 'reported', 2024, 192, 'primary', 'Konsisten di laporan 2022, 2023 dan tabel organisasi laporan 2024.', T_ORG),
  o('energy_total', 2022, 829252.82, 'reported', 2024, 192, 'conflicting', 'Tabel deskripsi laporan 2024 menulis angka berbeda tanpa penjelasan.', T_DESC),
  o('energy_renewable', 2022, 668396.28, 'reported', 2024, 193, 'primary', 'Tabel deskripsi laporan 2024 menulis 542.585,29.', T_RE),
  o('energy_renewable', 2022, 542585.29, 'reported', 2024, 192, 'conflicting', '', T_DESC),
  o('energy_renewable_share', 2022, 70, 'reported', 2024, 193, 'primary', '', T_RE),
  o('en_biomass', 2022, 125810.99, 'reported', 2024, 193, 'primary', '', T_RE),
  o('en_solar', 2022, 1100.31, 'reported', 2024, 193, 'primary', '', T_RE),
  o('en_rec', 2022, 541484.98, 'reported', 2024, 193, 'primary', '', T_RE),
  o('en_nonre_onsite', 2022, 286667.53, 'reported', 2024, 193, 'primary', '', T_RE),
  o('en_nonre_grid', 2022, null, 'reported_dash', 2024, 193, 'primary', '', T_RE),
  o('energy_office', 2022, 14680.59, 'reported', 2024, 192, 'primary', '', T_ORG),
  o('energy_mfg', 2022, 884436.08, 'reported', 2024, 192, 'primary', '', T_ORG),
  o('energy_warehouse', 2022, 55947.14, 'reported', 2024, 192, 'primary', '', T_ORG),
  o('electricity_total', 2022, 527904.70, 'reported', 2024, 192, 'primary', 'Tabel deskripsi laporan 2024. Tabel ini tidak konsisten untuk total energi; gunakan dengan hati-hati.', T_DESC),
  o('energy_intensity_mfg', 2022, 0.86, 'reported', 2024, 192, 'primary', '', T_ORG),

  // ---------- 2023 ----------
  o('ops_s12', 2023, 14662.90, 'reported', 2023, 168, 'primary', 'Sama di laporan 2024 dan 2025.', T_EM),
  o('s1', 2023, 14662.90, 'reported', 2023, 168, 'primary', '', T_EM),
  o('s1_fuel', 2023, 14525.70, 'reported', 2023, 168, 'primary', '', T_EM),
  o('s1_refrigerant', 2023, 137.20, 'reported', 2023, 168, 'primary', '', T_EM),
  o('s2_reported', 2023, null, 'reported_dash', 2023, 168, 'primary', 'Tabel utama “–”. Tabel pengurangan emisi laporan 2023 (hlm. 171) dan 2025 (hlm. 186) menulis 0.', T_EM),
  o('s2_reported', 2023, 0, 'reported', 2025, 186, 'conflicting', '', T_RED),
  o('s3', 2023, null, 'not_published', 2023, 168, 'primary', '“Hingga akhir 2023, Unilever Indonesia masih dalam tahap mendata emisi GRK cakupan 3.”', T_EM),
  o('full_value_chain', 2023, null, 'not_published', 2023, 168, 'primary', ''),
  o('ei_mfg', 2023, 14.50, 'reported', 2023, 169, 'primary', '', 'Grafik intensitas emisi'),
  o('energy_total', 2023, 838053.83, 'restated', 2025, 188, 'primary', 'Laporan 2025 merevisi angka laporan 2023 (834.203,75).', T_ORG),
  o('energy_total', 2023, 834203.75, 'reported', 2023, 172, 'superseded', 'Angka asli laporan 2023, juga tabel organisasi laporan 2024.', T_ORG),
  o('energy_total', 2023, 836918.12, 'reported', 2024, 192, 'conflicting', 'Tabel deskripsi laporan 2024.', T_DESC),
  o('energy_renewable', 2023, 577698.70, 'restated', 2025, 189, 'primary', '', T_RE),
  o('energy_renewable', 2023, 573886.46, 'reported', 2023, 176, 'superseded', '', T_RE),
  o('energy_renewable_share', 2023, 69, 'restated', 2025, 190, 'primary', 'Laporan 2023 juga 69%.', T_RE),
  o('en_biomass', 2023, 90494.12, 'restated', 2025, 189, 'primary', '', T_RE),
  o('en_solar', 2023, 1148.60, 'restated', 2025, 189, 'primary', 'Laporan 2023 dan 2024: 654,11.', T_RE),
  o('en_solar', 2023, 654.11, 'reported', 2023, 175, 'superseded', '', T_RE),
  o('en_rec', 2023, 486055.98, 'restated', 2025, 189, 'primary', 'Laporan 2023: 482.738,23.', T_RE),
  o('en_rec', 2023, 482738.23, 'reported', 2023, 176, 'superseded', '', T_RE),
  o('en_nonre_onsite', 2023, 260355.13, 'restated', 2025, 189, 'primary', 'Laporan 2023: 260.317,29.', T_RE),
  o('en_nonre_onsite', 2023, 260317.29, 'reported', 2023, 176, 'superseded', '', T_RE),
  o('en_nonre_grid', 2023, null, 'reported_dash', 2025, 189, 'primary', '', T_RE),
  o('energy_office', 2023, 16348.04, 'restated', 2025, 188, 'primary', 'Laporan 2023: 16.004,15.', T_ORG),
  o('energy_mfg', 2023, 798366.38, 'restated', 2025, 188, 'primary', 'Laporan 2023: 795.995,90.', T_ORG),
  o('energy_warehouse', 2023, 23339.41, 'restated', 2025, 188, 'primary', 'Laporan 2023: 22.203,70.', T_ORG),
  o('electricity_total', 2023, 487204.58, 'restated', 2025, 189, 'primary', 'Laporan 2024: 486.106,71.', T_DESC),
  o('energy_intensity_mfg', 2023, 0.79, 'reported', 2025, 188, 'primary', '', T_ORG),

  // ---------- 2024 ----------
  o('ops_s12', 2024, 10960.41, 'reported', 2024, 186, 'primary', 'Sama di laporan 2025 (hlm. 186, tabel pengurangan).', T_EM),
  o('s1', 2024, 10960.41, 'reported', 2024, 186, 'primary', '', T_EM),
  o('s1_fuel', 2024, 10710.42, 'reported', 2024, 187, 'primary', '', T_EM),
  o('s1_refrigerant', 2024, 249.99, 'reported', 2024, 187, 'primary', '', T_EM),
  o('s2_reported', 2024, null, 'reported_dash', 2024, 187, 'primary', 'Tabel utama “–”; tabel pengurangan laporan 2025 juga “–”. Narasi hlm. 188: penurunan karena offset Scope 2 dengan I-REC.', T_EM),
  o('s3', 2024, null, 'not_published', 2024, 186, 'primary', '“…masih melakukan pendataan dan perhitungan, sehingga belum dapat kami publikasikan.”', T_EM),
  o('full_value_chain', 2024, null, 'not_published', 2024, 186, 'primary', ''),
  o('ei_mfg', 2024, 11.40, 'reported', 2024, 187, 'primary', 'Catatan di bawah grafik masih menyebut 14,5 kg (angka 2023). Laporan 2025 mengonfirmasi 11,40.', 'Grafik intensitas emisi'),
  o('energy_total', 2024, 730389.48, 'reported', 2025, 188, 'primary', 'Sama di narasi dan tabel organisasi laporan 2024.', T_ORG),
  o('energy_total', 2024, 776899.51, 'reported', 2024, 193, 'conflicting', 'Tabel terbarukan laporan 2024 (PV surya 52.764,28 GJ). Dikoreksi laporan 2025.', T_RE),
  o('energy_total', 2024, 1507288.99, 'reported', 2024, 192, 'conflicting', 'Tabel deskripsi laporan 2024; tampak menjumlahkan listrik dan energi terbarukan dua kali.', T_DESC),
  o('energy_renewable', 2024, 539496.08, 'restated', 2025, 189, 'primary', 'Laporan 2024: 586.006,11 (tabel) atau 1.316.395,59 (tabel deskripsi).', T_RE),
  o('energy_renewable', 2024, 586006.11, 'reported', 2024, 193, 'superseded', '', T_RE),
  o('energy_renewable', 2024, 1316395.59, 'reported', 2024, 192, 'conflicting', 'Tabel deskripsi laporan 2024.', T_DESC),
  o('energy_renewable_share', 2024, 74, 'restated', 2025, 190, 'primary', 'Laporan 2024 mencetak 48% dan 75% (hlm. 186) untuk tahun yang sama.', T_RE),
  o('energy_renewable_share', 2024, 48, 'reported', 2024, 193, 'conflicting', 'Komponen persentase di tabel ini (5% + 4% + 30%) tidak menjumlah ke 48%.', T_RE),
  o('energy_renewable_share', 2024, 75, 'reported', 2024, 186, 'conflicting', 'Infografis pembuka bab.', 'Infografis'),
  o('en_biomass', 2024, 81789.65, 'restated', 2025, 189, 'primary', 'Sama di laporan 2024.', T_RE),
  o('en_solar', 2024, 6254.28, 'restated', 2025, 189, 'primary', 'Laporan 2024: 52.764,28 GJ. Revisi turun 88%.', T_RE),
  o('en_solar', 2024, 52764.28, 'reported', 2024, 193, 'superseded', '', T_RE),
  o('en_rec', 2024, 451452.15, 'restated', 2025, 189, 'primary', 'Laporan 2024: 451.452,18.', T_RE),
  o('en_nonre_onsite', 2024, 190893.40, 'reported', 2025, 189, 'primary', 'Sama di laporan 2024.', T_RE),
  o('en_nonre_grid', 2024, null, 'reported_dash', 2025, 189, 'primary', '', T_RE),
  o('energy_office', 2024, 15837.58, 'reported', 2025, 188, 'primary', '', T_ORG),
  o('energy_mfg', 2024, 692033.74, 'reported', 2025, 188, 'primary', '', T_ORG),
  o('energy_warehouse', 2024, 22518.16, 'reported', 2025, 188, 'primary', '', T_ORG),
  o('electricity_total', 2024, 457706.43, 'restated', 2025, 189, 'primary', 'Laporan 2024: 783.153,76.', T_DESC),
  o('electricity_total', 2024, 783153.76, 'reported', 2024, 192, 'superseded', '', T_DESC),
  o('energy_intensity_mfg', 2024, 0.78, 'reported', 2025, 188, 'primary', 'Tabel 0,78; grafik di halaman yang sama 0,74 (juga di laporan 2024 hlm. 191).', T_ORG),
  o('energy_intensity_mfg', 2024, 0.74, 'reported', 2025, 188, 'conflicting', 'Label grafik batang.', 'Grafik intensitas energi'),

  // ---------- 2025 ----------
  o('ops_s12', 2025, 7869.19, 'reported', 2025, 186, 'primary', 'Tabel utama hlm. 184 tidak memberi angka pada baris operasional; diambil dari total tabel pengurangan hlm. 186.', T_RED),
  o('s1', 2025, 7869.19, 'reported', 2025, 184, 'primary', '', T_EM),
  o('s1_fuel', 2025, 7590.51, 'reported', 2025, 184, 'primary', '', T_EM),
  o('s1_refrigerant', 2025, 278.68, 'reported', 2025, 184, 'primary', '', T_EM),
  o('s2_reported', 2025, null, 'reported_dash', 2025, 184, 'primary', 'Tabel utama “–”; tabel pengurangan hlm. 186 menulis 0. Narasi hlm. 185: offset Scope 2 dengan I-REC.', T_EM),
  o('s2_reported', 2025, 0, 'reported', 2025, 186, 'conflicting', '', T_RED),
  o('s3', 2025, null, 'not_published', 2025, 184, 'primary', '“…belum dapat kami publikasikan karena masih melakukan proses pendataan dan menyusun metode penghitungan yang tepat.”', T_EM),
  o('full_value_chain', 2025, null, 'not_published', 2025, 184, 'primary', ''),
  o('ei_mfg', 2025, 7.70, 'reported', 2025, 185, 'primary', '', 'Grafik intensitas emisi'),
  o('energy_total', 2025, 674488.63, 'reported', 2025, 188, 'primary', '', T_ORG),
  o('energy_renewable', 2025, 541717.80, 'reported', 2025, 189, 'primary', '', T_RE),
  o('energy_renewable_share', 2025, 80, 'reported', 2025, 190, 'primary', '', T_RE),
  o('en_biomass', 2025, 83413.51, 'reported', 2025, 189, 'primary', '', T_RE),
  o('en_solar', 2025, 17800.20, 'reported', 2025, 189, 'primary', '', T_RE),
  o('en_rec', 2025, 440504.09, 'reported', 2025, 189, 'primary', '', T_RE),
  o('en_nonre_onsite', 2025, 132770.83, 'reported', 2025, 189, 'primary', '', T_RE),
  o('en_nonre_grid', 2025, null, 'reported_dash', 2025, 189, 'primary', '', T_RE),
  o('energy_office', 2025, 15562.26, 'reported', 2025, 188, 'primary', '', T_ORG),
  o('energy_mfg', 2025, 607122.28, 'reported', 2025, 188, 'primary', 'Pabrik es krim hanya Januari–November 2025.', T_ORG),
  o('energy_warehouse', 2025, 51804.09, 'reported', 2025, 188, 'primary', 'Cakupan gudang bertambah dari 3 menjadi 11.', T_ORG),
  o('electricity_total', 2025, 458304.29, 'reported', 2025, 189, 'primary', '', T_DESC),
  o('energy_intensity_mfg', 2025, 0.62, 'reported', 2025, 188, 'primary', '', T_ORG),
].map(Object.freeze));

// Indikator yang tidak punya baris eksplisit di tahun tertentu: status diisi otomatis.
// Komponen Scope 3 dan total rantai nilai mengikuti status Scope 3.
const IMPLICIT_MISSING = ['s3_ingredients_packaging', 's3_consumer_use', 's3_distribution_retail', 's3_disposal', 's3_inbound_transport', 'co2_energy_mfg_2020basis'];

export function primaryObservation(indicator, year) {
  const found = OBSERVATIONS.find(r => r.indicator === indicator && r.year === year && r.use === 'primary');
  if (found) return found;
  if (!IMPLICIT_MISSING.includes(indicator)) return null;
  const parent = indicator.startsWith('s3_') ? primaryObservation('s3', year) : null;
  return Object.freeze({ indicator, year, value: null, status: parent?.status ?? 'not_disclosed', report: parent?.report ?? null,
    page: parent?.page ?? null, pdfPage: parent?.pdfPage ?? null, use: 'primary',
    note: indicator === 'co2_energy_mfg_2020basis' ? 'Metrik khusus laporan 2020; tidak dipakai lagi sejak laporan 2021.' : 'Mengikuti status Scope 3.', table: '' });
}

// Nilai seri utama; null bila tidak tersedia.
export function value(indicator, year) {
  return primaryObservation(indicator, year)?.value ?? null;
}

// Catatan konteks per tahun: perubahan batas, metode, dan peristiwa yang memengaruhi keterbandingan.
export const YEAR_CONTEXT = Object.freeze({
  2020: { boundaryChange: true, events: [
    { text: 'Laporan 2020 hanya memuat “CO2 dari energi (basis pasar)” untuk pabrik (24.776 t). Seri Scope 1+2 2020 berasal dari revisi laporan 2021–2022 yang menambah logistik dan kantor.', report: 2021, page: 94 },
    { text: 'Satu-satunya tahun dengan listrik jaringan tanpa sertifikat (115.397,11 GJ) dan Scope 2 bernilai (12.825,41 t CO2e).', report: 2022, page: 105 },
  ] },
  2021: { boundaryChange: false, events: [
    { text: 'Seluruh listrik yang dibeli dicakup sertifikat REC; Scope 2 tabel utama menjadi “–”.', report: 2021, page: 98 },
  ] },
  2022: { boundaryChange: false, events: [] },
  2023: { boundaryChange: true, events: [
    { text: 'Definisi batas berubah dari “pabrik, logistik dan kantor” (laporan 2022) menjadi “manufaktur, logistik di gudang, dan Grha Unilever” dengan pendekatan operational control.', report: 2023, page: 168 },
    { text: 'Energi logistik/gudang turun dari 55.947,14 GJ (2022) menjadi 22.203,70 GJ (2023, angka asli; revisi 2025: 23.339,41).', report: 2023, page: 172 },
    { text: 'Laporan 2025 merevisi energi 2023 (834.203,75 → 838.053,83 GJ). Emisi 2023 tidak direvisi.', report: 2025, page: 188 },
  ] },
  2024: { boundaryChange: false, events: [
    { text: 'Pengolahan sabun batangan di Pabrik Rungkut dihentikan; fasilitas fokus pada pengemasan.', report: 2024, page: 194 },
    { text: 'Laporan menyatakan “komponen yang termasuk dalam perhitungan emisi adalah CO2”, padahal satuan tabel t CO2e dan memuat refrigeran.', report: 2024, page: 186 },
  ] },
  2025: { boundaryChange: true, events: [
    { text: 'Cakupan gudang bertambah dari 3 menjadi 11.', report: 2025, page: 185 },
    { text: 'Pabrik es krim hanya Januari–November 2025 setelah divestasi/de-merger selesai 8 Desember 2025.', report: 2025, page: 182 },
  ] },
});

// Baseline 2015 berbeda antar tabel; dashboard tidak menghitung ulang klaim penurunan terhadap 2015.
export const BASELINE_2015 = Object.freeze([
  { table: 'Tabel pengurangan emisi (laporan 2022 hlm. 98, 2023 hlm. 171, 2025 hlm. 186)', s1: 31731.73, s2: 107262.47, total: 138994.20 },
  { table: 'Tabel jumlah emisi (laporan 2024 hlm. 186–187, 2025 hlm. 184)', s1: 29976.92, s2: 96005.00, total: null, note: 'Komponen gas & light fuel 29.976,92 + refrigeran 454,72 = 30.431,64, tidak sama dengan Scope 1 29.976,92.' },
]);

// Klaim persentase penurunan terhadap 2015 sebagaimana dilaporkan (tidak dihitung ulang).
export const REPORTED_REDUCTION_CLAIMS = Object.freeze([
  { year: 2020, percent: 78.89, report: 2022, page: 98 },
  { year: 2021, percent: 84.99, report: 2022, page: 98 },
  { year: 2022, percent: 88.12, report: 2022, page: 98 },
  { year: 2023, percent: 89.45, report: 2023, page: 171 },
  { year: 2024, percent: 92, report: 2025, page: 186 },
  { year: 2025, percent: 94.34, report: 2025, page: 186, note: 'Laporan menyebut “untuk kegiatan manufaktur” dan “karena proses offset cakupan 2 dengan I-REC”.' },
]);

export function sourceUrl(report, page) {
  const r = REPORTS[report];
  if (!r) return REPORT_INDEX;
  return page ? `${r.url}#page=${page + 2}` : r.url;
}
