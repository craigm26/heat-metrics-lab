# heat-metrics-lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public single-page scrollytelling explainer at `https://heat-metrics-lab.pages.dev/` that walks readers through the difference between air temperature, heat index, and WBGT — and simultaneously serves as a devrel A/B against the Google-tooling-built sister project [heat-protein-lab](https://github.com/craigm26/heat-protein-lab).

**Architecture:** Vanilla HTML + CSS + ES modules, no framework, no bundler. Build-time Python data pipeline writes JSON + SVG into a committed `data/` tree. Client-side `src/metrics.js` re-implements Rothfusz 1990 Heat Index and Liljegren-simplified WBGT, validated against the Python implementation via a 0.5 °F CI drift gate. 9 chapters (Ch 0–8) across 3 acts. Cloudflare Pages auto-deploy from `main`.

**Tech Stack:**
- Frontend: vanilla HTML/CSS/JS, ES modules, IntersectionObserver, native CSS Scroll-Driven Animations
- Build-time: Python 3.11+ via `uv`, matplotlib for SVG diagrams
- Runtime data: `api.weather.gov` (no key, CORS-friendly)
- Hosting: Cloudflare Pages
- CI: GitHub Actions (lint, drift gate, deploy)
- Skills installed for the build: `playground`, `scrollytelling`, `session-report`, `frontend-design`, plus the superpowers family

**Dependency graph (for parallel-subagent dispatch):**
```
Phase 0 ──> Phase 1 ─┐
              │       ├──> Phase 3 ┐
              ▼       │             │
            Phase 2 ──┤──> Phase 4 ─┼──> Phase 6
                      │             │
                      └──> Phase 5 ─┘
```

Phases 3, 4, 5 can each be implemented in a separate worktree by parallel subagents once Phases 0–2 land. Phase 6 sequences after all three.

---

## Phase 0 — Bootstrap

Set up the repo, install the skill stack, write the foundational config and docs, get an empty page deploying to Cloudflare Pages.

### Task 0.1: Confirm worktree convention

**Files:** none (operational)

- [ ] **Step 1:** If this implementation happens in a worktree, ensure it lives under `~/.config/superpowers/worktrees/heat-metrics-lab/` per the operator's convention (memory: `feedback_worktrees_under_superpowers_path`). If running directly in `~/heat-metrics-lab/`, skip.

- [ ] **Step 2:** Confirm git identity for commits:
  ```bash
  cd ~/heat-metrics-lab
  git config user.email | grep -q '@' || git config --local user.email craigm26@gmail.com
  git config user.name  | grep -q . || git config --local user.name 'Craig Merry'
  ```

### Task 0.2: Install required plugins

**Files:** none (skill installation)

- [ ] **Step 1:** Install the `scrollytelling` skill from the doodledood marketplace:
  ```bash
  /plugin marketplace add doodledood/claude-code-plugins
  /plugin install scrollytelling@doodledood
  ```

- [ ] **Step 2:** Enable the Anthropic-official `playground` and `session-report` plugins (already cached locally):
  ```bash
  /plugin install playground@claude-plugins-official
  /plugin install session-report@claude-plugins-official
  ```

- [ ] **Step 3:** Verify with `/plugin list`. Expected: `scrollytelling`, `playground`, `session-report`, plus the already-installed `superpowers`, `frontend-design`, `context7`, `serena`, `feature-dev`, `ralph-loop`.

- [ ] **Step 4:** Restart Claude Code if the skills don't show up via `Skill` tool — plugin installs require a session reload.

### Task 0.3: Scaffold the directory tree

**Files:** create the directory skeleton

- [ ] **Step 1:** Create the canonical directory tree:
  ```bash
  cd ~/heat-metrics-lab
  mkdir -p src/components data/{scenarios,divergence,references,diagrams} \
           scripts notes posts .github/workflows
  ```

- [ ] **Step 2:** Verify:
  ```bash
  find . -type d -not -path './.git*' | sort
  ```
  Expected output includes: `./data/diagrams`, `./data/divergence`, `./data/references`, `./data/scenarios`, `./posts`, `./scripts`, `./src/components`.

### Task 0.4: Write `.gitignore` and `LICENSE`

**Files:**
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1:** Write `.gitignore`:
  ```
  # OS
  .DS_Store
  Thumbs.db

  # Editors
  .vscode/
  .idea/
  *.swp

  # Python
  __pycache__/
  *.py[cod]
  .venv/
  .uv-cache/

  # Node
  node_modules/

  # Build artifacts that should NOT be committed
  # (NOTE: data/ IS committed — that's the whole point)
  dist/
  *.log

  # Anti-Antigravity-key-leak (memory rule)
  scripts/mcp_client*.py
  scripts/generate_*.py
  scripts/*_client.py
  ```

- [ ] **Step 2:** Write `LICENSE` (MIT, year 2026, attribution to Craig Merry).

- [ ] **Step 3:** Commit:
  ```bash
  git add .gitignore LICENSE
  git commit -m "chore: gitignore + MIT LICENSE"
  ```

### Task 0.5: Write `README.md` (v1 stub)

**Files:** Create: `README.md`

- [ ] **Step 1:** Write a short README modeled on heat-protein-lab's. Sections: pitch (3-4 sentences naming both threads — subject + devrel A/B), chapter list with the 9 titles, "How this is built" pointing at the spec + plan + DEVREL.md, hard constraints, live URL placeholder, license.

- [ ] **Step 2:** Commit:
  ```bash
  git add README.md
  git commit -m "docs: README v1 stub"
  ```

### Task 0.6: Write `PROJECT.md`, `DESIGN.md`, `DEVREL.md`, `AGENTS.md`, `CLAUDE.md` stubs

**Files:**
- Create: `PROJECT.md`, `DESIGN.md`, `DEVREL.md`, `AGENTS.md`, `CLAUDE.md`

- [ ] **Step 1:** `PROJECT.md` — mirror this implementation plan's phase headers; one line per phase pointing back at this plan file.

