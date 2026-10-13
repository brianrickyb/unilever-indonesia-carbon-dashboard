# Unilever Indonesia — Analisis Emisi & Energi 2020–2025

Dashboard analisis independen berdasarkan enam sustainability report resmi **PT Unilever Indonesia Tbk** (2020–2025). Bukan situs resmi perusahaan dan tidak memuat data Unilever global.

## Menjalankan

Butuh Node.js 20+, tanpa dependensi.

```
npm run dev            # http://127.0.0.1:4173  (PORT=4174 npm run dev bila port dipakai)
npm test               # 29 tes: dataset, analisis/alert, kalkulator, ekspor
npm run build:data     # tulis ulang data/ dari dist/data/official.mjs
npm run verify:pdf -- <folder berisi 2020.pdf…2025.pdf> data/observations-all-versions.json
```

`dist/` adalah situs statis yang bisa di-host di mana saja.

## Deploy (Vercel)

Repo ini siap di-import di [vercel.com/new](https://vercel.com/new). `vercel.json` menyajikan folder `dist/` dan menjalankan `npm test` sebagai build, jadi deploy gagal bila ada tes yang gagal. Tidak ada dependensi yang perlu diinstal. Setiap push ke branch `main` otomatis di-deploy ulang.

## Halaman

| Halaman | Isi |
| --- | --- |
| Dashboard | Satu layar untuk capstone: problem statement, bar peringatan, 5 kartu KPI (definisi lewat tombol ⓘ), tren emisi operasional, insight box, perbandingan scope, kontribusi sumber. Pilihan tahun 2020–2025 |
| Analisis tren | Pilih indikator; tren dengan celah untuk data kosong; komposisi Scope 1, bauran energi, intensitas, Scope 3 2020 vs 2021; tabel lengkap dan unduhan |
| Temuan & aksi | 3 temuan dipasangkan dengan 3 rekomendasi (tim, prioritas, KPI, langkah 30–90 hari di balik "Detail"); simulasi pengurangan |
| Peringatan | Ringkasan jumlah, daftar peringatan yang bisa dibuka untuk dampak & tindak lanjut, tabel aturan & ambang |
| Kalkulator | Pilih scope (tombol), sumber emisi, jumlah, satuan, nama; faktor dan pratinjau hasil muncul otomatis; daftar hasil dan unduh CSV |
| Data & metode | Tombol unduh dataset, laporan sumber, aturan membaca data, revisi, data dictionary, metode estimasi, faktor emisi |

Tautan lama (`#ringkasan`, `#tren`, `#temuan`, `#rekomendasi`) diarahkan otomatis ke halaman baru.

## Struktur

```
dist/data/official.mjs   dataset resmi (sumber tunggal), semua versi + status
dist/data/factors.mjs    katalog faktor emisi kalkulator
dist/lib/analysis.mjs    turunan, estimasi, alert, insight, rekomendasi, simulasi
dist/lib/calculator.mjs  validasi dan perhitungan kalkulator
dist/lib/export.mjs      CSV/JSON (dipakai UI dan build)
dist/ui/                 grafik SVG, tampilan, format angka
dist/app.mjs             routing, filter, interaksi
data/                    dataset bersih (CSV, JSON, data dictionary) — hasil build
docs/                    catatan kualitas data, metode & sumber, ringkasan perubahan
tools/verify_pdf_values.py  verifikasi angka terhadap PDF
archive/legacy-v1/       versi sebelumnya (2021–2025), disimpan untuk riwayat
```

## Dataset

- `data/unilever-indonesia-emissions-2020-2025.csv` / `.json` — seri utama, 27 indikator × 6 tahun.
- `data/unilever-indonesia-all-versions.csv` — semua angka termasuk revisi dan angka yang bertentangan.
- `data/unilever-indonesia-tableau.csv` — format panjang; `data_type` memisahkan resmi/hasil hitung/estimasi; `sum_safe` menandai baris yang boleh dijumlahkan.
- `data/unilever-indonesia-derived-metrics.csv`, `data/unilever-indonesia-alerts.csv`, `data/emission-factors-calculator.csv`.
- `data/DATA-DICTIONARY.md`, `docs/data-quality-notes.md`, `docs/method-and-sources.md`.

Aturan utama: nilai kosong = null (bukan nol) dengan status `reported_dash` / `not_disclosed` / `not_published`; tidak ada interpolasi; subtotal tidak dijumlahkan dengan komponen; total Scope 1–3 hanya ditampilkan bila dilaporkan (2020, 2021).
