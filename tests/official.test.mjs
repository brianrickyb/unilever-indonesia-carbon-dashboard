import test from 'node:test';
import assert from 'node:assert/strict';
import { YEARS, INDICATORS, OBSERVATIONS, REPORTS, value, primaryObservation, sourceUrl } from '../dist/data/official.mjs';

const close = (a, b, tol = 0.011) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('setiap indikator × tahun punya tepat satu observasi primary', () => {
  for (const id of Object.keys(INDICATORS)) for (const y of YEARS) {
    const explicit = OBSERVATIONS.filter(o => o.indicator === id && o.year === y && o.use === 'primary');
    assert.ok(explicit.length <= 1, `${id} ${y} punya ${explicit.length} primary`);
    assert.ok(primaryObservation(id, y), `${id} ${y} tidak punya status`);
  }
});

test('halaman PDF = halaman cetak + 2 dan URL mengarah ke laporan resmi', () => {
  for (const o of OBSERVATIONS.filter(o => o.report)) {
    assert.equal(o.pdfPage, o.page + 2);
    assert.ok(REPORTS[o.report].url.startsWith('https://www.unilever.co.id/files/'));
    assert.ok(o.pdfPage <= REPORTS[o.report].pdfPages);
  }
  assert.equal(sourceUrl(2025, 184), 'https://www.unilever.co.id/files/sustainability-report-2025.pdf#page=186');
});

test('nilai kunci sesuai laporan', () => {
  assert.equal(value('s1', 2025), 7869.19);
  assert.equal(value('s1', 2021), 20858.40);
  assert.equal(value('s1', 2020), 16518.17); // revisi laporan 2022
  assert.equal(value('s2_reported', 2020), 12825.41);
  assert.equal(value('s3', 2021), 2843661);
  assert.equal(value('energy_total', 2025), 674488.63);
  assert.equal(value('energy_total', 2023), 838053.83); // revisi laporan 2025
  assert.equal(value('en_solar', 2024), 6254.28); // revisi laporan 2025
  assert.equal(value('ei_mfg', 2025), 7.70);
});

test('Scope 1 = gas & light fuel + refrigeran (2021–2025 tepat; 2020 selisih revisi 0,05)', () => {
  for (const y of YEARS) {
    const gap = value('s1', y) - value('s1_fuel', y) - value('s1_refrigerant', y);
    if (y === 2020) close(gap, -0.05); else close(gap, 0, 1e-6);
  }
});

test('operasional = Scope 1 (+ Scope 2 bila ada angka)', () => {
  for (const y of YEARS) close(value('ops_s12', y), value('s1', y) + (value('s2_reported', y) ?? 0));
});

test('komponen Scope 3 menjumlah ke Scope 3; total rantai nilai = Scope 3 + operasional', () => {
  const parts = ['s3_ingredients_packaging', 's3_consumer_use', 's3_distribution_retail', 's3_disposal', 's3_inbound_transport'];
  for (const y of [2020, 2021]) close(parts.reduce((s, k) => s + value(k, y), 0), value('s3', y));
  close(value('full_value_chain', 2021), value('s3', 2021) + value('ops_s12', 2021));
  close(value('full_value_chain', 2020), value('s3', 2020) + 29343.63); // versi laporan 2021
});

test('energi: komponen menjumlah ke total dan porsi terbarukan cocok dengan persentase laporan', () => {
  for (const y of YEARS) {
    const re = value('en_biomass', y) + value('en_solar', y) + value('en_rec', y);
    close(re, value('energy_renewable', y));
    close(re + value('en_nonre_onsite', y) + (value('en_nonre_grid', y) ?? 0), value('energy_total', y), 0.06);
    const share = value('energy_renewable', y) / value('energy_total', y) * 100;
    assert.ok(Math.abs(share - value('energy_renewable_share', y)) < 1, `${y}: ${share}`);
    if (y >= 2020) close(value('energy_office', y) + value('energy_mfg', y) + value('energy_warehouse', y), value('energy_total', y), 0.06);
  }
});

test('data kosong tetap null dengan status yang benar, tidak pernah nol', () => {
  for (const y of [2021, 2022, 2023, 2024, 2025]) {
    const o = primaryObservation('s2_reported', y);
    assert.equal(o.value, null);
    assert.equal(o.status, 'reported_dash');
  }
  assert.equal(primaryObservation('s3', 2022).status, 'not_disclosed');
  for (const y of [2023, 2024, 2025]) assert.equal(primaryObservation('s3', y).status, 'not_published');
  for (const y of [2022, 2023, 2024, 2025]) {
    assert.equal(value('s3', y), null);
    assert.equal(value('s3_consumer_use', y), null);
    assert.equal(value('full_value_chain', y), null);
  }
  // Angka 0 di tabel sekunder dicatat sebagai versi bertentangan, bukan seri utama.
  assert.ok(OBSERVATIONS.some(o => o.indicator === 's2_reported' && o.value === 0 && o.use === 'conflicting'));
  assert.ok(!OBSERVATIONS.some(o => o.use === 'primary' && o.value === 0));
});

test('tidak ada data Unilever global: semua sumber dari unilever.co.id', () => {
  for (const r of Object.values(REPORTS)) assert.match(r.url, /^https:\/\/www\.unilever\.co\.id\//);
});
