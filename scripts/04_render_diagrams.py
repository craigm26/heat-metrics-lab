# scripts/04_render_diagrams.py
# Build-time SVG diagram rendering for heat-metrics-lab.
# Each render_* function writes one SVG into data/diagrams/.
# Run all: `uv run --project scripts python scripts/04_render_diagrams.py`
# Run one: `uv run --project scripts python scripts/04_render_diagrams.py --target NAME`
# Run with unit: `uv run --project scripts python scripts/04_render_diagrams.py --unit all`
import argparse
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as pe
from matplotlib.patches import FancyArrowPatch
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from _metrics import heat_index_c

REPO = Path(__file__).resolve().parents[1]
OUT = REPO / "data" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

# Brand tokens — kept in sync with src/styles.css and DESIGN.md.
PAPER = "#F5EFDF"
INK = "#1B1B1B"
INK_SOFT = "#3D3A33"
INK_FAINT = "#8A8275"
AIR = "#3F5160"
HEAT_INDEX = "#A45A2A"
WBGT = "#702424"

# Default matplotlib styling — surveyor's notebook aesthetic.
plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Spectral", "Charter", "Georgia", "DejaVu Serif"],
    "savefig.facecolor": PAPER,
    "axes.facecolor": PAPER,
    "axes.edgecolor": INK,
    "axes.labelcolor": INK,
    "xtick.color": INK_SOFT,
    "ytick.color": INK_SOFT,
    "text.color": INK,
})


# ---------------------------------------------------------------------------
# Task 3.1 — Stevenson screen annotated diagram
# Tufte principles applied:
#   - Layering: box outline dominant (INK), louvers recede (INK_SOFT), arrows mid-weight
#   - Data is the design: the screen itself carries all the information
#   - Eraser test: every element earns its ink (no decorative fills, no wood grain)
#
# NOTE: this diagram has no numeric temperature labels — it is a structural
# illustration only. Both unit variants are therefore identical. Both files
# are still emitted so the toggle swap logic works uniformly.
# ---------------------------------------------------------------------------

