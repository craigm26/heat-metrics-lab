// src/components/three-number-strip.js
// Renders the persistent top-of-viewport three-number strip. Listens for
// 'chapter-active' to update values + active-metric, and 'temp-unit-changed'
// to re-render under the new unit.
import { formatTemp } from "./temp-toggle.js";

export function initThreeNumberStrip() {
  const strip = document.querySelector("header.strip");
  if (!strip) return;
  let last = { air_temp_c: null, hi_c: null, wbgt_c: null };

  function render() {
    for (const key of ["air_temp_c", "hi_c", "wbgt_c"]) {
      const el = strip.querySelector(`[data-strip="${key}"]`);
      if (!el) continue;
      el.textContent = formatTemp(last[key], { decimals: 0, withUnit: false });
    }
  }

  window.addEventListener("chapter-active", (e) => {
    last = { ...last, ...e.detail.readings };
    strip.setAttribute("data-active-metric", e.detail.metric || "");
    render();
  });
  window.addEventListener("temp-unit-changed", render);
  render();
}
