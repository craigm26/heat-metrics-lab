# PROJECT.md — heat-metrics-lab build plan

> A phased build plan for a public scrollytelling explainer of air temperature, heat index, and WBGT (wet-bulb globe temperature). This project is simultaneously the Anthropic-side counterweight to [heat-protein-lab](https://github.com/craigm26/heat-protein-lab) — a devrel case study in building with Claude Code and the Anthropic skill/MCP ecosystem instead of Antigravity 2.0 and Google Science Skills. Each phase is small enough to ship in a single working session; chapters land on `master` directly with a commit per non-trivial step. See [README.md](./README.md) for the public framing, [DESIGN.md](./DESIGN.md) for visual design, [DEVREL.md](./DEVREL.md) for the A/B comparison log, and [AGENTS.md](./AGENTS.md) for IDE context.

## Project overview

A single, vanilla-HTML scrollytelling page that walks readers through what three core heat metrics measure, what each is blind to, and why the wall thermometer is the worst choice for any decision that matters. Nine chapters (Ch 0–8) across three acts: Anatomy (what each metric is) → Divergence (where they disagree) → Application (how to use them). Client-side JS re-implements Rothfusz 1990 Heat Index and Liljegren-simplified WBGT, validated against Python computations via a 0.5 °F CI drift gate. Cloudflare Pages auto-deploy from `master`.

## Build phases and dependencies

| Phase | Title | Key deliverables | Depends on |
|-------|-------|---|---|
| [Phase 0](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Bootstrap | Scaffold, config, foundational docs, empty page deploying | — |
| [Phase 1](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Formulas + Drift Gate (TDD) | Heat Index + WBGT JS/Python, 12-case reference table, CI gate | Phase 0 |
| [Phase 2](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Scrollytelling Skeleton | HTML structure, scroll triggers, IntersectionObserver, base styling | Phases 0, 1 |
| [Phase 3](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Act I Content + Diagrams (Ch 0–3) | Chapters 0–3 prose, diagrams, citations; three-number strip | Phases 0–2 |
| [Phase 4](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Act II Interactives (Ch 4–6) | Ch 4 scenario flipper, Ch 5 divergence map, Ch 6 blind-spot cards | Phases 0–2 |
| [Phase 5](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Act III Interactives + Practitioner (Ch 7–8) | Ch 7 sandbox + live NWS, Ch 8 practitioner chapter | Phases 0–2 |
| [Phase 6](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) | Polish + DevRel A/B | CSS refinement, a11y audit, visual regression, comparison post | All prior phases |

**Parallel opportunities:** Phases 3, 4, 5 can each be implemented independently in a separate worktree by parallel subagents once Phases 0–2 land. Phase 6 sequences after all three acts ship.

## See also

- [Design spec](./docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md) — full architecture, chapter outline, component specs, hard constraints
- [Implementation plan](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md) — detailed task breakdowns with step-by-step checkboxes
- [References](./references.md) — running bibliography
