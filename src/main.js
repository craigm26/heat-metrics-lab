// src/main.js — heat-metrics-lab page boot.
//
// Wires all Phase 2+ components in the right order:
//   1. temp-toggle: sets up the C/F state machine + button handler
//   2. three-number-strip: starts listening for chapter-active events
//   3. chapter-observer: starts the IntersectionObserver (will fire first event soon)
//   4. temp-text: walks the DOM and wraps inline °C literals
//   5. citation-chips: upgrades <cite data-source="..."> elements (no-op if none present)
//   6. scenario-flipper: Ch 4 centerpiece — fetches 5 scenario JSONs + renders chip row
//   7. divergence-map: Ch 5 centerpiece — 2D air×RH plot, dominant-metric region painting
//   8. blind-spot-cards: Ch 6 — three parallel cards, what each metric doesn't measure
//   9. sandbox-calculator: Ch 7 manual mode — 4 sliders, 3 live-computed metrics
//  10. live-nws-panel: Ch 7 location mode — api.weather.gov fetch + 6h forecast chart
//  11. ch7-mode-toggle: switches between sandbox and live-nws panels
import { initTempToggle } from "./components/temp-toggle.js";
import { initThreeNumberStrip } from "./components/three-number-strip.js";
import { initChapterObserver } from "./components/chapter-observer.js";
import { initTempText } from "./components/temp-text.js";
import { initCitationChips } from "./components/citation-chip.js";
import { initScenarioFlipper } from "./components/scenario-flipper.js";
import { initDivergenceMap } from "./components/divergence-map.js";
import { initBlindSpotCards } from "./components/blind-spot-cards.js";
import { initSandboxCalculator } from "./components/sandbox-calculator.js";
import { initLiveNwsPanel } from "./components/live-nws-panel.js";

function boot() {
  initTempToggle();
  initThreeNumberStrip();
  initChapterObserver();
  initTempText();
  initCitationChips();
  initScenarioFlipper();
  initDivergenceMap();
  initBlindSpotCards();
  initSandboxCalculator();
  initLiveNwsPanel();
  initCh7ModeToggle();
  // Visible boot marker for sanity-check in DevTools
  console.info("heat-metrics-lab — phase 5 booted");
}

function initCh7ModeToggle() {
  const toggleRoot = document.querySelector(".ch7-mode-toggle");
  if (!toggleRoot) return;
  const sandbox = document.getElementById("sandbox");
  const liveNws = document.getElementById("live-nws");
  toggleRoot.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    const mode = btn.getAttribute("data-mode");
    for (const b of toggleRoot.querySelectorAll("[data-mode]")) {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    }
    if (mode === "manual") {
      sandbox.hidden = false;
      liveNws.hidden = true;
    } else {
      sandbox.hidden = true;
      liveNws.hidden = false;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
