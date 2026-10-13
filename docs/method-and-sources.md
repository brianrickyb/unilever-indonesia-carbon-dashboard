# Metode, sumber dan asumsi

## Sumber laporan

Indeks: https://www.unilever.co.id/en/investors/annual-financial-and-sustainability-report/sustainability-reports/ (diakses 13 Oktober 2026). Halaman PDF = halaman cetak + 2 untuk keenam laporan.

| Tahun | URL | SHA-256 | Halaman yang dipakai (cetak) |
| --- | --- | --- | --- |
| 2020 | https://www.unilever.co.id/files/c6eec177-e850-49f9-af7d-9ef9872e5109/sustainability-report-2020-pqldla.pdf | 356ad863…b3ff55 | 3, 120 |
| 2021 | https://www.unilever.co.id/files/sustainability-report-2021-id.pdf | d56fa1ce…82a7ce | 94, 98 |
| 2022 | https://www.unilever.co.id/files/indonesia-sustainability-report-2022.pdf | 0ec3075e…674999 | 98, 105, 106 |
| 2023 | https://www.unilever.co.id/files/7a7fa3d4-b017-4943-95c4-ead368c8ed54/unilever-sustainability-report-2023-hires.pdf | 2141411d…c553b5 | 168, 169, 171, 172, 175, 176 |
| 2024 | https://www.unilever.co.id/files/indonesia-sustainability-report-2024.pdf | 2d7608a9…cca3afbd0b | 186–188, 191–194 |
| 2025 | https://www.unilever.co.id/files/sustainability-report-2025.pdf | 8da1797d…0070e4f | 182–190 |

Hash lengkap: `dist/data/official.mjs` (`REPORTS`).

## Proses

1. Unduh PDF dari indeks resmi; catat SHA-256.
2. Ekstrak teks per halaman (PyMuPDF); render halaman tabel dan grafik untuk verifikasi visual (label grafik yang tumpang tindih, mis. intensitas 2020 dan 2024).
3. Transkripsi manual ke `dist/data/official.mjs`, termasuk angka pembanding tahun sebelumnya dari setiap laporan, sehingga revisi terlihat.
4. Pilih seri utama (lihat `docs/data-quality-notes.md` §2).
5. Verifikasi otomatis: `tools/verify_pdf_values.py` mencari setiap angka di halaman PDF yang dirujuk dan memastikan nomor halaman cetak muncul di halaman itu. Hasil terakhir: 144 angka, 0 masalah.
6. Uji konsistensi (`npm test`): komponen = total, persen terbarukan = GJ terbarukan ÷ total, null tetap null.

## Rumus hasil perhitungan

- Perubahan tahunan = (nilai tahun ini − nilai tahun lalu) ÷ nilai tahun lalu × 100. Null bila salah satu kosong. Bukan bukti sebab-akibat.
- Porsi REC = listrik dicakup REC ÷ energi total. Porsi on-site = (biomassa + PV) ÷ energi total.
- Faktor implisit bahan bakar = t CO₂e gas & light fuel × 1000 ÷ GJ energi fosil on-site.
- **Estimasi independen Scope 2 location-based** = (GJ listrik dicakup REC + GJ listrik tanpa sertifikat bila dilaporkan) ÷ 3,6 × faktor ESDM 2019 Jamali (0,80 OM sampai 0,87 CM ex-post) t CO₂/MWh. Asumsi: seluruh lokasi di sistem Jamali; hanya CO₂; faktor 2019 dipakai untuk 2020–2025 karena tidak ada publikasi resmi yang lebih baru di indeks Ditjen Gatrik. Selalu berlabel “Estimasi independen”.

## Kalkulator: faktor emisi

Pengguna mengisi 5 hal (scope, kuantitas, satuan, nama, source group). Faktor dan metadata dipilih dari katalog `dist/data/factors.mjs` berdasarkan source group + tahun inventaris (default 2025, terlihat di layar). Hasil = kuantitas × konversi satuan × faktor ÷ 1000 (t CO₂e).

| Komponen | Sumber | Nilai |
| --- | --- | --- |
| GWP 100 tahun | IPCC AR5 WG1 Tabel 8.7/8.A.1 (basis pelaporan Indonesia ke UNFCCC) | CH₄ 28, N₂O 265, HFC-32 677, HFC-125 3.170, HFC-134a 1.300, HFC-143a 4.800, HCFC-22 1.760 |
| Bahan bakar stasioner | IPCC 2006 Vol. 2 Tabel 1.2 (NCV) & 2.3 | Gas alam 56.100/1/0,1 kg/TJ; solar 74.100/3/0,6; LPG 63.100/1/0,1; kayu CH₄ 30, N₂O 4 |
| Bahan bakar bergerak | IPCC 2006 Vol. 2 Tabel 3.2.1–3.2.2 | Solar 74.100/3,9/3,9; bensin 69.300/25/8 (katalis oksidasi) |
| Listrik PLN | ESDM, Faktor Emisi GRK Sistem Ketenagalistrikan 2019, kolom 7 (CM ex-post 0,5/0,5) | Jamali 0,87; Sumatera 0,94; Sulselbar 0,95; Sulutgo 0,78; Mahakam 1,14; Barito 1,31; Khatulistiwa 1,63; Batam 0,82; Lombok 1,61 t CO₂/MWh |
| Biodiesel | Mandatori ESDM | B30 (2020–2022), B35 (2023–2024; Januari 2023 masih B30), B40 (2025, Kepmen ESDM 341.K/EK.01/MEM.E/2024). Hanya porsi fosil yang dihitung sebagai CO₂ |

Asumsi terlihat di UI: densitas solar 0,84 kg/L dan bensin 0,74 kg/L (nilai tengah spesifikasi); MMBTU tagihan gas basis GCV dikonversi × 1,055056 × 0,9 ke GJ NCV; refrigeran diisi massa bocor/ditambahkan, bukan kapasitas; R-22 dan CO₂ biogenik = memo, tidak dijumlahkan; CH₄/N₂O biodiesel memakai NCV solar (penyederhanaan).

Grup yang sengaja **tidak** diberi faktor (dinonaktifkan dengan alasan): angkutan ton-km, bahan baku & kemasan, perjalanan udara, limbah. Lima input tidak cukup untuk menentukan faktor andal; kalkulator menjelaskan data tambahan yang dibutuhkan.

Validasi: kuantitas wajib, angka, ≥ 0, ≤ 10¹²; satuan harus cocok dengan grup; grup harus sesuai scope; grup tanpa faktor ditolak. Peringatan non-blokir: duplikat (grup + kuantitas + satuan), nama sama, Biosolar yang sama di Scope 1 dan Scope 3, kWh yang sama di dua sistem jaringan, kuantitas nol, faktor jaringan dari periode lain.

## Batas penggunaan

Dashboard ini analisis independen, bukan publikasi atau pernyataan perusahaan. Rekomendasi adalah usulan analisis tanpa estimasi biaya, penghematan, atau target perusahaan. Hasil kalkulator disimpan di sessionStorage browser dan tidak pernah mengubah data laporan.
