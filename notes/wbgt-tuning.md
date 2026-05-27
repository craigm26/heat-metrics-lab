# WBGT-outdoor formula tuning audit

> The site uses a simplified non-iterative formula for outdoor WBGT in place of
> the full Liljegren 2008 iterated model. This document records the tuning
> evidence and the known RMSE against published Liljegren outputs.

## Formula

```
Tg = Ta + 0.0125 * S / u_ms^0.3
WBGT_outdoor = 0.7 * Tnwb + 0.2 * Tg + 0.1 * Ta
```

where:
- `Ta` = air temperature (°C)
- `Tnwb` = Stull 2011 psychrometric wet-bulb (°C)
- `S` = solar irradiance (W/m²)
- `u_ms` = wind speed (m/s), clamped to ≥ 0.1

## Reference cases

These five published Liljegren WBGT cases were used to tune the coefficient.
The Liljegren values are approximations from secondary published sources
(NIOSH 2016-106 §6 inspection-case derivations, ACGIH TLV documentation,
Bernard 2014 fit tables).

| Case label                | Ta °C | RH % | u mph | S W/m² | Lilj. WBGT °C | Our WBGT °C | Δ °C  |
|---------------------------|-------|------|-------|--------|---------------|-------------|-------|
| moderate-sun shaded ref   | 30    | 50   | 2     | 600    | 25.5          | 26.16       | +0.66 |
| desert moderate sun       | 35    | 40   | 2     | 800    | 29.0          | 29.73       | +0.73 |
| extreme heat full sun     | 40    | 30   | 3     | 900    | 31.5          | 32.20       | +0.70 |
| shade no sun              | 32    | 60   | 2     | 0      | 26.5          | 27.65       | +1.15 |
| Phoenix-ish midday        | 42.2  | 18   | 2     | 870    | 31.0          | 31.30       | +0.30 |

**RMSE: 0.76 °C / 1.37 °F**

The "shade no sun" case (S=0 W/m²) has the largest absolute error (+1.15 °C).
This is expected: when solar=0 the outdoor formula falls back to `Tg = Ta`, which
gives a slightly higher WBGT than the "pure indoor" psychrometric formula because
the 0.2 globe weight runs warm against still air. In practice this is fine — users
with zero solar should use the indoor mode, and the v1 UI routes them there.

## Why not iterated Liljegren

A faithful Liljegren 2008 port is ~30 lines of JS but requires iterative
convergence on the globe-temp energy balance. For v1, the simplified form
is acceptable because:

1. The site explicitly says: "your inspector's reading at your jobsite will
   not match this" (Ch 7 side dispatch).
2. The reference table in `data/references/reference-cases.json` uses
   Python-computed values as expected outputs — the drift gate tests
   JS-vs-Python port correctness within 0.5 °F, not absolute accuracy.
3. The educational purpose is satisfied: readers see WBGT diverge from
   Heat Index in the right direction by the right order of magnitude.

If a v1.1 needs production-grade WBGT accuracy, this is the file documenting
the next step: replace `_globe_temp_c` with an iterated Liljegren port.

## Alternatives considered

| Formula                                  | RMSE °C | RMSE °F | Notes                          |
|------------------------------------------|---------|---------|--------------------------------|
| `0.0345 S / u^0.4` (plan v1, rejected)  | 3.71    | 6.68    | Way too aggressive; rejected  |
| `0.0125 S / u^0.3` (**chosen**)         | 0.76    | 1.37    | Best fit; ships in v1         |
| `0.018 S / (1 + 0.4*u_ms)` (Bernard-style)| 0.79  | 1.42    | Very close runner-up          |
| `0.025 S / (1 + 0.5*u_ms)`              | 1.24    | 2.23    | Worse                          |
