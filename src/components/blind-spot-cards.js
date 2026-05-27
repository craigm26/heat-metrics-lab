// src/components/blind-spot-cards.js
// Ch 6: three callout cards listing what each metric doesn't measure.
// Symmetric parallelism structure — each card uses the metric's ink color
// as a left-border accent. No icons, no decorative borders — lean eraser-test pass.

const BLIND_SPOTS = [
  {
    metric: "air",
    title: "Air temperature is blind to",
    items: [
      "humidity",
      "sunshine and radiant load",
      "wind",
      "what the worker is actually doing",
    ],
    note: "Built to describe a place's weather, not a body's heat balance.",
  },
  {
    metric: "heat-index",
    title: "Heat index is blind to",
    items: [
      "direct sunshine",
      "wind speed",
      "clothing and PPE",
      "exertion / work intensity",
    ],
    note: "Built for the forecast, not the jobsite. Indoor and shaded use cases were assumed.",
  },
  {
    metric: "wbgt",
    title: "WBGT is blind to",
    items: [
      "clothing and PPE insulation",
      "individual acclimatization",
      "underlying health conditions",
      "work intensity — separate adjustment tables apply",
    ],
    note: "The most complete environmental measure; still not a complete worker-safety oracle.",
  },
];

export function initBlindSpotCards() {
  const root = document.getElementById("blind-spot-cards");
  if (!root) return;

  const cardsHtml = BLIND_SPOTS.map((bs) => `
    <article class="blind-spot-card blind-spot-card--${bs.metric}" tabindex="0">
      <h3 class="blind-spot-card__title">${escapeHtml(bs.title)}</h3>
      <ul class="blind-spot-card__items">
        ${bs.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
      </ul>
      <p class="blind-spot-card__note">${escapeHtml(bs.note)}</p>
    </article>
  `).join("");

  root.innerHTML = `<div class="blind-spot-cards">${cardsHtml}</div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
