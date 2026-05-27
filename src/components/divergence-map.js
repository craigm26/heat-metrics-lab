// src/components/divergence-map.js
// Ch 5 divergence map. Paints each (air_temp, RH) cell by which metric
// would issue the strongest warning at that point. Outdoor vs indoor toggle.
import { formatTemp, currentUnit, cToF } from "./temp-toggle.js";

const STORAGE_KEY = "hml-divergence-mode";

const state = {
  mode: "outdoor",  // or "indoor"
  grids: {},        // mode -> grid JSON
};

const COLORS = {
  air: "var(--air)",
  "heat-index": "var(--heat-index)",
  wbgt: "var(--wbgt)",
  none: "var(--paper-edge)",
};

export async function initDivergenceMap() {
  const root = document.getElementById("divergence-map");
  if (!root) return;

  const [outdoor, indoor] = await Promise.all([
    fetch("/data/divergence/grid-outdoor.json").then((r) => r.json()).catch(() => null),
    fetch("/data/divergence/grid-indoor.json").then((r) => r.json()).catch(() => null),
  ]);
  if (!outdoor || !indoor) {
    root.innerHTML = "<p>Divergence map data could not be loaded.</p>";
    return;
  }
  state.grids.outdoor = outdoor;
  state.grids.indoor = indoor;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "outdoor" || saved === "indoor") state.mode = saved;
  } catch {}

  render(root);

  // Toggle clicks via event delegation
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (btn) {
      const m = btn.getAttribute("data-mode");
      if (m === "outdoor" || m === "indoor") {
        state.mode = m;
        try { localStorage.setItem(STORAGE_KEY, m); } catch {}
        render(root);
      }
    }
  });

  // Re-render on C/F toggle
  window.addEventListener("temp-unit-changed", () => render(root));
}

/**
 * Determine which metric has the largest normalized breach above its warning threshold.
 * Severity = (current - threshold) / threshold, clamped >= 0.
 * Thresholds:
 *   Air temp: 35 °C (OSHA outdoor heat hazard)
 *   Heat index: 32.2 °C (~90 °F, OSHA NEP high-heat trigger)
 *   WBGT: 28 °C (NIOSH heavy-work warning)
 */
function dominantMetric(cell, air_temp_c) {
  // Normalize each metric by its dynamic range above threshold so the three
  // compete on equal footing. WBGT's physical ceiling (~35 °C) is much lower
  // than HI's (~60 °C), so threshold-relative normalization would let HI
  // out-breach WBGT almost everywhere — which would hide the educational
  // point of the map (that WBGT diverges from HI in dry-hot-sunny conditions).
  // Range-relative normalization restores parity.
  //   Air:  35 → 50 °C (warm → lethal)
  //   HI:   32.2 → 54 °C (HI 90 °F → HI 130 °F NWS danger ceiling)
  //   WBGT: 28 → 35 °C (NIOSH moderate → ACGIH heavy-work ceiling)
  const sev_air  = Math.max(0, (air_temp_c   - 35.0) / (50.0 - 35.0));
  const sev_hi   = Math.max(0, (cell.hi_c    - 32.2) / (54.0 - 32.2));
  const sev_wbgt = Math.max(0, (cell.wbgt_c  - 28.0) / (35.0 - 28.0));
  if (sev_air === 0 && sev_hi === 0 && sev_wbgt === 0) return "none";
  if (sev_wbgt >= sev_hi && sev_wbgt >= sev_air) return "wbgt";
  if (sev_hi   >= sev_air) return "heat-index";
  return "air";
}

/**
 * Map WBGT to NIOSH work/rest recommendation for heavy work.
 * Source: NIOSH 2016-106 §6, Table 1.
 */
function niosh_work_rest_heavy(wbgt_c) {
  if (wbgt_c < 25.0) return "60-min work / 0-min rest";
  if (wbgt_c < 26.7) return "45-min work / 15-min rest";
  if (wbgt_c < 28.3) return "30-min work / 30-min rest";
  if (wbgt_c < 30.0) return "15-min work / 45-min rest";
  return "stop work — exceeds NIOSH ceiling";
}

