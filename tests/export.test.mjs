import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { officialCsv, tableauCsv, datasetJson, calculatorCsv, toCsv, officialRows } from '../dist/lib/export.mjs';
import { INDICATORS, YEARS } from '../dist/data/official.mjs';

const parse = csv => csv.trim().split('\r\n').map(line => { const out = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; });

test('CSV seri utama: satu baris per indikator × tahun, nilai kosong tetap kosong', () => {
  const rows = parse(officialCsv());
  const h = rows[0];
  assert.equal(rows.length - 1, Object.keys(INDICATORS).length * YEARS.length);
  const s2 = rows.find(r => r[h.indexOf('indicator_id')] === 's2_reported' && r[h.indexOf('year')] === '2025');
  assert.equal(s2[h.indexOf('value')], '');
  assert.equal(s2[h.indexOf('status')], 'reported_dash');
  const s1 = rows.find(r => r[h.indexOf('indicator_id')] === 's1' && r[h.indexOf('year')] === '2025');
  assert.equal(s1[h.indexOf('value')], '7869.19');
  assert.match(s1[h.indexOf('source_url')], /#page=186$/);
});

test('CSV Tableau menandai baris yang aman dijumlah dan membedakan data resmi dari hitungan', () => {
  const rows = parse(tableauCsv());
  const h = rows[0];
  const types = new Set(rows.slice(1).map(r => r[h.indexOf('data_type')]));
  assert.deepEqual([...types].sort(), ['estimasi_independen', 'hasil_perhitungan', 'resmi_laporan']);
  const safe = rows.slice(1).filter(r => r[h.indexOf('sum_safe')] === 'TRUE').map(r => r[h.indexOf('metric_id')]);
  assert.ok(!safe.includes('s1') && !safe.includes('ops_s12') && !safe.includes('energy_total'));
  // Komponen yang aman dijumlah per tahun = Scope 1 + Scope 2 dilaporkan
  const sum = y => rows.slice(1).filter(r => r[h.indexOf('year')] === String(y) && r[h.indexOf('sum_safe')] === 'TRUE' && r[h.indexOf('unit')] === 't CO2e').reduce((s, r) => s + Number(r[h.indexOf('value')] || 0), 0);
  assert.ok(Math.abs(sum(2025) - 7869.19) < 1e-6);
});

test('pencegahan formula injection hanya untuk teks, angka negatif tetap angka', () => {
  assert.equal(toCsv([['=SUM(A1)', -5, null]]), "'=SUM(A1),-5,\r\n");
});

test('JSON memuat seri, semua versi, aturan alert dan metadata batas', () => {
  const j = datasetJson();
  assert.equal(j.series.length, officialRows().length);
  assert.ok(j.versions.some(v => v.use === 'superseded'));
  assert.ok(j.alertRules.length >= 10);
  assert.match(j.meta.scope, /tidak memuat data Unilever global/);
});

test('ekspor kalkulator berlabel hasil kalkulator pengguna', () => {
  const csv = calculatorCsv([{ id: 'a', scope: 1, group: 's1_natgas', quantity: 10, unit: 'GJ', name: 'Boiler' }], 2025);
  assert.match(csv, /hasil_kalkulator_pengguna/);
  assert.match(csv, /IPCC 2006/);
});

test('file di folder data/ sinkron dengan generator (jalankan npm run build:data bila gagal)', async () => {
  const file = await readFile(new URL('../data/unilever-indonesia-emissions-2020-2025.csv', import.meta.url), 'utf8');
  assert.equal(file.replace(/^﻿/, ''), officialCsv());
});
