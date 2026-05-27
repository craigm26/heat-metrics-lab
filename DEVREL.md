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

_To come._

### Phase 1 observations

_To come._

### Phase 2 observations

_To come._

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
