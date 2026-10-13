import test from 'node:test';
import assert from 'node:assert/strict';
import { yoy, derived, locationBasedEstimate, impliedGridFactor2020, alertsFor, insights, RECOMMENDATIONS, scenario } from '../dist/lib/analysis.mjs';
import { YEARS } from '../dist/data/official.mjs';

const ids = y => alertsFor(y).map(a => a.id);

test('perubahan tahunan tidak menjembatani data kosong', () => {
  assert.equal(yoy('s3', 2022), null);
  assert.equal(yoy('s3', 2025), null);
  assert.equal(yoy('s1', 2020), null); // tidak ada 2019 di seri
  assert.ok(Math.abs(yoy('s1', 2021) - (20858.40 - 16518.17) / 16518.17 * 100) < 1e-9);
  assert.ok(Math.abs(yoy('s1_refrigerant', 2025) - 11.4765) < 0.001);
});

test('metrik turunan', () => {
  const d = derived(2025);
  assert.ok(Math.abs(d.recShare - 65.31) < 0.01);
  assert.ok(Math.abs(d.onsiteRenewableShare - 15.01) < 0.01);
  assert.ok(Math.abs(derived(2021).impliedFuelFactor - 78.12) < 0.01);
  assert.ok(Math.abs(impliedGridFactor2020() - 0.4001) < 0.001);
});

test('estimasi location-based memakai MWh × faktor ESDM dan dilabeli terpisah', () => {
  const e = locationBasedEstimate(2025);
  assert.ok(Math.abs(e.mwh - 440504.09 / 3.6) < 1e-6);
  assert.ok(Math.abs(e.central - e.mwh * 0.87) < 1e-6);
  assert.ok(Math.abs(e.low - e.mwh * 0.80) < 1e-6);
});

test('alert muncul sesuai kondisi data, bukan selalu', () => {
  assert.ok(ids(2021).includes('emission-rise'));
  assert.ok(!ids(2025).includes('emission-rise'));
  assert.ok(ids(2021).includes('implied-factor'));
  assert.ok(!ids(2022).includes('implied-factor'));
  assert.ok(ids(2020).includes('implied-factor')); // faktor Scope 2 implisit 0,40
  const ref = alertsFor(2025).find(a => a.id === 'refrigerant-rise');
  assert.equal(ref.severity, 'tinggi'); // naik dua tahun berturut-turut
  assert.ok(!ids(2023).includes('refrigerant-rise'));
  assert.ok(ids(2022).includes('intensity-rise'));
  for (const y of [2020, 2021]) assert.ok(!ids(y).includes('scope3-missing'));
  for (const y of [2022, 2023, 2024, 2025]) assert.ok(ids(y).includes('scope3-missing'));
  assert.ok(ids(2024).includes('double-count'));
  assert.ok(!ids(2025).includes('double-count'));
  assert.ok(ids(2025).includes('boundary-change'));
  assert.ok(ids(2023).includes('boundary-change'));
  assert.ok(!ids(2022).includes('boundary-change'));
  assert.ok(!ids(2020).includes('scope2-basis')); // 2020 punya angka Scope 2
});

test('setiap alert lengkap: masalah, bukti, dampak, tindak lanjut, aturan, jenis', () => {
  for (const y of YEARS) for (const a of alertsFor(y)) {
    for (const k of ['title', 'problem', 'evidence', 'impact', 'action', 'rule']) assert.ok(a[k] && !/undefined|NaN/.test(a[k]), `${y} ${a.id} ${k}`);
    assert.ok(['kinerja', 'kualitas'].includes(a.type));
  }
});

test('tiga insight dan tiga rekomendasi yang saling terhubung', () => {
  const ins = insights();
  assert.equal(ins.length, 3);
  for (const i of ins) {
    assert.ok(i.facts.length && i.interpretation && i.implication && i.limits && i.sources.length);
    assert.ok(!i.facts.join(' ').includes('NaN'));
  }
  assert.equal(RECOMMENDATIONS.length, 3);
  for (const r of RECOMMENDATIONS) {
    assert.ok(ins.some(i => i.id === r.insight));
    assert.ok(r.owner && r.priority && r.horizon && r.kpis.length && r.first90.length === 3);
  }
});

test('simulasi hanya mengurangi komponen Scope 1, dibatasi 0–100%', () => {
  const s = scenario(2025, 0, 0);
  assert.equal(s.projected, 7869.19);
  const t = scenario(2025, 10, 20);
  assert.ok(Math.abs(t.avoided - (759.051 + 55.736)) < 1e-6);
  assert.throws(() => scenario(2025, -1, 0));
  assert.throws(() => scenario(2025, 0, 101));
});
