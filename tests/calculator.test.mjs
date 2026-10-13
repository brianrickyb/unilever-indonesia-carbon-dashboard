import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFactor, SOURCE_GROUPS, biodieselBlend, UNITS } from '../dist/data/factors.mjs';
import { computeActivity, validateActivity, activityWarnings, summarise, CalcError } from '../dist/lib/calculator.mjs';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const row = (o = {}) => ({ id: 'x', scope: 1, group: 's1_natgas', quantity: 1000, unit: 'GJ', name: 'Boiler', ...o });

test('faktor diturunkan dari IPCC 2006 + GWP AR5', () => {
  near(resolveFactor('s1_natgas').value, 56.1545);
  near(resolveFactor('s1_lpg').value, 0.0473 * 63154.5 / 1000);
  near(resolveFactor('s1_gasoline_mobile').value, 0.74 * 44.3 / 1000 * 72120 / 1000);
  near(resolveFactor('s1_ref_r410a').value, 1923.5);
  near(resolveFactor('s1_ref_r404a').value, 3942.8);
  near(resolveFactor('s1_ref_r407c').value, 1624.21);
  near(resolveFactor('s2_grid_jamali').value, 0.87);
});

test('faktor Biosolar mengikuti mandatori biodiesel tahun inventaris', () => {
  assert.equal(biodieselBlend(2020).label, 'B30');
  assert.equal(biodieselBlend(2023).label, 'B35');
  assert.equal(biodieselBlend(2025).label, 'B40');
  const gjPerL = 0.84 * 43 / 1000;
  near(resolveFactor('s1_diesel_stationary', 2025).value, gjPerL * (74100 * 0.6 + 3 * 28 + 0.6 * 265) / 1000);
  near(resolveFactor('s1_diesel_mobile', 2020).value, gjPerL * (74100 * 0.7 + 3.9 * 28 + 3.9 * 265) / 1000);
  assert.ok(resolveFactor('s1_diesel_mobile', 2025).value < resolveFactor('s1_diesel_mobile', 2020).value);
});

test('setiap grup yang tersedia punya metadata lengkap dan satuan yang dapat dikonversi', () => {
  for (const g of SOURCE_GROUPS) {
    if (g.available === false) { assert.ok(g.reason); continue; }
    const f = resolveFactor(g.id, 2025);
    assert.ok(Number.isFinite(f.value) && f.value >= 0);
    assert.ok(f.sources.length && f.sources.every(s => s.url.startsWith('https://')));
    assert.ok(f.region && f.validFor && f.formula && f.assumptions.length);
    for (const u of g.units) assert.equal(UNITS[u].base, f.perUnit, `${g.id} ${u}`);
  }
});

test('konversi satuan dan rumus t CO2e', () => {
  near(computeActivity(row()).tonnes, 1000 * 56.1545 / 1000);
  near(computeActivity(row({ unit: 'MMBTU' })).tonnes, 1000 * 1.055056 * 0.9 * 56.1545 / 1000);
  near(computeActivity(row({ scope: 2, group: 's2_grid_jamali', quantity: 2, unit: 'MWh' })).tonnes, 2000 * 0.87 / 1000);
  near(computeActivity(row({ group: 's1_diesel_mobile', quantity: 3, unit: 'kL' })).tonnes, 3000 * resolveFactor('s1_diesel_mobile').value / 1000);
  near(computeActivity(row({ group: 's1_ref_r134a', quantity: 0.5, unit: 't' })).tonnes, 500 * 1300 / 1000);
});

test('validasi memblokir nilai negatif, satuan tidak cocok, scope salah, faktor tidak ada, kuantitas kosong', () => {
  const code = o => { try { validateActivity(row(o)); return null; } catch (e) { assert.ok(e instanceof CalcError); return e.code; } };
  assert.equal(code({ quantity: -5 }), 'quantity');
  assert.equal(code({ quantity: '' }), 'quantity');
  assert.equal(code({ quantity: 'abc' }), 'quantity');
  assert.equal(code({ unit: 'kWh' }), 'unit');
  assert.equal(code({ scope: 2 }), 'group');
  assert.equal(code({ scope: 3, group: 's3_purchased' }), 'factor');
  assert.equal(code({ name: '  ' }), 'name');
  assert.equal(code({ group: 'tidak_ada' }), 'group');
  assert.equal(code({ quantity: '12,5' }), null); // koma desimal diterima
});

test('peringatan penghitungan ganda dan duplikasi', () => {
  const existing = [row({ id: 'a', group: 's1_diesel_mobile', unit: 'L', quantity: 500, name: 'Truk' })];
  const w = activityWarnings(row({ id: 'b', scope: 3, group: 's3_cat4_diesel', unit: 'L', quantity: 500, name: 'Transporter' }), existing);
  assert.ok(w.some(x => x.code === 'double-count'));
  const d = activityWarnings(row({ id: 'c', group: 's1_diesel_mobile', unit: 'L', quantity: 500, name: 'truk ' }), existing);
  assert.ok(d.some(x => x.code === 'duplicate') && d.some(x => x.code === 'duplicate-name'));
  assert.ok(activityWarnings(row({ scope: 2, group: 's2_grid_jamali', unit: 'kWh' }), [], 2025).some(x => x.code === 'period'));
  assert.ok(activityWarnings(row({ quantity: 0 }), []).some(x => x.code === 'zero'));
});

test('R-22 dan CO2 biogenik dicatat sebagai memo, tidak dijumlahkan', () => {
  const s = summarise([
    row({ id: 'a' }),
    row({ id: 'b', group: 's1_ref_r22', unit: 'kg', quantity: 10, name: 'Chiller R-22' }),
    row({ id: 'c', group: 's1_biomass_wood', unit: 't', quantity: 100, name: 'Woodchip' }),
  ]);
  near(s.scopes[1], 56.1545 + 100 * 29.64 / 1000);
  near(s.memo, 10 * 1760 / 1000 + 100 * 1747.2 / 1000);
  assert.deepEqual(s.scopesPresent, [1]);
  assert.equal(s.results[1].tonnes, null);
});
