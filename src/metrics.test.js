// src/metrics.test.js — runs in node 20+ with native ESM.
// Validates JS implementation against the reference cases generated from Python.
import { heatIndexC, wbgtIndoorC, wbgtOutdoorC } from "./metrics.js";
import { readFileSync } from "node:fs";

const cases = JSON.parse(
  readFileSync(new URL("../data/references/reference-cases.json", import.meta.url))
);
const TOL_C = cases.tolerance_f / 1.8;

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
    if (ok) {
      pass++;
    } else {
      fail++;
      console.error(`FAIL ${c.id} ${name}: got ${got.toFixed(2)}, want ${want.toFixed(2)} (Δ ${(got - want).toFixed(2)} > ${TOL_C.toFixed(2)})`);
    }
  }
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
