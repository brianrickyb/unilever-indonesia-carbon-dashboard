# Data dictionary — PT Unilever Indonesia Tbk, 2020–2025

Dibuat otomatis oleh `npm run build:data` dari `dist/data/official.mjs`. Jangan diedit manual.

## Kolom file `unilever-indonesia-emissions-2020-2025.csv`

| Kolom | Arti |
| --- | --- |
| company | Selalu PT Unilever Indonesia Tbk |
| year | Tahun pelaporan (periode data) |
| indicator_id | Kode indikator (lihat tabel di bawah) |
| value | Angka seri utama; kosong = tidak tersedia, bukan nol |
| unit | Satuan |
| status / status_label | Status ketersediaan |
| boundary | Batas pelaporan |
| component_of | Indikator induk; jangan menjumlahkan komponen dengan induknya |
| source_report_year | Laporan asal angka (bisa lebih baru dari `year` bila revisi) |
| printed_page / pdf_page | Halaman cetak dan halaman file PDF |
| source_url | Tautan PDF resmi langsung ke halaman |
| source_table | Tabel sumber di laporan |
| note | Catatan revisi, konflik atau batas |

## Status

| Kode | Arti |
| --- | --- |
| `reported` | Dilaporkan |
| `restated` | Dilaporkan ulang (revisi) |
| `reported_dash` | Tanda “–” di tabel |
| `not_disclosed` | Tidak tercantum di laporan |
| `not_published` | Belum dipublikasikan (dinyatakan laporan) |

## Indikator resmi

| ID | Indikator | Satuan | Definisi | Batas | Komponen dari |
| --- | --- | --- | --- | --- | --- |
| `ops_s12` | Emisi operasional (Scope 1+2), subtotal dilaporkan | t CO2e | Baris “Operasional Unilever (Cakupan 1 dan 2)” atau total tabel pengurangan emisi. Angka dilaporkan, bukan hasil penjumlahan dashboard. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `s1` | Scope 1 | t CO2e | Emisi langsung dari pembakaran gas dan light fuel serta kebocoran refrigeran di lokasi yang dikendalikan perusahaan. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `s1_fuel` | Scope 1 · gas & light fuel | t CO2e | Baris “Energi tidak terbarukan (emisi CO2 dari gas dan light fuel)”. Komponen Scope 1. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. | `s1` |
| `s1_refrigerant` | Scope 1 · refrigeran | t CO2e | Baris “Refrigerants”. Komponen Scope 1. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. | `s1` |
| `s2_reported` | Scope 2, tabel utama (market-based) | t CO2e | Emisi listrik yang dibeli sebagaimana tercantum di tabel utama. Basis market-based: listrik yang dicakup sertifikat REC/I-REC tidak dihitung. Angka location-based tidak diungkapkan. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `s3` | Scope 3 | t CO2e | Emisi tidak langsung rantai nilai. Hanya tersedia untuk 2020 (dilaporkan ulang di laporan 2021) dan 2021. | Rantai nilai, lima kelompok yang dipakai laporan 2021. |  |
| `s3_ingredients_packaging` | Scope 3 · bahan baku & kemasan | t CO2e | “Ingredients and packaging”. | Rantai nilai. | `s3` |
| `s3_consumer_use` | Scope 3 · penggunaan oleh konsumen | t CO2e | “Consumer use”. | Rantai nilai. | `s3` |
| `s3_distribution_retail` | Scope 3 · distribusi & ritel | t CO2e | “Distribution and retail”. | Rantai nilai. | `s3` |
| `s3_disposal` | Scope 3 · pembuangan | t CO2e | “Disposal”. | Rantai nilai. | `s3` |
| `s3_inbound_transport` | Scope 3 · transportasi masuk | t CO2e | “Inbound transport”. | Rantai nilai. | `s3` |
| `full_value_chain` | Total rantai nilai (Scope 1, 2, 3), dilaporkan | t CO2e | Baris “Full value chain”. Sudah memuat Scope 1, 2 dan 3; jangan dijumlahkan lagi dengan Scope 3. | Operasional + rantai nilai. |  |
| `co2_energy_mfg_2020basis` | CO2 dari energi, basis pasar (metrik laporan 2020) | t CO2 | Satu-satunya angka emisi absolut di laporan 2020. Batas dan cakupan gas berbeda dari Scope 1+2; tidak dipakai di seri utama. | Pabrik saja (definisi laporan 2020). |  |
| `ei_mfg` | Intensitas emisi manufaktur | kg CO2e/ton produk | Emisi Scope 1+2 manufaktur dibagi ton produk (laporan 2025 hlm. 185). Pembilang tidak sama dengan emisi operasional organisasi. | Hanya aktivitas manufaktur; tidak termasuk logistik dan kantor. |  |
| `energy_total` | Konsumsi energi total | GJ | Konsumsi energi dalam organisasi (GRI 302-1): kantor, manufaktur dan gudang. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `energy_renewable` | Energi terbarukan | GJ | Biomassa on-site + PV surya on-site + listrik yang dicakup REC tanpa bundel (unbundled). | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `energy_renewable_share` | Porsi energi terbarukan (dilaporkan) | % | Persentase yang tercetak di laporan. Lebih dari separuhnya berasal dari sertifikat REC tanpa bundel, bukan pembangkitan fisik on-site. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `en_biomass` | Energi · biomassa on-site | GJ | “On-site renewable self-generation, biomass”. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. | `energy_renewable` |
| `en_solar` | Energi · PV surya on-site | GJ | “On-site renewable self-generation, PV solar”. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. | `energy_renewable` |
| `en_rec` | Energi · listrik dicakup REC (unbundled) | GJ | “Purchased renewable electricity: unbundled RECs bought in market”. Listrik fisik tetap dari jaringan PLN. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. | `energy_renewable` |
| `en_nonre_onsite` | Energi · tak terbarukan on-site (gas, light fuel) | GJ | “On-site non-renewable energy (e.g. gas, light-fuel oil, gas-fired CHP)”. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `en_nonre_grid` | Energi · listrik jaringan tanpa sertifikat | GJ | “Purchased non-renewable electricity”. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `energy_office` | Energi · kantor pusat | GJ | Rincian konsumsi energi per jenis lokasi. | Grha Unilever. |  |
| `energy_mfg` | Energi · manufaktur | GJ | Rincian konsumsi energi per jenis lokasi. | Pabrik. |  |
| `energy_warehouse` | Energi · gudang/logistik | GJ | Rincian konsumsi energi per jenis lokasi. | Gudang yang masuk cakupan (3 gudang s.d. 2024, 11 gudang pada 2025). |  |
| `electricity_total` | Konsumsi listrik | GJ | Tabel “Konsumsi energi” laporan 2025; sama dengan REC + PV surya pada 2023–2025. | Manufaktur, logistik gudang dan kantor pusat (Grha Unilever); pendekatan operational control. |  |
| `energy_intensity_mfg` | Intensitas energi manufaktur | GJ/ton produk | Konsumsi energi manufaktur per ton produk (GRI 302-3). | Hanya aktivitas manufaktur; tidak termasuk logistik dan kantor. |  |

