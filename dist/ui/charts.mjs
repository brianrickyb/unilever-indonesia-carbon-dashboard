// Grafik SVG tanpa dependensi. Lebar diukur dari kontainer agar teks tetap terbaca di mobile.
// Aturan: sumbu Y mulai dari nol, nilai null = celah (tidak pernah nol), garis tidak
// menyambung melewati tahun kosong, satu sumbu per grafik, label langsung secukupnya.

import { esc, num, compact, unitLabel } from './format.mjs';

const H = 270;
const M = { top: 34, right: 18, bottom: 34, left: 52 };

function niceTicks(max, count = 4) {
  if (!(max > 0)) return [0, 1];
  const raw = max / count, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1e9) / 1e9);
  if (ticks.at(-1) < max) ticks.push(ticks.at(-1) + step);
  return ticks;
}

function frame(width, ticks, y, unit, years, x, selectedYear, H = 270) {
  const grid = ticks.map(t => `<line class="grid" x1="${M.left}" x2="${width - M.right}" y1="${y(t)}" y2="${y(t)}"/><text class="tick" x="${M.left - 8}" y="${y(t) + 4}" text-anchor="end">${compact(t)}</text>`).join('');
  const xs = years.map(yr => `<text class="tick ${yr === selectedYear ? 'tick-selected' : ''}" x="${x(yr)}" y="${H - 10}" text-anchor="middle">${yr}</text>`).join('');
  return `${grid}<text class="unit" x="0" y="14">${esc(unitLabel(unit))}</text>${xs}`;
}

function annotationMarks(annotations, x, H = 270) {
  return annotations.map(a => `<g class="annot" tabindex="0" data-tip="${esc(a.tip)}" role="img" aria-label="${esc(a.tip)}"><line x1="${x(a.year)}" x2="${x(a.year)}" y1="${M.top - 6}" y2="${H - M.bottom}"/><rect x="${x(a.year) - 9}" y="${M.top - 22}" width="18" height="16" rx="3"/><text x="${x(a.year)}" y="${M.top - 10}" text-anchor="middle">${esc(a.mark)}</text></g>`).join('');
}

function bandX(width, years) {
  const inner = width - M.left - M.right, band = inner / years.length;
  return { band, x: yr => M.left + band * (years.indexOf(yr) + 0.5) };
}

// Grafik garis satu atau lebih seri dengan celah untuk data kosong.
export function lineChart({ width, years, series, unit, selectedYear, annotations = [], decimals = 2, label, height = 270 }) {
  const H = height;
  const all = series.flatMap(s => s.values.map(p => p.v)).filter(v => v !== null);
  const ticks = niceTicks(Math.max(...all, 0) * 1.08);
  const max = ticks.at(-1);
  const { x } = bandX(width, years);
  const y = v => M.top + (H - M.top - M.bottom) * (1 - v / max);
  let body = '';
  for (const s of series) {
    let d = '', open = false;
    for (const p of s.values) {
      if (p.v === null) { open = false; continue; }
      d += `${open ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(p.v).toFixed(1)}`;
      open = true;
    }
    body += `<path class="line" d="${d}" style="stroke:${s.color}"/>`;
    for (const p of s.values) {
      if (p.v === null) {
        body += `<g class="gap" tabindex="0" data-tip="${esc(`${p.year} · ${s.label}: ${p.missing ?? 'tidak tersedia'}`)}"><line x1="${x(p.year) - 10}" x2="${x(p.year) + 10}" y1="${H - M.bottom}" y2="${H - M.bottom}"/><text x="${x(p.year)}" y="${H - M.bottom - 8}" text-anchor="middle">n/a</text></g>`;
        continue;
      }
      const sel = p.year === selectedYear;
      body += `<g class="pt ${sel ? 'selected' : ''}" tabindex="0" data-tip="${esc(`${p.year} · ${s.label}: ${num(p.v, decimals)} ${unitLabel(unit)}${p.note ? ' · ' + p.note : ''}`)}"><circle cx="${x(p.year)}" cy="${y(p.v)}" r="${sel ? 6 : 4.5}" style="fill:${s.color}"/><circle class="hit" cx="${x(p.year)}" cy="${y(p.v)}" r="16"/></g>`;
    }
    // Label langsung: tahun terpilih dan titik terakhir yang tersedia.
    const known = s.values.filter(p => p.v !== null);
    const labelled = new Set([selectedYear, known.at(-1)?.year]);
    for (const p of known.filter(p => labelled.has(p.year))) body += `<text class="value" x="${x(p.year)}" y="${y(p.v) - 12}" text-anchor="middle">${num(p.v, decimals)}</text>`;
  }
  const legend = series.length > 1 ? `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>` : '';
  return `${legend}<svg class="chart" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${esc(label)}">${frame(width, ticks, y, unit, years, x, selectedYear, H)}${annotationMarks(annotations, x, H)}${body}</svg>`;
}

