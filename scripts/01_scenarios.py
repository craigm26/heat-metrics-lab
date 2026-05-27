# scripts/01_scenarios.py — write 5 hand-curated scenario JSONs for Ch 4 scenario flipper.
#
# Hand-curated rather than NCEI-fetched: API keys and rate limits add brittleness
# without changing the educational value. Three of the five (phoenix-aug-12pm,
# warehouse-indoor, lytton-bc-2021) match cases in data/references/reference-cases.json
# so the values are already cross-validated against the drift gate.

import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))
from _metrics import heat_index_c, wbgt_outdoor_c, wbgt_indoor_c

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "data" / "scenarios"
OUT.mkdir(parents=True, exist_ok=True)

# NIOSH 2016-106 §6 Table 6-1: WBGT thresholds for 60/40/20/0 minutes work per hour
# at heavy work intensity. Used to populate decision_hooks.niosh_work_rest_heavy.
def niosh_work_rest_heavy(wbgt_c: float) -> str:
    if wbgt_c < 25.0:
        return "60-min work / 0-min rest"
    elif wbgt_c < 26.7:
        return "45-min work / 15-min rest"
    elif wbgt_c < 28.3:
        return "30-min work / 30-min rest"
    elif wbgt_c < 30.0:
        return "15-min work / 45-min rest"
    else:
        return "stop work — exposure exceeds NIOSH heavy-work ceiling"

# OSHA Heat NEP triggers a heat-priority day at NWS HI >= 80 F (26.67 °C).
def osha_nep_priority_day(hi_c: float) -> bool:
    return hi_c >= 26.67

SCENARIOS = [
    {
        "id": "phoenix-aug-12pm",
        "label": "Phoenix, AZ — Aug, 12:00, full sun",
        "location": {"name": "Phoenix, AZ", "lat": 33.45, "lng": -112.07},
        "ts_local": "2024-08-12T12:00:00-07:00",
        "inputs": {"air_temp_c": 42.2, "rh_pct": 18, "wind_mph": 4, "solar_w_m2": 870},
        "outdoor": True,
        "source": {
            "method": "hand-curated",
            "basis": "NOAA NWS Phoenix climatological avg + Aug 2024 observed peak",
            "matches_reference_case": "phoenix-aug-12pm",
            "accessed_at": "2026-05-27",
        },
    },
    {
        "id": "houston-aug-6am-humid",
        "label": "Houston, TX — Aug, 6:00 am, humid dawn",
        "location": {"name": "Houston, TX", "lat": 29.76, "lng": -95.37},
        "ts_local": "2024-08-12T06:00:00-05:00",
        "inputs": {"air_temp_c": 28.0, "rh_pct": 92, "wind_mph": 2, "solar_w_m2": 0},
        "outdoor": True,
        "source": {
            "method": "hand-curated",
            "basis": "NOAA NWS Houston climatological dawn humidity",
            "accessed_at": "2026-05-27",
        },
    },
    {
        "id": "yuma-field-2pm",
        "label": "Yuma, AZ — field crew, 2:00 pm, full sun",
        "location": {"name": "Yuma, AZ", "lat": 32.69, "lng": -114.63},
        "ts_local": "2024-08-12T14:00:00-07:00",
        "inputs": {"air_temp_c": 44.0, "rh_pct": 14, "wind_mph": 5, "solar_w_m2": 950},
        "outdoor": True,
        "source": {
            "method": "hand-curated",
            "basis": "NOAA NWS Yuma climatological peak; UFW worker advocacy reports",
            "accessed_at": "2026-05-27",
        },
    },
    {
        "id": "indoor-warehouse-3pm",
        "label": "Indoor warehouse — 3:00 pm, no ventilation",
        "location": {"name": "Generic US warehouse (indoor)", "lat": None, "lng": None},
        "ts_local": "2024-08-12T15:00:00",
        "inputs": {"air_temp_c": 29.4, "rh_pct": 65, "wind_mph": 0, "solar_w_m2": 0},
        "outdoor": False,
        "source": {
            "method": "hand-curated",
            "basis": "ACGIH TLV documentation; published warehouse heat-stress case studies",
            "matches_reference_case": "warehouse-indoor",
            "accessed_at": "2026-05-27",
        },
    },
    {
        "id": "lytton-bc-2021-5pm",
        "label": "Lytton, BC — June 29 2021 heat dome peak, ~5:00 pm",
        "location": {"name": "Lytton, BC", "lat": 50.23, "lng": -121.58},
        "ts_local": "2021-06-29T17:00:00-07:00",
        "inputs": {"air_temp_c": 49.6, "rh_pct": 12, "wind_mph": 6, "solar_w_m2": 950},
        "outdoor": True,
        "source": {
            "method": "hand-curated",
            "basis": "Environment and Climate Change Canada observations, June 29 2021",
            "matches_reference_case": "lytton-bc-2021",
            "accessed_at": "2026-05-27",
        },
    },
]

count = 0
for s in SCENARIOS:
    t = s["inputs"]["air_temp_c"]
    rh = s["inputs"]["rh_pct"]
    wmph = s["inputs"]["wind_mph"]
    solar = s["inputs"]["solar_w_m2"]
    hi = heat_index_c(t, rh)
    if s["outdoor"] and solar > 0:
        wbgt = wbgt_outdoor_c(t, rh, wmph, solar)
        wbgt_kind = "outdoor"
    else:
        wbgt = wbgt_indoor_c(t, rh)
        wbgt_kind = "indoor"
    s["derived"] = {
        "hi_c": round(hi, 2),
        "wbgt_c": round(wbgt, 2),
        "wbgt_kind": wbgt_kind,
    }
    s["decision_hooks"] = {
        "niosh_work_rest_heavy": niosh_work_rest_heavy(wbgt),
        "osha_nep_priority_day": osha_nep_priority_day(hi),
    }
    out_file = OUT / f"{s['id']}.json"
    out_file.write_text(json.dumps(s, indent=2) + "\n")
    print(f"wrote data/scenarios/{s['id']}.json: Ta={t}°C, HI={hi:.2f}°C, WBGT_{wbgt_kind}={wbgt:.2f}°C")
    count += 1

print(f"\n{count} scenarios written")
