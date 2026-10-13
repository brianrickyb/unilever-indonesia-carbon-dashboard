import { VIEWS, PAGES, ALIASES, TREND_METRICS, chartSpecs, simulatorResult, factorPanel, draftWarnings, draftPreview } from './ui/views.mjs';
import { scenario } from './lib/analysis.mjs';
import { computeActivity, CalcError } from './lib/calculator.mjs';
import { officialCsv, versionsCsv, derivedCsv, tableauCsv, alertsCsv, datasetJson, calculatorCsv } from './lib/export.mjs';
import { sourceGroup, resolveFactor, DEFAULT_YEAR, INVENTORY_YEARS, groupsForScope } from './data/factors.mjs';
import { YEARS } from './data/official.mjs';

const $ = s => document.querySelector(s);
const STORE_KEY = 'uvi-calculator-v2';

const blankDraft = (scope = 1) => {
  const g = groupsForScope(scope).find(x => x.available !== false);
  return { scope, group: g.id, unit: g.units[0], quantity: '', name: '' };
};

const state = {
  page: 'dashboard', year: 2025, metric: 'ops_s12', fuelPct: 0, refPct: 0,
  calc: { year: DEFAULT_YEAR, rows: [], draft: blankDraft(), editing: null, error: '' },
};

// Inventaris kalkulator disimpan per perangkat (sessionStorage); data laporan tidak pernah disimpan.
try {
  const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) ?? 'null');
  if (saved && INVENTORY_YEARS.includes(saved.year) && Array.isArray(saved.rows)) {
    state.calc.year = saved.year;
    state.calc.rows = saved.rows.filter(r => { try { computeActivity(r, saved.year); return true; } catch { return false; } });
  }
} catch { /* penyimpanan tidak tersedia */ }
function persist() {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ year: state.calc.year, rows: state.calc.rows })); } catch { /* abaikan */ }
}

function notice(text) {
  const n = $('#notice');
  n.textContent = text;
  clearTimeout(notice.t);
  notice.t = setTimeout(() => { n.textContent = ''; }, 3500);
}

function render({ keepScroll = false, focus = null } = {}) {
  const raw = location.hash.slice(1);
  const page = ALIASES[raw] ?? raw;
  state.page = PAGES[page] ? page : 'dashboard';
  document.title = `${PAGES[state.page]} · Unilever Indonesia · Analisis Emisi 2020–2025`;
  document.querySelectorAll('[data-page]').forEach(a => {
    const on = a.dataset.page === state.page;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const y = scrollY;
  $('#main').innerHTML = VIEWS[state.page](state);
  drawCharts();
  if (keepScroll) scrollTo(0, y);
  if (focus) document.querySelector(focus)?.focus();
}

function drawCharts() {
  const specs = chartSpecs(state);
  document.querySelectorAll('[data-chart]').forEach(box => {
    const fn = specs[box.dataset.chart];
    if (!fn) return;
    const w = Math.max(280, Math.floor(box.clientWidth));
    box.innerHTML = fn(w);
  });
}

let resizeTimer, lastWidth = innerWidth;
addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  lastWidth = innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawCharts, 120);
});
addEventListener('hashchange', () => { render(); scrollTo(0, 0); $('#main').focus({ preventScroll: true }); });

