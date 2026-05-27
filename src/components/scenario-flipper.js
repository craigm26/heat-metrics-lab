// src/components/scenario-flipper.js
// Ch 4 scenario flipper centerpiece. Single state object + preset chips
// pattern from the `playground` skill, adapted for static scenarios + decision row.
import { formatTemp } from "./temp-toggle.js";
import { initCitationChips } from "./citation-chip.js";

const SCENARIO_IDS = [
  "phoenix-aug-12pm",
  "houston-aug-6am-humid",
  "yuma-field-2pm",
  "indoor-warehouse-3pm",
  "lytton-bc-2021-5pm",
];
const STORAGE_KEY = "hml-scenario";

const state = {
  currentScenarioId: null,
  scenarios: {},  // id -> scenario JSON
};

export async function initScenarioFlipper() {
  const root = document.getElementById("scenario-flipper");
  if (!root) return;

  // Fetch all 5 scenarios in parallel
  const fetches = SCENARIO_IDS.map(async (id) => {
    try {
      const r = await fetch(`/data/scenarios/${id}.json`);
      if (!r.ok) return null;
      return [id, await r.json()];
    } catch { return null; }
  });
  const results = await Promise.all(fetches);
  for (const r of results) {
    if (r) state.scenarios[r[0]] = r[1];
  }

  // Restore last selection or default to phoenix
  let initialId = null;
  try { initialId = localStorage.getItem(STORAGE_KEY); } catch {}
  if (!initialId || !state.scenarios[initialId]) initialId = SCENARIO_IDS[0];
  state.currentScenarioId = initialId;

  render(root);

  // Wire chip clicks via event delegation
  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".scenario-flipper__chip");
    if (!chip) return;
    const id = chip.getAttribute("data-scenario-id");
    if (!id || !state.scenarios[id] || id === state.currentScenarioId) return;
    state.currentScenarioId = id;
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    render(root);
    dispatchChapterActive();
  });

  // Re-render on C/F toggle
  window.addEventListener("temp-unit-changed", () => renderReadout(root));

  // On first paint, push the initial scenario's readings up to the three-number strip
  dispatchChapterActive();
}

function render(root) {
  const s = state.scenarios[state.currentScenarioId];
  if (!s) return;

  // Chip row
  const chipsHtml = SCENARIO_IDS.map((id) => {
    const sc = state.scenarios[id];
    if (!sc) return "";
    const active = id === state.currentScenarioId;
    return `<button type="button" class="scenario-flipper__chip ${active ? "is-active" : ""}" role="tab"
              aria-selected="${active}" data-scenario-id="${id}">${escapeHtml(sc.label)}</button>`;
  }).join("");

  // Readout (3 big numbers)
  const r = s.derived;
  const readoutHtml = `
    <div class="scenario-flipper__cell scenario-flipper__cell--air">
      <span class="scenario-flipper__label">Air</span>
      <span class="scenario-flipper__value" data-metric="air_temp_c">${formatTemp(s.inputs.air_temp_c, { decimals: 0 })}</span>
    </div>
    <div class="scenario-flipper__cell scenario-flipper__cell--hi">
      <span class="scenario-flipper__label">Heat index</span>
      <span class="scenario-flipper__value" data-metric="hi_c">${formatTemp(r.hi_c, { decimals: 0 })}</span>
    </div>
    <div class="scenario-flipper__cell scenario-flipper__cell--wbgt">
      <span class="scenario-flipper__label">WBGT ${r.wbgt_kind === "outdoor" ? "(outdoor)" : "(indoor)"}</span>
      <span class="scenario-flipper__value" data-metric="wbgt_c">${formatTemp(r.wbgt_c, { decimals: 0 })}</span>
    </div>
  `;

  // Decision row
  const wrest = s.decision_hooks.niosh_work_rest_heavy;
  const priority = s.decision_hooks.osha_nep_priority_day;
  const decisionHtml = `
    <div class="scenario-flipper__decision">
      <span class="scenario-flipper__decision-label">At this WBGT, NIOSH-recommended work/rest for heavy work is</span>
      <strong class="scenario-flipper__decision-value">${escapeHtml(wrest)}</strong>
      ${priority ? `<span class="scenario-flipper__decision-priority">OSHA Heat NEP priority day</span>` : ""}
      <span class="scenario-flipper__decision-citations">
        <cite data-source="niosh-2016-106">NIOSH 2016-106 §6</cite>
        <cite data-source="osha-nep">OSHA Heat NEP</cite>
      </span>
    </div>
  `;

  root.innerHTML = `
    <div class="scenario-flipper">
      <div class="scenario-flipper__chips" role="tablist" aria-label="Scenarios">${chipsHtml}</div>
      <div class="scenario-flipper__readout" aria-live="polite">${readoutHtml}</div>
      ${decisionHtml}
    </div>
  `;

  // Re-init citation chips since we just replaced their parent's innerHTML
  initCitationChips(root);
}

function renderReadout(root) {
  const s = state.scenarios[state.currentScenarioId];
  if (!s) return;
  const map = { air_temp_c: s.inputs.air_temp_c, hi_c: s.derived.hi_c, wbgt_c: s.derived.wbgt_c };
  for (const [key, val] of Object.entries(map)) {
    const el = root.querySelector(`.scenario-flipper__value[data-metric="${key}"]`);
    if (el) el.textContent = formatTemp(val, { decimals: 0 });
  }
}

function dispatchChapterActive() {
  const s = state.scenarios[state.currentScenarioId];
  if (!s) return;
  const readings = {
    air_temp_c: s.inputs.air_temp_c,
    hi_c: s.derived.hi_c,
    wbgt_c: s.derived.wbgt_c,
  };
  window.dispatchEvent(new CustomEvent("chapter-active", {
    detail: { chapter: "4", metric: "all", readings },
  }));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
