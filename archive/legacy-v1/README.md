# Unilever Indonesia — Analisis Emisi 2021–2025

Dashboard analisis independen berdasarkan lima sustainability report resmi PT Unilever Indonesia Tbk. Tampilan utama menggunakan data laporan resmi, bukan contoh. Bukan produk resmi atau yang disahkan Unilever.

## Menjalankan
Node.js diperlukan, tanpa dependensi tambahan. Jalankan `npm run dev`, lalu buka http://127.0.0.1:4173. Jalankan `npm test` untuk 24 tes model. Folder `dist` merupakan situs statis.

## Halaman
- Ringkasan: pilihan tahun, subtotal operasional, Scope 1/2/3, intensitas dan tren.
- Tren & komposisi: indikator yang bisa dipilih, komposisi Scope 1, rincian Scope 3 historis 2021 dan tabel lima tahun.
- Temuan: perubahan emisi, refrigeran dan celah pengungkapan, dengan batas interpretasi.
- Prioritas tindakan: usulan pemilik/KPI/langkah pertama dan simulasi terpisah pada gas/light fuel dan refrigeran.
- Data & sumber: tautan PDF, halaman tercetak/PDF, status angka dan catatan batas.
- Kalkulator tambahan: mulai kosong untuk aktivitas internal; tidak mengubah angka resmi. Edit hanya bertahan selama sesi.

## Data dan sumber
Sumber publik: https://www.unilever.co.id/en/investors/annual-financial-and-sustainability-report/sustainability-reports/

Dataset utama: `dist/reports-data.mjs`. Salinan ekspor: `docs/unilever-emissions-2021-2025.csv` dan `.json`. Metode dan provenance: `docs/report-data-method.md` dan `docs/source-file-checksums.json`. Pengambilan dan verifikasi dilakukan 13 Oktober 2026; tidak ada sinkronisasi otomatis saat aplikasi dibuka.

Tanda “–” tabel utama Scope 2 tetap null. Nilai nol dari tabel sekunder dijelaskan dalam catatan. Scope 3 hanya tersedia pada 2021 dalam dataset; data yang tidak tersedia tidak diinterpolasi. Subtotal operasional merupakan angka yang dilaporkan, bukan hasil mengisi Scope 2 kosong. Intensitas hanya mencakup manufaktur. Perubahan batas gudang dan periode es krim 2025 ditampilkan.

## Struktur dan arsip
`reports-data.mjs` memuat angka/sumber/perubahan/skenario/CSV. `reports-ui.mjs` memuat tampilan; `reports.css` sistem visual; `app.mjs` routing/interaksi. Modul model/analytics/capstone lama dipertahankan sebagai sumber kalkulator dan riwayat pengembangan, bukan sumber angka laporan. `design.md` adalah sistem desain yang aktif.

`docs/tableau-demo-dataset.csv` merupakan contoh lama, BUKAN data Unilever. Gunakan `docs/unilever-emissions-2021-2025.csv`. Outline capstone terbaru tersedia di `docs/capstone-presentation-outline.md`.

## Validasi dan Tableau
24 tes meliputi kalkulasi, unknown versus zero, kategori, skenario, ekspor, analytics dan rekonsiliasi laporan. Browser diperiksa untuk pergantian tahun, Scope 3 yang hilang, skenario, ekspor dan layout 320/375/414/768/1440 px.

CSV format panjang memiliki 40 baris indikator. Jangan menjumlahkan semua indikator: komponen, Scope 1 dan subtotal saling tumpang tindih. Di Tableau, filter satu `metric` dan `unit` sebelum agregasi. Nilai kosong wajib tetap null.
