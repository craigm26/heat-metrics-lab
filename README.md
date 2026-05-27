# heat-metrics-lab

> An **Anthropic-tooling experiment** that builds a real, citation-grounded, scrollytelling explainer of the difference between air temperature, heat index, and wet-bulb globe temperature (WBGT) — and simultaneously serves as a devrel A/B counterweight to [heat-protein-lab](https://github.com/craigm26/heat-protein-lab) (built with Antigravity 2.0 + Stitch MCP + Google DeepMind Science Skills). This one is built entirely in Claude Code with the Anthropic skill and MCP ecosystem. Not medical advice. A lab.

## What the lab will produce

A single-page, public scrollytelling explainer at `index.html` that walks the reader through what air temperature, heat index, and WBGT each measure, what each is blind to, and why the wall thermometer is the worst of the three for any decision that matters. Interactive chapters include a scenario flipper, a divergence map, a sandbox calculator, and a live NWS panel.

The narrative arc:

| Ch | Title | What it covers |
|---|---|---|
| 0 | The three numbers | Hook + disclaimer — air temp / HI / WBGT at a glance |
| 1 | What the wall thermometer tells you | Air temperature: siting, sources of variance, limitations |
| 2 | What it feels like | Heat index: the Rothfusz polynomial, humidity, still-invisible factors |
| 3 | What it does to a working body | WBGT: the three-thermometer rig, physiology, work/rest thresholds |
| 4 | Same day, three numbers | Interactive scenario flipper — see all three metrics for five real cases |
| 5 | The divergence map | 2D grid — air temp × RH, colored by which metric matters most |
| 6 | Where each metric fails | Honest accounting: what each metric was NOT designed to measure |
| 7 | Try it | Sandbox calculator + live NWS integration (enter your ZIP) |
| 8 | How professionals use these | NIOSH tables, OSHA citations, site measurement vs. this page |

## How this is built

- **Build-time data pipeline.** Python scripts in `scripts/` call NOAA NCEI, NWS, and academic databases via `uv`, writing frozen data into the committed `data/` directory.
- **Static page reads from `data/`.** Vanilla HTML + CSS + ES modules. No build framework, no bundler. IntersectionObserver for scroll triggers, native CSS Scroll-Driven Animations where supported. Client-side heat-index and WBGT re-implementations validated against the Python computation via a 0.5 °F CI drift gate.
- **Every claim is cited.** Inline footnote-style links to OSHA, NIOSH, NWS, published papers. Sources collected in `references.md`.

Full architecture lives in [`docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md`](./docs/superpowers/specs/2026-05-27-heat-metrics-lab-design.md). The implementation plan lives in [`docs/superpowers/plans/2026-05-27-heat-metrics-lab.md`](./docs/superpowers/plans/2026-05-27-heat-metrics-lab.md). The DevRel build log (A/B comparison against the Google side) lives in [`DEVREL.md`](./DEVREL.md).

## Hard constraints

- **No medical or clinical claims.** Not advice. Not a substitute for on-site WBGT measurement. If you are experiencing heat illness, seek medical help.
- **No PII, no analytics, no accounts, no biometric ingestion.** The page is purely static and educational.
- **No Google-hosted assets.** All fonts self-hosted; no `@import url(fonts.googleapis.com/...)`; no Google tracking.
- **Client-side math is deterministic.** No runtime LLM features; formulas must match Python within 0.5 °F.
- **Visualization ≠ recommendation.** The page shows three numbers and links to OSHA/NIOSH guidance, it does not generate personalized safety advice.
- **Every data source is cited.** NWS, NOAA NCEI, OSHA CPL 03-00-024-0, NIOSH 2016-106, peer-reviewed papers — all linked.
- **Mobile-first design; reduced-motion honored.** 44×44 px touch targets; no animations when `prefers-reduced-motion: reduce`.

## Where it lives

Live at **<https://heat-metrics-lab.pages.dev/>** (pending Phase 0 completion and deploy). Private until v1 polish lands.

## How to deploy it

The site auto-deploys to **Cloudflare Pages** via `.github/workflows/deploy.yml` on every push to `master`. One-time operator setup, under repo Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — create at Cloudflare dashboard → My Profile → API Tokens, using the **Cloudflare Pages — Edit** template (or a custom token with `Account → Cloudflare Pages → Edit` permission scoped to this account).
- `CLOUDFLARE_ACCOUNT_ID` — visible in the right sidebar of any page in the Cloudflare dashboard.

If either secret is missing the deploy job fails fast with an explicit message before invoking Wrangler.

## License

MIT for the project code. Fetched data in `data/` carries the licenses of upstream sources (NOAA, NWS, CDC/NIOSH, OSHA, published papers). See `references.md` for attribution.

## Author

Craig Merry (craigm26 on GitHub). Sibling to [heat-protein-lab](https://github.com/craigm26/heat-protein-lab); PRs welcome at pace.
