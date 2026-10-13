// Menulis dataset bersih ke folder data/ dari sumber tunggal dist/data/official.mjs.
// Jalankan: npm run build:data
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { officialCsv, versionsCsv, derivedCsv, tableauCsv, alertsCsv, datasetJson } from '../dist/lib/export.mjs';
import { OBSERVATIONS, REPORTS, INDICATORS } from '../dist/data/official.mjs';
import { factorTable, DEFAULT_YEAR } from '../dist/data/factors.mjs';
import { toCsv } from '../dist/lib/export.mjs';

const out = fileURLToPath(new URL('../data/', import.meta.url));
await mkdir(out, { recursive: true });

const factors = toCsv([
  ['inventory_year', 'scope', 'section', 'source_group_id', 'source_group', 'allowed_units', 'factor_value', 'factor_unit', 'region', 'valid_for', 'formula', 'sources', 'assumptions'],
  ...[2020, 2023, 2025].flatMap(y => factorTable(y).map(({ group, factor }) => [y, group.scope, group.section, group.id, group.label, group.units.join(' | '), factor.value, factor.unit, factor.region, factor.validFor, factor.formula, factor.sources.map(s => s.label).join(' | '), factor.assumptions.join(' ')])),
]);

const files = {
  'unilever-indonesia-emissions-2020-2025.csv': officialCsv(),
  'unilever-indonesia-emissions-2020-2025.json': JSON.stringify(datasetJson(), null, 2) + '\n',
  'unilever-indonesia-all-versions.csv': versionsCsv(),
  'unilever-indonesia-derived-metrics.csv': derivedCsv(),
  'unilever-indonesia-tableau.csv': tableauCsv(),
  'unilever-indonesia-alerts.csv': alertsCsv(),
  'emission-factors-calculator.csv': factors,
  // Untuk tools/verify_pdf_values.py
  'observations-all-versions.json': JSON.stringify({ reports: REPORTS, observations: OBSERVATIONS.map(o => ({ ...o, unit: INDICATORS[o.indicator].unit })) }, null, 2) + '\n',
};
// Data dictionary dibuat dari definisi indikator agar selalu sinkron dengan kode.
const { STATUS } = await import('../dist/data/official.mjs');
const { DERIVED_DEFS } = await import('../dist/lib/export.mjs');
const md = s => String(s).replaceAll('|', '\\|');
files['DATA-DICTIONARY.md'] = [
  '# Data dictionary — PT Unilever Indonesia Tbk, 2020–2025', '',
  'Dibuat otomatis oleh `npm run build:data` dari `dist/data/official.mjs`. Jangan diedit manual.', '',
  '## Kolom file `unilever-indonesia-emissions-2020-2025.csv`', '',
  '| Kolom | Arti |', '| --- | --- |',
  '| company | Selalu PT Unilever Indonesia Tbk |', '| year | Tahun pelaporan (periode data) |', '| indicator_id | Kode indikator (lihat tabel di bawah) |',
  '| value | Angka seri utama; kosong = tidak tersedia, bukan nol |', '| unit | Satuan |', '| status / status_label | Status ketersediaan |',
  '| boundary | Batas pelaporan |', '| component_of | Indikator induk; jangan menjumlahkan komponen dengan induknya |',
  '| source_report_year | Laporan asal angka (bisa lebih baru dari `year` bila revisi) |', '| printed_page / pdf_page | Halaman cetak dan halaman file PDF |',
  '| source_url | Tautan PDF resmi langsung ke halaman |', '| source_table | Tabel sumber di laporan |', '| note | Catatan revisi, konflik atau batas |', '',
  '## Status', '', '| Kode | Arti |', '| --- | --- |', ...Object.entries(STATUS).map(([k, v]) => `| \`${k}\` | ${v} |`), '',
  '## Indikator resmi', '', '| ID | Indikator | Satuan | Definisi | Batas | Komponen dari |', '| --- | --- | --- | --- | --- | --- |',
  ...Object.entries(INDICATORS).map(([id, i]) => `| \`${id}\` | ${md(i.label)} | ${md(i.unit)} | ${md(i.definition)} | ${md(i.boundary)} | ${i.componentOf ? '`' + i.componentOf + '`' : ''} |`), '',
  '## Metrik turunan (`unilever-indonesia-derived-metrics.csv`) — hasil perhitungan, bukan angka laporan', '', '| ID | Metrik | Satuan | Rumus |', '| --- | --- | --- | --- |',
  ...Object.entries(DERIVED_DEFS).map(([id, d]) => `| \`${id}\` | ${md(d.label)} | ${md(d.unit)} | ${md(d.formula)} |`),
  '| `scope2_location_estimate` | Estimasi independen Scope 2 location-based | t CO2 | purchasedGridMwh × 0,87 (CM ESDM 2019, Jamali) |',
  '| `scope2_location_estimate_low` | Batas bawah estimasi | t CO2 | purchasedGridMwh × 0,80 (OM ESDM 2019, Jamali) |', '',
  '## File Tableau (`unilever-indonesia-tableau.csv`)', '',
  '- `data_type`: `resmi_laporan`, `hasil_perhitungan`, `estimasi_independen`.',
  '- `sum_safe = TRUE` hanya untuk baris yang boleh dijumlahkan dalam satu tahun dan satuan yang sama (komponen Scope 1, Scope 2 dilaporkan, komponen energi). Filter `sum_safe` atau satu `metric_id` sebelum agregasi.',
  '- `is_missing = TRUE`: biarkan null; jangan ubah menjadi 0 di Tableau (gunakan `ZN()` hanya bila memang ingin menganggap nol, dan sebaiknya jangan).', '',
].join('\n');

for (const [name, content] of Object.entries(files)) {
  await writeFile(out + name, name.endsWith('.csv') ? '﻿' + content : content, 'utf8');
  console.log('ditulis', 'data/' + name);
}
console.log(`Faktor default tahun ${DEFAULT_YEAR}; ${OBSERVATIONS.length} observasi.`);
