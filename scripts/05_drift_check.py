# scripts/05_drift_check.py — fail if JS and Python differ from reference by > tolerance.
#
# Runs both src/metrics.js (via node) and scripts/_metrics.py against
# data/references/reference-cases.json. Prints a per-metric comparison table.
# Exits non-zero if any case has |js - ref| > tolerance OR |py - ref| > tolerance.
import json
import subprocess
import sys
from pathlib import Path

# Make scripts/ importable for _metrics
sys.path.insert(0, str(Path(__file__).parent))
from _metrics import heat_index_c, wbgt_indoor_c, wbgt_outdoor_c

REPO = Path(__file__).resolve().parents[1]
CASES_FILE = REPO / "data" / "references" / "reference-cases.json"
JS_FILE = REPO / "src" / "metrics.js"
CASES = json.loads(CASES_FILE.read_text())
TOL_C = CASES["tolerance_f"] / 1.8

# Build a one-shot Node script that imports the JS module and emits JSON for each case.
# Written to a temp file rather than passed via -e so import.meta.url works correctly.
JS_RUNNER_SOURCE = f"""
import {{ heatIndexC, wbgtIndoorC, wbgtOutdoorC }} from "{JS_FILE}";
import {{ readFileSync }} from "node:fs";
const cases = JSON.parse(readFileSync("{CASES_FILE}"));
const out = [];
for (const c of cases.cases) {{
  const {{ air_temp_c, rh_pct, wind_mph, solar_w_m2 }} = c.inputs;
  out.push({{
    id: c.id,
    hi_c: heatIndexC(air_temp_c, rh_pct),
    wbgt_indoor_c: wbgtIndoorC(air_temp_c, rh_pct),
    wbgt_outdoor_c: wbgtOutdoorC(air_temp_c, rh_pct, wind_mph, solar_w_m2),
  }});
}}
process.stdout.write(JSON.stringify(out));
"""

js_runner = REPO / "scripts" / "_metrics_runner.mjs"
js_runner.write_text(JS_RUNNER_SOURCE)
try:
    js_out = json.loads(subprocess.check_output(["node", str(js_runner)]))
finally:
    js_runner.unlink()

js_by_id = {row["id"]: row for row in js_out}

# Run Python implementation
py_by_id = {}
for c in CASES["cases"]:
    inputs = c["inputs"]
    py_by_id[c["id"]] = {
        "hi_c": heat_index_c(inputs["air_temp_c"], inputs["rh_pct"]),
        "wbgt_indoor_c": wbgt_indoor_c(inputs["air_temp_c"], inputs["rh_pct"]),
        "wbgt_outdoor_c": wbgt_outdoor_c(
            inputs["air_temp_c"], inputs["rh_pct"],
            inputs["wind_mph"], inputs["solar_w_m2"]
        ),
    }

# Compare
fail = 0
print(f"{'CASE':<36} {'METRIC':<16} {'PY':>8} {'JS':>8} {'REF':>8} {'Δ_PY_REF':>10} {'Δ_JS_REF':>10} {'Δ_PY_JS':>10} STATUS")
print("-" * 130)

for c in CASES["cases"]:
    cid = c["id"]
    py = py_by_id[cid]
    js = js_by_id[cid]
    for metric, ref_val in c["expected"].items():
        py_val = py[metric]
        js_val = js[metric]
        d_pyref = py_val - ref_val
        d_jsref = js_val - ref_val
        d_pyjs = py_val - js_val
        status = "OK"
        if abs(d_pyref) > TOL_C:
            status = "FAIL py-ref"
            fail += 1
        elif abs(d_jsref) > TOL_C:
            status = "FAIL js-ref"
            fail += 1
        elif abs(d_pyjs) > TOL_C:
            status = "FAIL drift"
            fail += 1
        print(f"{cid:<36} {metric:<16} {py_val:>8.3f} {js_val:>8.3f} {ref_val:>8.3f} "
              f"{d_pyref:>+10.4f} {d_jsref:>+10.4f} {d_pyjs:>+10.4f} {status}")

print()
print(f"Tolerance: ±{TOL_C:.3f} °C (= ±{CASES['tolerance_f']:.2f} °F)")
print(f"{'PASS' if fail == 0 else f'FAIL — {fail} case(s)'}")

sys.exit(1 if fail else 0)
