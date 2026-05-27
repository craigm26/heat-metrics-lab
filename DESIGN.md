# DESIGN.md — heat-metrics-lab

> Visual design system and UX specification. See [README.md](./README.md) for the project pitch, [PROJECT.md](./PROJECT.md) for the build plan, [AGENTS.md](./AGENTS.md) for IDE context, [DEVREL.md](./DEVREL.md) for the A/B comparison log, and the full [design spec](./docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md) for architecture.

## Design principles

1. **The data is the design.** Real observations, real formulas, real diagrams. The page's visual heroes are NOAA scenarios and NIOSH tables — the rest of the layout is a quiet frame around them.

2. **Three colors carry metric semantics.** Air temperature (slate blue `#3F5160`), Heat Index (umber `#A45A2A`), WBGT (oxblood `#702424`). These three inks thread through every chapter once introduced. By Ch 4, the reader reads color as meaning.

3. **Surveyor's notebook aesthetic.** Cream paper, serif body, marginalia. Inherited from heat-protein-lab and the operator's visual family (PlatAtlas Vol I/II, mcpreplay.dev). Quiet, considered, citation-dense. Closer to *Encyclopaedia Britannica* than *Stripe.com*.

4. **Every claim is cited.** No floating numbers. No vague gradients pretending to be data. If it looks scientific, it links to a source: OSHA CPL 03-00-024-0, NIOSH 2016-106, NWS Tech Memo SR-90, peer-reviewed papers. See [references.md](./references.md).

5. **Visualization ≠ recommendation.** The page shows three numbers and links to OSHA/NIOSH guidance. It does not generate personalized safety advice. A disclaimer block on Ch 0 and in the footer are load-bearing.

6. **Mobile first; reduced motion honored.** 44×44 px touch targets minimum. All scroll-driven animations have a static fallback when `prefers-reduced-motion: reduce`. Chapters work on 360×640 viewport.

7. **Reduced motion is honored.** When a user sets `prefers-reduced-motion: reduce`, all scroll-driven and time-driven animations snap to their static end state.

## Visual system

### Brand tokens

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F5EFDF` | Page background |
| `--ink` | `#1B1B1B` | Body text, high contrast |
| `--ink-soft` | `#3D3A33` | Secondary text, captions |
| `--air` | `#3F5160` | Air temperature metric ink |
| `--heat-index` | `#A45A2A` | Heat index metric ink |
| `--wbgt` | `#702424` | WBGT metric ink |

Contrast: `--ink` on `--paper` is ~14:1. `--ink-soft` on `--paper` is ~9:1. All are WCAG AA minimum.

### Typography

| Token | Family | Use |
|---|---|---|
| `--font-display` | "GT Sectra Display", "Spectral", serif | Chapter headings |
| `--font-body` | "Spectral", "Charter", "Georgia", serif | All body copy |
| `--font-mono` | "IBM Plex Mono", "JetBrains Mono", ui-monospace | Numbers, formulas, data values |
| `--font-ui` | "Inter", system-ui, sans-serif | UI chrome, the three-number strip |

All fonts are self-hosted. No `@import url(fonts.googleapis.com/...)`.

Type scale (rem; base 16 px):

- Hero chapter title: `clamp(2.5rem, 8vw, 5rem)`, display serif
- Section subhead: 1.75 / 2, display serif
- Body: 1.0625, serif, line-height 1.65, max-width 64ch
- Caption: 0.875, mono
- Marginalia: 0.8125, soft ink

### Spacing

8-pt baseline grid. Section vertical rhythm: 96 / 128 / 192 px between chapters at sm / md / lg. Inside a chapter: 24 px between paragraphs, 48 px before/after figures.

## Components and interactive zones

| Component | Where | What it does | Aria role |
|---|---|---|---|
| `three-number-strip` | persistent top | Renders air / HI / WBGT in big type; dashed until claimed by scroll | status |
| `chapter-observer` | global | IntersectionObserver wiring; fires `chapter-enter` event | — |
| `temp-toggle` | persistent footer | C↔F switch; persists to `localStorage['hml-unit']` | region |
| `temp-text` | inline | Auto-wraps `°C`/`°F` literals; responds to unit-changed event | — |
| `citation-chip` | inline | Footnote link with hover tooltip showing source + date | doc-note |
| `scenario-flipper` | Ch 4 | Playground-pattern widget: scenario chips, three-number readout, decision row | region |
| `divergence-map` | Ch 5 | SVG 2D plot (air-temp × RH); hover/tap → readout popover | figure |
| `blind-spot-cards` | Ch 6 | Static three-card grid in the three metric colors | group |
| `sandbox-calculator` | Ch 7 manual | Four range sliders + three live numbers | region |
| `live-nws-panel` | Ch 7 location | ZIP/lat-lng input → NWS two-step → three numbers + 6-hr chart | region |
| `work-rest-table` | Ch 8 | Static SVG from NIOSH §6 WBGT × work-intensity | figure |

## Motion

- **Scroll-driven animations:** CSS native `animation-timeline: view()` where supported; IntersectionObserver-driven fallback elsewhere.
- **Prefers-reduced-motion:** When `prefers-reduced-motion: reduce`, all scroll-driven and time-driven animations snap to static end-state.
- **Section transitions:** Crossfades, not slides.
- **The three-number-strip's number-fill animation** is the load-bearing motion moment; everything else is quiet.

## Accessibility budget

- Body text contrast ≥7:1 (`--ink` on `--paper`); secondary ≥4.5:1.
- All chapters `min-height: 100dvh`.
- All touch targets ≥44×44 px.
- `aria-live="polite"` on three-number strip and sandbox readout.
- Keyboard: tab through chips/sliders/inputs, arrow keys to flip scenarios, `Enter` confirms ZIP entry.
- Screen-reader: single `<h2>` per chapter; citations are real `<a>` with `aria-describedby`; SVGs have `<title>` + `<desc>`.

## Responsive behavior

- **Mobile (< 640 px):** Single column, full-width figures, touch-optimized inputs.
- **Tablet (640–1024 px):** Slightly larger text, centered figures, side-by-side pairs where possible.
- **Desktop (≥ 1024 px):** Optional marginalia column on the left (chapter metadata, footnotes); reading column (text, max 64ch); figure column on the right.

## Fonts (self-hosted)

All fonts are served from the repo or embedded as base64. No CDN fonts except from a vendor-provided SRI URL if absolutely necessary. Preferred fallback stacks (serif → serif, mono → mono, UI → UI) ensure graceful degradation on slow networks.
