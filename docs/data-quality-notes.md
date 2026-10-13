# Catatan kualitas data — PT Unilever Indonesia Tbk, 2020–2025

Diverifikasi 13 Oktober 2026 terhadap enam PDF resmi (SHA-256 di `dist/data/official.mjs`). Semua 144 angka di dataset dicek otomatis muncul di halaman PDF yang dirujuk (`npm run verify:pdf -- <folder-pdf> data/observations-all-versions.json`).

## 1. Ketersediaan per indikator

| Indikator | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 |
| --- | --- | --- | --- | --- | --- | --- |
| Scope 1 + komponen | revisi (lap. 2022) | ada | ada | ada | ada | ada |
| Scope 2, tabel utama | 12.825,41 (revisi) | “–” | “–” | “–” | “–” | “–” |
| Scope 3 | revisi (lap. 2021) | ada | tidak tercantum | belum dipublikasikan | belum dipublikasikan | belum dipublikasikan |
| Intensitas emisi manufaktur | ada | ada | ada | ada | ada | ada |
| Energi total & bauran | revisi (lap. 2021/2022) | ada | ada | revisi (lap. 2025) | revisi (lap. 2025) | ada |
| Konsumsi listrik | — | — | ada (tabel tak konsisten) | revisi | revisi | ada |

“–”, “tidak tercantum” dan “belum dipublikasikan” disimpan sebagai `null` dengan status berbeda. Tidak ada nilai yang diisi, diinterpolasi atau dianggap nol.

## 2. Revisi dan seri yang dipakai

Aturan: **seri utama = revisi terakhir yang komponennya menjumlah dengan benar.** Semua versi lain tetap ada di `data/unilever-indonesia-all-versions.csv` (kolom `use`).

| Tahun | Indikator | Versi awal | Versi dipakai | Alasan |
| --- | --- | --- | --- | --- |
| 2020 | Emisi | Lap. 2020: “CO₂ dari energi (basis pasar)” 24.776 t, pabrik saja | Lap. 2022: Scope 1 16.518,17; Scope 2 12.825,41; operasional 29.343,58 | Laporan 2021 menambah logistik & kantor (batas sama dengan 2021–2025); laporan 2022 menghitung ulang (bertanda *). |
| 2020 | Scope 1 | Lap. 2021: 16.518,22 | Lap. 2022: 16.518,17 | Komponen (16.254,62 + 263,60) tetap = 16.518,22; selisih 0,05 dicatat. |
| 2020 | Energi | Lap. 2020: 967.314,32 GJ (pabrik) | Lap. 2021/2022: 1.034.639,14 GJ | Menambah gudang dan kantor. |
| 2023 | Energi total | Lap. 2023: 834.203,75 GJ | Lap. 2025: 838.053,83 GJ | Revisi; komponen konsisten. |
| 2023 | PV surya | 654,11 GJ | 1.148,60 GJ | Revisi laporan 2025. |
| 2024 | PV surya | Lap. 2024: 52.764,28 GJ | Lap. 2025: 6.254,28 GJ | Angka 2024 membuat total tabel terbarukan (776.899,51) tidak cocok dengan total organisasi (730.389,48). |
| 2024 | % terbarukan | Lap. 2024: 48% (tabel) dan 75% (infografis) | Lap. 2025: 74% | 48% tidak sesuai komponennya. |

## 3. Masalah konsistensi yang ditemukan

