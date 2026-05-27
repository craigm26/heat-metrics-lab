// src/components/chapter-observer.js
// Wires IntersectionObserver to each <section.chapter>. Dispatches 'chapter-active'
// on window when a chapter crosses the 55% visibility threshold.

export function initChapterObserver() {
  const sections = Array.from(document.querySelectorAll("section.chapter"));
  if (sections.length === 0) return;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= 0.55) {
        for (const s of sections) s.classList.toggle("is-active", s === e.target);
        let readings = {};
        try {
          readings = JSON.parse(e.target.getAttribute("data-readings") || "{}");
        } catch { /* ignore malformed JSON */ }
        const metric = e.target.getAttribute("data-metric") || "";
        window.dispatchEvent(new CustomEvent("chapter-active", {
          detail: {
            chapter: e.target.getAttribute("data-chapter"),
            metric,
            readings,
          },
        }));
      }
    }
  }, { threshold: [0.55] });
  for (const s of sections) obs.observe(s);
}
