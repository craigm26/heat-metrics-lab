// src/main.js — heat-metrics-lab page boot.
//
// Wires all Phase 2+ components in the right order:
//   1. temp-toggle: sets up the C/F state machine + button handler
//   2. three-number-strip: starts listening for chapter-active events
//   3. chapter-observer: starts the IntersectionObserver (will fire first event soon)
//   4. temp-text: walks the DOM and wraps inline °C literals
//   5. citation-chips: upgrades <cite data-source="..."> elements (no-op if none present)
//   6. scenario-flipper: Ch 4 centerpiece — fetches 5 scenario JSONs + renders chip row
import { initTempToggle } from "./components/temp-toggle.js";
import { initThreeNumberStrip } from "./components/three-number-strip.js";
import { initChapterObserver } from "./components/chapter-observer.js";
import { initTempText } from "./components/temp-text.js";
import { initCitationChips } from "./components/citation-chip.js";
import { initScenarioFlipper } from "./components/scenario-flipper.js";

function boot() {
  initTempToggle();
  initThreeNumberStrip();
  initChapterObserver();
  initTempText();
  initCitationChips();
  initScenarioFlipper();
  // Visible boot marker for sanity-check in DevTools
  console.info("heat-metrics-lab — phase 4 booted");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
