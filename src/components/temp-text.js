// src/components/temp-text.js
// Auto-wraps inline `°C` literals in body copy so the C/F toggle catches them.
// Adapted from heat-protein-lab's pattern in src/main.js.
//
// Numbers wrapped in an ancestor with `data-c-delta` are treated as temperature
// DIFFERENCES, not absolute readings — converted by ΔF = ΔC × 9/5, no +32.
// Use this for phrases like "5–8 °C warmer" or "shift downward by 2.5–3 °C".
import { currentUnit, cToF } from "./temp-toggle.js";

const TEMP_RE = /(\d+(?:\.\d+)?(?:\s*[→\-–—]\s*\d+(?:\.\d+)?)*)\s*°\s*C(?![a-zA-Z])/g;
const NO_WALK_TAGS = new Set(["SCRIPT","STYLE","CODE","PRE","NOSCRIPT","TEXTAREA","INPUT"]);
const NO_WALK_CLASS = "no-temp-convert";

function cDeltaToF(c) { return c * 9 / 5; }
function isInDelta(node) {
  let p = node.parentNode;
  while (p) {
    if (p.dataset && "cDelta" in p.dataset) return true;
    p = p.parentNode;
  }
  return false;
}
function formatC(c, asFahrenheit, isDelta) {
  const v = asFahrenheit
    ? (isDelta ? cDeltaToF(c) : cToF(c))
    : c;
  return c === Math.floor(c) && v === Math.floor(v) ? v.toFixed(0) : v.toFixed(1);
}

export function initTempText(root = document.body) {
  walk(root);
  window.addEventListener("temp-unit-changed", () => rerenderAll(root));
}

function shouldSkip(node) {
  if (NO_WALK_TAGS.has(node.nodeName)) return true;
  if (node.classList && node.classList.contains(NO_WALK_CLASS)) return true;
  if (node.hasAttribute && node.hasAttribute("data-no-temp-convert")) return true;
  return false;
}

function walk(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let p = node.parentNode;
      while (p && p !== root) {
        if (shouldSkip(p)) return NodeFilter.FILTER_REJECT;
        p = p.parentNode;
      }
      return TEMP_RE.test(node.nodeValue || "")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);
  for (const tn of targets) wrap(tn);
}

function wrap(textNode) {
  const text = textNode.nodeValue;
  const isDelta = isInDelta(textNode);
  const asF = currentUnit() === "F";
  TEMP_RE.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0;
  let m;
  while ((m = TEMP_RE.exec(text))) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const numbersBlob = m[1];
    const parts = numbersBlob.split(/(\d+(?:\.\d+)?)/);
    for (const part of parts) {
      if (/^\d+(?:\.\d+)?$/.test(part)) {
        const span = document.createElement("span");
        span.className = "temp";
        span.setAttribute("data-c", part);
        if (isDelta) span.setAttribute("data-c-delta", "");
        const c = parseFloat(part);
        span.textContent = formatC(c, asF, isDelta);
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    frag.appendChild(document.createTextNode(" °" + currentUnit()));
    last = TEMP_RE.lastIndex;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  textNode.parentNode.replaceChild(frag, textNode);
}

function rerenderAll(root) {
  const unit = currentUnit();
  const asF = unit === "F";
  for (const span of root.querySelectorAll("span.temp")) {
    const c = parseFloat(span.getAttribute("data-c"));
    if (Number.isNaN(c)) continue;
    const isDelta = span.hasAttribute("data-c-delta");
    span.textContent = formatC(c, asF, isDelta);
    // Repaint the next sibling that carries "°C" or "°F" — text node OR element
    let sib = span.nextSibling;
    while (sib) {
      if (sib.nodeType === Node.TEXT_NODE && /°\s*[CF]/.test(sib.nodeValue)) {
        sib.nodeValue = sib.nodeValue.replace(/°\s*[CF]/, "°" + unit);
        break;
      }
      if (sib.nodeType === Node.ELEMENT_NODE && /°\s*[CF]/.test(sib.textContent || "")) {
        sib.textContent = sib.textContent.replace(/°\s*[CF]/, "°" + unit);
        break;
      }
      sib = sib.nextSibling;
    }
  }
}
