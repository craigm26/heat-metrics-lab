# Tweet thread — heat-metrics-lab launch 2026-05-27

X/Twitter handle: [@CraigMerry](https://x.com/CraigMerry)
Status: draft for operator review
Goal: one cohesive thread of 7 tweets that hooks on the A/B framing
against heat-protein-lab, names the two pre-ship bug catches, links
to the four canonical posts + the live page.

Each tweet ≤ 270 characters so it fits comfortably under the 280
limit with room for URL trimming.

---

## Thread (7 tweets)

### 1 — hook

> Two days ago I shipped heat-protein-lab on Google's stack —
> Antigravity 2.0 + Stitch + DeepMind Science Skills.
>
> Today I shipped the same shape on Anthropic's — Claude Code +
> advisor + tufte-viz + subagent-driven-dev.
>
> heat-metrics-lab is live:
>
> https://heat-metrics-lab.pages.dev/

`(thread ↓)`

---

### 2 — what it is

> 9 chapters of scrollytelling about three heat metrics: air temp,
> heat index, WBGT — and why occupational-safety inspectors care
> which one you're reading. 10 cited primary sources, 5 hand-curated
> scenarios, 1140-cell divergence map, no analytics, no PII, MIT.

---

### 3 — the formula bug `advisor` caught

> Phase 1 plan had this WBGT-outdoor globe-temp formula:
>
>   Tg = Ta + 0.0345·S / wind_ms^0.4
>
> The advisor ran it against 5 published Liljegren cases before
> any implementer touched the code. RMSE 6.68 °F.
>
> Corrected to 0.0125/u^0.3 (RMSE 1.37 °F) in commit 9ccb9e7.

---

### 4 — the chart bug `tufte-viz` caught

> Ch 5 divergence map under naive normalization: WBGT wins 2 of
> 1,140 outdoor cells. The map renders fine. The chapter argues
> the opposite of what the map shows.
>
> tufte-viz critique pass surfaced it pre-commit. Range-relative
> normalization → WBGT 8.9%. Commit 8c9da92.

---

### 5 — the numbers

> session-report says:
>
>   • heat-metrics-lab: 180.8M tokens, 96.5% cache, 63 subagents
>   • heat-protein-lab: ~483.6M tokens, ~97% cache, ~132 subagents
>
> 2.7× efficiency gap. Architectural driver: dispatch isolation vs
> worktree isolation.

---

### 6 — the clearest Google win

> heat-protein-lab pulled structured domain data — PDB, AlphaFold,
> HPA, ClinVar, Reactome — directly from Science Skills CLIs.
>
> No Anthropic-side equivalent today. For any explainer in a
> domain with authoritative databases, Science Skills is a real leg
> up.

---

### 7 — close

> Full A/B writeup + Phase 1 deep-dive + Phase 4 deep-dive + the
> launch post:
>
> • https://craigmerry.com/blog/2026-05-27-heat-metrics-lab-shipped/
> • https://craigmerry.com/blog/2026-05-27-the-drift-gate-and-the-advisor/
> • https://craigmerry.com/blog/2026-05-27-when-a-chart-skill-catches-a-design-bug/
> • https://craigmerry.com/blog/2026-05-27-same-brief-two-toolchains/

---

## Character counts (max 280)

| # | Body (rounded) | Note |
|---|---|---|
| 1 | ~265 | hook + URL |
| 2 | ~270 | description |
| 3 | ~265 | advisor catch with formula |
| 4 | ~265 | tufte-viz catch with numbers |
| 5 | ~265 | telemetry table |
| 6 | ~265 | honest Google win |
| 7 | ~270 | four-URL close |

If any tweet runs long, the URL can be replaced with a t.co-shortened
form (~23 chars) which saves ~30-40 characters.

## Posting checklist

- [ ] Post tweet 1 standalone
- [ ] Reply with tweets 2–7 in order
- [ ] Pin tweet 1 to profile through end of week
- [ ] Optional: cross-post tweet 1 to Bluesky and LinkedIn
- [ ] Optional: add `#heatmetrics #wbgt #devrel #claudecode` to tweet 7