def render_stevenson_screen(unit="c"):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.set_aspect("equal")
    ax.set_axis_off()
    fig.patch.set_facecolor(PAPER)

    # ── Box geometry (proportional to a real Stevenson screen: ~4 ft tall, 2.5 ft wide)
    # Working in "inches" (notional units). Box at center.
    cx, cy = 0.0, 0.0
    bw, bh = 2.5, 4.0   # box width, height
    bx = cx - bw / 2    # left edge of box
    by = cy - bh / 2    # bottom edge of box

    # Post: below the box, centered
    post_w = 0.2
    post_h = 1.5
    post_x = cx - post_w / 2
    post_y = by - post_h

    # Draw post first (behind box)
    post_rect = patches.Rectangle(
        (post_x, post_y), post_w, post_h,
        linewidth=1.2, edgecolor=INK_SOFT, facecolor=PAPER, zorder=1
    )
    ax.add_patch(post_rect)

    # Draw box outline (dominant weight — primary layer)
    box_rect = patches.Rectangle(
        (bx, by), bw, bh,
        linewidth=2.0, edgecolor=INK, facecolor=PAPER, zorder=2
    )
    ax.add_patch(box_rect)

    # Louvers — horizontal slats inside the box (secondary layer, recede)
    n_louvers = 10
    for i in range(1, n_louvers):
        y_slat = by + i * (bh / n_louvers)
        ax.plot(
            [bx + 0.08, bx + bw - 0.08], [y_slat, y_slat],
            color=INK_SOFT, linewidth=0.7, alpha=0.55, zorder=3
        )

    # Thermometer inside box — 'T' mark in AIR color (the one thing it measures)
    therm_x = cx
    therm_bottom = by + 0.7
    therm_top = cy + 0.9
    ax.plot([therm_x, therm_x], [therm_bottom, therm_top],
            color=AIR, linewidth=2.5, zorder=4)
    ax.plot(therm_x, therm_bottom,
            "o", color=AIR, markersize=8, zorder=5)
    ax.text(therm_x + 0.18, (therm_bottom + therm_top) / 2, "T",
            fontsize=9, color=AIR, va="center", fontstyle="italic", zorder=6)

    # ── Four annotation arrows pointing AWAY from the box
    # Each arrow starts just outside the box face and points further out.
    # Labels placed at arrow tips.
    # Positions: upper-left (humidity), upper-right (sunshine),
    #            lower-left (exertion), lower-right (wind).

    arrow_kw = dict(
        arrowstyle="->,head_width=0.12,head_length=0.12",
        color=INK_SOFT,
        linewidth=1.2,
        zorder=6,
    )
    label_kw = dict(
        fontsize=8.5, color=INK, va="center",
        fontfamily="serif",
    )

    gap = 0.18   # gap from box edge to arrow start
    arm = 1.05   # arrow length

    # Upper-left — humidity
    hl_start = (bx - gap, by + bh * 0.72)
    hl_end = (bx - gap - arm, by + bh * 0.72 + 0.55)
    ax.annotate("", xy=hl_end, xytext=hl_start, arrowprops=arrow_kw)
    ax.text(hl_end[0] - 0.12, hl_end[1] + 0.12,
            "humidity", ha="right", **label_kw)

    # Upper-right — sunshine
    hr_start = (bx + bw + gap, by + bh * 0.72)
    hr_end = (bx + bw + gap + arm, by + bh * 0.72 + 0.55)
    ax.annotate("", xy=hr_end, xytext=hr_start, arrowprops=arrow_kw)
    ax.text(hr_end[0] + 0.12, hr_end[1] + 0.12,
            "sunshine", ha="left", **label_kw)

    # Lower-left — exertion
    el_start = (bx - gap, by + bh * 0.22)
    el_end = (bx - gap - arm, by + bh * 0.22 - 0.55)
    ax.annotate("", xy=el_end, xytext=el_start, arrowprops=arrow_kw)
    ax.text(el_end[0] - 0.12, el_end[1] - 0.14,
            "exertion", ha="right", **label_kw)

    # Lower-right — wind
    wr_start = (bx + bw + gap, by + bh * 0.22)
    wr_end = (bx + bw + gap + arm, by + bh * 0.22 - 0.55)
    ax.annotate("", xy=wr_end, xytext=wr_start, arrowprops=arrow_kw)
    ax.text(wr_end[0] + 0.12, wr_end[1] - 0.14,
            "wind", ha="left", **label_kw)

    # ── A subtle caption under the box: disambiguates the arrow semantics
    ax.text(cx, post_y - 0.25,
            "measures air temperature only",
            fontsize=7.5, color=INK_FAINT, ha="center", style="italic")

    # ── Title
    ax.text(cx, by + bh + 0.55,
            "What an air-temperature reading isn't measuring",
            fontsize=11, color=INK, ha="center", fontweight="normal",
            fontfamily="serif")

    # Set view limits with generous padding so arrows don't clip
    margin_x = 2.2
    margin_y = 2.2
    ax.set_xlim(bx - margin_x, bx + bw + margin_x)
    ax.set_ylim(post_y - 0.6, by + bh + 0.9)

    fig.savefig(OUT / f"stevenson-screen-{unit}.svg", format="svg",
                bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Task 3.2 — NWS Heat-index nomogram
# Tufte principles applied:
#   - Range-frame: axes span data extents only
#   - Contour lines (not contourf fill) to keep data-ink high
#   - Two annotated comparison points are the argument — visually anchored
#   - Top/right spines removed; contour labels in INK_SOFT
#
# Unit variants:
#   °F (default / NWS convention): grid in °F, xlim 80–115, contours 80–140 step 5 °F
#   °C: grid in °C, xlim 27–46, contours 25–60 step 2.5 °C; anchor at 35 °C / 30 & 75% RH
# ---------------------------------------------------------------------------

def render_heat_index_nomogram(unit="c"):
    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    rhs = np.arange(10, 101, 5)   # 10–100% RH, shared by both units

    if unit == "f":
        # ── °F variant — NWS native domain
        temps_f = np.arange(80, 116, 1)    # 80–115 °F inclusive
        T_grid, RH_grid = np.meshgrid(temps_f, rhs)
        HI_grid = np.zeros_like(T_grid, dtype=float)
        for i, rh in enumerate(rhs):
            for j, tf in enumerate(temps_f):
                tc = (tf - 32) * 5 / 9
                hi_c = heat_index_c(tc, rh)
                HI_grid[i, j] = hi_c * 9 / 5 + 32

        levels = np.arange(80, 141, 5)

        cs = ax.contour(
            T_grid, RH_grid, HI_grid,
            levels=levels,
            colors=HEAT_INDEX,
            linewidths=0.9,
            alpha=0.85,
        )
        ax.clabel(cs, levels=levels[::2], inline=True, fontsize=7.5,
                  fmt="%d °F", colors=INK_SOFT)

        ax.set_xlim(80, 115)
        ax.set_ylim(10, 100)
        ax.set_xlabel("Air temperature (°F)", fontsize=9, color=INK_SOFT, labelpad=6)

        # Annotated comparison points in °F
        pt1_t, pt1_rh = 95.0, 30.0
        pt2_t, pt2_rh = 95.0, 75.0
        pt1_hi = heat_index_c((pt1_t - 32) * 5 / 9, pt1_rh) * 9 / 5 + 32
        pt2_hi = heat_index_c((pt2_t - 32) * 5 / 9, pt2_rh) * 9 / 5 + 32

        ann1_text = f"95 °F, 30% RH\n→ HI {pt1_hi:.0f} °F"
        ann2_text = f"95 °F, 75% RH\n→ HI {pt2_hi:.0f} °F"
        ann1_xy  = (pt1_t, pt1_rh)
        ann2_xy  = (pt2_t, pt2_rh)
        ann1_txt = (103, 22)
        ann2_txt = (84, 88)

    else:
        # ── °C variant — grid computed directly in °C
        # x-range covers ~27–46 °C (= 80–115 °F) with 0.5 °C resolution
        temps_c = np.arange(27, 46.5, 0.5)
        T_grid, RH_grid = np.meshgrid(temps_c, rhs)
        HI_grid = np.zeros_like(T_grid, dtype=float)
        for i, rh in enumerate(rhs):
            for j, tc in enumerate(temps_c):
                HI_grid[i, j] = heat_index_c(tc, rh)

        levels = np.arange(25, 61, 2.5)

        cs = ax.contour(
            T_grid, RH_grid, HI_grid,
            levels=levels,
            colors=HEAT_INDEX,
            linewidths=0.9,
            alpha=0.85,
        )
        ax.clabel(cs, levels=levels[::2], inline=True, fontsize=7.5,
                  fmt="%g °C", colors=INK_SOFT)

        ax.set_xlim(27, 46)
        ax.set_ylim(10, 100)
        ax.set_xlabel("Air temperature (°C)", fontsize=9, color=INK_SOFT, labelpad=6)

        # Annotated comparison points in °C (35 °C ≈ 95 °F)
        pt1_t, pt1_rh = 35.0, 30.0
        pt2_t, pt2_rh = 35.0, 75.0
        pt1_hi = heat_index_c(pt1_t, pt1_rh)
        pt2_hi = heat_index_c(pt2_t, pt2_rh)

        ann1_text = f"35 °C, 30% RH\n→ HI {pt1_hi:.0f} °C"
        ann2_text = f"35 °C, 75% RH\n→ HI {pt2_hi:.0f} °C"
        ann1_xy  = (pt1_t, pt1_rh)
        ann2_xy  = (pt2_t, pt2_rh)
        # Place text labels in chart-coordinate space (°C x-axis)
        ann1_txt = (38, 22)
        ann2_txt = (28, 88)

    # ── Shared styling (both units) ──────────────────────────────────────────
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(INK_FAINT)
    ax.spines["bottom"].set_color(INK_FAINT)

    ax.tick_params(axis="both", labelsize=8, color=INK_FAINT, length=3)
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_color(INK_SOFT)

    ax.set_ylabel("Relative humidity (%)", fontsize=9, color=INK_SOFT, labelpad=6)

    ax.plot(ann1_xy[0], ann1_xy[1], "o", color=INK, markersize=6, zorder=5)
    ax.plot(ann2_xy[0], ann2_xy[1], "o", color=INK, markersize=6, zorder=5)

    box_style = dict(
        boxstyle="round,pad=0.3", facecolor=PAPER, edgecolor=INK_SOFT, linewidth=0.8
    )
    ax.annotate(
        ann1_text,
        xy=ann1_xy,
        xytext=ann1_txt,
        fontsize=7.5, color=INK,
        arrowprops=dict(arrowstyle="-", color=INK_SOFT, linewidth=0.9),
        bbox=box_style,
        ha="left",
    )
    ax.annotate(
        ann2_text,
        xy=ann2_xy,
        xytext=ann2_txt,
        fontsize=7.5, color=INK,
        arrowprops=dict(arrowstyle="-", color=INK_SOFT, linewidth=0.9),
        bbox=box_style,
        ha="left",
    )

    ax.set_title(
        "What the same air temperature feels like at different humidity",
        fontsize=10.5, color=INK, pad=12, loc="left",
        fontfamily="serif",
    )

    fig.tight_layout()
    fig.savefig(OUT / f"heat-index-nomogram-{unit}.svg", format="svg",
                bbox_inches="tight", pad_inches=0.2)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Task 3.3 — Three-thermometer rig (WBGT illustration)
# Tufte principles applied:
#   - Multifunctioning elements: thermometer color = metric encoding AND label color
#   - Confection: three thermometers + formula + labels integrated in one composition
#   - Words, numbers, images integrated — formula adjacent to diagram, not below it
#   - No axes, no grid — this is an explanatory illustration
#
# NOTE: this diagram uses only symbolic labels (Td, Tnwb, Tg) with no numeric
# temperature readings. Both unit variants are therefore identical. Both files
# are still emitted so the toggle swap logic works uniformly.
# ---------------------------------------------------------------------------

def render_three_thermometer_rig(unit="c"):
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.set_aspect("equal")
    ax.set_axis_off()
    fig.patch.set_facecolor(PAPER)

    # ── Three thermometer schematics — vertical, equally spaced
    # Layout: three columns at x = -2, 0, +2 (in notional units)
    # Each thermometer: stem (vertical line) + bulb (circle at bottom)
    stem_bottom = -0.8   # bottom of stem
    stem_top = 1.6       # top of stem
    stem_half_w = 0.12   # half-width of the stem rectangle

    therm_defs = [
        # (x_center, color, bulb_symbol, label, sublabel)
        (-2.0, AIR,       "circle",  "Td (dry-bulb)",       "dry air"),
        ( 0.0, INK_SOFT,  "droplet", "Tnwb (natural wet-bulb)", "evaporative cooling"),
        ( 2.0, WBGT,      "globe",   "Tg (black globe)",    "radiant heat"),
    ]

    for xc, color, symbol, label, sublabel in therm_defs:
        # Stem rectangle
        stem_rect = patches.Rectangle(
            (xc - stem_half_w, stem_bottom),
            stem_half_w * 2, stem_top - stem_bottom,
            linewidth=1.2, edgecolor=color, facecolor=PAPER, zorder=2
        )
        ax.add_patch(stem_rect)

        # Bulb at the bottom
        if symbol == "globe":
            # Filled black sphere for the black globe thermometer
            bulb = patches.Circle(
                (xc, stem_bottom - 0.22), radius=0.22,
                linewidth=0.0, facecolor=INK, zorder=3
            )
        elif symbol == "droplet":
            # Water-droplet: a circle with a subtle color fill to suggest evaporation
            bulb = patches.Circle(
                (xc, stem_bottom - 0.22), radius=0.22,
                linewidth=1.4, edgecolor=color, facecolor=PAPER, zorder=3
            )
            # Small water drop glyph inside
            ax.text(xc, stem_bottom - 0.22, "~",
                    ha="center", va="center", fontsize=10,
                    color=color, fontweight="bold", zorder=4)
        else:
            # Plain circle bulb
            bulb = patches.Circle(
                (xc, stem_bottom - 0.22), radius=0.22,
                linewidth=1.4, edgecolor=color, facecolor=PAPER, zorder=3
            )
        ax.add_patch(bulb)

        # Label above the stem
        ax.text(xc, stem_top + 0.18, label,
                ha="center", va="bottom", fontsize=8,
                color=color, fontfamily="serif", fontstyle="italic")

        # Short sublabel below the bulb
        ax.text(xc, stem_bottom - 0.58, sublabel,
                ha="center", va="top", fontsize=7.5,
                color=INK_FAINT, fontfamily="serif")

    # ── Title
    ax.text(0.0, stem_top + 0.75,
            "What WBGT measures: three thermometers at once",
            ha="center", va="bottom", fontsize=11,
            color=INK, fontfamily="serif")

    # ── WBGT formula — placed below the thermometers, integrated into the illustration.
    # Color each component to match its thermometer.
    # We build this as a multi-color text line using ax.annotate at different x positions.
    formula_y = stem_bottom - 1.05

    # Lay out the formula: WBGT = 0.7 · Tnwb + 0.2 · Tg + 0.1 · Td
    # Parts: "WBGT_outdoor = 0.7·" [Tnwb] " + 0.2·" [Tg] " + 0.1·" [Td]
    formula_parts = [
        ("WBGT_outdoor = 0.7·", INK_SOFT, -3.1),
        ("Tnwb", INK_SOFT, -1.35),
        (" + 0.2·", INK_SOFT, -0.90),
        ("Tg", WBGT, -0.20),
        (" + 0.1·", INK_SOFT, 0.20),
        ("Td", AIR, 0.70),
    ]
    for text, color, x_pos in formula_parts:
        ax.text(x_pos, formula_y, text,
                ha="left", va="center", fontsize=9,
                color=color, fontfamily="serif", fontstyle="italic")

    # Set view limits
    ax.set_xlim(-4.0, 4.0)
    ax.set_ylim(formula_y - 0.4, stem_top + 1.1)

    fig.savefig(OUT / f"three-thermometer-rig-{unit}.svg", format="svg",
                bbox_inches="tight", pad_inches=0.2)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Task 5.3 — NIOSH work-rest table
# Tufte principles applied:
#   - Multifunctioning color: row tint is the severity encoding (no separate legend)
#   - Words, numbers, images integrated: citation embedded in figure, not below
#   - Layering: dark text on cream cells; "stop" row in WBGT oxblood signals ceiling
#   - Eraser test: hairline grid only; no box borders, no shadows, no decorative fills
#
# Unit variants:
#   °C (default / NIOSH convention): WBGT column header "WBGT °C"; bands in °C
#   °F: header "WBGT °F"; band labels converted (×9/5+32, 1 decimal); minutes unchanged
# ---------------------------------------------------------------------------

# Severity-gradient palette for data rows — extends the brand PAPER ramp toward
# a warm amber at ceiling. Index 0 = safest (near surface-card); index 4 = hottest.
SEV_TINTS = (
    "#FBF6E8",  # near --surface-card (#FBF6E8 == surface-card)
    "#F5EFDF",  # == PAPER
    "#EFE6CE",
    "#E5D8B8",
    "#D9C29C",  # warmest amber — approaching the WBGT ceiling
)


def _c_band_to_f(band_c: str) -> str:
    """Convert a WBGT band string from °C to °F (1 decimal precision).

    Handles formats: "< 25.0", "25.0–26.7", "≥ 32.2".
    The work-minutes values in body cells are NOT touched by this function.
    """
    # Map each known °C band to its °F equivalent.
    # Calculated as (c * 9/5 + 32), rounded to 1 decimal.
    _table = {
        "< 25.0":     "< 77.0",
        "25.0–26.7":  "77.0–80.1",
        "26.7–28.3":  "80.1–82.9",
        "28.3–30.0":  "82.9–86.0",
        "30.0–32.2":  "86.0–90.0",
        "≥ 32.2":     "≥ 90.0",
    }
    return _table.get(band_c, band_c)


def render_work_rest_table(unit="c"):
    """NIOSH 2016-106 §6 work-rest table: WBGT × work intensity → minutes of work per hour.

    Source values from NIOSH 2016-106 Table 6-1 (REL line, acclimatized worker).
    The matrix isn't a precise reproduction — it's a clean reading-version that
    surfaces the thresholds without recreating NIOSH's typographic style.

    Tufte principles applied:
      - Multifunctioning color: each row's WBGT band is the metric encoding
      - Words, numbers, images integrated: citation embedded in figure, not below
      - Layering: dark text on cream cells; thresholds boldfaced; "stop" row in WBGT oxblood
    """
    fig, ax = plt.subplots(figsize=(8, 5), facecolor=PAPER)
    ax.set_facecolor(PAPER)
    ax.axis("off")

    # Header row + 6 data rows.
    # Columns: WBGT range | Light | Moderate | Heavy | Very Heavy
    # Each cell value is minutes of work per hour at that band.
    # The WBGT column header and band labels change with unit; work minutes do not.
    wbgt_unit_label = "WBGT °C" if unit == "c" else "WBGT °F"
    header = [wbgt_unit_label, "Light", "Moderate", "Heavy", "Very heavy"]

    # °C source bands (NIOSH 2016-106 Table 6-1)
    rows_c = [
        ("< 25.0",     "60", "60", "60", "60", None),
        ("25.0–26.7",  "60", "60", "45", "30", None),
        ("26.7–28.3",  "60", "45", "30", "30", None),
        ("28.3–30.0",  "45", "30", "15", "—",  None),
        ("30.0–32.2",  "30", "15", "—",  "—",  None),
        ("≥ 32.2",     "Stop work — exceeds NIOSH ceiling", None, None, None, "stop"),
    ]

    # Build the displayed rows: convert WBGT band labels if °F, leave work minutes as-is
    if unit == "f":
        rows = [
            (_c_band_to_f(r[0]),) + r[1:]
            for r in rows_c
        ]
    else:
        rows = rows_c

    n_cols = len(header)
    n_rows = len(rows) + 1  # +1 for header
    col_w = 1.0 / n_cols
    row_h = 1.0 / n_rows

    def cell(x, y, w, h, text, *, bold=False, bg=None, fg=INK, ha="center", size=12):
        if bg:
            ax.add_patch(patches.Rectangle((x, y), w, h, facecolor=bg, edgecolor="none"))
        ax.text(x + w / 2 if ha == "center" else x + 0.01, y + h / 2,
                text, ha=ha, va="center", color=fg,
                fontsize=size, fontweight="bold" if bold else "normal",
                fontfamily="serif")

    # Header row
    for i, h in enumerate(header):
        x = i * col_w
        y = 1.0 - row_h
        cell(x, y, col_w, row_h, h, bold=True, bg=PAPER, fg=INK_SOFT, size=11)

    # Data rows
    for r_idx, (wbgt_label, c1, c2, c3, c4, special) in enumerate(rows):
        y = 1.0 - (r_idx + 2) * row_h
        if special == "stop":
            # Ceiling row: full WBGT oxblood background, paper-colored text
            cell(0, y, 1.0, row_h, c1, bold=True, bg=WBGT, fg=PAPER, ha="center", size=12)
            continue
        sev_tint = SEV_TINTS[r_idx]
        cell(0, y, col_w, row_h, wbgt_label, bold=True, bg=sev_tint, fg=INK, size=11)
        for i, val in enumerate([c1, c2, c3, c4]):
            x = (i + 1) * col_w
            is_stop = (val == "—")
            cell(x, y, col_w, row_h, val,
                 bold=False, bg=sev_tint,
                 fg=INK_FAINT if is_stop else INK,
                 size=12)

    # Thin hairline grid in INK_FAINT (whisper — Tufte's layering principle)
    for i in range(n_cols + 1):
        x = i * col_w
        ax.add_line(plt.Line2D([x, x], [0, 1.0 - row_h], color=INK_FAINT, linewidth=0.4))
    for i in range(n_rows + 1):
        y = i * row_h
        ax.add_line(plt.Line2D([0, 1.0], [y, y], color=INK_FAINT, linewidth=0.4))

    # Title + integrated citation (Tufte: words, numbers, images integrated)
    ax.text(0.0, 1.04, "NIOSH-recommended work/rest minutes per hour, acclimatized worker",
            fontsize=12, fontweight="bold", color=INK, fontfamily="serif")
    ax.text(0.0, -0.06,
            "Source: NIOSH 2016-106, Section 6, Table 6-1 (Recommended Exposure Limit).",
            fontsize=9, color=INK_FAINT, fontfamily="serif", style="italic")

    fig.subplots_adjust(left=0.02, right=0.98, bottom=0.10, top=0.95)
    fig.savefig(OUT / f"work-rest-table-{unit}.svg", format="svg", bbox_inches="tight")
    plt.close(fig)


TARGETS = {
    "stevenson-screen": render_stevenson_screen,
    "heat-index-nomogram": render_heat_index_nomogram,
    "three-thermometer-rig": render_three_thermometer_rig,
    "work-rest-table": render_work_rest_table,
}

UNITS = ["c", "f"]


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--target", choices=list(TARGETS) + ["all"], default="all",
                   help="Which diagram to render (default: all)")
    p.add_argument("--unit", choices=UNITS + ["all"], default="all",
                   help="Temperature unit variant to write: c, f, or all (default: all)")
    args = p.parse_args()

    keys = list(TARGETS) if args.target == "all" else [args.target]
    units = UNITS if args.unit == "all" else [args.unit]

    for k in keys:
        for u in units:
            TARGETS[k](u)
            print(f"wrote data/diagrams/{k}-{u}.svg")
