# scripts/_gen_reference_cases.py — one-shot: write reference-cases.json from _metrics.py.
# Generated values are the source of truth for the JS-vs-Python drift gate.
import json
from pathlib import Path
from _metrics import heat_index_c, wbgt_indoor_c, wbgt_outdoor_c

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "data" / "references" / "reference-cases.json"

# Twelve cases spanning the operating range of the site.
# Each: id, label, source-note, inputs (T °C, RH %, wind mph, solar W/m²),
# and the metrics we expect (hi_c always; wbgt_indoor_c for no-solar cases;
# wbgt_outdoor_c for cases with solar > 0).
CASES_RAW = [
    # NWS heat-index validation cases (HI only, no solar)
    ("rothfusz-80-40", "T=80°F RH=40% — NWS chart anchor", "NWS Tech Memo SR-90", 26.67, 40.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("rothfusz-90-70", "T=90°F RH=70% — high-humidity HI", "NWS Tech Memo SR-90", 32.22, 70.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("rothfusz-100-50", "T=100°F RH=50% — extreme-heat HI", "NWS Tech Memo SR-90", 37.78, 50.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("rothfusz-95-30-low-rh", "T=95°F RH=30% — low-RH adjustment region", "NWS SR-90 low-RH branch", 35.0, 30.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("rothfusz-87-90-high-rh", "T=87°F RH=90% — high-RH adjustment region", "NWS SR-90 high-RH branch", 30.56, 90.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("rothfusz-79-50-below-threshold", "T=79°F RH=50% — below Rothfusz threshold (simple formula)", "NWS SR-90 simple branch", 26.11, 50.0, 4.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    # Outdoor WBGT cases (solar > 0)
    ("liljegren-30-50-moderate-sun", "T=30°C RH=50% u=2mph S=600 — moderate sun", "tuned against Liljegren 2008", 30.0, 50.0, 2.0, 600.0, ["hi_c", "wbgt_outdoor_c"]),
    ("liljegren-35-40-full-sun", "T=35°C RH=40% u=2mph S=800 — desert moderate sun", "tuned against Liljegren 2008", 35.0, 40.0, 2.0, 800.0, ["hi_c", "wbgt_outdoor_c"]),
    ("liljegren-40-30-extreme", "T=40°C RH=30% u=3mph S=900 — extreme heat full sun", "tuned against Liljegren 2008", 40.0, 30.0, 3.0, 900.0, ["hi_c", "wbgt_outdoor_c"]),
    ("phoenix-aug-12pm", "Phoenix Aug noon full sun (Ch 4 scenario)", "site scenario", 42.2, 18.0, 4.0, 870.0, ["hi_c", "wbgt_outdoor_c"]),
    ("warehouse-indoor", "Indoor warehouse no ventilation no sun", "site scenario", 29.4, 65.0, 0.0, 0.0, ["hi_c", "wbgt_indoor_c"]),
    ("lytton-bc-2021", "Lytton BC 2021 heat dome peak", "ECCC obs + Liljegren-simplified", 49.6, 12.0, 6.0, 950.0, ["hi_c", "wbgt_outdoor_c"]),
]

cases = []
for cid, label, source, t, rh, wmph, solar, want in CASES_RAW:
    expected = {}
    if "hi_c" in want:
        expected["hi_c"] = round(heat_index_c(t, rh), 2)
    if "wbgt_indoor_c" in want:
        expected["wbgt_indoor_c"] = round(wbgt_indoor_c(t, rh), 2)
    if "wbgt_outdoor_c" in want:
        expected["wbgt_outdoor_c"] = round(wbgt_outdoor_c(t, rh, wmph, solar), 2)
    cases.append({
        "id": cid,
        "label": label,
        "source_note": source,
        "inputs": {"air_temp_c": t, "rh_pct": rh, "wind_mph": wmph, "solar_w_m2": solar},
        "expected": expected,
    })

out = {
    "version": "1.0",
    "tolerance_f": 0.5,
    "note": "Reference values are computed from scripts/_metrics.py (Python implementation). The drift gate tests JS-vs-Python port correctness within 0.5 °F. Absolute-accuracy validation against external references (NWS chart, NIOSH §6, Liljegren 2008) is documented in notes/wbgt-tuning.md and references.md with a separate, looser tolerance.",
    "generated_by": "scripts/_gen_reference_cases.py",
    "cases": cases,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, indent=2) + "\n")
print(f"wrote {OUT} with {len(cases)} cases")
