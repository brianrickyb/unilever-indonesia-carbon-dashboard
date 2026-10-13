// Mesin kalkulator aktivitas. Pengguna mengisi lima hal: scope, kuantitas tahunan,
// satuan aktivitas, nama, dan source group. Faktor dan metadatanya diisi otomatis
// dari katalog (dist/data/factors.mjs) berdasarkan source group + tahun inventaris.

import { sourceGroup, resolveFactor, UNITS, DEFAULT_YEAR, INVENTORY_YEARS } from '../data/factors.mjs';

export const MAX_QUANTITY = 1e12;

export class CalcError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const normalise = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Validasi satu baris. Melempar CalcError untuk kesalahan yang memblokir penyimpanan.
export function validateActivity(input, year = DEFAULT_YEAR) {
  const scope = Number(input.scope);
  if (![1, 2, 3].includes(scope)) throw new CalcError('scope', 'Pilih Scope 1, 2 atau 3.');
  if (!INVENTORY_YEARS.includes(Number(year))) throw new CalcError('year', 'Tahun inventaris harus 2020–2025.');
  const name = String(input.name ?? '').trim();
  if (!name) throw new CalcError('name', 'Isi nama aktivitas, misalnya “Boiler pabrik Cikarang”.');
  if (name.length > 100) throw new CalcError('name', 'Nama maksimal 100 karakter.');

  const group = sourceGroup(input.group);
  if (!group) throw new CalcError('group', 'Pilih source group dari daftar.');
  if (group.scope !== scope) throw new CalcError('group', `“${group.label}” termasuk Scope ${group.scope}, bukan Scope ${scope}.`);
  if (group.available === false) throw new CalcError('factor', `Faktor tidak ditemukan untuk “${group.label}”. ${group.reason}`);

  const raw = input.quantity;
  if (raw === '' || raw === null || raw === undefined) throw new CalcError('quantity', 'Isi kuantitas tahunan. Data yang belum diketahui jangan diisi nol.');
  const quantity = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(quantity)) throw new CalcError('quantity', 'Kuantitas harus berupa angka.');
  if (quantity < 0) throw new CalcError('quantity', 'Kuantitas tidak boleh negatif. Catat koreksi sebagai penyesuaian terpisah dengan penjelasan.');
  if (quantity > MAX_QUANTITY) throw new CalcError('quantity', 'Kuantitas terlalu besar; periksa satuan.');

  if (!UNITS[input.unit]) throw new CalcError('unit', 'Pilih satuan aktivitas.');
  if (!group.units.includes(input.unit)) {
    throw new CalcError('unit', `Satuan tidak cocok: “${UNITS[input.unit].label}” tidak dapat dipakai untuk ${group.label}. Pilih ${group.units.map(u => UNITS[u].label).join(' atau ')}.`);
  }
  const factor = resolveFactor(group.id, year);
  if (!factor) throw new CalcError('factor', 'Faktor tidak ditemukan untuk kombinasi ini.');
  if (UNITS[input.unit].base !== factor.perUnit) throw new CalcError('unit', 'Satuan aktivitas tidak dapat dikonversi ke satuan faktor.');

  return { id: input.id ?? null, scope, name, group: group.id, quantity, unit: input.unit };
}

// Hitung satu baris yang sudah valid: t CO2e = kuantitas × konversi × faktor ÷ 1000.
export function computeActivity(row, year = DEFAULT_YEAR) {
  const v = validateActivity(row, year);
  const group = sourceGroup(v.group);
  const factor = resolveFactor(v.group, year);
  const baseQuantity = v.quantity * UNITS[v.unit].toBase;
  const tonnes = baseQuantity * factor.value / 1000;
  const memoTonnes = factor.memo ? baseQuantity * factor.memo.value / 1000 : null;
  return {
    ...v, id: row.id, year: Number(year), group, factor, baseQuantity,
    tonnes: group.memoOnly ? null : tonnes,
    memoTonnes: group.memoOnly ? tonnes : memoTonnes,
    memoLabel: group.memoOnly ? 'HCFC (memo, di luar Scope 1)' : factor.memo?.label ?? null,
    formula: `${fmtNum(v.quantity)} ${UNITS[v.unit].label}${UNITS[v.unit].toBase !== 1 ? ` × ${fmtNum(UNITS[v.unit].toBase)}` : ''} × ${fmtNum(factor.value)} ${factor.unit} ÷ 1000`,
  };
}

// Peringatan non-blokir: potensi penghitungan ganda, nol, dan ketidaksesuaian periode.
export function activityWarnings(candidate, existing = [], year = DEFAULT_YEAR) {
  const warnings = [];
  const others = existing.filter(r => r.id !== candidate.id);
  const same = (a, b) => a.quantity === b.quantity && a.unit === b.unit;
  const g = sourceGroup(candidate.group);

  if (others.some(r => r.group === candidate.group && same(r, candidate))) {
    warnings.push({ code: 'duplicate', text: 'Ada baris lain dengan source group, kuantitas dan satuan yang sama. Pastikan ini bukan data yang sama yang dimasukkan dua kali.' });
  }
  if (others.some(r => normalise(r.name) === normalise(candidate.name))) {
    warnings.push({ code: 'duplicate-name', text: 'Nama aktivitas sudah dipakai. Bedakan lokasi atau periode bila keduanya memang aktivitas berbeda.' });
  }
  const diesel = ['s1_diesel_mobile', 's1_diesel_stationary', 's3_cat4_diesel', 's3_cat9_diesel'];
  if (diesel.includes(candidate.group) && others.some(r => diesel.includes(r.group) && r.group !== candidate.group && same(r, candidate))) {
    warnings.push({ code: 'double-count', text: 'Volume Biosolar yang sama sudah tercatat di grup lain. Solar armada sendiri (Scope 1) dan solar transporter (Scope 3) tidak boleh dihitung dua kali.' });
  }
  if (candidate.group.startsWith('s2_grid_') && others.some(r => r.group.startsWith('s2_grid_') && same(r, candidate))) {
    warnings.push({ code: 'double-count', text: 'Konsumsi listrik yang sama sudah tercatat di sistem jaringan lain. Satu meter hanya masuk satu sistem.' });
  }
  if (candidate.quantity === 0) {
    warnings.push({ code: 'zero', text: 'Kuantitas 0 berarti tidak ada aktivitas. Bila datanya belum ada, jangan simpan baris ini.' });
  }
  const f = resolveFactor(candidate.group, year);
  if (f?.periodMismatch) warnings.push({ code: 'period', text: `Faktor jaringan resmi terbaru adalah tahun 2019; dipakai untuk inventaris ${year} sebagai pendekatan.` });
  if (g?.memoOnly) warnings.push({ code: 'memo', text: 'R-22 (HCFC) dihitung sebagai memo dan tidak dijumlahkan ke Scope 1.' });
  return warnings;
}

// Ringkasan inventaris pengguna. Total per scope hanya dari baris yang dihitung.
export function summarise(rows, year = DEFAULT_YEAR) {
  const results = rows.map(r => computeActivity(r, year));
  const scopes = { 1: 0, 2: 0, 3: 0 };
  let memo = 0;
  for (const r of results) {
    if (r.tonnes !== null) scopes[r.scope] += r.tonnes;
    if (r.memoTonnes !== null) memo += r.memoTonnes;
  }
  const scopesPresent = [1, 2, 3].filter(s => results.some(r => r.scope === s));
  return { results, scopes, scopesPresent, memo, total: scopes[1] + scopes[2] + scopes[3], count: results.length };
}

function fmtNum(v) {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(v);
}
