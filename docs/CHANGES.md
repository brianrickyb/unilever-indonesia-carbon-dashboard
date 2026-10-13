# Ringkasan perubahan dan hasil pengujian — 13 Oktober 2026

## Audit versi sebelumnya (`archive/legacy-v1/`)
- Cakupan 2021–2025; laporan 2020 belum dipakai.
- Tidak ada indikator energi / energi terbarukan.
- Kalkulator meminta pengguna mengisi faktor dan sumbernya sendiri; tidak ada katalog faktor.
- Kode inti diminifikasi; modul lama (model/analytics/capstone) masih dimuat walau tidak lagi dirender.
- Angka laporan 2021–2025 yang ada **terkonfirmasi benar** (Scope 1, komponen, intensitas, Scope 3 2021).

## Perubahan
1. **Data 2020–2025** diverifikasi ulang dari enam PDF (SHA-256 dicatat). Ditambahkan: 2020 (seri revisi + metrik asli), Scope 3 2020, energi total/terbarukan/komponen, energi per jenis lokasi, intensitas energi, konsumsi listrik. 168 observasi termasuk 31 versi revisi/konflik.
2. **Kualitas data**: revisi dan angka bertentangan didokumentasikan; ditemukan penghitungan ganda energi 2024, revisi PV surya 2024 (−88%), perubahan definisi batas 2023, faktor implisit tidak wajar 2021 dan Scope 2 2020, baseline 2015 dua versi, klaim “hanya CO₂” 2024.
3. **Dataset bersih** di `data/` (CSV, JSON, Tableau, versi, turunan, peringatan, faktor, data dictionary otomatis).
4. **Dashboard baru** di proyek yang sama: 7 halaman, 6 indikator utama, 7 grafik (tren, komposisi Scope 1, bauran energi, 2 intensitas, Scope 3, tren operasional), tabel pendamping, unduhan.
5. **3 insight, 3 rekomendasi** (dihitung dari data), **11 aturan peringatan** berambang yang dipisah kinerja vs kualitas data.
6. **Kalkulator** 5 input dengan faktor otomatis: 24 source group (IPCC 2006 + AR5, ESDM 2019 untuk 9 sistem jaringan, biodiesel B30/B35/B40 per tahun), 4 grup dinonaktifkan dengan alasan, validasi dan cek penghitungan ganda, memo R-22 dan CO₂ biogenik, ekspor CSV. Hasil terpisah dari data laporan.
7. **UI**: satu stylesheet bertoken, mode gelap, tag jenis data, penanda analisis independen di setiap halaman.
8. Server dev menerima `PORT`.

## Hasil pengujian
- `npm test`: **29/29 lulus** (dataset 9, analisis 7, kalkulator 7, ekspor 6).
- `tools/verify_pdf_values.py`: **144 angka, 0 masalah** (setiap angka ditemukan di halaman PDF yang dirujuk; nomor halaman cetak cocok).
- Browser (Chromium headless, Playwright):
  - 7 halaman × 1440 px dan 375 px: tanpa error konsol, tanpa overflow horizontal, tanpa teks `NaN`/`undefined`.
  - Filter tahun mengubah KPI (Scope 1 2021 = 20.858,40; Scope 3 2024 = “Belum dipublikasikan”).
  - Tren Scope 3: 4 celah n/a, garis hanya 2020–2021.
  - Tooltip, unduhan CSV Tableau dan kalkulator berhasil.
  - Peringatan per tahun: 2020: 3, 2021: 3, 2022: 5, 2023: 4, 2024: 7, 2025: 5.
  - Kalkulator: nilai negatif ditolak; 12.500 MMBTU gas → 666,52 t CO₂e; peringatan periode faktor jaringan; 4 grup Scope 3 nonaktif; peringatan Biosolar ganda Scope 1/3; angka laporan tetap 7.869,19 setelah kalkulator dipakai; baris bertahan setelah reload.
  - Mode gelap dirender dengan palet gelap.

## Yang tidak dapat diverifikasi / batasan
- Scope 3 2022–2025 dan Scope 2 location-based tidak dipublikasikan perusahaan; tidak diisi.
- Faktor jaringan ESDM resmi terbaru yang ditemukan adalah tahun 2019; dipakai dengan label periode berbeda.
- Nomor keputusan B35 (2023) tidak diverifikasi dari sumber primer; tanggal berlaku 1 Februari 2023 dicatat sebagai asumsi.
- Densitas BBM memakai nilai tengah spesifikasi, bukan data pemasok.

## Pembaruan UI (ramah pengguna)
Mengikuti checklist dashboard modul capstone (KPI cards, trend chart, scope comparison, category contribution, red flag alert, insight box) dan masukan bahwa tampilan sebelumnya terlalu padat.
- Halaman utama menjadi satu **Dashboard**: problem statement → bar peringatan → 5 KPI → tren + insight box → perbandingan scope + kontribusi sumber.
- Navigasi 7 → 6 tab; Temuan dan Rekomendasi digabung menjadi pasangan temuan ↔ aksi.
- Teks definisi, bukti, dan metode dipindah ke tombol ⓘ (tooltip) dan bagian "Detail" yang bisa dibuka-tutup; tag "Data resmi" di setiap kartu dihapus, label hanya untuk estimasi/hasil hitung/usulan.
- Kalkulator: pilihan scope berupa tombol, faktor emisi ringkas dengan detail bisa dibuka, pratinjau hasil t CO₂e saat mengetik, daftar hasil yang lebih sederhana.
- Peringatan: kartu ringkas yang bisa dibuka; tabel aturan dipindah ke bagian lipat.
- Data & metode: tombol unduh di atas, bagian lain dilipat.
- Tidak ada perubahan pada data, perhitungan, atau aturan alert. Tes: 29/29 lulus; uji browser 6 halaman × 1440/375 px tanpa error, tanpa overflow horizontal.
