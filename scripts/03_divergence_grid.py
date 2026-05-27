# scripts/03_divergence_grid.py — write a 2D grid of (air_temp, RH) -> (HI, WBGT)
# for the Ch 5 divergence map. Two grids: outdoor (sun + wind defaults) and indoor.

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _metrics import heat_index_c, wbgt_outdoor_c, wbgt_indoor_c

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "data" / "divergence"
OUT.mkdir(parents=True, exist_ok=True)

# 20-48 °C step 0.5; 5-100 % RH step 5
T_RANGE = [round(20 + 0.5 * i, 1) for i in range(int((48 - 20) / 0.5) + 1)]
RH_RANGE = list(range(5, 101, 5))


def grid(outdoor: bool):
    rows = []
    for t in T_RANGE:
        row_cells = []
        for rh in RH_RANGE:
            if outdoor:
                wbgt = wbgt_outdoor_c(t, rh, wind_mph=4, solar_w_m2=700)
            else:
                wbgt = wbgt_indoor_c(t, rh)
            row_cells.append({
                "hi_c": round(heat_index_c(t, rh), 2),
                "wbgt_c": round(wbgt, 2),
            })
        rows.append({"air_temp_c": t, "cells": row_cells})
    return {
        "rh_axis": RH_RANGE,
        "temp_axis": T_RANGE,
        "rows": rows,
        "defaults": {
            "wind_mph": 4,
            "solar_w_m2": 700 if outdoor else 0,
        },
        "note": "Indices computed from scripts/_metrics.py. Used by the Ch 5 divergence map.",
    }


outdoor = grid(True)
indoor = grid(False)
(OUT / "grid-outdoor.json").write_text(json.dumps(outdoor, indent=2) + "\n")
(OUT / "grid-indoor.json").write_text(json.dumps(indoor, indent=2) + "\n")

ncells = len(T_RANGE) * len(RH_RANGE)
print(f"wrote grid-outdoor.json + grid-indoor.json: {ncells} cells each ({len(T_RANGE)} T × {len(RH_RANGE)} RH)")