// ---------- tooltip ----------
const tip = $('#tooltip');
function showTip(el, x, y) {
  tip.textContent = el.dataset.tip;
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(x + 14, innerWidth - w - 8)) + 'px';
  tip.style.top = Math.max(8, y - h - 12 < 8 ? y + 18 : y - h - 12) + 'px';
}
document.addEventListener('pointermove', e => { const t = e.target.closest?.('[data-tip]'); if (t) showTip(t, e.clientX, e.clientY); else tip.hidden = true; });
document.addEventListener('focusin', e => { const t = e.target.closest?.('[data-tip]'); if (t) { const r = t.getBoundingClientRect(); showTip(t, r.left + r.width / 2, r.top); } });
document.addEventListener('focusout', () => { tip.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') tip.hidden = true; });

// ---------- unduhan ----------
const DOWNLOADS = {
  official: () => ['unilever-indonesia-emissions-2020-2025.csv', officialCsv()],
  versions: () => ['unilever-indonesia-all-versions.csv', versionsCsv()],
  derived: () => ['unilever-indonesia-derived-metrics.csv', derivedCsv()],
  tableau: () => ['unilever-indonesia-tableau.csv', tableauCsv()],
  alerts: () => ['unilever-indonesia-alerts.csv', alertsCsv()],
  json: () => ['unilever-indonesia-emissions-2020-2025.json', JSON.stringify(datasetJson(), null, 2)],
  calculator: () => [`kalkulator-aktivitas-${state.calc.year}.csv`, calculatorCsv(state.calc.rows, state.calc.year)],
};
function download(kind) {
  const [name, content] = DOWNLOADS[kind]();
  const isCsv = name.endsWith('.csv');
  const url = URL.createObjectURL(new Blob([isCsv ? '﻿' : '', content], { type: isCsv ? 'text/csv;charset=utf-8' : 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice(`${name} diunduh.`);
}

// ---------- kalkulator ----------
function refreshFactor() {
  const c = state.calc, g = sourceGroup(c.draft.group);
  const f = g && g.available !== false ? resolveFactor(g.id, c.year) : null;
  const box = document.querySelector('.factor-box');
  if (box) box.innerHTML = factorPanel(g, f, c.year);
  const w = $('#calc-warnings');
  if (w) w.innerHTML = draftWarnings(state);
  const pv = $('#calc-preview');
  if (pv) pv.innerHTML = draftPreview(state);
}

document.addEventListener('input', e => {
  const t = e.target;
  if (t.closest('#calc-form') && ['quantity', 'name'].includes(t.name)) {
    state.calc.draft[t.name] = t.value;
    state.calc.error = '';
    $('#calc-error').textContent = '';
    $('#calc-warnings').innerHTML = draftWarnings(state);
    $('#calc-preview').innerHTML = draftPreview(state);
  }
  if (t.id === 'sim-fuel' || t.id === 'sim-ref') {
    state[t.id === 'sim-fuel' ? 'fuelPct' : 'refPct'] = Number(t.value);
    $('#out-fuel').textContent = state.fuelPct + '%';
    $('#out-ref').textContent = state.refPct + '%';
    $('#sim-result').innerHTML = simulatorResult(scenario(Number($('#sim-year').value), state.fuelPct, state.refPct));
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'metric-select' && TREND_METRICS.includes(t.value)) { state.metric = t.value; render({ keepScroll: true, focus: '#metric-select' }); }
  if (t.id === 'sim-year') $('#sim-result').innerHTML = simulatorResult(scenario(Number(t.value), state.fuelPct, state.refPct));
  if (t.id === 'calc-year') { state.calc.year = Number(t.value); persist(); render({ keepScroll: true, focus: '#calc-year' }); }
  const form = t.closest('#calc-form');
  if (form) {
    const d = state.calc.draft;
    if (t.name === 'scope') { Object.assign(d, blankDraft(Number(t.value)), { quantity: d.quantity, name: d.name }); render({ keepScroll: true, focus: '#calc-form [name="scope"]:checked' }); }
    if (t.name === 'group') {
      d.group = t.value;
      const g = sourceGroup(d.group);
      if (!g.units.includes(d.unit)) d.unit = g.units[0];
      render({ keepScroll: true, focus: '#calc-form [name="group"]' });
    }
    if (t.name === 'unit') { d.unit = t.value; refreshFactor(); }
  }
});

document.addEventListener('submit', e => {
  if (e.target.id !== 'calc-form') return;
  e.preventDefault();
  const c = state.calc;
  try {
    const id = c.editing ?? (crypto.randomUUID?.() ?? String(Date.now()));
    const r = computeActivity({ ...c.draft, id }, c.year);
    const row = { id, scope: r.scope, group: r.group.id, quantity: r.quantity, unit: r.unit, name: r.name };
    const i = c.rows.findIndex(x => x.id === id);
    if (i >= 0) c.rows[i] = row; else c.rows.push(row);
    c.draft = { ...blankDraft(row.scope), group: row.group, unit: row.unit };
    c.editing = null; c.error = '';
    persist();
    render({ keepScroll: true, focus: '#calc-form [name="quantity"]' });
    notice(`${row.name}: ${r.tonnes === null ? 'memo' : r.tonnes.toLocaleString('id-ID', { maximumFractionDigits: 3 }) + ' t CO₂e'} dihitung.`);
  } catch (err) {
    c.error = err instanceof CalcError ? err.message : 'Tidak dapat menghitung baris ini.';
    $('#calc-error').textContent = c.error;
    const field = err.code && document.querySelector(`#calc-form [name="${err.code === 'factor' ? 'group' : err.code}"]`);
    field?.focus();
  }
});

document.addEventListener('click', e => {
  const yearBtn = e.target.closest('[data-year]');
  if (yearBtn) { state.year = Number(yearBtn.dataset.year); render({ keepScroll: true, focus: `[data-year="${state.year}"]` }); return; }
  const dl = e.target.closest('[data-download]');
  if (dl) { download(dl.dataset.download); return; }
  const act = e.target.closest('[data-action]');
  if (!act) return;
  const c = state.calc;
  switch (act.dataset.action) {
    case 'sim-reset': state.fuelPct = 0; state.refPct = 0; render({ keepScroll: true }); break;
    case 'calc-edit': {
      const r = c.rows.find(x => x.id === act.dataset.id);
      if (!r) return;
      c.draft = { scope: r.scope, group: r.group, unit: r.unit, quantity: String(r.quantity), name: r.name };
      c.editing = r.id;
      render({ focus: '#calc-form [name="quantity"]' });
      $('#calc-form').scrollIntoView({ block: 'start' });
      break;
    }
    case 'calc-delete': c.rows = c.rows.filter(x => x.id !== act.dataset.id); if (c.editing === act.dataset.id) { c.editing = null; c.draft = blankDraft(); } persist(); render({ keepScroll: true }); notice('Aktivitas dihapus.'); break;
    case 'calc-cancel': c.editing = null; c.draft = blankDraft(c.draft.scope); render({ keepScroll: true }); break;
    case 'calc-clear': if (confirm('Kosongkan semua aktivitas kalkulator? Data laporan tidak terpengaruh.')) { c.rows = []; c.editing = null; persist(); render({ keepScroll: true }); } break;
  }
});

// Navigasi tahun dengan panah kiri/kanan pada kontrol tahun.
document.addEventListener('keydown', e => {
  const b = e.target.closest?.('[data-year]');
  if (!b || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const i = YEARS.indexOf(state.year) + (e.key === 'ArrowRight' ? 1 : -1);
  if (i < 0 || i >= YEARS.length) return;
  e.preventDefault();
  state.year = YEARS[i];
  render({ keepScroll: true, focus: `[data-year="${state.year}"]` });
});

// ---------- perbesar grafik ----------
const dialog = $('#chart-dialog');
let dialogSource = null; // { card, button }
function renderDialog() {
  if (!dialogSource) return;
  const { card } = dialogSource;
  const body = $('#chart-dialog-body');
  const box = card.querySelector('[data-chart]');
  const w = Math.max(280, Math.floor(body.clientWidth - 44));
  if (box) {
    const h = Math.max(300, Math.min(innerHeight - 240, Math.round(w * 0.5)));
    const fn = chartSpecs(state)[box.dataset.chart];
    body.innerHTML = fn ? fn(w, h) : '';
  } else {
    body.innerHTML = card.querySelector('.expand-body')?.innerHTML ?? '';
  }
}
function openDialog(button) {
  const card = button.closest('.viz');
  if (!card) return;
  dialogSource = { card, button };
  const title = card.querySelector('h2')?.textContent.trim() ?? 'Grafik';
  const sub = card.querySelector('.card-head p')?.textContent.trim() ?? '';
  $('#chart-dialog-title').textContent = title;
  $('#chart-dialog-sub').textContent = sub;
  dialog.append(tip); // tooltip harus berada di lapisan atas yang sama dengan dialog
  dialog.showModal();
  document.body.classList.add('dialog-open');
  renderDialog();
}
function closeDialog() { if (dialog.open) dialog.close(); }
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  tip.hidden = true;
  document.body.append(tip);
  const btn = dialogSource?.button;
  dialogSource = null;
  if (btn?.isConnected) btn.focus();
});
// Klik di area redup (di luar kotak dialog) menutup dialog.
dialog.addEventListener('click', e => {
  if (e.target.closest('[data-dialog-close]')) return closeDialog();
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog();
});
document.addEventListener('click', e => { const b = e.target.closest('[data-expand]'); if (b) openDialog(b); });
addEventListener('resize', () => { if (dialog.open) renderDialog(); });

// ---------- tema terang/gelap ----------
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => document.documentElement.dataset.theme ?? (darkQuery.matches ? 'dark' : 'light');
function syncThemeButton() {
  const b = $('#theme-toggle');
  const dark = currentTheme() === 'dark';
  b.textContent = dark ? 'Mode terang' : 'Mode gelap';
  b.setAttribute('aria-label', dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
}
$('#theme-toggle').addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('uvi-theme', next); } catch { /* abaikan */ }
  syncThemeButton();
  drawCharts();
  renderDialog();
});
darkQuery.addEventListener('change', () => { if (!document.documentElement.dataset.theme) syncThemeButton(); });
syncThemeButton();

render();
