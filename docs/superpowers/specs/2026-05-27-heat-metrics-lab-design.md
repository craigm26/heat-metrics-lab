# heat-metrics-lab — Design Spec

> **Status:** Draft for implementation
> **Date:** 2026-05-27
> **Author:** Craig Merry (with Claude Opus 4.7)
> **Sibling project:** [heat-protein-lab](https://github.com/craigm26/heat-protein-lab)

## 1. Overview

A standalone, public, single-page scrollytelling explainer that walks a reader through the difference between **air temperature**, **heat index**, and **wet-bulb globe temperature (WBGT)** — what each measures, what each is blind to, and why your wall thermometer is the worst of the three for any decision that actually matters. Modeled in structural shape on [heat-protein-lab](https://github.com/craigm26/heat-protein-lab), with its own three-act story and its own visual identity.

The project carries **two threads** that run in parallel:

1. **Subject thread.** A general-audience explainer with practitioner sidebars. Hero interactives: a scenario flipper, a client-side sandbox calculator, and a live `api.weather.gov` panel.
2. **DevRel thread.** The Anthropic-side counterweight to heat-protein-lab. Heat-protein-lab was built in **Antigravity 2.0 + Stitch MCP + Google DeepMind Science Skills** — a celebration of Google's IDE and skill ecosystem. This site is built entirely in **Claude Code + the Anthropic skill/MCP ecosystem (superpowers, frontend-design, playground, scrollytelling, session-report, etc.)** with no Google tooling. The build experience is logged in `DEVREL.md` and the comparison post is the closing artifact.

## 2. Audience

**Both, with a split.** Body chapters speak to a curious, educated general reader. Inside each chapter is a discrete **side dispatch** voiced for EHS / safety / compliance practitioners — citing OSHA Heat NEP CPL 03-00-024-0 (renewed 2026-04-10), NIOSH 2016-106 §6, ACGIH TLVs, and the still-pending Federal Heat Rule NPRM.

## 3. Scope

**In scope (v1):**

- 9 chapters (Ch 0–8) across 3 acts: Anatomy → Divergence → Application
- Hero interactives: scenario flipper, divergence map, sandbox calculator, live NWS panel
- Build-time data pipeline (NOAA NCEI for historical scenarios, peer-reviewed papers for formulas)
- Client-side reimplementations of NWS Heat Index (Rothfusz 1990) and outdoor/indoor WBGT (Liljegren 2008 simplified) with a CI-enforced drift gate against Python build-time computation
- C↔F toggle, persistent via `localStorage['hml-unit']`, auto-wrapping all `°C` literals in body copy
- Cloudflare Pages deploy at `https://heat-metrics-lab.pages.dev/`
- `DEVREL.md` build log throughout, comparison post drafted at v1

**Out of scope (v1):**

- Spanish translation (v2)
- Mobile native app
- "Should I work outside right now" advice synthesis — we show three numbers and link to OSHA/NIOSH guidance, we do not generate personalized recommendations
- Account creation, login, save-my-location — no user state beyond the unit toggle
- Analytics or third-party scripts
- Runtime LLM features (no streaming Claude output in the page itself; client-side math is deterministic)
- A custom domain (use the `.pages.dev` URL for v1, defer brand domain)

## 4. Architecture

### 4.1 Page shape

Single static page `index.html` plus an ES-module entry `src/main.js` and stylesheet `src/styles.css`. **No build framework, no bundler, no router.** This is the deliberate match to heat-protein-lab — the toolchain control variable for the A/B.

### 4.2 Data pipeline

Python scripts under `scripts/`, run via `uv`, fetch and freeze data into `data/`. All `data/*.json` and `data/diagrams/*.svg` are committed. The page works offline; refreshing data is an explicit `make data` workflow.

- `01_scenarios.py` — pull historical observations from NOAA NCEI Local Climatological Data API for the 5 scenarios in Ch 4; fall back to hand-curated values from published case studies if API access is rate-limited
- `02_compute_indices.py` — for each scenario, compute Heat Index (Rothfusz) and WBGT (Liljegren-simplified outdoor + psychrometric indoor); write to scenario JSON `derived` block
- `03_osha_references.py` — fetch OSHA CPL 03-00-024-0, extract App I / App J excerpts, write citation metadata
- `04_render_diagrams.py` — generate static SVGs via matplotlib + post-processing (Stevenson screen, NWS HI nomogram, three-thermometer rig, divergence map, NIOSH work-rest table)
- `05_drift_check.py` — run both JS (`src/metrics.js`) and Python implementations against `data/references/reference-cases.json`; fail if any case diverges by >0.5 °F

### 4.3 Client runtime

Vanilla HTML + CSS + ES modules. `IntersectionObserver` for scroll triggers. Native CSS Scroll-Driven Animations (`animation-timeline: view()`) where supported, observer-driven `.is-active` class fallback elsewhere. Pure-JS reimplementations of Heat Index and WBGT live in `src/metrics.js` and are tested in `src/metrics.test.js` with a tiny custom runner — no Jest/Vitest dependency, in keeping with the precedent.

### 4.4 Live NWS panel (Ch 7 "my location" mode)

The browser fires two requests against `api.weather.gov`:

1. `GET /points/{lat},{lng}` → returns gridpoint URL
2. `GET /gridpoints/{office}/{x,y}/forecast/hourly` → returns 156-hour forecast with temp, dewpoint (→ RH), wind, sky-cover

Solar load is estimated client-side from cloud cover + solar zenith angle (NOAA SOLPOS standard formula). No API key required. CORS-friendly. Gracefully degrades to "couldn't reach NWS, try sandbox mode" on failure.

## 5. Skill & MCP stack

### 5.1 The "Anthropic tooling only" boundary

| Surface | Constraint |
|---|---|
| IDE / authoring | Claude Code only. No Antigravity, Cursor, Copilot, Gemini CLI. |
| LLM-mediated steps | Claude only (Opus 4.7 for design + spec, Sonnet 4.6 / Haiku 4.5 for implementation subagents). No Gemini. |
| Skills / MCPs | Anthropic-official + community-marketplace items vetted below. No Google Science Skills. No Stitch. |
| Hosting | Cloudflare Pages (neutral on the A/B axis). |
| Data sources | NOAA, NWS, CDC/NIOSH, OSHA, peer-reviewed papers. Not "tooling" — public scientific data. Allowed. |
| Fonts | Self-hosted local fallback stacks. No `@import url(fonts.googleapis.com/...)`. |

### 5.2 Skills to install / enable before kickoff

| Skill | Source | Role |
|---|---|---|
| `playground` | Anthropic official | Scaffold for Ch 4 scenario flipper + Ch 7 sandbox — single-state-object pattern + preset chips |
| `scrollytelling` | doodledood community marketplace | Scroll-driven story mechanics; trying it is part of the devrel content |
| `session-report` | Anthropic official | Quantitative spine of the A/B retro — token usage, per-skill spend, cache breaks |
| `frontend-design` | Anthropic official (installed) | Polish layer; "avoid generic AI aesthetics" |
| `subagent-driven-development` | superpowers (installed) | Parallel chapter implementation within each act |
| `test-driven-development` | superpowers (installed) | `src/metrics.js` against the reference-cases table |
| `verification-before-completion` | superpowers (installed) | Pre-merge gate |
| `using-git-worktrees` | superpowers (installed) | Isolated workspace per act |

Install commands captured in `PROJECT.md § Phase 0`.

### 5.3 Skills considered and rejected

- **NOAA Full MCP / Weather MCP** — a 50-line Python script that hits `api.weather.gov` and NCEI directly is auditable, doesn't add a runtime dependency, and runs without Claude Code. The MCP would only help me at authoring time.
- **`consultant` (doodledood)** — multi-provider LLM consultations violates the "Anthropic tooling only" constraint that is load-bearing for the devrel comparison.
- **`hookify`** — YAGNI at this size.
- **`prompt-engineering`** — no prompt-driven runtime feature.
- **`mcp-server-dev` / `plugin-dev` / `skill-creator`** — not authoring a plugin in this project. If a clean reusable pattern emerges, spin it out after shipping.

### 5.4 Available without install

- `context7` MCP — current docs for formula references, IntersectionObserver patterns
- `serena` MCP — symbol-level navigation
- `claude-in-chrome` MCP — Pi-side Chrome automation for viewport regression + the Ch 7 live-NWS happy-path test

## 6. Chapter outline (the spine)

Each chapter has a **body** (general audience), a **visual hero**, and where it serves the practitioner thread, a **side dispatch** sidebar.

### 6.1 Visual through-line

A thin **three-number strip** at the top of the viewport, always visible, showing the current air temp / heat index / WBGT. For Act I, two of the three are dashed-out while the chapter you're reading "fills in" its own number. From Ch 4 onward all three are live, tied to the currently-selected scenario or sandbox state. The strip is the page's identity.

### 6.2 Act I — Anatomy (Ch 0–3)

**Ch 0 — "The three numbers."** Hero one-screen card: the three numbers in oversized type (`95 °F / 105 °F / 82 °F`). One sentence under each ("what your thermometer says / what it feels like / what your body has to do"). Disclaimer block ("not a clinical tool; not a substitute for OSHA-cited measurements").

**Ch 1 — "What the wall thermometer tells you" (air temperature).**
- *Visual hero:* diagrammed Stevenson screen (1864 standard louvered enclosure), annotated with arrows pointing to *what isn't measured* — humidity, sun, wind, exertion.
- *Body:* what an air-temp reading is, why siting matters (5 ft above ground, shaded, ventilated, away from radiant surfaces), why two thermometers 50 ft apart can disagree by 10 °F.
- *Side dispatch:* OSHA does not specify raw air-temperature thresholds in the Heat Rule; HI ≥80 °F is the trigger.

**Ch 2 — "What it feels like" (heat index).**
- *Visual hero:* recreated NWS heat-index nomogram (air-temp × RH → HI), annotated to show how 95 °F at 30% RH = HI 89 °F vs 95 °F at 75% RH = HI 124 °F.
- *Body:* Steadman 1979 apparent temperature, Rothfusz 1990 polynomial that became the NWS implementation. What it adds: humidity. What it doesn't see: sun, wind, exertion, clothing.
- *Side dispatch:* OSHA Heat NEP "heat priority day" at NWS HI ≥80 °F (CPL 03-00-024-0 Renewed 2026-04-10). Federal NPRM (comments closed 2025-10-30) keys "initial heat trigger" to HI 80 °F.

**Ch 3 — "What it does to a working body" (WBGT).**
- *Visual hero:* three-thermometer rig diagram (Tnwb, Tg, Td) with outdoor formula `WBGT = 0.7·Tnwb + 0.2·Tg + 0.1·Td` annotated; hover/tap each thermometer for what it senses.
- *Body:* Yaglou & Minard 1957, Parris Island Marine training-deaths study. What it adds: sun (black globe), wind (natural wet bulb), radiant load. What it doesn't see: clothing, acclimatization, work intensity (those go in the adjusted NIOSH/ACGIH tables).
- *Side dispatch:* ACGIH TLVs use WBGT × work-intensity for recommended work/rest ratios; NIOSH 2016-106 §6 has the canonical tables.

### 6.3 Act II — Divergence (Ch 4–6)

**Ch 4 — "Same day, three numbers" (the scenario flipper).**
- *Centerpiece:* `playground`-shaped widget — scenario chips, big three-number readout, decision row ("at this WBGT, OSHA-recommended work/rest for heavy work is 15 min work / 45 min rest"), citation links.
- *Scenarios:* Phoenix Aug 12pm full sun; Houston Aug 6am humid dawn; Yuma field crew 2pm full sun; indoor warehouse 3pm no ventilation; Lytton BC 2021 5pm heat dome.
- *Body:* the dramatic chapter — for each scenario, two metrics agree but the third disagrees, and that disagreement is the decision-driving fact.
- *Side dispatch:* the indoor warehouse case is the most expensive to get wrong — air thermometer says 85 °F comfortable, HI agrees, WBGT is 88 °F with no air movement → over NIOSH moderate-work threshold.

**Ch 5 — "The divergence map."**
- *Visual hero:* SVG 2D plot — air-temp on x, RH on y, three overlaid colored regions showing where each metric issues its strongest warning. Hover/tap a point for the three numbers + OSHA/NIOSH action. Solar/wind held at typical-outdoor defaults; toggle to indoor.
- *Body:* where the metrics agree (most temperate conditions), where they diverge (upper-right humid; lower-right dry-but-sunny; cool-but-radiant-load indoor). "Feels like" is the wrong question when the question is "is my body shedding heat fast enough."

**Ch 6 — "Where each metric fails."**
- *Visual hero:* three side-by-side callout cards in the three ink colors. *Air temp blind to:* humidity, sun, wind, exertion. *Heat index blind to:* sun, wind, clothing, exertion. *WBGT blind to:* clothing, acclimatization, individual physiology, work intensity.
- *Body:* honest accounting. Each metric was built to answer a specific question. None was built to be a universal "is this worker safe right now" oracle.

### 6.4 Act III — Application (Ch 7–8)

**Ch 7 — "Try it" (sandbox + live NWS, one chapter, two modes).**
- *Centerpiece:* unified `playground`-shaped widget with a mode toggle. **Manual mode:** four range sliders (air temp, RH, wind, sun) → three live numbers. **My location mode:** ZIP/lat-lng input → `api.weather.gov` two-step fetch → fills three numbers + 6-hour mini-chart.
- *Body:* what are the three numbers *right now where you are reading this*? What action does each suggest?
- *Side dispatch:* your inspector's reading at your jobsite will not match this — NWS observations are sited per WMO standard; jobsite WBGT measured per ACGIH may differ several degrees. The site reading is what counts for compliance.

**Ch 8 — "How professionals use these" (practitioner chapter).**
- *Visual hero:* clean reproduction of NIOSH 2016-106 §6 WBGT × work-intensity table + OSHA Heat NEP App-J citation-language excerpts.
- *Body:* the practitioner thread surfaced. Wall thermometer is the worst of the three for any decision that matters. HI triggers heat-priority days under the NEP. WBGT supports specific work/rest orders at specific jobsites. Citation defense without WBGT measurements is structurally weaker.
- *Side dispatch:* this is where I work on this — HeatCompass is a B2B tool doing the WBGT computation and citation-trail. One paragraph. No CTA gate.

### 6.5 Closing footer (not a chapter)

References, devrel post link, "lab, not advice" disclaimer repeated, data-source manifest, persistent C↔F toggle.

## 7. Data model

### 7.1 File layout

```
data/
  scenarios/
    phoenix-aug-12pm.json
    houston-aug-6am-humid.json
    yuma-field-2pm.json
    indoor-warehouse-3pm.json
    lytton-bc-2021-5pm.json
  divergence/
    grid-outdoor.json
    grid-indoor.json
  references/
    reference-cases.json     # 12-case drift-gate table
    osha-nep.json
    niosh-2016-106.json
    rothfusz-1990.json
    steadman-1979.json
    yaglou-minard-1957.json
    acgih-tlv.json
    fed-nprm-2024.json
  diagrams/
    stevenson-screen.svg
    heat-index-nomogram.svg
    three-thermometer-rig.svg
    divergence-map.svg
    work-rest-table.svg
```

### 7.2 Scenario schema

```json
{
  "id": "phoenix-aug-12pm",
  "label": "Phoenix, AZ — Aug 2024, 12:00 local, full sun",
  "location": { "name": "Phoenix, AZ", "lat": 33.45, "lng": -112.07 },
  "ts_utc": "2024-08-12T19:00:00Z",
  "inputs":  { "air_temp_c": 42.2, "rh_pct": 18, "wind_mph": 4, "solar_w_m2": 870, "cloud_pct": 5 },
  "derived": { "hi_c": 41.7, "wbgt_c": 31.8 },
  "decision_hooks": {
    "niosh_work_rest_heavy": "15-min work / 45-min rest",
    "osha_nep_priority_day": true
  },
  "source": { "url": "https://...", "accessed_at": "2026-05-27", "method": "NCEI LCD" }
}
```

### 7.3 Citation sources

- Ch 1: Stevenson 1864; WMO CIMO Guide (Guide to Meteorological Instruments and Methods of Observation, WMO-No. 8)
- Ch 2: Rothfusz 1990 NWS Tech Memo SR-90; Steadman 1979 J Appl Meteorol
- Ch 3: Yaglou & Minard 1957 AMA Arch Indust Health; ISO 7243; NIOSH 2016-106 §6
- Ch 4–5: NOAA NCEI Local Climatological Data API; Liljegren 2008
- Ch 7 live mode: `api.weather.gov` (two-step gridpoint resolution)
- Ch 8: OSHA CPL 03-00-024-0 (Heat NEP, renewed 2026-04-10); Federal NPRM 86 FR 59309 (comments closed 2025-10-30, still pending as of 2026-05-27); NIOSH 2016-106 §6; ACGIH 2025 TLV

## 8. Components, motion, accessibility

### 8.1 Components

Each component is a self-contained ES module under `src/components/`.

| Component | Where | What it does |
|---|---|---|
| `three-number-strip` | persistent top | Renders air / HI / WBGT; dashed-out until claimed by scroll; reads `appState.currentReadings` |
| `chapter-observer` | global | IntersectionObserver wiring; sets `appState.currentReadings` from `data-readings` on each `<section>` |
| `temp-toggle` | persistent footer | C/F switch; persists to `localStorage['hml-unit']`; fires `temp-unit-changed` |
| `temp-text` | inline | Auto-wraps `°C` literals; listens for unit change; lifts ~80 lines from heat-protein-lab `src/main.js` |
| `citation-chip` | inline | Footnote link with hover tooltip showing source + accessed date |
| `scenario-flipper` | Ch 4 | Playground-pattern widget |
| `divergence-map` | Ch 5 | SVG 2D plot reading `grid-outdoor.json` / `grid-indoor.json`; hover/tap → readout |
| `blind-spot-cards` | Ch 6 | Static three-card grid |
| `sandbox-calculator` | Ch 7 manual | Four sliders + three live numbers; calls `src/metrics.js` |
| `live-nws-panel` | Ch 7 location | ZIP/lat-lng → `api.weather.gov` two-step → three numbers + 6-hour mini-chart |
| `work-rest-table` | Ch 8 | Static SVG built from NIOSH §6 |

### 8.2 Motion

- Native CSS Scroll-Driven Animations (`animation-timeline: view()`) where supported; IntersectionObserver-driven `.is-active` class fallback elsewhere
- `prefers-reduced-motion: reduce` → all scroll-driven and time-driven animations replaced with static end-state rendering
- Section transitions = crossfades, not slides
- The three-number-strip's number-fill animation is the load-bearing motion moment; everything else is quiet

### 8.3 Accessibility budget

- Body text contrast ≥7:1 (`--ink` on `--paper`); secondary ≥4.5:1
- All chapters `min-height: 100dvh`
- All touch targets ≥44×44 px
- `aria-live="polite"` on three-number strip and sandbox readout
- Keyboard: tab through chips/sliders/inputs, arrow keys to flip scenarios, `Enter` confirms ZIP entry
- Screen-reader: single `<h2>` per chapter; citations are real `<a>` with `aria-describedby`; SVGs have `<title>` + `<desc>`
- Viewport regression via `claude-in-chrome` at end of each act: 360×640, 768, 1280

## 9. Repo, brand, deploy

### 9.1 Repo

- `github.com/craigm26/heat-metrics-lab`
- Private until v1 polish lands, then public (heat-protein-lab pattern)
- License MIT

### 9.2 Brand

Inherits the surveyor's-notebook aesthetic from heat-protein-lab — cream paper, serif body, marginalia, citation chips — but with its own palette that does load-bearing work in Act II.

Three metric ink colors, threaded through every chapter once introduced:

| Metric | Ink | Hex | Mood |
|---|---|---|---|
| Air temperature | slate blue | `#3F5160` | cool, instrumental |
| Heat index | umber/copper | `#A45A2A` | warmer, perceptual |
| WBGT | oxblood | `#702424` | hottest, physiological |

Typography stack matches heat-protein-lab (GT Sectra Display / Spectral / Charter / Georgia for serif, IBM Plex Mono / JetBrains Mono for numbers, Inter / system-ui for chrome). All self-hosted.

- **Favicon:** three thin thermometer marks in the three ink colors, on cream
- **OG image:** three big numbers `95 °F / 105 °F / 82 °F` with `"three metrics. one heat day. three different decisions."` in display serif

### 9.3 Deploy

- Cloudflare Pages, auto-deploy on push to `main`
- `_headers` carried from heat-protein-lab (security + cache + SRI)
- Primary URL: `https://heat-metrics-lab.pages.dev/`
- No custom domain in v1

### 9.4 File layout

```
heat-metrics-lab/
  index.html
  src/
    main.js
    metrics.js
    metrics.test.js
    styles.css
    components/*.js
  data/         # all built artifacts, committed
  scripts/      # uv-run python
  notes/        # devrel scratch
  posts/        # blog-mirror of devrel post
  docs/
    superpowers/
      specs/
        2026-05-27-heat-metrics-lab-design.md   ← this file
  AGENTS.md
  CLAUDE.md
  DESIGN.md
  DEVREL.md
  PROJECT.md
  README.md
  references.md
  LICENSE
  _headers
  favicon.svg
  og.svg
  .github/workflows/
```

## 10. Hard constraints

Each fails CI if violated.

- JS formulas match Python within 0.5 °F across the 12 reference cases in `data/references/reference-cases.json`
- All `°C` literals in body copy go through `temp-text` auto-wrap so the C/F toggle catches them (lint script: regex scan + allowlist for legitimate exemptions)
- No external network requests at page load (live NWS fires only on user action in Ch 7)
- No font/style/script from a Google host (visual-grep against the built `index.html`)
- `prefers-reduced-motion: reduce` cuts every animation to a static end-state (manual checklist on each component PR)
- Contrast ≥4.5:1 everywhere; ≥7:1 for body text

## 11. Testing layers

1. **Unit (`metrics.js`).** TDD against `data/references/reference-cases.json`. Custom runner, no framework. Pattern from heat-protein-lab.
2. **Drift gate.** `scripts/05_drift_check.py` runs JS + Python against the reference table; CI job; hard gate.
3. **Visual regression.** `claude-in-chrome` at end of each act — capture at 360 / 768 / 1280, diff against committed baseline. Soft gate.
4. **Live NWS happy path.** End-to-end in `claude-in-chrome` — enter ZIP `85003` (Phoenix), confirm the three numbers populate and the chart renders. Hard gate.
5. **A11y spot check.** Keyboard-only walkthrough + screen-reader spot check on Ch 4 and Ch 7. Soft gate.
6. **DevRel measurement.** Final `session-report` run against the heat-metrics-lab build window, side-by-side with the heat-protein-lab window. Output joins `DEVREL.md`.

## 12. DevRel layer (the A/B comparison)

### 12.1 What `DEVREL.md` records

A running log, updated as each phase ships:

- which skill / MCP was invoked when, what it produced
- where Claude Code felt great (e.g. `subagent-driven-development` for parallel chapter implementation, `verification-before-completion` before merges, `playground` skill scaffolding the centerpieces)
- where Claude Code felt worse than the Google side (the honest column)
- token spend by chapter, by skill, by subagent (from `session-report`)
- a final A/B table with concrete rows: data-fetch DX, design generation, scrollytelling mechanics, citation discipline, visual generation, scroll-animation tuning, deploy

### 12.2 The comparison post

Drafted at v1, mirrored at `posts/` (heat-protein-lab pattern), canonical on craigmerry.com. Honest about both the wins and the things the Google side did better — that's the whole point of running the A/B in good faith.

### 12.3 Comparison axes (skeleton — "Finding" cells filled post-build, not blocking)

| Axis | Google side (heat-protein-lab) | Anthropic side (heat-metrics-lab) | Finding |
|---|---|---|---|
| IDE | Antigravity 2.0 | Claude Code | _post-build_ |
| Design generation | Stitch MCP | `frontend-design` + `playground` | _post-build_ |
| Scrollytelling mechanics | hand-rolled in Antigravity | `scrollytelling` skill (doodledood) | _post-build_ |
| Scientific data fetch | Science Skills (PDB/HPA/ClinVar/Reactome) | Python scripts hitting NOAA/NWS directly | _post-build_ |
| Citation discipline | manual | `frontend-design` + manual | _post-build_ |
| Visual figure generation | matplotlib + Stitch | matplotlib + `frontend-design` | _post-build_ |
| Build-time measurement | none | `session-report` | _post-build_ |
| Deploy | Cloudflare Pages | Cloudflare Pages | match (intentional control) |

## 13. Open deferrals (acknowledged, not blocking)

- **Custom domain.** Deferred to v1.1. Likely `metrics.heatcompass.com` or kept on `.pages.dev`. Not blocking.
- **Spanish translation.** v2. The heat-protein-lab precedent stayed English-only at v1; we follow.
- **NOAA NCEI rate-limit fallback.** If the historical API is rate-limited at build time, the spec allows hand-curated values from published case studies as a fallback. The scenario JSON's `source.method` field records which path was taken.
- **`writing` skill (doodledood) adoption.** Mild yes in §5; install only if early drafts drift from the heat-protein-lab voice. Not blocking.
- **`claude-md-improver` and `claude-automation-recommender`.** Run once near build-end if useful. Not blocking.
