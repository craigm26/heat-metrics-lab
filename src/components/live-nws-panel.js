// src/components/live-nws-panel.js
// Ch 7 location-mode panel: fetches current conditions + 6-hour forecast
// from api.weather.gov given lat,lng. Renders three metrics for current
// hour + a small inline SVG chart for the next 6 hours.

import { heatIndexC, wbgtIndoorC, wbgtOutdoorC } from "../metrics.js";
import { formatTemp } from "./temp-toggle.js";
import { initCitationChips } from "./citation-chip.js";

const STORAGE_KEY = "hml-nws-coords";

const PRESETS = [
  { label: "Phoenix, AZ", lat: 33.45, lng: -112.07 },
  { label: "Houston, TX", lat: 29.76, lng: -95.37 },
];

const state = {
  coords: null,    // { lat, lng } or null
  loading: false,
  error: null,
  current: null,   // { air_temp_c, rh_pct, wind_mph, solar_w_m2_estimate, hi_c, wbgt_c, time, sky_cover_pct }
  forecast: null,  // [{ time, air_temp_c, hi_c, wbgt_c, ... }, ...] for next 6 hours
  inputDraft: null, // last raw input the user typed; preserved across parse-fail re-renders
  station: null,   // { gridId, gridX, gridY, city, state, forecastOffice, timeZone, radarStation } from /points
};

export function initLiveNwsPanel() {
  const root = document.getElementById("live-nws");
  if (!root) return;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.lat === "number" && typeof saved.lng === "number") {
      state.coords = saved;
    }
  } catch {}

  render(root);

  root.addEventListener("click", async (e) => {
    const preset = e.target.closest("[data-preset]");
    if (preset) {
      const i = parseInt(preset.getAttribute("data-preset"), 10);
      const p = PRESETS[i];
      if (p) await loadCoords(root, p.lat, p.lng);
      return;
    }
    const submit = e.target.closest('[data-action="submit"]');
    if (submit) {
      await handleSubmit(root);
      return;
    }
    const detect = e.target.closest('[data-action="detect"]');
    if (detect) {
      await detectLocation(root);
    }
  });

  root.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const inp = e.target.closest('input[data-action="coords-input"]');
    if (!inp) return;
    e.preventDefault();
    await handleSubmit(root);
  });

  window.addEventListener("temp-unit-changed", () => render(root));
}

async function handleSubmit(root) {
  const inp = root.querySelector('input[data-action="coords-input"]');
  if (!inp) return;
  const raw = inp.value.trim();
  // Empty input: refresh the saved location if we have one; else prompt gently.
  if (!raw) {
    if (state.coords) {
      await loadCoords(root, state.coords.lat, state.coords.lng);
      return;
    }
    state.error = "Enter coordinates above or pick a preset below.";
    state.inputDraft = "";
    render(root);
    return;
  }
  const parsed = parseLatLng(raw);
  if (!parsed) {
    // Preserve what the user typed AND the previous successful location.
    state.error = "Couldn't parse lat,lng — try a format like '33.45, -112.07'";
    state.inputDraft = raw;
    render(root);
    return;
  }
  state.inputDraft = null;
  await loadCoords(root, parsed.lat, parsed.lng);
}

