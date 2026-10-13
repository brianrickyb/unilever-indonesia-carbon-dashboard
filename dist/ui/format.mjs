// Format angka gaya Indonesia (1.234,56) dan escape HTML.

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function num(v, d = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
}

// Desimal default per satuan.
export function decimals(unit, v) {
  if (unit === '%') return 0;
  if (unit === 'GJ/ton produk') return 2;
  if (unit === 'kg CO2e/ton produk') return 2;
  if (unit === 'GJ' || unit === 'MWh') return 0;
  if (Math.abs(v) >= 100000) return 0;
  return 2;
}

export const val = (v, unit) => (v === null || v === undefined ? '—' : num(v, decimals(unit, v)) + (unit === '%' ? '%' : ''));

export function compact(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return num(v / 1e6, a >= 1e7 ? 0 : 1) + ' jt';
  if (a >= 1e3) return num(v / 1e3, a >= 1e4 ? 0 : 1) + ' rb';
  return num(v, a < 10 && a % 1 ? 2 : 0);
}

export const change = c => (c === null ? '—' : `${c > 0 ? '+' : c < 0 ? '−' : ''}${num(Math.abs(c), 1)}%`);

export const unitLabel = u => u.replace('CO2e', 'CO₂e').replace('CO2', 'CO₂');