1. **Penghitungan ganda energi 2024** (lap. 2024 hlm. 192). Tabel “Konsumsi energi” mencetak total 1.507.288,99 GJ = 730.389,48 + 776.899,51, dan terbarukan 1.316.395,59 = 730.389,48 + 586.006,11. Tidak dipakai.
2. **Tabel deskripsi 2022 (lap. 2024)**: total 829.252,82 GJ = terbarukan tanpa biomassa (542.585,29) + fosil. Tidak dipakai.
3. **Intensitas energi 2024**: tabel 0,78 vs grafik 0,74 GJ/ton pada halaman yang sama (lap. 2024 hlm. 191–192; lap. 2025 hlm. 188). Dashboard memakai tabel.
4. **Intensitas emisi 2024**: grafik 11,40, catatan di bawahnya masih “14,5 kg pada 2023”. Dipakai 11,40 (dikonfirmasi lap. 2025).
5. **Intensitas 2020**: laporan 2020 hlm. 120 tabel 20,595; hlm. 3 20,60; grafik laporan 2021+ 20,59.
6. **Scope 2 “–” vs 0**: tabel utama “–” (2021–2025), tabel pengurangan emisi menulis 0 (2021, 2022, 2023, 2025) dan “–” (2024). Narasi 2024–2025: penurunan karena offset Scope 2 dengan I-REC. Basis market-based tidak dinyatakan eksplisit; location-based tidak diungkapkan.
7. **Cakupan gas**: laporan 2024 hlm. 186 menyatakan “komponen yang termasuk dalam perhitungan emisi adalah CO₂”, sementara tabel memakai t CO₂e dan memuat refrigeran.
8. **Baseline 2015 dua versi**: tabel pengurangan (Scope 1 31.731,73; Scope 2 107.262,47; total 138.994,20) vs tabel jumlah emisi (Scope 1 29.976,92; Scope 2 96.005,00; komponennya 29.976,92 + 454,72 ≠ 29.976,92). Klaim penurunan terhadap 2015 tidak dihitung ulang.
9. **Faktor implisit 2021**: gas & light fuel ÷ energi fosil on-site = 78,1 kg CO₂e/GJ, sedangkan tahun lain 55,8–57,2 (gas alam IPCC 56,2). Puncak Scope 1 2021 perlu dikonfirmasi.
10. **Faktor implisit Scope 2 2020**: 12.825,41 t ÷ 32.055 MWh = 0,40 t/MWh, separuh faktor ESDM Jamali 2019 (OM 0,80; CM 0,87).

## 4. Keterbandingan antar tahun

- **2020**: seri revisi (lihat §2). Angka asli laporan 2020 tidak sebanding.
- **2023**: definisi batas berubah dari “pabrik, logistik dan kantor” menjadi “manufaktur, logistik di gudang, dan Grha Unilever” (operational control). Energi logistik/gudang turun 55.947 → 22.204 GJ (angka asli 2023).
- **2024**: pengolahan sabun batangan di Rungkut dihentikan (lap. 2024 hlm. 194).
- **2025**: gudang 3 → 11 (energi gudang +130%); pabrik es krim hanya Januari–November (divestasi selesai 8 Desember 2025).
- **Intensitas** hanya manufaktur; emisi absolut mencakup gudang dan kantor. Volume produksi tidak diungkapkan.

## 5. Ambang batas peringatan

| Aturan | Jenis | Ambang |
| --- | --- | --- |
| Kenaikan emisi | Kinerja | Scope 1 atau operasional naik > 5% YoY |
| Kenaikan refrigeran | Kinerja | > 10% YoY; “tinggi” bila tahun sebelumnya juga naik |
| Kenaikan intensitas | Kinerja | Intensitas emisi atau energi naik > 5% YoY |
| Scope 3 tidak tersedia | Kualitas | Nilai Scope 3 tahun terpilih null |
| Perubahan batas | Kualitas | Laporan mencatat perubahan batas/periode |
| Basis Scope 2 | Kualitas | Scope 2 “–” dan ada listrik dicakup REC |
| Faktor implisit | Kualitas | > 20% dari median seri; Scope 2 > 25% dari faktor ESDM |
| Angka bertentangan | Kualitas | Versi lain di tahun sama berbeda > 1% |
| Penghitungan ganda | Kualitas | Angka = total energi + angka lain (±0,05 GJ) |
| Revisi | Kualitas | Revisi laporan berikutnya > 1% |
| Cakupan gas/baseline | Kualitas | Laporan 2024–2025 mencetak definisi yang bertentangan |

Ambang 5%/10%/20%/25% adalah aturan penyaringan analisis ini, bukan standar regulasi.

## 6. Keterbatasan yang tidak dapat diselesaikan dari data publik

- Tidak ada emisi per pabrik, volume produksi absolut, atau rincian bahan bakar per jenis.
- Scope 3 2022–2025 tidak tersedia; lima kelompok 2021 bukan 15 kategori GHG Protocol.
- Scope 2 location-based tidak diungkapkan; estimasi dashboard memakai faktor ESDM 2019 (terbaru yang dipublikasikan di indeks Ditjen Ketenagalistrikan per 13 Oktober 2026) dan asumsi seluruh listrik di sistem Jamali.
- Jenis refrigeran dan GWP yang dipakai perusahaan tidak diungkapkan.