function parseLatLng(raw) {
  if (!raw) return null;
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function detectLocation(root) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      state.error = "This browser doesn't expose geolocation. Pick a preset or enter coordinates.";
      render(root);
      resolve();
      return;
    }
    state.loading = true;
    state.error = null;
    render(root);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await loadCoords(root, pos.coords.latitude, pos.coords.longitude);
        resolve();
      },
      (err) => {
        state.loading = false;
        if (err.code === err.PERMISSION_DENIED) {
          state.error = "Location permission denied. Pick a preset or enter coordinates below.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          state.error = "Couldn't determine your location. Pick a preset or enter coordinates below.";
        } else if (err.code === err.TIMEOUT) {
          state.error = "Location request timed out. Pick a preset or enter coordinates below.";
        } else {
          state.error = `Location error: ${err.message}`;
        }
        render(root);
        resolve();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function loadCoords(root, lat, lng) {
  state.coords = { lat, lng };
  state.loading = true;
  state.error = null;
  state.current = null;
  state.forecast = null;
  state.station = null;
  state.inputDraft = null;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.coords)); } catch {}
  render(root);

  try {
    // Stage 1: resolve gridpoint
    const pointResp = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, {
      headers: { Accept: "application/geo+json" },
    });
    if (!pointResp.ok) throw new Error(`NWS /points responded ${pointResp.status}`);
    const point = await pointResp.json();
    const forecastUrl = point?.properties?.forecastHourly;
    if (!forecastUrl) throw new Error("NWS response missing forecastHourly URL");

    // Capture the gridpoint metadata for display.
    const pp = point.properties || {};
    const rel = pp.relativeLocation?.properties || {};
    state.station = {
      gridId: pp.gridId || null,
      gridX: pp.gridX ?? null,
      gridY: pp.gridY ?? null,
      city: rel.city || null,
      state: rel.state || null,
      forecastOffice: pp.cwa || (pp.forecastOffice ? pp.forecastOffice.split("/").pop() : null),
      timeZone: pp.timeZone || null,
      radarStation: pp.radarStation || null,
    };

    // Stage 2: hourly forecast
    const fcResp = await fetch(forecastUrl, {
      headers: { Accept: "application/geo+json" },
    });
    if (!fcResp.ok) throw new Error(`NWS forecastHourly responded ${fcResp.status}`);
    const fc = await fcResp.json();
    const periods = fc?.properties?.periods;
    if (!Array.isArray(periods) || periods.length < 1) throw new Error("NWS forecast was empty");

    // Current = periods[0]; next 6 = periods[0..5]
    const current = periodToReading(periods[0], lat);
    const forecast = periods.slice(0, 6).map(p => periodToReading(p, lat));

    state.current = current;
    state.forecast = forecast;
    state.loading = false;
    render(root);
    dispatchChapterActive(current);
  } catch (err) {
    state.loading = false;
    state.error = `Couldn't reach NWS: ${err.message}. Try Manual mode instead.`;
    render(root);
  }
}

function periodToReading(p, lat) {
  // NWS returns temperature with unit C or F (per period.temperatureUnit)
  let temp_c;
  if (p.temperatureUnit === "F") {
    temp_c = (p.temperature - 32) * 5 / 9;
  } else {
    temp_c = p.temperature;
  }

  // RH: NWS exposes relativeHumidity.value when available; fall back to dewpoint Magnus
  let rh;
  if (p.relativeHumidity?.value != null) {
    rh = p.relativeHumidity.value;
  } else if (p.dewpoint?.value != null) {
    // Magnus formula approximation, dewpoint in C, T in C
    const td = p.dewpoint.value;
    const a = 17.625, b = 243.04;
    const es_t = Math.exp((a * temp_c) / (b + temp_c));
    const es_td = Math.exp((a * td) / (b + td));
    rh = Math.min(100, Math.max(5, 100 * es_td / es_t));
  } else {
    rh = 50; // fallback default
  }

  // Wind: NWS may give "5 mph", "10 to 15 mph", "10 km/h" — parse leading number
  let wind_mph = 4;
  if (typeof p.windSpeed === "string") {
    const m = p.windSpeed.match(/(\d+(?:\.\d+)?)/);
    if (m) {
      wind_mph = parseFloat(m[1]);
      if (/km\/h/i.test(p.windSpeed)) wind_mph = wind_mph * 0.621371;
    }
  }

  // Solar estimate: clear-sky max ~1000 W/m² scaled by skyCover and sun elevation
  // solar = 1000 * sin(elevation) * (1 - 0.7 * cloudFrac)
  let sky_cover_pct = 50;
  if (p.skyCover?.value != null) sky_cover_pct = p.skyCover.value;
  const cloudFrac = sky_cover_pct / 100;
  const elevDeg = solarElevationAt(p.startTime, lat);
  const sinElev = Math.max(0, Math.sin(elevDeg * Math.PI / 180));
  const solar_w_m2 = Math.max(0, 1000 * sinElev * (1 - 0.7 * cloudFrac));

  const hi_c = heatIndexC(temp_c, rh);
  const wbgt_c = solar_w_m2 > 0
    ? wbgtOutdoorC(temp_c, rh, wind_mph, solar_w_m2)
    : wbgtIndoorC(temp_c, rh);

  return {
    time: p.startTime,
    air_temp_c: temp_c,
    rh_pct: rh,
    wind_mph,
    solar_w_m2_estimate: solar_w_m2,
    hi_c,
    wbgt_c,
    sky_cover_pct,
  };
}

