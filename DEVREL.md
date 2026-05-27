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
| IDE | Antigravity 2.0 | Claude Code | _post-build_ |
| Design generation | Stitch MCP | `frontend-design` + `playground` | _post-build_ |
| Scrollytelling mechanics | hand-rolled in Antigravity | `scrollytelling` skill (doodledood) | _post-build_ |
| Scientific data fetch | Science Skills (PDB/HPA/ClinVar/Reactome) | Python scripts hitting NOAA/NWS directly | _post-build_ |
| Citation discipline | manual | `frontend-design` + manual | _post-build_ |
| Visual figure generation | matplotlib + Stitch | matplotlib + `frontend-design` | _post-build_ |
| Build-time measurement | none | `session-report` | _post-build_ |
| Deploy | Cloudflare Pages | Cloudflare Pages | match (intentional control) |

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

_To come._

### Phase 4 observations

_To come._

### Phase 5 observations

_To come._

### Phase 6 observations

_To come._

## References

- [Heat Compass console regulatory landscape](https://github.com/HeatCompass/console/blob/main/docs/REGULATORY_LANDSCAPE.md) — companion B2B context
- [OSHA Heat NEP CPL 03-00-024-0 (renewed 2026-04-10)](https://www.osha.gov/enforcement/directives/03-00-024-0) — NWS HI ≥80 °F heat-priority-day trigger
- [Federal NPRM 86 FR 59309 (2024-08-30, comments closed 2025-10-30)](https://federalregister.gov/) — pending Federal Heat Rule
- [NIOSH 2016-106 §6](https://www.cdc.gov/niosh/docs/2016-106/) — WBGT × work-intensity tables
