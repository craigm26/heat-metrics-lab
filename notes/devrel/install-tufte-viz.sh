#!/usr/bin/env bash
# Install the tufte-viz skill (aparente) into ~/.claude/skills/
# Source: https://gist.github.com/aparente/e48c353755958621b3c0004593105a90
#
# After install + Claude Code restart, the skill becomes available via the
# Skill tool. Used in heat-metrics-lab Phases 3-5 for chart critique passes
# on the nomogram (Ch 2), three-thermometer rig (Ch 3), divergence map (Ch 5),
# sparkline mini-chart (Ch 7), and NIOSH table (Ch 8).

set -euo pipefail
GIST_ID=e48c353755958621b3c0004593105a90
DEST=~/.claude/skills/tufte-viz
REFS_BASE=https://gist.githubusercontent.com/aparente/${GIST_ID}/raw

mkdir -p "$DEST/references" "$DEST/demos"

curl -sSL "${REFS_BASE}/SKILL.md" > "$DEST/SKILL.md"
curl -sSL "${REFS_BASE}/references__tufte-principles.md" > "$DEST/references/tufte-principles.md"
curl -sSL "${REFS_BASE}/references__analytical-design.md" > "$DEST/references/analytical-design.md"

# Optional: the four demo HTMLs (big, useful as visual reference)
curl -sSL "${REFS_BASE}/demo__giss-temperature.html" > "$DEST/demos/giss-temperature.html"
curl -sSL "${REFS_BASE}/demo__kyoto-sakura.html" > "$DEST/demos/kyoto-sakura.html"
curl -sSL "${REFS_BASE}/demo__sunspot-butterfly.html" > "$DEST/demos/sunspot-butterfly.html"
curl -sSL "${REFS_BASE}/demo__sunspot-pretty.html" > "$DEST/demos/sunspot-pretty.html"

echo "Installed tufte-viz to $DEST"
echo "Restart Claude Code to make the skill available via the Skill tool."
