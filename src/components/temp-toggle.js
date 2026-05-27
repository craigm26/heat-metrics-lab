// src/components/temp-toggle.js
// Persists C/F preference to localStorage and emits 'temp-unit-changed' on window.
const KEY = "hml-unit";

/**
 * Swap the src of every <img data-temp-svg="..."> to the -c.svg or -f.svg variant.
 * Called at init (handles restored localStorage state) and on every toggle click.
 * @param {string} unit — "C" or "F"
 */
export function syncTempSvgs(unit) {
  const suffix = unit === "F" ? "-f.svg" : "-c.svg";
  const opposite = unit === "F" ? "-c.svg" : "-f.svg";
  document.querySelectorAll("img[data-temp-svg]").forEach((img) => {
    const base = img.dataset.tempSvg; // e.g. "heat-index-nomogram"
    const currentSrc = img.getAttribute("src");
    // Replace the unit suffix regardless of which variant is currently set.
    const newSrc = currentSrc.replace(opposite, suffix)
      // Handles first load where src might already have the right suffix — no-op then.
      .replace(new RegExp(`/data/diagrams/${base}\\.svg$`), `/data/diagrams/${base}${suffix}`);
    if (newSrc !== currentSrc) img.setAttribute("src", newSrc);
  });
}

export function initTempToggle() {
  const btn = document.getElementById("unit-toggle");
  if (!btn) return;
  const initial = currentUnit();
  applyButton(btn, initial);
  // Sync diagrams to whatever unit was restored from localStorage.
  syncTempSvgs(initial);
  btn.addEventListener("click", () => {
    const next = currentUnit() === "C" ? "F" : "C";
    try { localStorage.setItem(KEY, next); } catch { /* private mode etc. */ }
    applyButton(btn, next);
    syncTempSvgs(next);
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
