# DEVREL.md — heat-metrics-lab A/B comparison

> This project is the Anthropic-side counterweight to [heat-protein-lab](https://github.com/craigm26/heat-protein-lab). Heat-protein-lab was built in **Antigravity 2.0 + Stitch MCP + Google DeepMind Science Skills** — a celebration of Google's IDE and skill ecosystem. This site is built entirely in **Claude Code + the Anthropic skill/MCP ecosystem** (superpowers, frontend-design, playground, scrollytelling, session-report) with no Google tooling. The build experience is logged here and the final comparison post lives on [craigmerry.com](https://craigmerry.com/blog/).

## Build log (filled in per-phase)

### Phase 0 — Bootstrap

_To be filled in as Phase 0 ships._

### Phase 1 — Formulas + Drift Gate

_To be filled in as Phase 1 ships._

### Phase 2 — Scrollytelling skeleton

_To be filled in as Phase 2 ships._

### Phase 3 — Act I: Anatomy

_To be filled in as Phase 3 ships._

### Phase 4 — Act II: Divergence

_To be filled in as Phase 4 ships._

### Phase 5 — Act III: Application

_To be filled in as Phase 5 ships._

### Phase 6 — Polish + DevRel

_To be filled in as Phase 6 ships._

## A/B comparison axes (post-build findings)

| Axis | Google side (heat-protein-lab) | Anthropic side (heat-metrics-lab) | Finding |
|---|---|---|---|
| IDE | Antigravity 2.0 | Claude Code | Both require operator-side plugin install; no clear winner on setup friction |
| Design generation | Stitch MCP | `frontend-design` + `playground` | Claude-side produced distinctive SVG diagrams with Tufte critique passes; Stitch MCP produced richer interactive UI scaffolding |
| Scrollytelling mechanics | hand-rolled in Antigravity | hand-rolled (IntersectionObserver) | `scrollytelling` skill not used — heat-protein-lab's mechanics ported cleanly enough |
| Scientific data fetch | Science Skills (PDB/HPA/ClinVar/Reactome) | Python scripts hitting NOAA/NWS directly | Google Science Skills give structured domain data for free; Claude-side fetched raw API then formatted manually |
| Citation discipline | manual | `frontend-design` + manual | No clear winner; both builds landed 10+ citations with similar rigor |
| Visual figure generation | matplotlib + Stitch | matplotlib + `frontend-design` + `tufte-viz` | `tufte-viz` caught the Phase 4 normalization bug that would have shipped silently |
| Formula correctness gating | visual inspection | `advisor` pre-implementation review + drift gate CI | Advisor caught the WBGT globe-temp formula producing 3-7 °F error before any code shipped; no equivalent on Google side |
| Build-time measurement | none | `session-report` | See build telemetry table below |
| Deploy | Cloudflare Pages | Cloudflare Pages | match (intentional control) |

### Build telemetry (session-report A/B)

_Methodology: both builds ran on the same Pi under the same `-home-craigm26` project-transcript directory. Per-project slicing is by time window only (not project flag). Heat-protein-lab = `--since 2026-05-25T00:00:00-07:00` by-day bucket for 2026-05-25. Heat-metrics-lab = `--since 2026-05-27T00:00:00-07:00` (Run A). Full HTML reports saved in `notes/session-reports/`._

| Metric | heat-protein-lab (2026-05-25) | heat-metrics-lab (2026-05-27) | Finding |
|---|---|---|---|
| **Total tokens (input + output)** | 483.6M | 180.8M | HML was **2.7× cheaper** — driven by fewer git-worktree sessions and shorter subagent chains |
| **Cache-hit rate** | ~97% (3-day combined) | 96.5% | Both builds stayed well above the 85% healthy threshold |
| **Sessions / API calls** | 6 sessions | 10 sessions / 1,822 API calls | HPL had fewer but larger sessions (Antigravity batch model vs Claude Code interactive) |
| **Subagent calls** | ~132 (derived: 195 combined − 63 HML) | 63 calls, avg 1.17M/call | HPL's worktree-isolation pattern drove more subagent spawns; HML's dispatch chains were larger per call |
| **Top skill (HML)** | `superpowers:using-git-worktrees` (32.7M, HPL-specific) | `superpowers:subagent-driven-development` (43.2M, 24% of input) | Worktrees vs dispatch are the primary architectural difference in the cost structures |
| **Top 5 skills (HML)** | using-git-worktrees / using-superpowers / test-driven-development / brainstorming / writing-plans | subagent-driven-development / executing-plans / tufte-viz / writing-plans / playground | `tufte-viz` is unique to HML; `using-git-worktrees` is unique to HPL |
| **Top prompt** | "Proceed." (94.7M tokens, 11.2% of combined) | "1" (54.2M tokens, 30% of HML total) | Both builds dominated by single-word continuation prompts launching large execution chains |
| **Formula bug caught pre-ship** | None (visual inspection) | Yes — advisor caught 3-7 °F WBGT error before code shipped | Strong Claude-side win; no equivalent on Google side |
| **Visualization bug caught pre-ship** | None | Yes — `tufte-viz` caught Phase 4 normalization flaw hiding the divergence story | Strong Claude-side win; no equivalent on Google side |

_Note: heat-protein-lab telemetry is derived from the by-day bucket for 2026-05-25 in the combined 3-day window run — it captures all sessions active on that day under `-home-craigm26`. Session-level attribution to HPL specifically is not possible since both projects ran in the same cwd. The 2026-05-25 bucket does include a few other short sessions (~5%) that were not HPL. Treat HPL numbers as directional._

## Comparison post

The final A/B write-up will be drafted at v1 polish and published to both [craigmerry.com/blog/](https://craigmerry.com/blog/) and mirrored at `posts/` in this repo. It will be honest about wins and losses on both sides — that's the whole point of running the A/B in good faith.

## Phase observations

_To be filled in as each phase ships — one section per phase below._

### Phase 0 observations

Bootstrap was uneventful but surfaced one structural finding about subagent-driven dev on Claude Code: **plugin installs require slash commands and cannot be invoked from a subagent.** `/plugin install scrollytelling@doodledood` and the playground/session-report installs had to be handed back to the operator as a side-channel action. On the Google side, Antigravity 2.0's Skills panel handles plugin enablement through the IDE chrome and is similarly out-of-band for agents; no clear winner — both surfaces require operator interaction for one-time setup steps.

Phase 0 cost: 5 commits via a single Haiku implementer dispatch (~3 min). Spec + quality review (Haiku + Haiku) caught two issues — broken anchor links in PROJECT.md (`#phase-3-act-i-anatomy-ch-03` referencing headings that don't exist in the plan file because the plan uses "Content + Diagrams" not "Anatomy") and a duplicated reduced-motion principle in DESIGN.md. Both fixed via one fix-subagent dispatch.

### Phase 1 observations

**The big finding of this phase came from the advisor, before any code shipped.** The plan's outdoor-WBGT formula `Tg = Ta + 0.0345 * S / wind_ms^0.4` was described as "matches Liljegren 2008 within ~1 °C." Empirical check against five published Liljegren reference cases showed it actually produced WBGT readings **3-7 °F too high** — RMSE 6.68 °F against an 0.5 °F drift gate. A 30-minute tuning pass replaced it with `Tg = Ta + 0.0125 * S / wind_ms^0.3` (RMSE 1.37 °F). The plan was amended in commit `9ccb9e7` before any implementer touched the formula.

This is a meaningful devrel data point. On the Google side (heat-protein-lab), formulas were either lookup-table values from PDB/HPA/ClinVar (via Google Science Skills) or hand-written matplotlib plotting code reviewed visually. No equivalent "is this formula even right" sanity check happened during heat-protein-lab. The advisor's pre-implementation review is a Claude-side affordance that meaningfully saves rework.

Three implementer dispatches in Phase 1 (A: Python + reference table + tuning notes; B: JS TDD on `src/metrics.js`; C: drift script + CI workflow). All three landed cleanly with one APPROVED + two APPROVED_WITH_FOLLOWUPS verdicts (FOLLOWUPS were MINOR doc polish, deferred).

**Drift gate result: JS-vs-Python is bit-for-bit identical across all 24 check-rows.** Max delta vs reference values: 0.005 °C = 0.009 °F. That's a 56× safety margin against the 0.5 °F gate. The line-for-line port discipline (with the implementer dispatch prompt explicitly calling it out) produced a perfect translation.

Token use, approximate (full numbers come from `session-report` at end-of-build): Dispatch A ~50k, Dispatch B ~36k, Dispatch C ~37k. Reviewers (Haiku) ~70k + ~72k for spec/quality on A; ~71k for quality on B; inline verification on C. Total Phase 1 ~340k tokens; cheap.

Skill stack used in Phase 1:
- `superpowers:writing-plans` (this plan)
- `superpowers:subagent-driven-development` (the dispatch ceremony)
- `superpowers:test-driven-development` (Dispatch B's red→green cycle)
- `advisor` (caught the WBGT formula bug before code)

`scrollytelling`, `playground`, `session-report` not yet exercised (Phase 2+).

### Phase 2 observations

Three implementer dispatches, all Sonnet, all DONE in one round each:

- **Dispatch D** (`ca629e8`, 307 lines): full brand stylesheet + 9 chapter section stubs with structured `data-readings='{...}'` JSON + persistent strip markup + unit-toggle button. The `data-readings` schema decision (Ch 1 = air only, Ch 2 = air+HI, Ch 3+ = all three) lived in the dispatch prompt as inline guidance — the implementer carried it through faithfully.
- **Dispatch E** (`4d2db03`, 219 lines): five JS components — temp-toggle, temp-text auto-wrap, chapter-observer (IntersectionObserver), three-number-strip, main.js boot. The non-obvious wiring detail caught in the dispatch prompt before code was written: the hero markup uses an element-node sibling for the `°C` suffix (`<span class="hero-numbers__unit"> °C</span>`), so `rerenderAll`'s sibling-loop needs to handle both text-node AND element-node siblings to repaint correctly. This was identified pre-implementation and resolved cleanly.
- **Dispatch F** (`1c2fda8`, 163 lines): citation-chip helper with lazy-loaded source metadata + tooltip styles + example reference JSON. Fully a11y-tested (role/tabindex/aria-label/aria-pressed; Escape key dismiss; both hover and focus triggers).

Skipped formal subagent-driven spec reviews on Dispatch D and E in favor of inline `grep` verification — the dispatches were structurally explicit enough (verbatim CSS/HTML/JS in the prompt) that the spec compliance check reduced to "did the implementer write what was prescribed" which is fast to verify by reading the diff. This is a deviation from strict subagent-driven-dev that I'll note in the comparison post: with prompts that fully specify the artifact, the spec-review stage's marginal value drops. For algorithmic work (Phase 1 formula correctness, Phase 4 scenario fetcher, etc.) the spec review keeps its full value.

`scrollytelling` skill from doodledood was NOT used — Phase 2 worked directly from heat-protein-lab's hand-rolled IntersectionObserver pattern (which is well-understood and works). This is itself a finding: the precedent project's mechanics carry over cleanly enough that a dedicated scrollytelling skill is supplementary, not load-bearing.

Token spend (approximate, full breakdown from `session-report` later): Dispatch D ~41k, Dispatch E ~43k, Dispatch F ~35k. Phase 2 total ~120k. Markedly cheaper per dispatch than Phase 1 because Phase 2 is structurally explicit (markup + components with predetermined shapes) while Phase 1 involved formula tuning + cross-implementation validation.

Phase 2 closeout state: scrollytelling skeleton runs in-browser (smoke test pending push to Cloudflare Pages); all five components syntax-check via `node --check`; foundation is ready for Phase 3/4/5 to fan out in parallel.

### Phase 2.5 mid-session finding — `tufte-viz` skill (aparente)

Mid-session, the operator surfaced [aparente's `tufte-viz` skill gist](https://gist.github.com/aparente/e48c353755958621b3c0004593105a90) — Edward Tufte's data visualization principles packaged as a Claude Code skill. Anthropic author. Already-shipped, well-built. Two reference files (~13 KB total) covering the canonical Tufte principles (data-ink, chartjunk, integrity, small multiples, density, multifunctioning elements, aesthetics + the 7-question Tufte Test) plus analytical-design extensions (six principles of analytical design, sparklines, layering, micro/macro, range-frames, confections, causality + extended 14-question test).

**Why it matters for this build:** heat-metrics-lab has five chart-class artifacts remaining (Ch 2 nomogram, Ch 3 three-thermometer rig, Ch 5 divergence map, Ch 7 sparkline mini-chart, Ch 8 NIOSH table) + the three-number-strip. Every one of them is a near-direct application of one of Tufte's principles. Installing `tufte-viz` and running a critique pass before each chart's implementation is a concrete, low-risk quality win for Phases 3-5.

**Why it matters for the devrel A/B:** the Google-side build (heat-protein-lab) used `science-skills` for *data* (PDB structures, ClinVar variants, Reactome pathways) but had no equivalent guidance for *visualization quality*. Charts were vibes-judged. The Anthropic ecosystem has Tufte-grade chart guidance available as a community skill — meaningful axis for the post.

Install path captured at [`notes/devrel/install-tufte-viz.sh`](../../notes/devrel/install-tufte-viz.sh) — the gist isn't in a Claude marketplace, so the script clones the four files into `~/.claude/skills/tufte-viz/` manually. Run + restart Claude Code in the next session.

**Gaps surfaced:** `tufte-viz` is print-tradition. It doesn't address (1) scroll-driven progressive reveal, (2) interactive controls coexisting with data display, (3) citation discipline integrated into the chart. If those gaps actually bite during Phase 3-5 (not in the abstract), a complementary `narrative-charts` skill is a Phase 6 follow-up candidate.

### Phase 3 observations

Two implementer dispatches (both Sonnet) + one manual commit-and-push pass for the diagrams. Three diagrams + three chapters + ten new citation reference files, six commits total.

**Dispatch G** (diagrams, ~83k tokens) — produced `scripts/04_render_diagrams.py` with three matplotlib render functions: Stevenson screen, NWS heat-index nomogram, three-thermometer rig. The implementer **invoked tufte-viz at design time and again as a critique pass** per the dispatch instruction. The output included a detailed eraser-test/collision-test/7-question Tufte walk through the nomogram. The implementer hit a thinking budget and stopped before committing — the three SVGs and the script were on disk but uncommitted. **Controller (me) finished the commit pass** with one commit per diagram, putting the applied Tufte principle in each commit message (`f59c370` layering; `096d198` range-frame + comparison; `fc88d8c` multifunctioning color). This is a real workflow note for the comparison post: the "subagent generates + critiques but stops short of commit" pattern is recoverable but adds controller overhead.

**Dispatch H** (Act I prose, ~70k tokens) — produced ~1,500 words of body prose across Ch 1, 2, 3 plus 10 citation reference JSON files (Stevenson 1864, WMO CIMO, OSHA NEP CPL 03-00-024-0, Steadman 1979, Rothfusz 1990 NWS SR-90, Federal NPRM 2024, Yaglou-Minard 1957, NIOSH 2016-106, ACGIH TLV, ISO 7243). Three commits, one per chapter. Word counts within target ranges (Ch 1 379, Ch 2 472, Ch 3 554). Side dispatches in `<aside class="side-dispatch">` voiced for EHS practitioners with embedded `<cite>` chips.

**Smoke test passed inline**: 3/3 SVG embeds resolve, 10/10 `<cite data-source>` attributes have matching JSON files, 7/7 JS modules syntax-check, drift gate still PASS (24/24 cases), 8/8 critical assets serve 200 OK via local `http.server`.

**Tufte-viz skill verdict so far:** delivers real analysis-shaped output rather than generic praise. The nomogram critique caught a specific potential collision between an annotation box and a contour line in the lower-right zone — a concrete actionable finding, not vibes. The skill's "eraser test" + "collision test" + "7-question Tufte test" structure forces the implementer to walk through specific reasoning. Strong devrel data point: this kind of structured critique was absent in the Google-side build (heat-protein-lab chart-design pass was visual-inspection-only).

**One follow-up flagged for Phase 6:** the `°F` literals in side dispatches stay as `°F` regardless of the C/F toggle state (the `temp-text.js` walker only matches `°C` literals). For regulatory quotes (e.g., "OSHA Heat NEP triggers at HI ≥80 °F"), keeping the source-document units is arguably correct — but it creates a slight UX inconsistency. Phase 6 polish: either (a) document the convention explicitly ("regulatory quotes use source-document units"), (b) extend `temp-text.js` to also handle `°F` and convert bidirectionally, or (c) add parenthetical conversions next to regulatory thresholds. Not blocking v1 ship.

### Phase 4 observations

Three implementer dispatches (Sonnet) + one significant iteration on the divergence-map normalization.

**Dispatch I (data, ~48k tokens)** — 5 scenario JSONs + outdoor/indoor divergence grids. Hand-curated values rather than NOAA NCEI fetch (no API key, no rate-limit fragility); three of five scenarios are exact matches to the Phase 1 reference-cases.json drift-gated values (phoenix-aug-12pm, warehouse-indoor, lytton-bc-2021), keeping a single source of truth for those cells.

**Dispatch J (Ch 4 scenario flipper, ~62k tokens)** — applied the `playground` skill's single-state-object + preset-chips pattern. The flipper dispatches a `chapter-active`-shaped event on chip click so the persistent three-number-strip stays in sync; lasts selection persists via `localStorage["hml-scenario"]`. 392-word body prose framing the divergence using Phoenix vs warehouse vs Lytton as the dramatic anchors.

**Dispatch K (Ch 5 divergence map + Ch 6 blind-spot cards, ~84k tokens)** — invoked `tufte-viz` for both. **The implementer surfaced a real spec problem during their own critique pass**: under the original threshold-relative normalization, WBGT won only 2/1140 outdoor cells and 0/1140 indoor — HI's much larger ceiling (~60°C vs WBGT's ~35°C) meant HI's threshold-relative breach was always larger. The implementer rewrote the Ch 5 prose to honestly describe what the map showed (HI-dominant everywhere) rather than asserting the spec's intended divergence story. That honesty surfaced the issue rather than burying it. The fix (commit `8c9da92`): renormalize by each metric's dynamic range above threshold (Air 35→50, HI 32.2→54, WBGT 28→35). New distribution: outdoor WBGT 8.9% (a meaningful band), indoor WBGT 0% (which is itself a finding — indoor WBGT mathematically tracks HI when there's no solar load, so "WBGT measurement earns its keep outdoors" becomes the chapter's key claim). Ch 5 prose rewritten again (`63abfb9`) to match the corrected map.

**Operator-side commit (`110888d`)** landed mid-session: dropped the GitHub Actions deploy workflow in favor of local `npx wrangler pages deploy`. Removes the deferred CF Pages secrets blocker; deploys become a deliberate operator action rather than a per-push automatic that was failing silently.

**Real win for the review-driven workflow:** the implementer's tufte-viz self-critique caught a substantive design issue (the normalization that hid the educational point of the entire act) before commit. Without the structured critique pass, the bug would have shipped silently — the map would have rendered something that *looked* right (colored cells) but failed to make its argument. Strong devrel data point for the comparison post.

**Tufte-viz follow-up gap:** the skill's analytical-design reference covers "layering" and "comparison" thoroughly but doesn't address **the calibration of multi-metric encodings** — i.e., when you paint regions by "which metric dominates," the normalization choice itself is a design decision the skill could give guidance on. Phase 6 follow-up candidate: a small extension to the skill (or a complementary skill) about choosing normalization for multi-metric severity maps.

### Phase 5 observations

Two implementer dispatches + inline closing-footer write. All 9 chapters now populated; zero placeholders remain in `index.html`.

**Dispatch L (Ch 7 sandbox + live NWS, ~78k tokens)** — applied `playground` skill's single-state-object + preset-chips pattern across both modes. Sandbox: four range sliders (air temp, RH, wind, solar) → three live-computed metrics via the same `src/metrics.js` that drives the drift gate. Live NWS: lat/lng input + two preset coordinate buttons (Phoenix, Houston) → two-stage `api.weather.gov` fetch (`/points/{lat},{lng}` → `forecastHourly`) → renders current-hour readout + 6-hour mini-chart as inline SVG with three lines (air/HI/WBGT) + endpoint markers. Solar estimated client-side from cloud cover + solar elevation (simplified NOAA formula). The CSP already allowed `api.weather.gov` in `connect-src` from Phase 0, so no infrastructure change needed — the live mode just works.

**ZIP-input pivot to lat/lng:** the original spec called for ZIP code geocoding via Open-Meteo. The implementer correctly noted that adding a geocoder host to the CSP allowlist contradicts the "no third-party services" hard constraint. They pivoted to direct lat/lng input + two preset coordinate buttons (which cover the most likely demo cases — Phoenix and Houston). Cleaner; honest about the v1 simplification.

**Dispatch M (Ch 8 practitioner chapter + work-rest table, ~67k tokens)** — `tufte-viz` applied to the NIOSH work-rest table render. Multifunctioning-elements principle: row tints (cream → amber → oxblood) carry severity encoding so no separate legend needed. The bottom row in WBGT oxblood ("stop work — exceeds NIOSH ceiling") is the chapter's load-bearing visual moment. Body prose (438 words) walks the reader through how OSHA inspectors actually use these tables. HeatCompass mention kept appropriately neutral — single paragraph, no waitlist link, no pitch language.

**Closing footer (inline)** — colophon section after Ch 8 with: "lab, not advice" reiteration (oxblood left border for emphasis), full source list of all 10 cited references with direct URLs, sibling-project A/B context (heat-protein-lab comparison), source repo link, MIT license note, data manifest enumerating the scenarios + grids + diagrams + references + drift-gate cases.

**Phase 5 smoke test passed inline**:
- 13/13 JS modules syntax-check
- 0 placeholders remaining (all 9 chapters complete)
- Drift gate still PASS (Phase 1 contract intact)
- 8/8 critical assets serve 200 OK locally
- Final HTML: 36.8 KB, ~3,965 body words

**Tufte-viz consistent contribution across Phases 3-5:** the skill earned its install. Across 4 diagram critiques (Stevenson screen, HI nomogram, three-thermometer rig, NIOSH work-rest table) and 2 interactive critiques (divergence map, scenario flipper), the structured eraser/collision/7-test reviews caught a real bug (the divergence-map normalization in Phase 4) and produced specific principle applications in every other case. Strong devrel data point for the comparison post.

### Phase 6 observations

**Task 6.4 (session-report A/B) complete.** Two HTML reports generated under `notes/session-reports/`:
- `heat-metrics-lab-build-window.html` — Run A, `--since 2026-05-27T00:00:00-07:00`, 180.8M tokens
- `combined-3d-window.html` — Run B, `--since 2026-05-25T00:00:00-07:00`, 847.4M tokens (3-day: HPL + other work + HML)

Key finding: heat-metrics-lab consumed 180.8M tokens vs heat-protein-lab's ~483.6M — a 2.7× efficiency difference. The primary driver is architectural: HPL used `superpowers:using-git-worktrees` (32.7M alone) for isolation while HML used dispatch-based subagent isolation, which is cheaper per unit of parallel work on a single-machine single-operator build. Both builds landed comparable final artifacts (9-chapter scrollytelling explainers with matplotlib diagrams, citation chips, and interactive figures).

The two pre-ship bug catches (WBGT formula via `advisor`; normalization flaw via `tufte-viz`) are unambiguous Claude-side wins — both were caught before a line of the flawed code shipped, and neither had an equivalent catch on the Google side.

## References

- [Heat Compass console regulatory landscape](https://github.com/HeatCompass/console/blob/main/docs/REGULATORY_LANDSCAPE.md) — companion B2B context
- [OSHA Heat NEP CPL 03-00-024-0 (renewed 2026-04-10)](https://www.osha.gov/enforcement/directives/03-00-024-0) — NWS HI ≥80 °F heat-priority-day trigger
- [Federal NPRM 86 FR 59309 (2024-08-30, comments closed 2025-10-30)](https://federalregister.gov/) — pending Federal Heat Rule
- [NIOSH 2016-106 §6](https://www.cdc.gov/niosh/docs/2016-106/) — WBGT × work-intensity tables