// Kolom bertumpuk (atau satu seri). Segmen null tidak digambar; tahun tanpa data diberi tanda.
export function columnChart({ width, years, stacks, data, unit, selectedYear, annotations = [], decimals = 0, label, totalLabel = true, missingText = {}, height = 270 }) {
  const H = height;
  const totals = years.map(yr => stacks.reduce((s, k) => s + (data[yr]?.[k.key] ?? 0), 0));
  const ticks = niceTicks(Math.max(...totals, 0) * 1.1);
  const max = ticks.at(-1);
  const { x, band } = bandX(width, years);
  const bw = Math.min(H > 300 ? 44 : 28, band * 0.56);
  const y = v => M.top + (H - M.top - M.bottom) * (1 - v / max);
  let body = '';
  years.forEach((yr, i) => {
    const row = data[yr] ?? {};
    const known = stacks.filter(k => row[k.key] !== null && row[k.key] !== undefined);
    const dim = selectedYear && yr !== selectedYear ? ' dim' : '';
    if (!known.length || totals[i] === 0) {
      body += `<g class="gap" tabindex="0" data-tip="${esc(`${yr}: ${missingText[yr] ?? 'tidak tersedia'}`)}"><line x1="${x(yr) - 10}" x2="${x(yr) + 10}" y1="${H - M.bottom}" y2="${H - M.bottom}"/><text x="${x(yr)}" y="${H - M.bottom - 8}" text-anchor="middle">n/a</text></g>`;
      return;
    }
    let acc = 0;
    known.forEach((k, j) => {
      const v = row[k.key], y0 = y(acc), y1 = y(acc + v);
      const top = j === known.length - 1;
      const h = Math.max(0, y0 - y1 - (j ? 2 : 0));
      const yTop = y1;
      const tip = `${yr} · ${k.label}: ${num(v, decimals)} ${unitLabel(unit)} (${num(v / totals[i] * 100, 1)}%)`;
      body += `<g class="seg${dim}" tabindex="0" data-tip="${esc(tip)}"><path d="${roundedTop(x(yr) - bw / 2, yTop, bw, h, top ? 3 : 0)}" style="fill:${k.color}"/><rect class="hit" x="${x(yr) - band / 2}" y="${yTop}" width="${band}" height="${Math.max(h, 6)}"/></g>`;
      acc += v;
    });
    const missing = stacks.filter(k => !known.includes(k));
    if (totalLabel) body += `<text class="value${dim}" x="${x(yr)}" y="${y(totals[i]) - 8}" text-anchor="middle">${max < 1000 ? num(totals[i], decimals) : compact(totals[i])}${missing.length && stacks.length > 1 ? '*' : ''}</text>`;
  });
  const legend = stacks.length > 1 ? `<div class="legend">${stacks.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>` : '';
  return `${legend}<svg class="chart" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${esc(label)}">${frame(width, ticks, y, unit, years, x, selectedYear, H)}${annotationMarks(annotations, x, H)}${body}</svg>`;
}

function roundedTop(x, y, w, h, r) {
  if (h <= 0) return '';
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

// Batang horizontal berkelompok (mis. Scope 3 2020 vs 2021).
export function groupedBars({ width, rows, keys, unit, label, decimals = 0, barH = 12 }) {
  const max = niceTicks(Math.max(...rows.flatMap(r => keys.map(k => r[k.key] ?? 0))) * 1.05).at(-1);
  const labelW = Math.min(170, width * 0.38), right = 70, gap = 4, rowH = keys.length * (barH + gap) + 18;
  const h = rows.length * rowH + 10;
  const x = v => labelW + (width - labelW - right) * v / max;
  let body = '';
  rows.forEach((r, i) => {
    const top = 8 + i * rowH;
    body += `<text class="row-label" x="0" y="${top + 11}">${esc(r.label)}</text>`;
    keys.forEach((k, j) => {
      const v = r[k.key], yy = top + 16 + j * (barH + gap) - 14;
      if (v === null || v === undefined) {
        body += `<text class="tick" x="${labelW}" y="${yy + 10}">n/a</text>`;
        return;
      }
      const w = Math.max(1, x(v) - labelW);
      body += `<g class="seg" tabindex="0" data-tip="${esc(`${r.label} · ${k.label}: ${num(v, decimals)} ${unitLabel(unit)}`)}"><path d="M${labelW},${yy}H${labelW + w - 3}Q${labelW + w},${yy} ${labelW + w},${yy + 3}V${yy + barH - 3}Q${labelW + w},${yy + barH} ${labelW + w - 3},${yy + barH}H${labelW}Z" style="fill:${k.color}"/></g><text class="value-sm" x="${labelW + w + 6}" y="${yy + barH - 2}">${compact(v)}</text>`;
    });
  });
  const legend = keys.length > 1 ? `<div class="legend">${keys.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('')}</div>` : '';
  return `${legend}<svg class="chart" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
}