function solarElevationAt(isoString, lat) {
  // Simplified NOAA solar elevation: good to a few degrees for orientation purposes.
  // Returns degrees above horizon.
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 30;
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  // Solar declination
  const decl = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  // Use local clock hours from the ISO timestamp (already timezone-aware)
  const localHour = d.getHours() + d.getMinutes() / 60;
  // Hour angle: 0 at solar noon (approximated as local noon)
  const hourAngle = 15 * (localHour - 12); // degrees
  const sinElev = Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180)
                + Math.cos(lat * Math.PI / 180) * Math.cos(decl * Math.PI / 180)
                  * Math.cos(hourAngle * Math.PI / 180);
  return Math.max(-90, Math.min(90, Math.asin(sinElev) * 180 / Math.PI));
}

function render(root) {
  let bodyHtml;
  if (state.loading) {
    bodyHtml = `<p class="live-nws__loading">Reaching api.weather.gov&#x2026;</p>`;
  } else if (state.error) {
    bodyHtml = `<p class="live-nws__error">${escapeHtml(state.error)}</p>`;
  } else if (state.current && state.forecast) {
    bodyHtml = renderResult();
  } else {
    bodyHtml = `<p class="live-nws__prompt">Enter a lat,lng (e.g. <code>33.45, -112.07</code>) or pick a preset below.</p>`;
  }

  const presetsHtml = PRESETS.map((p, i) => `
    <button type="button" class="live-nws__preset" data-preset="${i}">${escapeHtml(p.label)}</button>
  `).join("");

  // Prefer the user's in-progress draft (so a bad-parse error doesn't erase what they typed),
  // then fall back to the last successful coords.
  const initialValue = state.inputDraft != null
    ? state.inputDraft
    : (state.coords
        ? `${state.coords.lat.toFixed(4)}, ${state.coords.lng.toFixed(4)}`
        : "");

  const detectHtml = ("geolocation" in navigator)
    ? `<button type="button" class="live-nws__detect" data-action="detect">Use my location</button>`
    : "";

  root.innerHTML = `
    <div class="live-nws">
      ${detectHtml}
      <div class="live-nws__controls">
        <input type="text" class="live-nws__input" data-action="coords-input"
               placeholder="lat, lng  (e.g. 33.45, -112.07)"
               value="${escapeHtml(initialValue)}"
               aria-label="Latitude, longitude" />
        <button type="button" class="live-nws__submit" data-action="submit">Fetch</button>
      </div>
      <div class="live-nws__presets">${presetsHtml}</div>
      <div class="live-nws__body" aria-live="polite">${bodyHtml}</div>
    </div>
  `;
  initCitationChips(root);
}

function renderStation() {
  const s = state.station;
  if (!s) return "";
  const place = (s.city && s.state) ? `${s.city}, ${s.state}` : null;
  const gridpoint = (s.gridId && s.gridX != null && s.gridY != null)
    ? `${s.gridId} ${s.gridX},${s.gridY}` : null;
  const office = s.forecastOffice ? `forecast office ${s.forecastOffice}` : null;
  const radar = s.radarStation ? `radar ${s.radarStation}` : null;
  const tz = s.timeZone ? `${s.timeZone}` : null;
  const parts = [place, gridpoint, office, radar, tz].filter(Boolean);
  if (!parts.length) return "";
  return `<p class="live-nws__station">NWS gridpoint: ${parts.map(escapeHtml).join(" · ")}.</p>`;
}

