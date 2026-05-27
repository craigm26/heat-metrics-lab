// src/components/sandbox-calculator.js
// Ch 7 manual-mode panel: four sliders + three live-computed metrics.
// State object pattern from `playground` skill.

import { heatIndexC, wbgtIndoorC, wbgtOutdoorC } from "../metrics.js";
import { formatTemp } from "./temp-toggle.js";

const STORAGE_KEY = "hml-sandbox";

const state = {
  air_temp_c: 35,
  rh_pct: 50,
  wind_mph: 4,
  solar_w_m2: 700,
};

const RANGES = {
  air_temp_c: { min: 15, max: 50, step: 0.5, unit: "°C", label: "Air temperature" },
  rh_pct:     { min: 5,  max: 100, step: 1,  unit: "%",  label: "Relative humidity" },
  wind_mph:   { min: 0,  max: 25, step: 0.5, unit: "mph", label: "Wind speed" },
  solar_w_m2: { min: 0,  max: 1100, step: 25, unit: "W/m²", label: "Solar irradiance" },
};

export function initSandboxCalculator() {
  const root = document.getElementById("sandbox");
  if (!root) return;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") Object.assign(state, saved);
  } catch {}

  render(root);

  root.addEventListener("input", (e) => {
    const slider = e.target.closest('input[type="range"]');
    if (!slider) return;
    const key = slider.getAttribute("data-key");
    if (!(key in state)) return;
    state[key] = parseFloat(slider.value);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    renderReadout(root);
    renderInputDisplay(root, key);
    dispatchChapterActive();
  });

  window.addEventListener("temp-unit-changed", () => renderReadout(root));

  // On boot, push the initial state up to the three-number strip
  dispatchChapterActive();
}

function render(root) {
  const slidersHtml = Object.entries(RANGES).map(([key, r]) => `
    <div class="sandbox__slider">
      <label class="sandbox__slider-label" for="sandbox-${key}">
        ${r.label}
        <span class="sandbox__slider-value" data-display="${key}">${formatSliderDisplay(key, state[key])}</span>
      </label>
      <input id="sandbox-${key}" type="range" min="${r.min}" max="${r.max}" step="${r.step}"
             value="${state[key]}" data-key="${key}" aria-label="${r.label} in ${r.unit}" />
    </div>
  `).join("");

  root.innerHTML = `
    <div class="sandbox">
      <div class="sandbox__controls">${slidersHtml}</div>
      <div class="sandbox__readout" aria-live="polite">
        <div class="sandbox__cell sandbox__cell--air">
          <span class="sandbox__label">Air</span>
          <span class="sandbox__value" data-metric="air_temp_c">${formatTemp(state.air_temp_c, {decimals: 0})}</span>
        </div>
        <div class="sandbox__cell sandbox__cell--hi">
          <span class="sandbox__label">Heat index</span>
          <span class="sandbox__value" data-metric="hi_c">${formatTemp(computeHi(), {decimals: 0})}</span>
        </div>
        <div class="sandbox__cell sandbox__cell--wbgt">
          <span class="sandbox__label">WBGT</span>
          <span class="sandbox__value" data-metric="wbgt_c">${formatTemp(computeWbgt(), {decimals: 0})}</span>
        </div>
      </div>
    </div>
  `;
}

function formatSliderDisplay(key, val) {
  const r = RANGES[key];
  if (key === "air_temp_c") return formatTemp(val, {decimals: 1, withUnit: true});
  if (key === "rh_pct")     return `${val.toFixed(0)} ${r.unit}`;
  if (key === "wind_mph")   return `${val.toFixed(1)} ${r.unit}`;
  return `${val.toFixed(0)} ${r.unit}`;
}

function renderInputDisplay(root, key) {
  const el = root.querySelector(`[data-display="${key}"]`);
  if (el) el.textContent = formatSliderDisplay(key, state[key]);
}

function renderReadout(root) {
  const updates = {
    air_temp_c: state.air_temp_c,
    hi_c: computeHi(),
    wbgt_c: computeWbgt(),
  };
  for (const [k, v] of Object.entries(updates)) {
    const el = root.querySelector(`.sandbox__value[data-metric="${k}"]`);
    if (el) el.textContent = formatTemp(v, {decimals: 0});
  }
  // Also re-render air-temp slider display (it depends on unit)
  renderInputDisplay(root, "air_temp_c");
}

function computeHi() {
  return heatIndexC(state.air_temp_c, state.rh_pct);
}
function computeWbgt() {
  // If solar=0, use indoor formula (psychrometric); otherwise outdoor.
  if (state.solar_w_m2 <= 0) return wbgtIndoorC(state.air_temp_c, state.rh_pct);
  return wbgtOutdoorC(state.air_temp_c, state.rh_pct, state.wind_mph, state.solar_w_m2);
}

function dispatchChapterActive() {
  window.dispatchEvent(new CustomEvent("chapter-active", {
    detail: {
      chapter: "7",
      metric: "all",
      readings: {
        air_temp_c: state.air_temp_c,
        hi_c: computeHi(),
        wbgt_c: computeWbgt(),
      },
    },
  }));
}
