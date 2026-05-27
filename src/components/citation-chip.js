// src/components/citation-chip.js
// Upgrades <cite data-source="..."> elements into interactive citation chips
// with a tooltip card showing the source's title, citation, URL, accessed date.
//
// Source metadata is lazy-loaded from /data/references/<source>.json on first
// hover or focus. Each source is fetched at most once per page load.
//
// Schema for /data/references/<source>.json:
//   { id, title, citation, url, accessed_at, note? }

const cache = new Map();

export function initCitationChips(root = document) {
  for (const el of root.querySelectorAll("cite[data-source]")) {
    upgrade(el);
  }
}

function upgrade(el) {
  if (el.classList.contains("citation-chip")) return; // idempotent
  el.classList.add("citation-chip");
  el.setAttribute("tabindex", "0");
  el.setAttribute("role", "button");
  const source = el.getAttribute("data-source");
  el.setAttribute("aria-label", `Citation: ${source}. Hover or focus for details.`);

  let tip = null;

  function show() {
    loadMeta(source).then((meta) => {
      if (!meta) return;
      if (!tip) {
        tip = renderTip(meta);
        el.appendChild(tip);
      }
      tip.classList.add("is-visible");
    });
  }

  function hide() {
    if (tip) tip.classList.remove("is-visible");
  }

  el.addEventListener("mouseenter", show);
  el.addEventListener("focus", show);
  el.addEventListener("mouseleave", hide);
  el.addEventListener("blur", hide);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

async function loadMeta(source) {
  if (cache.has(source)) return cache.get(source);
  try {
    const r = await fetch(`/data/references/${source}.json`);
    if (!r.ok) { cache.set(source, null); return null; }
    const meta = await r.json();
    cache.set(source, meta);
    return meta;
  } catch {
    cache.set(source, null);
    return null;
  }
}

function renderTip(meta) {
  const tip = document.createElement("span");
  tip.className = "citation-chip__tip";
  tip.setAttribute("role", "tooltip");
  const title = document.createElement("strong");
  title.textContent = meta.title || meta.id || "Source";
  tip.appendChild(title);
  if (meta.citation) {
    tip.appendChild(document.createElement("br"));
    tip.appendChild(document.createTextNode(meta.citation));
  }
  if (meta.url) {
    tip.appendChild(document.createElement("br"));
    const a = document.createElement("a");
    a.href = meta.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = meta.url;
    tip.appendChild(a);
  }
  if (meta.accessed_at) {
    tip.appendChild(document.createElement("br"));
    const small = document.createElement("small");
    small.textContent = `accessed ${meta.accessed_at}`;
    tip.appendChild(small);
  }
  return tip;
}