function renderResult() {
  const c = state.current;
  const f = state.forecast;
  const time = new Date(c.time);
  const timeLabel = time.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  const readoutHtml = `
    <div class="live-nws__readout">
      <div class="live-nws__cell live-nws__cell--air">
        <span class="live-nws__label">Air</span>
        <span class="live-nws__value">${formatTemp(c.air_temp_c, {decimals: 0})}</span>
      </div>
      <div class="live-nws__cell live-nws__cell--hi">
        <span class="live-nws__label">Heat index</span>
        <span class="live-nws__value">${formatTemp(c.hi_c, {decimals: 0})}</span>
      </div>
      <div class="live-nws__cell live-nws__cell--wbgt">
        <span class="live-nws__label">WBGT</span>
        <span class="live-nws__value">${formatTemp(c.wbgt_c, {decimals: 0})}</span>
      </div>
    </div>
    <p class="live-nws__meta">
      Reported ${escapeHtml(timeLabel)} for ${state.coords.lat.toFixed(2)}&#176;, ${state.coords.lng.toFixed(2)}&#176;.
      Sky cover ${c.sky_cover_pct.toFixed(0)}%,
      wind ${c.wind_mph.toFixed(1)}&nbsp;mph,
      estimated solar ${c.solar_w_m2_estimate.toFixed(0)}&nbsp;W/m&#178;.
    </p>
    ${renderStation()}
  `;

  const chartHtml = renderChart(f);

  return readoutHtml + chartHtml;
}

function renderChart(forecast) {
  const W = 480, H = 140;
  const pad = { left: 40, right: 64, top: 12, bottom: 28 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const allVals = forecast.flatMap(r => [r.air_temp_c, r.hi_c, r.wbgt_c]);
  const minV = Math.min(...allVals) - 1;
  const maxV = Math.max(...allVals) + 1;
  const span = Math.max(0.1, maxV - minV);

  const n = forecast.length;
  const xStep = n > 1 ? plotW / (n - 1) : plotW;
  const xy = (i, v) => [
    pad.left + i * xStep,
    pad.top + plotH - ((v - minV) / span) * plotH,
  ];

  const series = [
    { key: "air_temp_c", color: "var(--air)", label: "Air" },
    { key: "hi_c",       color: "var(--heat-index)", label: "HI" },
    { key: "wbgt_c",     color: "var(--wbgt)", label: "WBGT" },
  ];

  let lines = "";
  for (const s of series) {
    const d = forecast.map((r, i) => {
      const [x, y] = xy(i, r[s.key]);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
    lines += `<path d="${d}" stroke="${s.color}" stroke-width="2" fill="none" />`;
    // Endpoint dot + label
    const last = n - 1;
    const [ex, ey] = xy(last, forecast[last][s.key]);
    lines += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.5" fill="${s.color}" />`;
    lines += `<text x="${(ex + 7).toFixed(1)}" y="${(ey + 4).toFixed(1)}" font-family="var(--font-mono)" font-size="11" fill="${s.color}">${s.label} ${formatTemp(forecast[last][s.key], {decimals: 0})}</text>`;
  }

  // Hour labels along the x-axis
  let xLabels = "";
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1 || i === Math.floor(n / 2)) {
      const [x] = xy(i, minV);
      xLabels += `<text x="${x.toFixed(1)}" y="${(H - 8).toFixed(1)}" font-size="10" font-family="var(--font-ui)" fill="var(--ink-faint)" text-anchor="middle">+${i}h</text>`;
    }
  }

  return `
    <div class="live-nws__chart">
      <svg viewBox="0 0 ${W} ${H}" role="img"
           aria-label="6-hour forecast of air temperature, heat index, and WBGT"
           width="100%" preserveAspectRatio="xMidYMid meet">
        ${lines}
        ${xLabels}
      </svg>
    </div>
  `;
}

function dispatchChapterActive(reading) {
  if (!reading) return;
  window.dispatchEvent(new CustomEvent("chapter-active", {
    detail: {
      chapter: "7",
      metric: "all",
      readings: {
        air_temp_c: reading.air_temp_c,
        hi_c: reading.hi_c,
        wbgt_c: reading.wbgt_c,
      },
    },
  }));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
