# Metode dataset Unilever Indonesia

Lima PDF resmi diunduh, teks diekstrak dengan pypdf, dan tabel emisi diperiksa secara visual. Angka merupakan transkripsi faktual; narasi dashboard adalah rangkuman/analisis independen. URL lengkap tersedia dalam setiap baris CSV/JSON dan modul data. Checksum mengidentifikasi edisi PDF yang dipakai.

| Tahun | Emisi: halaman cetak / PDF | Intensitas: halaman cetak / PDF | Scope 1 (t CO2e) | Refrigeran (t CO2e) | Intensitas kg CO2e/ton produk |
| --- | --- | --- | ---: | ---: | ---: |
| 2021 | 94 / 96 | 94 / 96 | 20,858.40 | 231.58 | 12.95 |
| 2022 | 98 / 100 | 98 / 100 | 16,516.70 | 522.31 | 15.56 |
| 2023 | 168 / 170 | 169 / 171 | 14,662.90 | 137.20 | 14.50 |
| 2024 | 186–187 / 188–189 | 187 / 189 | 10,960.41 | 249.99 | 11.40 |
| 2025 | 184 / 186 | 185 / 187 | 7,869.19 | 278.68 | 7.70 |

Subtotal operasi 2025 diambil dari tabel pengurangan emisi hlm. 186 / PDF 188. Tabel utama tidak memberi angka pada judul kelompok operasi. Tahun lain memiliki subtotal tersendiri. Kesamaan subtotal dengan Scope 1 tidak dijadikan alasan mengisi tanda Scope 2 dengan nol.

## Scope 2
Kelima tabel utama menampilkan tanda “–”. Nilai numerik dipertahankan null, status `reported_dash`. Bukti sekunder dicatat: laporan 2022 hlm. 98 menampilkan nol untuk 2021 dan 2022; laporan 2025 hlm. 186 menampilkan nol untuk 2023 dan 2025, tanda untuk 2024. Narasi 2024/2025 merujuk I-REC. Ini bukan dasar untuk menyatakan emisi fisik jaringan nol atau mengisi kalkulasi location-based dengan nol.

## Scope 3
Laporan 2021 hlm. 94 memuat 2,843,661 t CO2e, dengan lima kelompok yang menjumlah tepat. Total rantai nilai dilaporkan 2,864,519.40 t CO2e. Tabel 2022 hlm. 98 tidak mencantumkan Scope 3. Narasi 2023 hlm. 168 menyatakan pendataan berlangsung; 2024 hlm. 186 dan 2025 hlm. 184 menyatakan belum dapat dipublikasikan. Status tidak tersedia tidak berarti nol. Kelima kelompok 2021 tidak diklaim sebagai pemetaan lengkap 15 kategori GHG Protocol.

## Keterbandingan
- Angka diambil dari laporan tahunnya sendiri (as reported), bukan seri restatement yang dinormalisasi.
- Gas/light fuel + refrigeran cocok dengan Scope 1 tiap tahun.
- Emisi absolut mencakup manufaktur, logistik dan kantor; intensitas hanya manufaktur. Jangan membagi keduanya untuk menurunkan produksi organisasi.
- 2025: gudang bertambah 3 ke 11 (hlm. 185); pabrik es krim dilaporkan Januari–November (hlm. 182). Perubahan tahunan tidak dinormalisasi.
- Grafik intensitas 2024 menunjukkan 11.40, sementara catatan di bawahnya masih mengutip 14.5 untuk 2023. Dataset mengikuti label grafik 2024, dikonfirmasi grafik laporan 2025.
- Basis 2015 berbeda antara tabel utama dan tabel pengurangan pada laporan lebih baru. Dashboard tidak menghitung ulang klaim penurunan terhadap 2015.
- Usulan tindakan dan persentase skenario bukan komitmen perusahaan; slider mulai dari nol dan tidak mengubah laporan.

## Penggunaan ekspor
CSV memuat 8 indikator × 5 tahun dengan unit/status/batas/halaman/URL/catatan. Filter satu indikator sebelum agregasi; jangan menjumlah komponen + Scope 1 + subtotal. JSON juga memuat rincian Scope 3 tahun 2021. Pembaruan membutuhkan verifikasi ulang PDF, bukan scraping otomatis.