## Metrik turunan (`unilever-indonesia-derived-metrics.csv`) — hasil perhitungan, bukan angka laporan

| ID | Metrik | Satuan | Rumus |
| --- | --- | --- | --- |
| `refrigerantShare` | Porsi refrigeran dari Scope 1 | % | s1_refrigerant ÷ s1 × 100 |
| `fuelShare` | Porsi gas & light fuel dari Scope 1 | % | s1_fuel ÷ s1 × 100 |
| `componentGap` | Selisih Scope 1 − (gas & light fuel + refrigeran) | t CO2e | s1 − (s1_fuel + s1_refrigerant) |
| `impliedFuelFactor` | Faktor implisit bahan bakar on-site | kg CO2e/GJ | s1_fuel × 1000 ÷ en_nonre_onsite |
| `renewableShareComputed` | Porsi energi terbarukan (dihitung) | % | energy_renewable ÷ energy_total × 100 |
| `recShare` | Porsi listrik dicakup REC dari energi total | % | en_rec ÷ energy_total × 100 |
| `onsiteRenewableShare` | Porsi energi terbarukan on-site (biomassa + PV) | % | (en_biomass + en_solar) ÷ energy_total × 100 |
| `fossilOnsiteShare` | Porsi bahan bakar fosil on-site | % | en_nonre_onsite ÷ energy_total × 100 |
| `purchasedGridMwh` | Listrik jaringan yang dibeli | MWh | (en_rec + en_nonre_grid bila dilaporkan) ÷ 3,6 |
| `scope2_location_estimate` | Estimasi independen Scope 2 location-based | t CO2 | purchasedGridMwh × 0,87 (CM ESDM 2019, Jamali) |
| `scope2_location_estimate_low` | Batas bawah estimasi | t CO2 | purchasedGridMwh × 0,80 (OM ESDM 2019, Jamali) |

## File Tableau (`unilever-indonesia-tableau.csv`)

- `data_type`: `resmi_laporan`, `hasil_perhitungan`, `estimasi_independen`.
- `sum_safe = TRUE` hanya untuk baris yang boleh dijumlahkan dalam satu tahun dan satuan yang sama (komponen Scope 1, Scope 2 dilaporkan, komponen energi). Filter `sum_safe` atau satu `metric_id` sebelum agregasi.
- `is_missing = TRUE`: biarkan null; jangan ubah menjadi 0 di Tableau (gunakan `ZN()` hanya bila memang ingin menganggap nol, dan sebaiknya jangan).