- [ ] **Step 2:** `DESIGN.md` — visual design system stub. Cover principles (1: the data is the design; 2: three colors carry the metric semantics; 3: surveyor's notebook aesthetic inherited from sibling; 4: every claim cited; 5: viz ≠ recommendation; 6: mobile-first; 7: reduced-motion honored). Token tables (color, typography, spacing) — duplicate from spec §9.

- [ ] **Step 3:** `DEVREL.md` — empty A/B log with the comparison-axes table from spec §12.3. Will be filled in as the build progresses.

- [ ] **Step 4:** `AGENTS.md` — IDE context for Claude Code: where the spec/plan live, which skills to invoke when, the hard constraints from spec §10.

- [ ] **Step 5:** `CLAUDE.md` — same content as `AGENTS.md` for now. Both files reference the same context; we keep them in sync via a single source if a `claude-md-improver` workflow is set up later.

- [ ] **Step 6:** Commit:
  ```bash
  git add PROJECT.md DESIGN.md DEVREL.md AGENTS.md CLAUDE.md
  git commit -m "docs: project + design + devrel + agent context stubs"
  ```

### Task 0.7: Write `_headers` (Cloudflare Pages security + cache)

**Files:** Create: `_headers`

- [ ] **Step 1:** Copy and adapt from heat-protein-lab's `_headers`:
  ```
  /*
    X-Frame-Options: DENY
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
    Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self' https://api.weather.gov; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'

  /src/*
    Cache-Control: public, max-age=3600, must-revalidate

  /data/*
    Cache-Control: public, max-age=86400, must-revalidate

  /*.svg
    Cache-Control: public, max-age=86400
  ```

- [ ] **Step 2:** Commit:
  ```bash
  git add _headers
  git commit -m "chore: _headers — CSP with api.weather.gov in connect-src, cache rules"
  ```

### Task 0.8: Write the placeholder `index.html`

**Files:** Create: `index.html`

- [ ] **Step 1:** Write a minimal `<!DOCTYPE html>` that establishes the page identity but renders nothing real yet:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>heat-metrics-lab — air temperature, heat index, WBGT</title>
    <meta name="description" content="Three metrics. One heat day. Three different decisions. A scrollytelling explainer of air temperature, heat index, and wet-bulb globe temperature.">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="stylesheet" href="/src/styles.css">
    <meta property="og:title" content="heat-metrics-lab">
    <meta property="og:description" content="Three metrics. One heat day. Three different decisions.">
    <meta property="og:image" content="/og.svg">
    <meta property="og:url" content="https://heat-metrics-lab.pages.dev/">
    <meta name="twitter:card" content="summary_large_image">
  </head>
  <body>
    <main>
      <section class="chapter chapter--hero" data-chapter="0">
        <div class="chapter__inner">
          <h1>heat-metrics-lab</h1>
          <p>Under construction — see <a href="/docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md">design spec</a>.</p>
        </div>
      </section>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2:** Write a minimal `src/styles.css` with token declarations only:
  ```css
  :root {
    --paper: #F5EFDF;
    --ink: #1B1B1B;
    --ink-soft: #3D3A33;
    --air: #3F5160;
    --heat-index: #A45A2A;
    --wbgt: #702424;
    --font-display: "GT Sectra Display", "Spectral", serif;
    --font-body: "Spectral", "Charter", "Georgia", serif;
    --font-mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace;
    --font-ui: "Inter", system-ui, sans-serif;
  }
  html, body { margin: 0; background: var(--paper); color: var(--ink); font-family: var(--font-body); }
  .chapter { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
  .chapter h1 { font-family: var(--font-display); font-size: clamp(2.5rem, 8vw, 5rem); margin: 0; }
  a { color: var(--wbgt); }
  ```

- [ ] **Step 3:** Write a minimal `src/main.js` that exports a placeholder:
  ```javascript
  // heat-metrics-lab — entry point.
  // Real wiring lands in Phase 2.
  console.info("heat-metrics-lab boot — phase 0 stub");
  ```

- [ ] **Step 4:** Commit:
  ```bash
  git add index.html src/styles.css src/main.js
  git commit -m "feat: phase-0 placeholder index.html + tokens"
  ```

### Task 0.9: Create the GitHub repo and push

**Files:** none (git operation)

- [ ] **Step 1:** Confirm with the operator that the repo `craigm26/heat-metrics-lab` should be created. Do NOT push without confirmation.

- [ ] **Step 2:** With confirmation, create the GitHub repo (private to start):
  ```bash
  gh repo create craigm26/heat-metrics-lab --private --source ~/heat-metrics-lab --remote origin --description "Three metrics. One heat day. Three different decisions. — sibling devrel A/B to heat-protein-lab"
  ```

- [ ] **Step 3:** Push:
  ```bash
  cd ~/heat-metrics-lab
  git push -u origin master
  ```

- [ ] **Step 4:** Confirm the repo is visible:
  ```bash
  gh repo view craigm26/heat-metrics-lab --web
  ```

### Task 0.10: Wire Cloudflare Pages

**Files:** Create: `.github/workflows/deploy.yml`

- [ ] **Step 1:** Confirm with the operator that they want Cloudflare Pages auto-deploy wired now (vs. after Phase 2 when there's more to look at). Default: yes, wire it.

- [ ] **Step 2:** Write `.github/workflows/deploy.yml` modeled on heat-protein-lab's:
  ```yaml
  name: Deploy to Cloudflare Pages
  on:
    push:
      branches: [master]
    workflow_dispatch:
  jobs:
    deploy:
      runs-on: ubuntu-latest
      permissions:
        contents: read
        deployments: write
      steps:
        - uses: actions/checkout@v4
        - name: Deploy to Cloudflare Pages
          uses: cloudflare/wrangler-action@v4
          with:
            apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
            accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
            command: pages deploy . --project-name=heat-metrics-lab --branch=master
  ```

- [ ] **Step 3:** Operator-side: create the Cloudflare Pages project (one-time, GUI or `wrangler pages project create heat-metrics-lab`). Add the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets via `gh secret set`.

- [ ] **Step 4:** Commit and push to trigger first deploy:
  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "ci: Cloudflare Pages deploy workflow"
  git push
  ```

- [ ] **Step 5:** Visit `https://heat-metrics-lab.pages.dev/` and confirm the Phase-0 stub renders. Capture the URL for `README.md`.

---

## Phase 1 — Formulas + Drift Gate (TDD)

Implement Heat Index and WBGT in both JS and Python. Lock in the 0.5 °F drift gate before any chapter writes against the formulas.

### Task 1.1: Author the reference-cases table

**Files:** Create: `data/references/reference-cases.json`

- [ ] **Step 1:** Write a JSON file with 12 reference cases drawn from NWS Tech Memo SR-90 (Rothfusz 1990) and NIOSH 2016-106 §6. Each case has known inputs and expected outputs to 1 decimal place. Example structure:
  ```json
  {
    "version": "1.0",
    "tolerance_f": 0.5,
    "cases": [
      {
        "id": "rothfusz-table-1-row-1",
        "label": "T=80F RH=40%",
        "source": "NWS Tech Memo SR-90, Table 1",
        "inputs": { "air_temp_c": 26.67, "rh_pct": 40, "wind_mph": 4, "solar_w_m2": 0 },
        "expected": { "hi_c": 26.39, "wbgt_indoor_c": 19.4 }
      },
      { "id": "rothfusz-90-70", "label": "T=90F RH=70%", "source": "NWS SR-90 Table 1", "inputs": { "air_temp_c": 32.22, "rh_pct": 70, "wind_mph": 4, "solar_w_m2": 0 }, "expected": { "hi_c": 41.67, "wbgt_indoor_c": 28.1 } },
      { "id": "rothfusz-100-50", "label": "T=100F RH=50%", "source": "NWS SR-90 Table 1", "inputs": { "air_temp_c": 37.78, "rh_pct": 50, "wind_mph": 4, "solar_w_m2": 0 }, "expected": { "hi_c": 52.78, "wbgt_indoor_c": 30.5 } },
      { "id": "rothfusz-low-rh-80", "label": "T=80F RH=10% (low-RH branch)", "source": "Rothfusz adjustment region", "inputs": { "air_temp_c": 26.67, "rh_pct": 10, "wind_mph": 4, "solar_w_m2": 0 }, "expected": { "hi_c": 26.39, "wbgt_indoor_c": 17.8 } },
      { "id": "rothfusz-high-rh-90", "label": "T=90F RH=95% (high-RH branch)", "source": "Rothfusz adjustment region", "inputs": { "air_temp_c": 32.22, "rh_pct": 95, "wind_mph": 4, "solar_w_m2": 0 }, "expected": { "hi_c": 53.33, "wbgt_indoor_c": 30.0 } },
      { "id": "rothfusz-shade-edge", "label": "T=79F RH=50% (below Rothfusz threshold)", "source": "Rothfusz: simple formula below 80F", "inputs": { "air_temp_c": 26.11, "rh_pct": 50, "wind_mph": 4, "solar_w_m2": 0 }, "expected": { "hi_c": 26.11, "wbgt_indoor_c": 19.3 } },
      { "id": "niosh-table-wbgt-30", "label": "WBGT 30C heavy work", "source": "NIOSH 2016-106 Section 6, Table 6-1", "inputs": { "air_temp_c": 36.0, "rh_pct": 50, "wind_mph": 2, "solar_w_m2": 700 }, "expected": { "hi_c": 50.8, "wbgt_outdoor_c": 30.0 } },
      { "id": "niosh-wbgt-25-moderate", "label": "WBGT 25C moderate", "source": "NIOSH 2016-106 Section 6", "inputs": { "air_temp_c": 30.0, "rh_pct": 50, "wind_mph": 3, "solar_w_m2": 500 }, "expected": { "hi_c": 31.1, "wbgt_outdoor_c": 25.0 } },
      { "id": "liljegren-shade", "label": "WBGT shade (no solar)", "source": "Liljegren 2008 simplified", "inputs": { "air_temp_c": 32.0, "rh_pct": 60, "wind_mph": 5, "solar_w_m2": 0 }, "expected": { "hi_c": 38.9, "wbgt_outdoor_c": 26.5 } },
      { "id": "liljegren-full-sun", "label": "WBGT full sun", "source": "Liljegren 2008 simplified", "inputs": { "air_temp_c": 32.0, "rh_pct": 60, "wind_mph": 5, "solar_w_m2": 900 }, "expected": { "hi_c": 38.9, "wbgt_outdoor_c": 30.8 } },
      { "id": "psychrometric-indoor-warehouse", "label": "Indoor warehouse no wind", "source": "ACGIH TLV documentation", "inputs": { "air_temp_c": 29.4, "rh_pct": 65, "wind_mph": 0, "solar_w_m2": 0 }, "expected": { "hi_c": 31.7, "wbgt_indoor_c": 25.6 } },
      { "id": "lytton-2021-extreme", "label": "Lytton BC 2021 heat dome peak", "source": "ECCC observations + Liljegren", "inputs": { "air_temp_c": 49.6, "rh_pct": 12, "wind_mph": 6, "solar_w_m2": 950 }, "expected": { "hi_c": 47.2, "wbgt_outdoor_c": 32.0 } }
    ]
  }
  ```

  Note: actual `expected` values must be looked up from primary sources before commit. The numbers above are illustrative; replace each with the source-table value. If a source value disagrees with both JS and Python implementations consistently, document the discrepancy in the case's `notes` field rather than silently adjusting.

- [ ] **Step 2:** Commit:
  ```bash
  git add data/references/reference-cases.json
  git commit -m "data: 12-case reference table (Rothfusz + Liljegren + NIOSH)"
  ```

### Task 1.2: Write the failing JS metrics tests

**Files:** Create: `src/metrics.test.js`

- [ ] **Step 1:** Write a tiny test runner inline (no framework dependency, like heat-protein-lab's pattern). Test file:
  ```javascript
  // src/metrics.test.js — runs in node 20+ with native ESM
  import { heatIndexC, wbgtIndoorC, wbgtOutdoorC } from "./metrics.js";
  import { readFileSync } from "node:fs";

  const cases = JSON.parse(readFileSync(new URL("../data/references/reference-cases.json", import.meta.url)));
  const tol = cases.tolerance_f;
  const TOL_C = tol / 1.8;

  let pass = 0, fail = 0;
  for (const c of cases.cases) {
    const { air_temp_c, rh_pct, wind_mph, solar_w_m2 } = c.inputs;
    const hi = heatIndexC(air_temp_c, rh_pct);
    const wbi = wbgtIndoorC(air_temp_c, rh_pct);
    const wbo = wbgtOutdoorC(air_temp_c, rh_pct, wind_mph, solar_w_m2);
    const checks = [];
    if ("hi_c" in c.expected) checks.push(["hi_c", hi, c.expected.hi_c]);
    if ("wbgt_indoor_c" in c.expected) checks.push(["wbgt_indoor_c", wbi, c.expected.wbgt_indoor_c]);
    if ("wbgt_outdoor_c" in c.expected) checks.push(["wbgt_outdoor_c", wbo, c.expected.wbgt_outdoor_c]);
    for (const [name, got, want] of checks) {
      const ok = Math.abs(got - want) <= TOL_C;
      if (ok) pass++;
      else { fail++; console.error(`FAIL ${c.id} ${name}: got ${got.toFixed(2)}, want ${want.toFixed(2)} (Δ ${(got - want).toFixed(2)} > ${TOL_C.toFixed(2)})`); }
    }
  }
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
  ```

- [ ] **Step 2:** Run to confirm it fails (no implementation yet):
  ```bash
  cd ~/heat-metrics-lab
  node src/metrics.test.js
  ```
  Expected: `Cannot find module '...metrics.js'` or equivalent import error.

### Task 1.3: Implement `heatIndexC` to make the HI tests pass

**Files:** Create: `src/metrics.js`

- [ ] **Step 1:** Write the Rothfusz 1990 Heat Index in JS. The full piecewise formula per NWS Tech Memo SR-90:
  ```javascript
  // src/metrics.js — pure functions, ESM, no dependencies.

  // Rothfusz 1990 (NWS Tech Memo SR-90).
  // Inputs: air_temp_c (°C), rh_pct (0-100).
  // Returns: heat index in °C.
  export function heatIndexC(air_temp_c, rh_pct) {
    const T = air_temp_c * 9 / 5 + 32; // convert to °F for the polynomial
    const R = rh_pct;
    // Simple formula for "feels like" when below ~80 °F
    const simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));
    const avg = (simple + T) / 2;
    if (avg < 80) return (simple - 32) * 5 / 9;
    // Full Rothfusz regression
    let HI =
      -42.379
      + 2.04901523 * T
      + 10.14333127 * R
      - 0.22475541 * T * R
      - 0.00683783 * T * T
      - 0.05481717 * R * R
      + 0.00122874 * T * T * R
      + 0.00085282 * T * R * R
      - 0.00000199 * T * T * R * R;
    // Low-RH adjustment (RH < 13 and 80 <= T <= 112)
    if (R < 13 && T >= 80 && T <= 112) {
      HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    }
    // High-RH adjustment (RH > 85 and 80 <= T <= 87)
    if (R > 85 && T >= 80 && T <= 87) {
      HI += ((R - 85) / 10) * ((87 - T) / 5);
    }
    return (HI - 32) * 5 / 9;
  }
  ```

- [ ] **Step 2:** Add stub exports for the two WBGT functions so the test file's imports resolve (they'll return NaN until Tasks 1.4 / 1.5):
  ```javascript
  export function wbgtIndoorC(_t, _rh) { return NaN; }
  export function wbgtOutdoorC(_t, _rh, _w, _s) { return NaN; }
  ```

- [ ] **Step 3:** Run the tests. Expected: HI cases pass, WBGT cases fail (NaN ≠ expected).
  ```bash
  node src/metrics.test.js
  ```

### Task 1.4: Implement `wbgtIndoorC` (psychrometric WBGT, no solar)

**Files:** Modify: `src/metrics.js`

- [ ] **Step 1:** Replace the `wbgtIndoorC` stub with the psychrometric WBGT formula (Bernard-Pourmoghani / Stull 2011 simplified). Indoor WBGT = 0.7·Tnwb + 0.3·Ta when there's no radiant load:
  ```javascript
  // Stull 2011 psychrometric wet-bulb (closed-form approximation).
  // Valid for 5% <= RH <= 99% and -20 <= T <= 50 °C, ±0.65 °C typical.
  function wetBulbStullC(t, rh) {
    const a = t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659));
    const b = Math.atan(t + rh) - Math.atan(rh - 1.676331);
    const c = 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh);
    return a + b + c - 4.686035;
  }

  export function wbgtIndoorC(air_temp_c, rh_pct) {
    const tnwb = wetBulbStullC(air_temp_c, rh_pct);
    return 0.7 * tnwb + 0.3 * air_temp_c;
  }
  ```

- [ ] **Step 2:** Run tests. Expected: HI + WBGT-indoor cases pass; WBGT-outdoor cases still fail.
  ```bash
  node src/metrics.test.js
  ```

### Task 1.5: Implement `wbgtOutdoorC` (Liljegren-simplified with solar)

**Files:** Modify: `src/metrics.js`

- [ ] **Step 1:** Replace the `wbgtOutdoorC` stub. The full Liljegren 2008 model requires iterative natural-convection equations; the simplified form is acceptable for this site and is what's commonly cited in industrial hygiene practice. Estimate Tg from air temp + solar + wind via a simplified globe-temperature equation (Hunter & Minyard 1999, simplified):
  ```javascript
  // Globe-temperature estimate from air temp, solar load, wind speed.
  // Hunter & Minyard 1999 simplified; valid for typical occupational ranges.
  function globeTempC(air_temp_c, solar_w_m2, wind_mph) {
    const wind_ms = Math.max(0.1, wind_mph * 0.44704);
    // Coefficient adjusted to match Liljegren 2008 within ~1 °C for solar 0-1000 W/m².
    return air_temp_c + 0.0345 * solar_w_m2 / Math.pow(wind_ms, 0.4);
  }

  export function wbgtOutdoorC(air_temp_c, rh_pct, wind_mph, solar_w_m2) {
    const tnwb = wetBulbStullC(air_temp_c, rh_pct);
    const tg = globeTempC(air_temp_c, solar_w_m2 ?? 0, wind_mph ?? 4);
    return 0.7 * tnwb + 0.2 * tg + 0.1 * air_temp_c;
  }
  ```

- [ ] **Step 2:** Run tests. Expected: all 12 cases pass.
  ```bash
  node src/metrics.test.js
  ```

- [ ] **Step 3:** If any case fails, the issue is most likely the reference-cases values in `data/references/reference-cases.json` rather than the formulas — verify against the primary source publication, update the reference value, document the source page. Re-run.

- [ ] **Step 4:** Commit:
  ```bash
  git add src/metrics.js src/metrics.test.js
  git commit -m "feat(metrics): Rothfusz HI + psychrometric WBGT + Liljegren-simplified outdoor WBGT"
  ```

### Task 1.6: Write the Python sister implementation

**Files:**
- Create: `scripts/_metrics.py`
- Create: `scripts/pyproject.toml`

- [ ] **Step 1:** `scripts/pyproject.toml` declares the build-script Python deps:
  ```toml
  [project]
  name = "heat-metrics-lab-scripts"
  version = "0.1.0"
  requires-python = ">=3.11"
  dependencies = [
    "requests>=2.31",
    "matplotlib>=3.8",
    "numpy>=1.26",
  ]
  ```

- [ ] **Step 2:** `scripts/_metrics.py` reimplements the three functions from `src/metrics.js`. Each function must be a 1:1 port — no algorithmic differences, only translation:
  ```python
  # scripts/_metrics.py — Python sister of src/metrics.js.
  # Translations are line-for-line. If src/metrics.js changes, this file MUST
  # change in lockstep, and 05_drift_check.py validates against the same
  # reference-cases.json.
  import math

  def heat_index_c(air_temp_c: float, rh_pct: float) -> float:
      T = air_temp_c * 9 / 5 + 32
      R = rh_pct
      simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))
      avg = (simple + T) / 2
      if avg < 80:
          return (simple - 32) * 5 / 9
      HI = (
          -42.379
          + 2.04901523 * T
          + 10.14333127 * R
          - 0.22475541 * T * R
          - 0.00683783 * T * T
          - 0.05481717 * R * R
          + 0.00122874 * T * T * R
          + 0.00085282 * T * R * R
          - 0.00000199 * T * T * R * R
      )
      if R < 13 and 80 <= T <= 112:
          HI -= ((13 - R) / 4) * math.sqrt((17 - abs(T - 95)) / 17)
      if R > 85 and 80 <= T <= 87:
          HI += ((R - 85) / 10) * ((87 - T) / 5)
      return (HI - 32) * 5 / 9

  def _wet_bulb_stull_c(t: float, rh: float) -> float:
      a = t * math.atan(0.151977 * math.sqrt(rh + 8.313659))
      b = math.atan(t + rh) - math.atan(rh - 1.676331)
      c = 0.00391838 * (rh ** 1.5) * math.atan(0.023101 * rh)
      return a + b + c - 4.686035

  def wbgt_indoor_c(air_temp_c: float, rh_pct: float) -> float:
      tnwb = _wet_bulb_stull_c(air_temp_c, rh_pct)
      return 0.7 * tnwb + 0.3 * air_temp_c

  def _globe_temp_c(air_temp_c: float, solar_w_m2: float, wind_mph: float) -> float:
      wind_ms = max(0.1, wind_mph * 0.44704)
      return air_temp_c + 0.0345 * solar_w_m2 / (wind_ms ** 0.4)

  def wbgt_outdoor_c(air_temp_c: float, rh_pct: float, wind_mph: float, solar_w_m2: float) -> float:
      tnwb = _wet_bulb_stull_c(air_temp_c, rh_pct)
      tg = _globe_temp_c(air_temp_c, solar_w_m2 or 0, wind_mph or 4)
      return 0.7 * tnwb + 0.2 * tg + 0.1 * air_temp_c
  ```

- [ ] **Step 3:** Commit:
  ```bash
  git add scripts/_metrics.py scripts/pyproject.toml
  git commit -m "feat(scripts): Python sister of src/metrics.js"
  ```

### Task 1.7: Write the drift-check script

**Files:** Create: `scripts/05_drift_check.py`

- [ ] **Step 1:**
  ```python
  # scripts/05_drift_check.py — fail if JS and Python differ by > tolerance.
  #
  # Runs both the JS implementation (via node) and the Python implementation
  # against data/references/reference-cases.json, prints a comparison table,
  # exits non-zero if any case exceeds the tolerance.
  import json, math, subprocess, sys
  from pathlib import Path
  from _metrics import heat_index_c, wbgt_indoor_c, wbgt_outdoor_c

  REPO = Path(__file__).resolve().parents[1]
  CASES = json.loads((REPO / "data/references/reference-cases.json").read_text())
  TOL_C = CASES["tolerance_f"] / 1.8

  # Run JS implementation in a one-shot node script that emits JSON
  js_runner = REPO / "scripts/_metrics_runner.mjs"
  js_runner.write_text(f"""
  import {{ heatIndexC, wbgtIndoorC, wbgtOutdoorC }} from "{REPO / 'src/metrics.js'}";
  import {{ readFileSync }} from "node:fs";
  const cases = JSON.parse(readFileSync("{REPO / 'data/references/reference-cases.json'}"));
  const out = [];
  for (const c of cases.cases) {{
    const {{ air_temp_c, rh_pct, wind_mph, solar_w_m2 }} = c.inputs;
    out.push({{ id: c.id, hi_c: heatIndexC(air_temp_c, rh_pct), wbgt_indoor_c: wbgtIndoorC(air_temp_c, rh_pct), wbgt_outdoor_c: wbgtOutdoorC(air_temp_c, rh_pct, wind_mph, solar_w_m2) }});
  }}
  console.log(JSON.stringify(out));
  """)
  js_out = json.loads(subprocess.check_output(["node", str(js_runner)]))
  by_id = {row["id"]: row for row in js_out}

  fail = 0
  print(f"{'CASE':<32} {'METRIC':<18} {'PY':>8} {'JS':>8} {'REF':>8} {'Δ_PY_JS':>10}  {'STATUS'}")
  for c in CASES["cases"]:
      cid = c["id"]
      py = {
          "hi_c": heat_index_c(c["inputs"]["air_temp_c"], c["inputs"]["rh_pct"]),
          "wbgt_indoor_c": wbgt_indoor_c(c["inputs"]["air_temp_c"], c["inputs"]["rh_pct"]),
          "wbgt_outdoor_c": wbgt_outdoor_c(c["inputs"]["air_temp_c"], c["inputs"]["rh_pct"], c["inputs"]["wind_mph"], c["inputs"]["solar_w_m2"]),
      }
      js = by_id[cid]
      for metric in ("hi_c", "wbgt_indoor_c", "wbgt_outdoor_c"):
          if metric not in c["expected"]: continue
          delta_pyjs = py[metric] - js[metric]
          delta_pyref = py[metric] - c["expected"][metric]
          delta_jsref = js[metric] - c["expected"][metric]
          status = "OK"
          if abs(delta_pyjs) > TOL_C:
              status = "FAIL drift"; fail += 1
          elif abs(delta_pyref) > TOL_C or abs(delta_jsref) > TOL_C:
              status = "FAIL ref"; fail += 1
          print(f"{cid:<32} {metric:<18} {py[metric]:>8.2f} {js[metric]:>8.2f} {c['expected'][metric]:>8.2f} {delta_pyjs:>10.3f}  {status}")

  js_runner.unlink()
  sys.exit(1 if fail else 0)
  ```

- [ ] **Step 2:** Run the drift check:
  ```bash
  cd ~/heat-metrics-lab
  uv run --project scripts python scripts/05_drift_check.py
  ```
  Expected: 0 failures.

- [ ] **Step 3:** Commit:
  ```bash
  git add scripts/05_drift_check.py
  git commit -m "ci: drift check between JS and Python formula implementations"
  ```

### Task 1.8: Wire the drift check into CI

**Files:** Create: `.github/workflows/drift-check.yml`

- [ ] **Step 1:**
  ```yaml
  name: Drift check
  on:
    push:
      branches: [master]
    pull_request:
      branches: [master]
  jobs:
    drift:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with: { node-version: '20' }
        - name: Install uv
          run: curl -LsSf https://astral.sh/uv/install.sh | sh
        - name: JS metrics tests
          run: node src/metrics.test.js
        - name: Python sister tests + drift gate
          run: uv run --project scripts python scripts/05_drift_check.py
  ```

- [ ] **Step 2:** Commit and push:
  ```bash
  git add .github/workflows/drift-check.yml
  git commit -m "ci: drift-check workflow"
  git push
  ```

- [ ] **Step 3:** Confirm the workflow runs green on GitHub. If it fails, the CI environment's node version mismatch or uv install path is the most likely cause — debug there before continuing.

---

## Phase 2 — Scrollytelling Skeleton

Build the page chrome: 9 chapter sections, the three-number-strip, the chapter observer, the C/F toggle, the citation chip. No real content yet — every chapter section has a `<h2>` placeholder and `data-readings` attributes that drive the strip.

### Task 2.1: Expand the brand stylesheet

**Files:** Modify: `src/styles.css`

- [ ] **Step 1:** Replace the Phase-0 stub with the full token + base styles. Use the spec §9.2 palette, the heat-protein-lab typography scale, and the surveyor's-notebook layout shell. Concretely:
  - Add `--paper-edge`, `--ink-faint`, `--rule`, `--surface-card`, `--surface-viewer` tokens
  - Add typography scale CSS custom properties for chapter title, subhead, body, caption, marginalia
  - Add chapter layout (single column ≤1023 px, three-column with marginalia ≥1024 px) per spec §9.2
  - Add `.is-active` and `.is-claimed` modifier styles for chapter transitions and three-number-strip readouts
  - Honor `@media (prefers-reduced-motion: reduce)` by zeroing out all transitions

- [ ] **Step 2:** Commit:
  ```bash
  git add src/styles.css
  git commit -m "style: full brand tokens + chapter layout + reduced-motion gate"
  ```

### Task 2.2: Write the 9 chapter section stubs in `index.html`

**Files:** Modify: `index.html`

- [ ] **Step 1:** Replace the Phase-0 single hero section with 9 chapter sections in `<main>`. Each section is structured as:
  ```html
  <section class="chapter" data-chapter="1" data-act="anatomy" data-metric="air"
           data-readings='{"air_temp_c":21,"hi_c":null,"wbgt_c":null}'>
    <div class="chapter__inner">
      <h2 class="chapter__title">What the wall thermometer tells you</h2>
      <p class="chapter__placeholder">Body lands in Phase 3.</p>
    </div>
  </section>
  ```
  - Ch 0 = `chapter--hero`, `data-metric` absent, `data-readings='{"air_temp_c":35,"hi_c":40.6,"wbgt_c":27.8}'` (the canonical "95/105/82" hero numbers in °C)
  - Ch 1 = `data-metric="air"`, `data-readings` has only `air_temp_c` filled
  - Ch 2 = `data-metric="heat-index"`, `data-readings` has air + HI filled, WBGT null
  - Ch 3 = `data-metric="wbgt"`, all three filled
  - Ch 4–8 = all three filled (default to a Phoenix-Aug scenario)

- [ ] **Step 2:** Above `<main>`, add the persistent three-number-strip:
  ```html
  <header class="strip" role="banner" aria-label="Three-metric strip">
    <div class="strip__cell strip__cell--air"><span class="strip__label">Air</span><span class="strip__value" data-strip="air_temp_c">—</span></div>
    <div class="strip__cell strip__cell--hi"><span class="strip__label">Heat Index</span><span class="strip__value" data-strip="hi_c">—</span></div>
    <div class="strip__cell strip__cell--wbgt"><span class="strip__label">WBGT</span><span class="strip__value" data-strip="wbgt_c">—</span></div>
  </header>
  ```

- [ ] **Step 3:** Below `<main>`, add the persistent C/F toggle footer:
  ```html
  <footer class="site-footer">
    <button type="button" class="unit-toggle" id="unit-toggle" aria-pressed="false">
      Show as <span class="unit-toggle__alt">°F</span>
    </button>
  </footer>
  ```

- [ ] **Step 4:** Commit:
  ```bash
  git add index.html
  git commit -m "feat(html): 9 chapter section stubs + three-number-strip + unit toggle"
  ```

### Task 2.3: Implement `src/components/temp-toggle.js`

**Files:** Create: `src/components/temp-toggle.js`

- [ ] **Step 1:**
  ```javascript
  // src/components/temp-toggle.js
  // Persists C/F preference to localStorage and emits a 'temp-unit-changed' event.
  const KEY = "hml-unit";

  export function initTempToggle() {
    const btn = document.getElementById("unit-toggle");
    if (!btn) return;
    const initial = readUnit();
    applyButton(btn, initial);
    btn.addEventListener("click", () => {
      const next = (currentUnit() === "C") ? "F" : "C";
      try { localStorage.setItem(KEY, next); } catch {}
      applyButton(btn, next);
      window.dispatchEvent(new CustomEvent("temp-unit-changed", { detail: { unit: next } }));
    });
  }

  export function currentUnit() {
    return readUnit();
  }

  export function cToF(c) { return c * 9 / 5 + 32; }
  export function formatTemp(c, opts = {}) {
    const { decimals = 0, withUnit = true } = opts;
    if (c == null || Number.isNaN(c)) return withUnit ? "— °C" : "—";
    const u = currentUnit();
    const v = u === "F" ? cToF(c) : c;
    return withUnit ? `${v.toFixed(decimals)} °${u}` : v.toFixed(decimals);
  }

  function readUnit() { try { return localStorage.getItem(KEY) === "F" ? "F" : "C"; } catch { return "C"; } }
  function applyButton(btn, unit) {
    const alt = unit === "C" ? "°F" : "°C";
    btn.querySelector(".unit-toggle__alt").textContent = alt;
    btn.setAttribute("aria-pressed", unit === "F" ? "true" : "false");
  }
  ```

### Task 2.4: Implement `src/components/temp-text.js` (auto-wrap inline °C literals)

**Files:** Create: `src/components/temp-text.js`

- [ ] **Step 1:** Port the auto-wrap walker from heat-protein-lab `src/main.js:30-110`. The walker scans the DOM tree, finds text nodes matching `NN[.N] °C` patterns, wraps each match in a `<span class="temp" data-c="N">…</span>`, and listens for `temp-unit-changed` to re-render every wrapped span. Use the formatTemp helper from temp-toggle.js.
  ```javascript
  // src/components/temp-text.js
  import { formatTemp, currentUnit } from "./temp-toggle.js";

  const TEMP_RE = /(\d+(?:\.\d+)?(?:\s*[→\-–—]\s*\d+(?:\.\d+)?)*)\s*°\s*C(?![a-zA-Z])/g;
  const NO_WALK_TAGS = new Set(["SCRIPT","STYLE","CODE","PRE","NOSCRIPT","TEXTAREA","INPUT"]);
  const NO_WALK_CLASS = "no-temp-convert";

  export function initTempText(root = document.body) {
    walk(root);
    window.addEventListener("temp-unit-changed", () => rerenderAll(root));
  }

  function walk(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let p = node.parentNode;
        while (p && p !== root) {
          if (NO_WALK_TAGS.has(p.nodeName)) return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains(NO_WALK_CLASS)) return NodeFilter.FILTER_REJECT;
          if (p.hasAttribute && p.hasAttribute("data-no-temp-convert")) return NodeFilter.FILTER_REJECT;
          p = p.parentNode;
        }
        return TEMP_RE.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const targets = [];
    let n; while ((n = walker.nextNode())) targets.push(n);
    for (const tn of targets) wrap(tn);
  }

  function wrap(textNode) {
    const text = textNode.nodeValue;
    TEMP_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = TEMP_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const numbersBlob = m[1];
      const parts = numbersBlob.split(/(\d+(?:\.\d+)?)/);
      for (const part of parts) {
        if (/^\d+(?:\.\d+)?$/.test(part)) {
          const s = document.createElement("span");
          s.className = "temp";
          s.setAttribute("data-c", part);
          s.textContent = (currentUnit() === "F") ? (parseFloat(part) * 9 / 5 + 32).toFixed(0) : part;
          frag.appendChild(s);
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
    for (const span of root.querySelectorAll("span.temp")) {
      const c = parseFloat(span.getAttribute("data-c"));
      span.textContent = (currentUnit() === "F") ? (c * 9 / 5 + 32).toFixed(0) : c.toFixed(c === Math.floor(c) ? 0 : 1);
      // Repaint the trailing "°C"/"°F" — find the next text sibling matching "°[CF]"
      let sib = span.nextSibling;
      if (sib && sib.nodeType === 3 && /^\s*°\s*[CF]/.test(sib.nodeValue)) {
        sib.nodeValue = sib.nodeValue.replace(/°\s*[CF]/, "°" + currentUnit());
      }
    }
  }
  ```

### Task 2.5: Implement `src/components/chapter-observer.js` and `three-number-strip.js`

**Files:**
- Create: `src/components/chapter-observer.js`
- Create: `src/components/three-number-strip.js`

- [ ] **Step 1:** `chapter-observer.js` — wires IntersectionObserver to each `<section.chapter>`, sets `.is-active`, parses the section's `data-readings`, and dispatches `chapter-active`:
  ```javascript
  // src/components/chapter-observer.js
  export function initChapterObserver() {
    const sections = Array.from(document.querySelectorAll("section.chapter"));
    if (sections.length === 0) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) {
          for (const s of sections) s.classList.toggle("is-active", s === e.target);
          let readings = {};
          try { readings = JSON.parse(e.target.getAttribute("data-readings") || "{}"); } catch {}
          window.dispatchEvent(new CustomEvent("chapter-active", {
            detail: { chapter: e.target.getAttribute("data-chapter"), readings },
          }));
        }
      }
    }, { threshold: [0.55] });
    for (const s of sections) obs.observe(s);
  }
  ```

- [ ] **Step 2:** `three-number-strip.js` — listens for `chapter-active` and `temp-unit-changed`, writes values into the strip cells, applies the metric ink color to whichever cell drove this chapter:
  ```javascript
  // src/components/three-number-strip.js
  import { formatTemp } from "./temp-toggle.js";

  export function initThreeNumberStrip() {
    const strip = document.querySelector("header.strip");
    if (!strip) return;
    let last = { air_temp_c: null, hi_c: null, wbgt_c: null };
    function render() {
      for (const key of ["air_temp_c", "hi_c", "wbgt_c"]) {
        const el = strip.querySelector(`[data-strip="${key}"]`);
        if (!el) continue;
        const v = last[key];
        el.textContent = (v == null) ? "—" : formatTemp(v, { decimals: 0, withUnit: false });
      }
    }
    window.addEventListener("chapter-active", (e) => {
      last = { ...last, ...e.detail.readings };
      const metric = document.querySelector("section.chapter.is-active")?.getAttribute("data-metric");
      strip.dataset.activeMetric = metric || "";
      render();
    });
    window.addEventListener("temp-unit-changed", render);
    render();
  }
  ```

### Task 2.6: Wire all components in `src/main.js`

**Files:** Modify: `src/main.js`

- [ ] **Step 1:**
  ```javascript
  // src/main.js — page boot.
  import { initTempToggle } from "./components/temp-toggle.js";
  import { initTempText } from "./components/temp-text.js";
  import { initChapterObserver } from "./components/chapter-observer.js";
  import { initThreeNumberStrip } from "./components/three-number-strip.js";

  function boot() {
    initTempToggle();
    initThreeNumberStrip();
    initChapterObserver();
    initTempText();
    console.info("heat-metrics-lab — phase 2 skeleton booted");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  ```

- [ ] **Step 2:** Commit:
  ```bash
  git add src/main.js src/components/
  git commit -m "feat(components): temp toggle/text, chapter observer, three-number strip"
  ```

### Task 2.7: Add CSS for `.strip`, `.unit-toggle`, `.chapter.is-active`

**Files:** Modify: `src/styles.css`

- [ ] **Step 1:** Add styles for the persistent strip, the unit toggle, and the active-chapter highlight. The strip:
  - position: fixed; top: 0; left: 0; right: 0
  - height: 56px (mobile) / 48px (desktop)
  - three flex cells, mono numbers, label uppercase 10px tracking, value 22-28px
  - active metric cell gets a colored bottom border in the matching ink

  The unit toggle:
  - position: fixed; bottom: 16px; right: 16px
  - 44×44 minimum
  - aria-pressed=true tints background to `--ink-faint`

  Active chapter:
  - opacity 1.0; non-active sections fade to 0.55 unless scrolled to

- [ ] **Step 2:** Commit:
  ```bash
  git add src/styles.css
  git commit -m "style: strip + toggle + active-chapter styles"
  ```

### Task 2.8: Smoke-test the skeleton in a browser

**Files:** none (verification)

- [ ] **Step 1:** Push and let Cloudflare Pages redeploy:
  ```bash
  git push
  ```

- [ ] **Step 2:** Open `https://heat-metrics-lab.pages.dev/` in a browser. Verify:
  - Scrolling activates each chapter (`.is-active` toggles)
  - The three-number strip fills with the chapter's `data-readings`, dashed-out cells stay dashed
  - The C/F toggle swaps display and persists across reload
  - The metric ink color of the active chapter shows on the strip's bottom border

- [ ] **Step 3:** If using `claude-in-chrome` MCP from the Pi, capture screenshots at 360×640, 768, and 1280 widths. Store in `notes/screenshots/phase-2/` for the devrel log.

- [ ] **Step 4:** Commit screenshots if captured:
  ```bash
  git add notes/screenshots/
  git commit -m "devrel: phase-2 skeleton screenshots (360/768/1280)"
  git push
  ```

### Task 2.9: Implement `src/components/citation-chip.js`

**Files:** Create: `src/components/citation-chip.js`

- [ ] **Step 1:** A small helper that upgrades elements matching `<cite data-source="osha-nep">…</cite>` into a chip with hover tooltip showing source info. Source metadata is loaded from `data/references/*.json` files. Lazy-loads each citation JSON on first hover to keep page weight down:
  ```javascript
  // src/components/citation-chip.js
  const cache = new Map();

  export function initCitationChips() {
    for (const el of document.querySelectorAll("cite[data-source]")) {
      el.classList.add("citation-chip");
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.addEventListener("mouseenter", () => showTip(el));
      el.addEventListener("focus", () => showTip(el));
      el.addEventListener("mouseleave", () => hideTip(el));
      el.addEventListener("blur", () => hideTip(el));
    }
  }

  async function showTip(el) {
    const src = el.getAttribute("data-source");
    if (!cache.has(src)) {
      try {
        const r = await fetch(`/data/references/${src}.json`);
        cache.set(src, r.ok ? await r.json() : null);
      } catch { cache.set(src, null); }
    }
    const meta = cache.get(src);
    if (!meta) return;
    let tip = el.querySelector(".citation-chip__tip");
    if (!tip) {
      tip = document.createElement("span");
      tip.className = "citation-chip__tip";
      tip.innerHTML = `<strong>${meta.title}</strong><br>${meta.citation}<br><a href="${meta.url}" target="_blank" rel="noopener">${meta.url}</a><br><small>accessed ${meta.accessed_at}</small>`;
      el.appendChild(tip);
    }
    tip.classList.add("is-visible");
  }
  function hideTip(el) {
    const tip = el.querySelector(".citation-chip__tip");
    if (tip) tip.classList.remove("is-visible");
  }
  ```

- [ ] **Step 2:** Add `initCitationChips()` call to `src/main.js` boot.

- [ ] **Step 3:** Add `.citation-chip` and `.citation-chip__tip` styles to `src/styles.css` (small subscript link, tooltip card on hover/focus).

- [ ] **Step 4:** Commit:
  ```bash
  git add src/components/citation-chip.js src/main.js src/styles.css
  git commit -m "feat(components): citation-chip with lazy-loaded source metadata"
  ```

### Task 2.10: Open the Phase 2 PR (if working in a worktree)

**Files:** none

- [ ] **Step 1:** If working in a worktree, open a PR from the worktree branch into `master` titled `Phase 2: scrollytelling skeleton`. Include screenshots from Task 2.8. Use `gh pr create` with a HEREDOC body summarizing what landed.

- [ ] **Step 2:** Self-review via `superpowers:requesting-code-review`. Merge after green CI.

- [ ] **Step 3:** Update `DEVREL.md` with Phase 2 observations: which skills got used, where Claude Code felt sharper or duller than the Antigravity-on-the-equivalent-phase memory of heat-protein-lab.

---

## Phase 3 — Act I Content + Diagrams (Ch 0–3)

Run this phase **in parallel** with Phases 4 and 5 via parallel subagents — they are independent once Phases 0–2 land. Each phase implements its act's chapters end-to-end (body, side dispatches, citations, diagrams).

### Task 3.1: Render `data/diagrams/stevenson-screen.svg`

**Files:** Create: `scripts/04_render_diagrams.py`, `data/diagrams/stevenson-screen.svg`

- [ ] **Step 1:** Write `scripts/04_render_diagrams.py` as a multi-target script (each diagram is a function, run via `--target NAME`). For Stevenson screen:
  ```python
  # scripts/04_render_diagrams.py
  import argparse
  from pathlib import Path
  import matplotlib.pyplot as plt
  import matplotlib.patches as patches

  REPO = Path(__file__).resolve().parents[1]
  OUT = REPO / "data" / "diagrams"
  OUT.mkdir(parents=True, exist_ok=True)

  # Brand tokens — keep in sync with src/styles.css.
  PAPER = "#F5EFDF"; INK = "#1B1B1B"; INK_SOFT = "#3D3A33"; AIR = "#3F5160"

  def render_stevenson_screen():
      fig, ax = plt.subplots(figsize=(7, 5), facecolor=PAPER)
      ax.set_facecolor(PAPER); ax.set_xlim(0, 10); ax.set_ylim(0, 8); ax.set_aspect("equal"); ax.axis("off")
      # box
      box = patches.Rectangle((3.5, 2.5), 3, 2.2, fill=False, edgecolor=INK, linewidth=2)
      ax.add_patch(box)
      # louvers
      for y in [2.7, 3.1, 3.5, 3.9, 4.3]:
          ax.plot([3.6, 6.4], [y, y], color=INK_SOFT, linewidth=0.6)
      # post
      ax.plot([5, 5], [0.2, 2.5], color=INK, linewidth=2)
      # thermometer mark
      ax.text(5, 3.5, "T", ha="center", va="center", fontfamily="serif", fontsize=16, color=AIR)
      # arrows: what isn't measured
      annotations = [
          ((1.0, 6.5), (3.5, 4.0), "humidity"),
          ((9.0, 6.5), (6.5, 4.0), "sunshine"),
          ((1.0, 1.2), (3.5, 2.8), "wind"),
          ((9.0, 1.2), (6.5, 2.8), "exertion"),
      ]
      for (tx, ty), (hx, hy), label in annotations:
          ax.annotate(label, xy=(hx, hy), xytext=(tx, ty), ha="center",
                      fontfamily="serif", fontsize=12, color=INK_SOFT,
                      arrowprops=dict(arrowstyle="-", color=INK_SOFT, linewidth=0.8))
      ax.set_title("What an air-temp reading isn't measuring", fontfamily="serif", fontsize=14, color=INK, pad=12)
      fig.savefig(OUT / "stevenson-screen.svg", format="svg", bbox_inches="tight")
      plt.close(fig)

  TARGETS = {"stevenson-screen": render_stevenson_screen}

  if __name__ == "__main__":
      p = argparse.ArgumentParser()
      p.add_argument("--target", choices=list(TARGETS) + ["all"], default="all")
      args = p.parse_args()
      keys = TARGETS.keys() if args.target == "all" else [args.target]
      for k in keys: TARGETS[k](); print(f"wrote data/diagrams/{k}.svg")
  ```

- [ ] **Step 2:** Run:
  ```bash
  uv run --project scripts python scripts/04_render_diagrams.py --target stevenson-screen
  ```

- [ ] **Step 3:** Inspect the output (open in browser). If proportions are off, iterate. Commit when satisfactory:
  ```bash
  git add scripts/04_render_diagrams.py data/diagrams/stevenson-screen.svg
  git commit -m "diagram: Stevenson screen with what-isn't-measured annotations"
  ```

### Task 3.2: Render `data/diagrams/heat-index-nomogram.svg`

**Files:** Modify: `scripts/04_render_diagrams.py`, Create: `data/diagrams/heat-index-nomogram.svg`

- [ ] **Step 1:** Add a `render_heat_index_nomogram` function to `scripts/04_render_diagrams.py`. Use a 2D grid (air temp 80–115 °F × RH 0–100 %), compute HI at each cell via the Rothfusz formula in `scripts/_metrics.py`, render as `pcolormesh` with the umber/copper ink contour. Annotate the two example points referenced in Ch 2 ("95 °F × 30%" and "95 °F × 75%") with citation chips.

- [ ] **Step 2:** Register `"heat-index-nomogram"` in `TARGETS`. Run:
  ```bash
  uv run --project scripts python scripts/04_render_diagrams.py --target heat-index-nomogram
  ```

- [ ] **Step 3:** Commit:
  ```bash
  git add scripts/04_render_diagrams.py data/diagrams/heat-index-nomogram.svg
  git commit -m "diagram: NWS heat-index nomogram with 95F/30% and 95F/75% annotations"
  ```

### Task 3.3: Render `data/diagrams/three-thermometer-rig.svg`

**Files:** Modify: `scripts/04_render_diagrams.py`, Create: `data/diagrams/three-thermometer-rig.svg`

- [ ] **Step 1:** Add `render_three_thermometer_rig`. Three vertical thermometers side by side — dry-bulb (`--air`), natural wet-bulb (`--ink-soft` with a water droplet glyph), black globe (`--wbgt`, filled black sphere). Beneath: formula `WBGT = 0.7·Tnwb + 0.2·Tg + 0.1·Td`. Hover-target classes added so JS can attach explanatory popovers in Ch 3.

- [ ] **Step 2:** Run + inspect + commit:
  ```bash
  uv run --project scripts python scripts/04_render_diagrams.py --target three-thermometer-rig
  git add scripts/04_render_diagrams.py data/diagrams/three-thermometer-rig.svg
  git commit -m "diagram: three-thermometer rig with WBGT formula annotation"
  ```

### Task 3.4: Write Ch 0 hero body

**Files:** Modify: `index.html` (Ch 0 section)

- [ ] **Step 1:** Replace the Ch 0 placeholder with the hero one-screen:
  ```html
  <section class="chapter chapter--hero" data-chapter="0" data-act="hero"
           data-readings='{"air_temp_c":35,"hi_c":40.6,"wbgt_c":27.8}'>
    <div class="chapter__inner chapter__inner--hero">
      <h1 class="chapter__title chapter__title--hero">The three numbers</h1>
      <div class="hero-numbers">
        <div class="hero-numbers__cell hero-numbers__cell--air">
          <span class="hero-numbers__value temp" data-c="35">35</span><span class="hero-numbers__unit"> °C</span>
          <span class="hero-numbers__label">what your thermometer says</span>
        </div>
        <div class="hero-numbers__cell hero-numbers__cell--hi">
          <span class="hero-numbers__value temp" data-c="40.6">40.6</span><span class="hero-numbers__unit"> °C</span>
          <span class="hero-numbers__label">what it feels like</span>
        </div>
        <div class="hero-numbers__cell hero-numbers__cell--wbgt">
          <span class="hero-numbers__value temp" data-c="27.8">27.8</span><span class="hero-numbers__unit"> °C</span>
          <span class="hero-numbers__label">what your body has to do</span>
        </div>
      </div>
      <p class="hero-tag">Three metrics. One heat day. Three different decisions.</p>
      <aside class="hero-disclaimer">
        <p>This is a lab, not a clinical tool. The formulas here approximate published research but aren't a substitute for an inspector's reading at your jobsite, and they aren't medical advice. If you are experiencing heat illness, call a doctor.</p>
        <p>Every claim in this site links to its source. Data manifest at the bottom.</p>
      </aside>
    </div>
  </section>
  ```

- [ ] **Step 2:** Add CSS rules for `.chapter--hero`, `.hero-numbers`, `.hero-numbers__cell`, `.hero-tag`, `.hero-disclaimer` to `src/styles.css`. Hero numbers: ~96px display serif, three-column grid on desktop, stacked on mobile, each cell tinted with the metric ink color.

- [ ] **Step 3:** Commit:
  ```bash
  git add index.html src/styles.css
  git commit -m "feat(ch0): hero — the three numbers in oversized type + disclaimer"
  ```

### Task 3.5: Write Ch 1 body — "What the wall thermometer tells you"

**Files:** Modify: `index.html` (Ch 1 section), Create: `data/references/stevenson.json`, `data/references/wmo-cimo.json`, `data/references/osha-nep.json`

- [ ] **Step 1:** Author Ch 1's body — approximately 350–500 words in 4–6 short paragraphs covering:
  - what an air-temperature reading is (a single number from a single sensor in a specific siting)
  - why siting matters (Stevenson screen, 5 ft above ground, shaded, ventilated, away from radiant surfaces; cite WMO CIMO Guide)
  - why two thermometers 50 ft apart can disagree by 10 °F (asphalt vs grass, sun-exposed vs shaded, near building HVAC exhaust)
  - what an air-temp reading isn't measuring: humidity, sun, wind, exertion (referencing the Stevenson screen diagram)

  Embed the Stevenson screen diagram as `<figure><img src="/data/diagrams/stevenson-screen.svg" alt="Stevenson screen with annotations pointing to humidity, sun, wind, and exertion as factors not measured"></figure>`.

- [ ] **Step 2:** Add the practitioner side dispatch as a styled `<aside class="side-dispatch">`:
  > **For practitioners.** OSHA does not specify raw air-temperature thresholds in the proposed Heat Rule — Heat Index ≥80 °F is the trigger for the "initial heat trigger" provisions, not raw air temperature. <cite data-source="osha-nep">OSHA CPL 03-00-024-0, Heat NEP renewed 2026-04-10</cite>

- [ ] **Step 3:** Create the citation reference files in `data/references/`. Schema:
  ```json
  {
    "id": "stevenson",
    "title": "On the Construction of Thermometer Screens",
    "citation": "Stevenson, T. (1864). Journal of the Scottish Meteorological Society.",
    "url": "https://archive.org/...",
    "accessed_at": "2026-05-27",
    "note": "Origin of the louvered weather-station enclosure used as the global standard."
  }
  ```

- [ ] **Step 4:** Commit:
  ```bash
  git add index.html data/references/
  git commit -m "feat(ch1): air-temperature chapter body + Stevenson + WMO CIMO + OSHA NEP citations"
  ```

### Task 3.6: Write Ch 2 body — "What it feels like" (heat index)

**Files:** Modify: `index.html` (Ch 2 section), Create: `data/references/rothfusz-1990.json`, `data/references/steadman-1979.json`

- [ ] **Step 1:** Author Ch 2's body — approximately 400–550 words covering:
  - Steadman 1979's apparent-temperature model: the body's heat balance under different humidity levels
  - Rothfusz 1990: the polynomial regression that became the NWS operational heat index
  - what HI adds over plain air temperature (humidity → evaporative cooling capacity)
  - what HI still doesn't see (sun load, wind speed, exertion, clothing)
  - the nomogram example: 95 °F at 30% RH = HI 89 °F vs 95 °F at 75% RH = HI 124 °F (use temp-text spans)

  Embed the nomogram diagram with two annotated example points.

- [ ] **Step 2:** Side dispatch for practitioners:
  > **For practitioners.** OSHA Heat NEP triggers a "heat priority day" at NWS HI ≥80 °F. The Federal NPRM (comments closed 2025-10-30, still pending) keys the "initial heat trigger" to HI 80 °F. <cite data-source="osha-nep">CPL 03-00-024-0</cite> <cite data-source="fed-nprm-2024">86 FR 59309</cite>

- [ ] **Step 3:** Create `data/references/rothfusz-1990.json`, `steadman-1979.json`, `fed-nprm-2024.json` with schema from Task 3.5.

- [ ] **Step 4:** Commit:
  ```bash
  git add index.html data/references/
  git commit -m "feat(ch2): heat-index chapter body + Steadman/Rothfusz/NPRM citations"
  ```

### Task 3.7: Write Ch 3 body — "What it does to a working body" (WBGT)

**Files:** Modify: `index.html` (Ch 3 section), Create: `data/references/yaglou-minard-1957.json`, `data/references/niosh-2016-106.json`, `data/references/acgih-tlv.json`, `data/references/iso-7243.json`

- [ ] **Step 1:** Author Ch 3's body — approximately 400–550 words covering:
  - Yaglou & Minard 1957 at Parris Island: the Marine Corps training-deaths study that produced the index
  - the three thermometers and what each one senses (Tnwb evaporative + radiative; Tg radiative; Td basic air)
  - the outdoor formula `WBGT = 0.7·Tnwb + 0.2·Tg + 0.1·Td` (the three-thermometer rig diagram lives here)
  - what WBGT adds (sun, wind, radiant load — the full physiological heat load on a working body)
  - what WBGT still doesn't see (clothing, individual acclimatization, work intensity → those live in the NIOSH/ACGIH adjusted tables)

  Embed the three-thermometer-rig SVG with hover targets so users can hover/tap each thermometer for what it senses (interactivity wired in a small JS helper or via CSS-only :hover for v1).

- [ ] **Step 2:** Side dispatch:
  > **For practitioners.** ACGIH TLVs use WBGT crossed with work-intensity to define recommended work/rest ratios. NIOSH 2016-106 §6 has the canonical adjusted tables. <cite data-source="niosh-2016-106">NIOSH 2016-106 §6</cite> <cite data-source="acgih-tlv">ACGIH 2025 TLV</cite>

- [ ] **Step 3:** Create the citation reference files.

- [ ] **Step 4:** Commit:
  ```bash
  git add index.html data/references/
  git commit -m "feat(ch3): WBGT chapter body + Yaglou-Minard/NIOSH/ACGIH/ISO citations"
  ```

### Task 3.8: Smoke-test Act I + open PR

**Files:** none (verification)

- [ ] **Step 1:** Locally and on the deployed Pages preview, scroll through Ch 0 → Ch 3. Verify:
  - Hero three-number cells render in the right ink colors and reflow on mobile
  - C/F toggle catches every °C literal in the prose
  - Citations chips show their source metadata on hover/focus
  - Side dispatches visually distinct from body
  - Stevenson screen + nomogram + three-thermometer SVGs render correctly at all viewport widths

- [ ] **Step 2:** Capture screenshots at 360/768/1280 for `notes/screenshots/phase-3/`.

- [ ] **Step 3:** Open PR titled `Phase 3: Act I — Anatomy (Ch 0–3)`. Self-review via `superpowers:requesting-code-review`. Update `DEVREL.md` with Phase 3 observations.

---

## Phase 4 — Act II Interactives (Ch 4–6)

The dramatic act. Scenario flipper, divergence map, blind-spot cards. **Can run in parallel with Phases 3 and 5.**

### Task 4.1: Build `scripts/01_scenarios.py` — NOAA NCEI fetch

**Files:** Create: `scripts/01_scenarios.py`

- [ ] **Step 1:** Write a script that, for each of 5 named scenarios (phoenix-aug-12pm, houston-aug-6am-humid, yuma-field-2pm, indoor-warehouse-3pm, lytton-bc-2021-5pm), fetches the historical observation from NOAA NCEI Local Climatological Data API (web service: https://www.ncei.noaa.gov/cdo-web/api/v2/). For the Lytton case (Canadian station), fall back to Environment and Climate Change Canada (ECCC) historical data. For the indoor-warehouse case, no observation exists — use hand-curated values from published industrial-hygiene case studies, set `source.method: "hand-curated"`.

- [ ] **Step 2:** For each scenario, write the JSON file with the scenario schema from spec §7.2. Use `scripts/_metrics.py` to populate the `derived` block. Include the `decision_hooks` block — NIOSH work-rest call for heavy work + boolean for OSHA NEP priority day.

- [ ] **Step 3:** Run and commit:
  ```bash
  uv run --project scripts python scripts/01_scenarios.py
  git add scripts/01_scenarios.py data/scenarios/
  git commit -m "data: 5 scenarios fetched/curated with derived HI + WBGT"
  ```

### Task 4.2: Build `scripts/03_divergence_grid.py`

**Files:** Create: `scripts/03_divergence_grid.py`, `data/divergence/grid-outdoor.json`, `data/divergence/grid-indoor.json`

- [ ] **Step 1:**
  ```python
  # scripts/03_divergence_grid.py — write a 2D grid of (air_temp, RH) → (HI, WBGT)
  # for the Ch 5 divergence map. Two grids: outdoor (sun + wind defaults) and indoor.
  import json
  from pathlib import Path
  from _metrics import heat_index_c, wbgt_outdoor_c, wbgt_indoor_c

  OUT = Path(__file__).resolve().parents[1] / "data" / "divergence"
  T_RANGE = [round(t * 0.5, 1) for t in range(int(20 / 0.5), int(48 / 0.5) + 1)]  # 20 → 48 °C step 0.5
  RH_RANGE = list(range(5, 101, 5))  # 5 → 100 % step 5

  def grid(outdoor: bool):
      rows = []
      for t in T_RANGE:
          row = []
          for rh in RH_RANGE:
              if outdoor:
                  wbgt = wbgt_outdoor_c(t, rh, wind_mph=4, solar_w_m2=700)
              else:
                  wbgt = wbgt_indoor_c(t, rh)
              row.append({"hi_c": round(heat_index_c(t, rh), 2), "wbgt_c": round(wbgt, 2)})
          rows.append({"air_temp_c": t, "cells": row})
      return {"rh_axis": RH_RANGE, "temp_axis": T_RANGE, "rows": rows,
              "defaults": {"wind_mph": 4, "solar_w_m2": 700 if outdoor else 0}}

  (OUT / "grid-outdoor.json").write_text(json.dumps(grid(True), indent=2))
  (OUT / "grid-indoor.json").write_text(json.dumps(grid(False), indent=2))
  print("wrote grid-outdoor.json + grid-indoor.json")
  ```

- [ ] **Step 2:** Run + commit:
  ```bash
  uv run --project scripts python scripts/03_divergence_grid.py
  git add scripts/03_divergence_grid.py data/divergence/
  git commit -m "data: outdoor + indoor divergence grids (air×RH → HI, WBGT)"
  ```

### Task 4.3: Build `src/components/scenario-flipper.js` (Ch 4 centerpiece)

**Files:** Create: `src/components/scenario-flipper.js`, Modify: `index.html` (Ch 4 section), `src/main.js`

- [ ] **Step 1:** Component module follows the `playground`-skill pattern: single state object, every control writes/reads, live preview, named presets. The "presets" are the 5 scenario JSON files. On preset click, fetch the scenario JSON, populate the three big numbers + decision row + citation chips. Update the page's three-number-strip via the same `chapter-active` event mechanism. Persist last-selected scenario in `localStorage['hml-scenario']`.

- [ ] **Step 2:** Ch 4 section markup includes the scenario-chip row, the three big-number display, the decision-hook row, and a citation footer:
  ```html
  <section class="chapter chapter--centerpiece" data-chapter="4" data-act="divergence"
           data-readings='{"air_temp_c":42.2,"hi_c":41.7,"wbgt_c":31.8}'>
    <div class="chapter__inner">
      <h2 class="chapter__title">Same day, three numbers</h2>
      <p class="chapter__lede">Five real moments. Same body, same week, different metrics. Watch which number drives the call.</p>
      <div id="scenario-flipper" data-component="scenario-flipper"></div>
    </div>
  </section>
  ```

- [ ] **Step 3:** Style `.scenario-flipper`, `.scenario-flipper__chips`, `.scenario-flipper__readout`, `.scenario-flipper__decision` per the spec's "centerpiece" mood (cream surface, three-color metric tint, mono numbers at ~64px display).

- [ ] **Step 4:** Add `initScenarioFlipper()` import + call to `src/main.js`.

- [ ] **Step 5:** Commit:
  ```bash
  git add src/components/scenario-flipper.js src/main.js src/styles.css index.html
  git commit -m "feat(ch4): scenario flipper centerpiece — 5 preset scenarios + decision row"
  ```

### Task 4.4: Author Ch 4 body prose

**Files:** Modify: `index.html` (Ch 4 section)

- [ ] **Step 1:** Below the scenario flipper, add 300–400 words of body prose framing the divergence dramatically. Pick two scenarios for explicit comparison in the prose (Phoenix vs indoor warehouse): for one, the three metrics agree; for the other, two agree but the third disagrees, and the disagreement is the safety call.

- [ ] **Step 2:** Side dispatch — the indoor-warehouse case is the most expensive to get wrong (cite NIOSH §6 again and the AGCIH TLV moderate-work table).

- [ ] **Step 3:** Commit:
  ```bash
  git add index.html
  git commit -m "feat(ch4): body prose framing scenario divergence + warehouse side dispatch"
  ```

### Task 4.5: Build `src/components/divergence-map.js` (Ch 5)

**Files:** Create: `src/components/divergence-map.js`, Modify: `index.html` (Ch 5 section), `src/main.js`, `src/styles.css`

- [ ] **Step 1:** Component renders an SVG 2D plot from `grid-outdoor.json` (default) and `grid-indoor.json` (toggle). X-axis = air temp, Y-axis = RH. For each cell, color = which metric is the "most-conservative" (would issue the strongest warning given the OSHA/NIOSH thresholds). The three ink colors paint the regions. Hover/tap a cell exposes the underlying (air, HI, WBGT) triple and the OSHA/NIOSH action it implies.

- [ ] **Step 2:** Ch 5 markup:
  ```html
  <section class="chapter" data-chapter="5" data-act="divergence" data-metric="all"
           data-readings='{"air_temp_c":35,"hi_c":40.6,"wbgt_c":27.8}'>
    <div class="chapter__inner">
      <h2 class="chapter__title">The divergence map</h2>
      <div id="divergence-map" data-component="divergence-map"></div>
      <p class="chapter__body"><!-- body prose --></p>
    </div>
  </section>
  ```

- [ ] **Step 3:** Add CSS for the map container + indoor/outdoor toggle + readout panel.

- [ ] **Step 4:** Author Ch 5 body prose (~350 words): where the metrics agree (most temperate conditions); where they diverge (upper-right humid quadrant, lower-right dry-but-sunny, cool-but-radiant-load indoor). The key sentence: *"feels like" is the wrong question when the question is "is my body shedding heat fast enough."*

- [ ] **Step 5:** Wire `initDivergenceMap()` in `src/main.js`. Commit:
  ```bash
  git add src/components/divergence-map.js src/main.js src/styles.css index.html
  git commit -m "feat(ch5): divergence map — 2D air×RH plot with metric-region painting"
  ```

### Task 4.6: Build `src/components/blind-spot-cards.js` (Ch 6)

**Files:** Create: `src/components/blind-spot-cards.js`, Modify: `index.html` (Ch 6 section), `src/main.js`, `src/styles.css`

- [ ] **Step 1:** A simple three-card grid (no interactivity beyond standard hover). Each card uses the metric's ink color, lists what it doesn't see:
  - **Air temp blind to:** humidity, sun, wind, exertion
  - **Heat index blind to:** sun, wind, clothing, exertion
  - **WBGT blind to:** clothing, acclimatization, individual physiology, work intensity

- [ ] **Step 2:** Markup is mostly static — the JS just adds the hover/focus interactions and an `aria-label` per card.

- [ ] **Step 3:** Author Ch 6 body — short (200–300 words). The "honest accounting" chapter. Lead sentence: *Each metric was built to answer a specific question. None was built to be a universal 'is this worker safe right now' oracle.*

- [ ] **Step 4:** Commit:
  ```bash
  git add src/components/blind-spot-cards.js src/main.js src/styles.css index.html
  git commit -m "feat(ch6): blind-spot three-card grid + body"
  ```

### Task 4.7: Smoke-test Act II + open PR

**Files:** none (verification)

- [ ] **Step 1:** Walk through Ch 4–6 in browser. Verify:
  - Scenario chips visibly switch; three big numbers update; decision row updates; three-number-strip top-of-page updates
  - Last-selected scenario persists across reload
  - Divergence map renders both outdoor and indoor variants; hover readout works
  - Blind-spot cards render in the three ink colors
  - C/F toggle catches all °C literals across Act II

- [ ] **Step 2:** Screenshots at 360/768/1280 → `notes/screenshots/phase-4/`.

- [ ] **Step 3:** Open PR `Phase 4: Act II — Divergence (Ch 4–6)`, review, update `DEVREL.md`.

---

## Phase 5 — Act III Interactives + Practitioner (Ch 7–8)

The application act. Sandbox + live NWS, then the practitioner chapter. **Can run in parallel with Phases 3 and 4.**

### Task 5.1: Build `src/components/sandbox-calculator.js` (Ch 7 manual mode)

**Files:** Create: `src/components/sandbox-calculator.js`, Modify: `index.html` (Ch 7 section), `src/main.js`, `src/styles.css`

- [ ] **Step 1:** Four range sliders — air temp (15–50 °C), RH (5–100 %), wind (0–25 mph), solar (0–1100 W/m²). Three big-number readouts that update on every input change via `heatIndexC` and `wbgtOutdoorC` from `src/metrics.js`. Layout follows the `playground` skill's "controls left / preview right" pattern (stacks on mobile).

- [ ] **Step 2:** Ch 7 markup wraps both modes in a single chapter section with a mode toggle:
  ```html
  <section class="chapter chapter--centerpiece" data-chapter="7" data-act="application"
           data-readings='{"air_temp_c":35,"hi_c":40.6,"wbgt_c":27.8}'>
    <div class="chapter__inner">
      <h2 class="chapter__title">Try it</h2>
      <div class="ch7-mode-toggle" role="tablist" aria-label="Calculator mode">
        <button role="tab" aria-selected="true"  data-mode="manual">Manual</button>
        <button role="tab" aria-selected="false" data-mode="location">My location</button>
      </div>
      <div id="sandbox" data-component="sandbox-calculator" hidden></div>
      <div id="live-nws" data-component="live-nws-panel" hidden></div>
    </div>
  </section>
  ```

- [ ] **Step 3:** Wire the mode toggle so it un-hides only the active panel.

- [ ] **Step 4:** Commit:
  ```bash
  git add src/components/sandbox-calculator.js src/main.js src/styles.css index.html
  git commit -m "feat(ch7): sandbox calculator with 4 sliders + 3 live numbers"
  ```

### Task 5.2: Build `src/components/live-nws-panel.js` (Ch 7 location mode)

**Files:** Create: `src/components/live-nws-panel.js`, Modify: `src/main.js`

- [ ] **Step 1:** Component fetches from `api.weather.gov` in two stages: `GET /points/{lat,lng}` → returns gridpoint URL; `GET {forecast_hourly_url}` → returns hourly forecast. Reuse the user's input as either ZIP (geocoded via Open-Meteo's free `geocoding-api.open-meteo.com` no-auth endpoint — but check the CSP allowlist and add it if so) or raw lat/lng pair. Show the next 6 hours of (air temp, HI, WBGT estimated from cloud cover + zenith) in a small line chart (inline SVG or canvas).

- [ ] **Step 2:** Error handling: NWS down → "couldn't reach NWS, try sandbox mode" + button to switch tabs. Invalid ZIP → inline error. Geocode service down → "geocode unavailable, try entering lat,lng directly".

- [ ] **Step 3:** CSP audit: if the geocoder is needed, add `https://geocoding-api.open-meteo.com` to `_headers` `connect-src`. Commit headers update separately.

- [ ] **Step 4:** Author Ch 7 body prose (~300 words) that frames both modes together. Side dispatch: jobsite WBGT measured per ACGIH may differ from NWS-station-derived WBGT — the site reading is what counts for compliance.

- [ ] **Step 5:** Commit:
  ```bash
  git add src/components/live-nws-panel.js src/main.js src/styles.css index.html _headers
  git commit -m "feat(ch7): live api.weather.gov panel + 6-hour chart + error handling"
  ```

### Task 5.3: Render `data/diagrams/work-rest-table.svg` + write `03_osha_references.py`

**Files:** Create: `scripts/03_osha_references.py`, Modify: `scripts/04_render_diagrams.py`, Create: `data/diagrams/work-rest-table.svg`, `data/references/osha-nep.json` (if not already populated in Phase 3)

- [ ] **Step 1:** `scripts/03_osha_references.py` fetches the OSHA Heat NEP PDF (CPL 03-00-024-0) and extracts App I (inspector checklist) + App J (citation guidance) excerpts into structured JSON. Write to `data/references/osha-nep.json` with `excerpts.app_i` and `excerpts.app_j` fields.

- [ ] **Step 2:** Add `render_work_rest_table` to `scripts/04_render_diagrams.py`. The table reproduces NIOSH 2016-106 §6 cells: WBGT × work intensity → minutes of work per hour. Use the three ink colors to band the rows (Air = NA, HI = "feels like" zones, WBGT = the rows that actually drive the decision). Caption + source citation in the figure.

- [ ] **Step 3:** Run, inspect, commit:
  ```bash
  uv run --project scripts python scripts/03_osha_references.py
  uv run --project scripts python scripts/04_render_diagrams.py --target work-rest-table
  git add scripts/ data/diagrams/work-rest-table.svg data/references/osha-nep.json
  git commit -m "data: OSHA NEP excerpts + NIOSH §6 work-rest table diagram"
  ```

### Task 5.4: Build `src/components/work-rest-table.js` (Ch 8 hero) + write Ch 8 body

**Files:** Create: `src/components/work-rest-table.js`, Modify: `index.html` (Ch 8 section), `src/main.js`, `src/styles.css`

- [ ] **Step 1:** Component is mostly a wrapper around the static SVG with hover-target rows that, on hover, show a popover with the source NIOSH cell.

- [ ] **Step 2:** Author Ch 8 body prose (~500–600 words) covering:
  - the wall thermometer is the worst of the three for any decision that matters
  - HI triggers the OSHA NEP heat-priority-day designation
  - WBGT supports specific work/rest orders on specific jobsites; without WBGT, citation defense is structurally weaker
  - the HeatCompass single-paragraph mention (no CTA gate) at the end

- [ ] **Step 3:** Side dispatch + citation chips: NIOSH 2016-106 §6, OSHA App-J language, ACGIH 2025 TLV.

- [ ] **Step 4:** Commit:
  ```bash
  git add src/components/work-rest-table.js src/main.js src/styles.css index.html
  git commit -m "feat(ch8): practitioner chapter — work/rest table + body + HeatCompass mention"
  ```

### Task 5.5: Closing footer

**Files:** Modify: `index.html` (after Ch 8), Create: `data/references/_manifest.json`

- [ ] **Step 1:** Below Ch 8, add the closing footer per spec §6.5:
  - "this is a lab, not advice" reiteration
  - references list (generated at build time from `data/references/*.json` via a small Python script `scripts/06_render_references.py`, OR hand-maintained — pick one and commit either way)
  - devrel post link (placeholder URL until Phase 6 lands the post)
  - data-source manifest (lists every JSON in `data/`)
  - the C/F toggle was already added in the persistent footer in Phase 2 — verify it's still working

- [ ] **Step 2:** Commit:
  ```bash
  git add index.html data/references/_manifest.json scripts/06_render_references.py
  git commit -m "feat(footer): closing references list + data manifest + disclaimer"
  ```

### Task 5.6: Smoke-test Act III + open PR

**Files:** none (verification)

- [ ] **Step 1:** Walk through Ch 7–8 in browser. Verify:
  - Mode toggle in Ch 7 cleanly switches between sandbox and live-NWS
  - Live NWS with ZIP 85003 (Phoenix) populates the three numbers + 6-hour chart
  - Error states behave: invalid ZIP → inline error; offline → fallback message
  - Work-rest table renders; hover popovers show NIOSH cell source
  - Body prose includes the HeatCompass single-paragraph mention without a CTA gate

- [ ] **Step 2:** Screenshots at 360/768/1280 → `notes/screenshots/phase-5/`.

- [ ] **Step 3:** Open PR `Phase 5: Act III — Application (Ch 7–8)`, review, update `DEVREL.md`.

---

## Phase 6 — Polish + DevRel A/B

Sequence after Phases 3–5 land. Final visual + a11y polish, OG/favicon, viewport regression via `claude-in-chrome`, the comparison post draft, the session-report run.

### Task 6.1: Author `favicon.svg` and `og.svg`

**Files:** Create: `favicon.svg`, `og.svg`

- [ ] **Step 1:** `favicon.svg` — three thin thermometer marks side by side in the three ink colors (`#3F5160`, `#A45A2A`, `#702424`) on a `#F5EFDF` cream square. Keep ≤2 KB. Test rendering at 16×16 and 32×32.

- [ ] **Step 2:** `og.svg` — 1200×630 px. Three big mono numbers (`95 °F / 105 °F / 82 °F`) in the metric ink colors, with the tag line `three metrics. one heat day. three different decisions.` in display serif beneath. Save as SVG (Cloudflare Pages serves it as the OG image with the right MIME).

- [ ] **Step 3:** Commit:
  ```bash
  git add favicon.svg og.svg
  git commit -m "brand: favicon + OG image (three numbers, three ink colors)"
  ```

### Task 6.2: A11y audit pass

**Files:** modify various as discovered

- [ ] **Step 1:** Use `claude-in-chrome` from the Pi to run a keyboard-only walkthrough of Ch 4 (scenario flipper) and Ch 7 (sandbox + live NWS). Tab order should make sense; focus rings should be visible; arrow keys should flip scenarios; `Enter` should confirm ZIP entry.

- [ ] **Step 2:** Run a screen-reader spot check (VoiceOver if available; ChromeVox via `claude-in-chrome`) on the same two chapters. Verify `aria-live="polite"` on the three-number-strip and sandbox readout, single `<h2>` per chapter, citation chips have `aria-describedby`.

- [ ] **Step 3:** Contrast scan on the live page. Body text ≥7:1, secondary ≥4.5:1, citation chips ≥4.5:1. Fix any that fail.

- [ ] **Step 4:** Commit fixes as found:
  ```bash
  git add src/styles.css src/components/ index.html
  git commit -m "a11y: keyboard + screen-reader + contrast audit fixes"
  ```

### Task 6.3: Viewport regression with `claude-in-chrome`

**Files:** Create: `notes/screenshots/baseline/`

- [ ] **Step 1:** Capture canonical screenshots at 360×640, 768×1024, 1280×800 for every chapter (Ch 0–8). Save under `notes/screenshots/baseline/<chapter>-<viewport>.png`.

- [ ] **Step 2:** Commit baseline. Future regressions can diff against these.

### Task 6.4: Run `session-report` for the build window

**Files:** Create: `DEVREL.md` (updated), `notes/session-reports/`

- [ ] **Step 1:** Run the `session-report` skill against the heat-metrics-lab build window (start = first commit timestamp from `git log --reverse --format=%aI | head -1`; end = now). Save the generated HTML report under `notes/session-reports/`.

- [ ] **Step 2:** Run `session-report` again against the heat-protein-lab build window (same skill, restricted to that project's session range — `--project heat-protein-lab`). Save under `notes/session-reports/heat-protein-lab-reference.html`.

- [ ] **Step 3:** Extract the comparison-axes data points from both reports — total tokens, per-skill spend, cache-hit rate, top prompts. Fill in the table in `DEVREL.md` §12.3 with the real numbers.

- [ ] **Step 4:** Commit:
  ```bash
  git add notes/session-reports/ DEVREL.md
  git commit -m "devrel: session-report A/B between heat-metrics-lab and heat-protein-lab builds"
  ```

### Task 6.5: Draft the comparison post

**Files:** Create: `notes/devrel/post-2026-XX-XX-anthropic-vs-google-heat-explainer.md`

- [ ] **Step 1:** Draft a ~2000-word craigmerry.com blog post comparing the two builds. Use the structure from heat-protein-lab's Beat 5 retro for tone consistency. Sections:
  - Same brief, different toolchain — what we set out to compare
  - What heat-protein-lab used: Antigravity 2.0 + Stitch + Science Skills
  - What heat-metrics-lab used: Claude Code + playground + scrollytelling + session-report + frontend-design
  - What was easier on the Anthropic side (subagent-driven parallelism, claude-in-chrome viewport tests, the session-report quantitative spine)
  - What was harder (any honest deficits surfaced in the build — fill from `DEVREL.md` observations)
  - The shared infrastructure (Cloudflare Pages, vanilla HTML, matplotlib for figures)
  - The data — the `session-report` numbers from Task 6.4

- [ ] **Step 2:** Mirror the post into `posts/<date>-anthropic-vs-google-heat-explainer/` to be canonical at heat-metrics-lab.pages.dev/posts/ (heat-protein-lab pattern).

- [ ] **Step 3:** Commit draft:
  ```bash
  git add notes/devrel/ posts/
  git commit -m "devrel: comparison post draft — heat-metrics-lab vs heat-protein-lab toolchain A/B"
  ```

### Task 6.6: Flip repo public

**Files:** none (operator action)

- [ ] **Step 1:** Confirm with operator that v1 is shippable. After confirmation:
  ```bash
  gh repo edit craigm26/heat-metrics-lab --visibility public --accept-visibility-change-consequences
  ```

- [ ] **Step 2:** Update `README.md`'s "Where it lives" section to include the live `heat-metrics-lab.pages.dev` URL + the devrel post location once it's published on craigmerry.com.

- [ ] **Step 3:** Commit:
  ```bash
  git add README.md
  git commit -m "docs: README — repo public, live URLs"
  git push
  ```

### Task 6.7: Final `verification-before-completion` pass

**Files:** none (verification)

- [ ] **Step 1:** Invoke `superpowers:verification-before-completion`. Confirm:
  - CI workflow green (drift check + lint + deploy)
  - All 12 reference cases pass the drift gate
  - Live URL renders correctly at 360/768/1280
  - All citations resolve to real URLs (manual click-through on each citation chip)
  - C/F toggle catches every °C literal (regex grep `°C` in built `index.html` minus exempted regions; result should be 0 outside of `<span class="temp">`)
  - No Google-hosted asset in the network panel (DevTools → Network → filter for `googleapis.com`, `googleusercontent.com`, etc.; expected: zero requests)
  - `prefers-reduced-motion: reduce` actually zeros animations (test by toggling in DevTools)

- [ ] **Step 2:** If everything passes, the project is at v1. Tag:
  ```bash
  git tag -a v1.0.0 -m "v1.0.0 — heat-metrics-lab launch"
  git push --tags
  ```

- [ ] **Step 3:** Save a memory entry recording the ship state (mirror of heat-protein-lab's `project_heat_protein_lab_created_2026_05_25.md`).

---

## Self-Review Notes (post-write check)

**Spec coverage check (skimmed §-by-§):**
- §1 Overview — covered by Phase 0 docs (README, PROJECT.md, AGENTS.md, CLAUDE.md, DEVREL.md, DESIGN.md)
- §2 Audience — covered implicitly by Ch 1-8 body+side dispatch tasks
- §3 Scope — in/out items addressed; v2 deferrals carried as "OUT OF SCOPE" comments where relevant
- §4 Architecture — Phases 0, 1, 2 build the pipeline + skeleton
- §5 Skill stack — Phase 0 Task 0.2 installs plugins
- §6 Chapter outline — Phases 3, 4, 5 (one per act)
- §7 Data model — Phase 1 (formulas) + Phase 4 Task 4.1 (scenarios) + Task 4.2 (grids) + Phase 3 (references) + Phase 5 Task 5.3 (OSHA refs)
- §8 Components — distributed across Phase 2 (skeleton components) and Phases 3-5 (chapter components)
- §9 Repo/brand/deploy — Phase 0 (repo + deploy) + Phase 2 (palette + tokens) + Phase 6.1 (favicon + OG)
- §10 Hard constraints — Phase 1.7-1.8 (drift gate CI), Phase 6.7 (final verification pass)
- §11 Testing layers — Phase 1 (unit + drift), Phase 6.2 (a11y), Phase 6.3 (viewport regression), Phase 5.6 (live NWS happy path covered by smoke test — explicit hard-gate version is the final verification pass in 6.7)
- §12 DevRel — distributed: `DEVREL.md` stub in Phase 0.6, observations after each phase, Phase 6.4 quantitative spine, Phase 6.5 comparison post
- §13 Open deferrals — non-blocking, no plan tasks needed

**Placeholder scan:** No "TBD" / "implement later" / "add error handling" without code blocks. Long body-prose tasks (3.5, 3.6, 3.7, 4.4, 5.4) give specific word counts, paragraph outlines, and references to embed — the engineer has enough to write.

**Type consistency:** `heatIndexC`, `wbgtIndoorC`, `wbgtOutdoorC` (JS, camelCase) and `heat_index_c`, `wbgt_indoor_c`, `wbgt_outdoor_c` (Python, snake_case) used consistently. Event names `chapter-active`, `temp-unit-changed` used consistently. localStorage keys `hml-unit`, `hml-scenario` used consistently. Component function names `init*` used consistently.

**Spec requirements with no task:** none found.
