# AGENTS.md — heat-metrics-lab

> Project context file. Claude Code and any other coding agent that follows the AGENTS.md convention should read this at session start. Skim [README.md](./README.md) for the public framing and [PROJECT.md](./PROJECT.md) for the phased build plan.

## What this project is

A public, MIT-licensed scrollytelling explainer about the difference between air temperature, heat index, and WBGT. The page is a static HTML/CSS/JS site that reads pre-computed JSON and SVG diagrams from `data/`. Build-time Python scripts fetch data from NOAA, NWS, and academic sources; client-side JS re-implements Rothfusz 1990 Heat Index and Liljegren-simplified WBGT with a 0.5 °F CI drift gate against Python. See [PROJECT.md](./PROJECT.md) for the chapter outline and build phases.

The project is also being tracked as a developer-relations case study about building with **Claude Code + Anthropic skill/MCP ecosystem** as the counterweight to [heat-protein-lab](https://github.com/craigm26/heat-protein-lab) (Antigravity 2.0 + Google Science Skills). See [DEVREL.md](./DEVREL.md) for the A/B log.

## What this project is **not**

- **Not a clinical or medical tool.** No diagnostic claims. No medical advice. No PII. No accounts. No analytics.
- **Not a prediction or recommendation engine.** The page shows three numbers and links to OSHA/NIOSH guidance; it does not suggest personalized safety decisions.
- **Not a HeatCompass feature.** Sibling context (B2B tool uses these metrics), but this is standalone and public.

If you are about to write code that violates any of those, stop and ask.

## Where things live

| Path | Purpose |
|---|---|
| `src/` | Frontend: HTML components, CSS tokens, JS metrics, scroll mechanics |
| `data/` | Committed build artifacts: scenario JSON, divergence grids, diagrams SVG, reference cases |
| `scripts/` | Build-time Python: NOAA/NWS/academic data fetchers, drift-gate runner |
| `docs/superpowers/specs/` | Full design spec + architecture |
| `docs/superpowers/plans/` | Task-by-task implementation plan with checkboxes |
| `DESIGN.md` | Visual system, brand tokens, component specs, a11y budget |
| `DEVREL.md` | A/B log against heat-protein-lab; comparison-axes table (filled post-build) |
| `PROJECT.md` | Phase overview and dependencies |
| `references.md` | Running bibliography (citations grow per chapter) |

## Skills used in this build

| Skill | When to use | Notes |
|---|---|---|
| `frontend-design` | Polish layer, component styling, avoiding generic AI aesthetics | Installed; use before and after visual chapters |
| `tufte-viz` | Chart design + critique passes (data-ink, lie factor, chartjunk, small multiples, sparklines, analytical design) | Community skill from aparente. Install via `notes/devrel/install-tufte-viz.sh`. Use for every chart in Phases 3-5: Ch 2 nomogram, Ch 3 thermometer rig, Ch 5 divergence map, Ch 7 sparkline mini-chart, Ch 8 NIOSH table |
| `playground` | Ch 4 scenario flipper, Ch 7 sandbox centerpieces | Scaffolds single-state-object pattern + preset chips |
| `scrollytelling` | Scroll-driven narrative structure, section transitions | doodledood community skill; documents scroll patterns |
| `session-report` | End of each phase | Token usage, per-skill spend, cache metrics for `DEVREL.md` |
| `superpowers:subagent-driven-development` | Parallel chapter implementation within each act | Spins up independent tasks with isolated state |
| `superpowers:test-driven-development` | `src/metrics.js` against `data/references/reference-cases.json` | Red-green-refactor for formula correctness |
| `superpowers:verification-before-completion` | Before any merge or "done" claim | Runs tests, checks CSP, diff-reviews code |
| `superpowers:using-git-worktrees` | Phase 3/4/5 parallel work (optional; can work directly on main) | Isolated workspace per act if multiple agents work in parallel |

## Hard constraints (in spec §10, CI-enforced)

1. **JS formulas match Python within 0.5 °F** across 12 reference cases in `data/references/reference-cases.json`. The drift-check script (`scripts/05_drift_check.py`) runs in CI and is a hard gate.

2. **All `°C` and `°F` literals in body copy go through `temp-text` component** so the C/F toggle catches them. A lint script (TBD Phase 2) regex-scans the built HTML and fails if any un-wrapped literals slip through.

3. **No external network requests at page load.** Live NWS fetches only fire on explicit user action in Ch 7.

4. **No font/script/style from a Google host.** Visual grep of the built `index.html` against `fonts.googleapis.com`, `google.com`, etc. must return 0 matches.

5. **`prefers-reduced-motion: reduce` cuts every animation to static end-state.** Manual checklist on each component PR; automated test via `claude-in-chrome` at end of each phase.

6. **Contrast ≥4.5:1 everywhere; ≥7:1 for body text.** Verified with Chrome a11y audit.

## Conventions for this project

- **Commits directly on `main`.** Operator has explicitly authorized this. (No PR flow.)
- **Commit messages in terse imperative lower-case.** Examples: `feat: ch4 scenario flipper`, `data: add lytton-2021 scenario`, `chore: ci drift-gate`.
- **No Google-hosted fonts, scripts, or styles.** All `@import` and `<link rel=stylesheet>` must point to `self` or data: URLs.
- **CSP headers carry `api.weather.gov` in `connect-src` only** (not in `default-src`, that would be too broad).
- **Per-task work lands as a discrete commit.** Squashing is fine, but breaking the changelog into reviewable pieces helps catch mistakes.

## Escalation

If you encounter anything that could harm a worker or mislead a reader — for example, weakening the "this is a lab, not advice" disclaimer, or shipping unverified safety numbers — surface that gap explicitly to the operator first. Don't silently proceed; don't silently decline. Surface the conflict and ask.

## References

- [Full design spec](./docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md)
- [Implementation plan](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md)
- [Sibling project: heat-protein-lab](https://github.com/craigm26/heat-protein-lab)