function render(root) {
  const grid = state.grids[state.mode];
  if (!grid) return;

  const W = 760, H = 420;
  const pad = { left: 56, right: 24, top: 24, bottom: 56 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const nT = grid.temp_axis.length;
  const nRH = grid.rh_axis.length;
  const cellW = plotW / nT;
  const cellH = plotH / nRH;

  // Build per-cell rects — 57 × 20 = 1140 cells
  let rectsHtml = "";
  for (let i = 0; i < nT; i++) {
    const t = grid.temp_axis[i];
    const row = grid.rows[i];
    for (let j = 0; j < nRH; j++) {
      const rh = grid.rh_axis[j];
      const cell = row.cells[j];
      const dom = dominantMetric(cell, t);
      // SVG Y axis is inverted — high RH near top
      const y = pad.top + plotH - (j + 1) * cellH;
      const x = pad.left + i * cellW;
      rectsHtml += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellW.toFixed(2)}" height="${cellH.toFixed(2)}" fill="${COLORS[dom]}" data-air="${t}" data-rh="${rh}" data-hi="${cell.hi_c}" data-wbgt="${cell.wbgt_c}" data-dom="${dom}"/>`;
    }
  }

  // Axes — range-frame style: lines span only the actual data extent
  const axisColor = "var(--ink-faint)";
  const tickColor = "var(--ink-soft)";

  // X-axis ticks every 5 °C: 20, 25, 30, 35, 40, 45 (underlying grid is °C; labels follow the C/F toggle)
  const xTickValues = [20, 25, 30, 35, 40, 45];
  const isF = currentUnit() === "F";
  let xTicksHtml = "";
  for (const tv of xTickValues) {
    const xi = grid.temp_axis.indexOf(tv);
    if (xi < 0) continue;
    const x = pad.left + (xi + 0.5) * cellW;
    const label = isF ? Math.round(cToF(tv)).toString() : tv.toString();
    xTicksHtml += `<line x1="${x.toFixed(1)}" y1="${(pad.top + plotH).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(pad.top + plotH + 6).toFixed(1)}" stroke="${tickColor}" stroke-width="1"/>`;
    xTicksHtml += `<text x="${x.toFixed(1)}" y="${(pad.top + plotH + 22).toFixed(1)}" text-anchor="middle" font-size="11" font-family="var(--font-ui)" fill="${tickColor}">${label}</text>`;
  }

  // Y-axis ticks every 20% RH: 20, 40, 60, 80, 100
  const yTickValues = [20, 40, 60, 80, 100];
  let yTicksHtml = "";
  for (const rv of yTickValues) {
    const yi = grid.rh_axis.indexOf(rv);
    if (yi < 0) continue;
    const y = pad.top + plotH - (yi + 0.5) * cellH;
    yTicksHtml += `<line x1="${(pad.left - 6).toFixed(1)}" y1="${y.toFixed(1)}" x2="${pad.left}" y2="${y.toFixed(1)}" stroke="${tickColor}" stroke-width="1"/>`;
    yTicksHtml += `<text x="${(pad.left - 10).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" font-family="var(--font-ui)" fill="${tickColor}">${rv}</text>`;
  }

  // Axis labels
  const xMid = pad.left + plotW / 2;
  const yMid = pad.top + plotH / 2;
  const axisLabels = `
    <text x="${xMid.toFixed(1)}" y="${(H - 10).toFixed(1)}" text-anchor="middle" font-size="12" font-family="var(--font-ui)" fill="${tickColor}">Air temperature (${isF ? "°F" : "°C"})</text>
    <text x="14" y="${yMid.toFixed(1)}" transform="rotate(-90, 14, ${yMid.toFixed(1)})" text-anchor="middle" font-size="12" font-family="var(--font-ui)" fill="${tickColor}">Relative humidity (%)</text>
  `;

  // Range-frame: thin axis lines only spanning the plot extent
  const axisLines = `
    <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="${axisColor}" stroke-width="1"/>
    <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="${axisColor}" stroke-width="1"/>
  `;

  const isOutdoor = state.mode === "outdoor";

  const html = `
    <div class="divergence-map__toggle" role="tablist" aria-label="Setting">
      <button type="button" role="tab" aria-selected="${isOutdoor}" data-mode="outdoor" class="${isOutdoor ? "is-active" : ""}">Outdoor (sun + wind)</button>
      <button type="button" role="tab" aria-selected="${!isOutdoor}" data-mode="indoor" class="${!isOutdoor ? "is-active" : ""}">Indoor (no sun, no wind)</button>
    </div>
    <svg class="divergence-map__svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Air temperature × relative humidity divergence map showing which metric — air temp, heat index, or WBGT — would issue the strongest warning at each point">
      ${rectsHtml}
      ${axisLines}
      ${xTicksHtml}
      ${yTicksHtml}
      ${axisLabels}
    </svg>
    <div class="divergence-map__legend" aria-label="Color key">
      <span class="divergence-map__legend-item divergence-map__legend-item--air">Air temp dominant</span>
      <span class="divergence-map__legend-item divergence-map__legend-item--hi">Heat Index dominant</span>
      <span class="divergence-map__legend-item divergence-map__legend-item--wbgt">WBGT dominant</span>
      <span class="divergence-map__legend-item divergence-map__legend-item--none">None in warning</span>
    </div>
    <div class="divergence-map__readout" aria-live="polite" aria-atomic="true">
      <span class="divergence-map__readout-prompt">Hover or tap a cell to read its three numbers.</span>
    </div>
  `;
  root.innerHTML = html;

  // Wire hover/tap on cells via event delegation on the SVG
  const svg = root.querySelector(".divergence-map__svg");
  const readout = root.querySelector(".divergence-map__readout");

  svg.addEventListener("pointermove", (e) => {
    const r = e.target.closest("rect[data-air]");
    if (!r) {
      readout.innerHTML = `<span class="divergence-map__readout-prompt">Hover or tap a cell to read its three numbers.</span>`;
      return;
    }
    const air = parseFloat(r.getAttribute("data-air"));
    const rh = parseFloat(r.getAttribute("data-rh"));
    const hi = parseFloat(r.getAttribute("data-hi"));
    const wbgt = parseFloat(r.getAttribute("data-wbgt"));
    const dom = r.getAttribute("data-dom");
    readout.innerHTML = `
      <strong class="divergence-map__readout-coords">${formatTemp(air, { decimals: 0 })} / ${rh.toFixed(0)}% RH</strong>
      <span class="divergence-map__readout-metric"><span class="dot dot--air"></span>Air ${formatTemp(air, { decimals: 0 })}</span>
      <span class="divergence-map__readout-metric"><span class="dot dot--hi"></span>HI ${formatTemp(hi, { decimals: 1 })}</span>
      <span class="divergence-map__readout-metric"><span class="dot dot--wbgt"></span>WBGT ${formatTemp(wbgt, { decimals: 1 })}</span>
      <span class="divergence-map__readout-action divergence-map__readout-action--${escapeHtml(dom)}">${escapeHtml(niosh_work_rest_heavy(wbgt))}</span>
    `;
  });

  svg.addEventListener("pointerleave", () => {
    readout.innerHTML = `<span class="divergence-map__readout-prompt">Hover or tap a cell to read its three numbers.</span>`;
  });

  // Touch support — pointerdown for tap on mobile
  svg.addEventListener("pointerdown", (e) => {
    const r = e.target.closest("rect[data-air]");
    if (!r) return;
    const air = parseFloat(r.getAttribute("data-air"));
    const rh = parseFloat(r.getAttribute("data-rh"));
    const hi = parseFloat(r.getAttribute("data-hi"));
    const wbgt = parseFloat(r.getAttribute("data-wbgt"));
    const dom = r.getAttribute("data-dom");
    readout.innerHTML = `
      <strong class="divergence-map__readout-coords">${formatTemp(air, { decimals: 0 })} / ${rh.toFixed(0)}% RH</strong>
      <span class="divergence-map__readout-metric"><span class="dot dot--air"></span>Air ${formatTemp(air, { decimals: 0 })}</span>
      <span class="divergence-map__readout-metric"><span class="dot dot--hi"></span>HI ${formatTemp(hi, { decimals: 1 })}</span>
      <span class="divergence-map__readout-metric"><span class="dot dot--wbgt"></span>WBGT ${formatTemp(wbgt, { decimals: 1 })}</span>
      <span class="divergence-map__readout-action divergence-map__readout-action--${escapeHtml(dom)}">${escapeHtml(niosh_work_rest_heavy(wbgt))}</span>
    `;
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
