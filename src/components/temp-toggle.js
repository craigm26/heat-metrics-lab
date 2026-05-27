// src/components/temp-toggle.js
// Persists C/F preference to localStorage and emits 'temp-unit-changed' on window.
const KEY = "hml-unit";

export function initTempToggle() {
  const btn = document.getElementById("unit-toggle");
  if (!btn) return;
  applyButton(btn, currentUnit());
  btn.addEventListener("click", () => {
    const next = currentUnit() === "C" ? "F" : "C";
    try { localStorage.setItem(KEY, next); } catch { /* private mode etc. */ }
    applyButton(btn, next);
    window.dispatchEvent(new CustomEvent("temp-unit-changed", { detail: { unit: next } }));
  });
}

export function currentUnit() {
  try { return localStorage.getItem(KEY) === "F" ? "F" : "C"; }
  catch { return "C"; }
}

export function cToF(c) { return c * 9 / 5 + 32; }

/**
 * Format a Celsius value for display under the current unit setting.
 * @param {number|null|undefined} c — Celsius input
 * @param {object} [opts] — { decimals=0, withUnit=true }
 * @returns {string}
 */
export function formatTemp(c, opts = {}) {
  const { decimals = 0, withUnit = true } = opts;
  if (c == null || Number.isNaN(c)) return withUnit ? "— °C" : "—";
  const u = currentUnit();
  const v = u === "F" ? cToF(c) : c;
  return withUnit ? `${v.toFixed(decimals)} °${u}` : v.toFixed(decimals);
}

function applyButton(btn, unit) {
  // The button reads "Show as °F" when currently C; "Show as °C" when currently F.
  const alt = unit === "C" ? "°F" : "°C";
  const altSpan = btn.querySelector(".unit-toggle__alt");
  if (altSpan) altSpan.textContent = alt;
  btn.setAttribute("aria-pressed", unit === "F" ? "true" : "false");
}
