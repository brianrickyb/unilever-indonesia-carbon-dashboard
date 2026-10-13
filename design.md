# Sistem desain

Analisis independen PT Unilever Indonesia Tbk. Tampilan riset yang tenang: data paling menonjol, dekorasi tidak ada.

## Prinsip
- Hierarki: tahun terpilih → indikator utama → grafik yang menjawab satu pertanyaan → tabel pendamping → sumber.
- Setiap angka membawa jenisnya: tag **Data resmi**, **Hasil perhitungan**, **Estimasi independen** (garis putus), **Usulan analisis**, **Asumsi** (titik-titik), **Hasil kalkulator**. Jenis dibedakan dengan teks + gaya garis, bukan warna saja.
- Kosong ≠ nol: “–” untuk tanda di tabel, *n/a* untuk tidak tersedia, celah di grafik. Tidak ada total Scope 1–3 bila Scope 3 kosong.
- Bahasa Indonesia ringkas; istilah teknis (Scope, REC, location-based) dipertahankan.
- Tidak ada gradien, emoji, bayangan tebal, atau kartu berulang tanpa fungsi.

## Token
Didefinisikan di `dist/styles.css` (`:root`, dengan mode gelap lewat `prefers-color-scheme` dan `[data-theme]`). Huruf: Space Grotesk (judul, angka besar), Inter (teks, angka tabel dengan tabular numerals).

Warna merek: biru Unilever `#1F36C7` (± Pantone 2728 C) untuk header, tab aktif, tombol utama, pilihan tahun dan seri 1; mode gelap `#5B73F0`. Logo dan aset merek resmi tidak dipakai; penanda analisis independen tetap tampil.

Palet seri (urutan tetap, divalidasi CVD dengan validator dataviz; mode gelap lolos kontras 3:1, mode terang memakai label langsung + tabel sebagai pengganti):
1 biru Unilever `#1f36c7` · 2 oranye `#eb6834` · 3 aqua `#1baf7a` · 4 kuning `#eda100` · 5 magenta `#e87ba4`.
Status (merah/kuning tua/abu) hanya untuk tingkat peringatan, selalu disertai ikon ▲ ■ ● dan teks.

## Grafik
SVG buatan sendiri, lebar diukur dari kontainer (teks tetap terbaca di 320–1440 px). Sumbu Y mulai nol, satu sumbu per grafik, garis 2 px, batang ≤ 28 px dengan ujung membulat dan celah 2 px antar segmen, label langsung hanya pada tahun terpilih dan titik akhir, tooltip pada hover dan fokus keyboard, penanda R/B untuk revisi dan perubahan batas.

## Responsif & aksesibilitas
Navigasi tab bergulir horizontal di layar kecil; pemilih tahun menjadi grid 6 kolom; KPI 3 → 2 → 1 kolom; tabel bergulir di dalam kontainernya sendiri. Kontrol native (select, button, input), fokus terlihat, panah kiri/kanan berpindah tahun, `aria-live` untuk notifikasi.
