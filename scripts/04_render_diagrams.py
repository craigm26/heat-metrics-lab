# scripts/04_render_diagrams.py
# Build-time SVG diagram rendering for heat-metrics-lab.
# Each render_* function writes one SVG into data/diagrams/.
# Run all: `uv run --project scripts python scripts/04_render_diagrams.py`
# Run one: `uv run --project scripts python scripts/04_render_diagrams.py --target NAME`
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
# ---------------------------------------------------------------------------

def render_stevenson_screen():
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

    fig.savefig(OUT / "stevenson-screen.svg", format="svg",
                bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Task 3.2 — NWS Heat-index nomogram
# Tufte principles applied:
#   - Range-frame: x-axis spans 80–115 °F, y-axis spans 10–100% (data extents only)
#   - Contour lines (not contourf fill) to keep data-ink high
#   - Two annotated comparison points are the argument — visually anchored
#   - Top/right spines removed; contour labels in INK_SOFT
# ---------------------------------------------------------------------------

def render_heat_index_nomogram():
    # Build the grid in °F for the NWS domain
    temps_f = np.arange(80, 116, 1)          # 80 to 115 inclusive
    rhs = np.arange(10, 101, 5)              # 10 to 100 inclusive

    # Compute heat index on the grid (convert to °F at render time)
    T_grid, RH_grid = np.meshgrid(temps_f, rhs)
    HI_grid = np.zeros_like(T_grid, dtype=float)
    for i, rh in enumerate(rhs):
        for j, tf in enumerate(temps_f):
            tc = (tf - 32) * 5 / 9
            hi_c = heat_index_c(tc, rh)
            HI_grid[i, j] = hi_c * 9 / 5 + 32

    # Contour levels at every 5 °F from 80 to 140
    levels = np.arange(80, 141, 5)

    fig, ax = plt.subplots(figsize=(8, 6))
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    # Contour lines — HEAT_INDEX color, moderate weight (not fill)
    cs = ax.contour(
        T_grid, RH_grid, HI_grid,
        levels=levels,
        colors=HEAT_INDEX,
        linewidths=0.9,
        alpha=0.85,
    )
    ax.clabel(cs, levels=levels[::2], inline=True, fontsize=7.5,
              fmt="%d °F", colors=INK_SOFT)

    # ── Range-frame: axes span only the data extent
    # Remove top + right spines (Tufte open frame)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(INK_FAINT)
    ax.spines["bottom"].set_color(INK_FAINT)

    # Tighten axis limits to exact data range
    ax.set_xlim(80, 115)
    ax.set_ylim(10, 100)

    # Tick styling
    ax.tick_params(axis="both", labelsize=8, color=INK_FAINT, length=3)
    for label in ax.get_xticklabels() + ax.get_yticklabels():
        label.set_color(INK_SOFT)

    ax.set_xlabel("Air temperature (°F)", fontsize=9, color=INK_SOFT, labelpad=6)
    ax.set_ylabel("Relative humidity (%)", fontsize=9, color=INK_SOFT, labelpad=6)

    # ── Annotated comparison points — these are the argument of the chart.
    # Values computed at render time from the same function, so they match contours.
    pt1_t = 95.0
    pt1_rh = 30.0
    pt2_t = 95.0
    pt2_rh = 75.0
    pt1_hi = heat_index_c((pt1_t - 32) * 5 / 9, pt1_rh) * 9 / 5 + 32
    pt2_hi = heat_index_c((pt2_t - 32) * 5 / 9, pt2_rh) * 9 / 5 + 32

    # Point markers — dominant in INK
    ax.plot(pt1_t, pt1_rh, "o", color=INK, markersize=6, zorder=5)
    ax.plot(pt2_t, pt2_rh, "o", color=INK, markersize=6, zorder=5)

    # Leader lines + boxed labels
    box_style = dict(
        boxstyle="round,pad=0.3", facecolor=PAPER, edgecolor=INK_SOFT, linewidth=0.8
    )
    ax.annotate(
        f"95 °F, 30% RH\n→ HI {pt1_hi:.0f} °F",
        xy=(pt1_t, pt1_rh),
        xytext=(103, 22),
        fontsize=7.5, color=INK,
        arrowprops=dict(arrowstyle="-", color=INK_SOFT, linewidth=0.9),
        bbox=box_style,
        ha="left",
    )
    ax.annotate(
        f"95 °F, 75% RH\n→ HI {pt2_hi:.0f} °F",
        xy=(pt2_t, pt2_rh),
        xytext=(84, 88),
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
    fig.savefig(OUT / "heat-index-nomogram.svg", format="svg",
                bbox_inches="tight", pad_inches=0.2)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Task 3.3 — Three-thermometer rig (WBGT illustration)
# Tufte principles applied:
#   - Multifunctioning elements: thermometer color = metric encoding AND label color
#   - Confection: three thermometers + formula + labels integrated in one composition
#   - Words, numbers, images integrated — formula adjacent to diagram, not below it
#   - No axes, no grid — this is an explanatory illustration
# ---------------------------------------------------------------------------

def render_three_thermometer_rig():
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

    fig.savefig(OUT / "three-thermometer-rig.svg", format="svg",
                bbox_inches="tight", pad_inches=0.2)
    plt.close(fig)


TARGETS = {
    "stevenson-screen": render_stevenson_screen,
    "heat-index-nomogram": render_heat_index_nomogram,
    "three-thermometer-rig": render_three_thermometer_rig,
}


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--target", choices=list(TARGETS) + ["all"], default="all")
    args = p.parse_args()
    keys = list(TARGETS) if args.target == "all" else [args.target]
    for k in keys:
        TARGETS[k]()
        print(f"wrote data/diagrams/{k}.svg")
