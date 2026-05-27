// src/metrics.js — pure functions, ESM, no dependencies.
//
// MUST stay in lockstep with scripts/_metrics.py. The drift gate
// (scripts/05_drift_check.py, Task 1.7) validates that both implementations
// produce the same output for every case in data/references/reference-cases.json
// within tolerance_f.

/**
 * Rothfusz 1990 (NWS Tech Memo SR-90) heat index.
 * @param {number} air_temp_c — air temperature, °C
 * @param {number} rh_pct — relative humidity, 0-100
 * @returns {number} heat index, °C
 */
export function heatIndexC(air_temp_c, rh_pct) {
  const T = air_temp_c * 9 / 5 + 32;
  const R = rh_pct;
  const simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094));
  const avg = (simple + T) / 2;
  if (avg < 80) return (simple - 32) * 5 / 9;
  let HI =
    -42.379
    + 2.04901523 * T
    + 10.14333127 * R
    - 0.22475541 * T * R
    - 0.00683783 * T * T
    - 0.05481717 * R * R
    + 0.00122874 * T * T * R
    + 0.00085282 * T * R * R
    - 0.00000199 * T * T * R * R;
  if (R < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  }
  if (R > 85 && T >= 80 && T <= 87) {
    HI += ((R - 85) / 10) * ((87 - T) / 5);
  }
  return (HI - 32) * 5 / 9;
}

/**
 * Stull 2011 closed-form psychrometric wet-bulb.
 * Valid for 5% ≤ RH ≤ 99% and -20 ≤ T ≤ 50 °C, ±0.65 °C typical.
 * @param {number} t — air temperature, °C
 * @param {number} rh — relative humidity, 0-100
 * @returns {number} wet-bulb temperature, °C
 */
function wetBulbStullC(t, rh) {
  const a = t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659));
  const b = Math.atan(t + rh) - Math.atan(rh - 1.676331);
  const c = 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh);
  return a + b + c - 4.686035;
}

/**
 * Psychrometric WBGT (no solar load).
 * WBGT_indoor = 0.7 * Tnwb + 0.3 * Ta
 * @param {number} air_temp_c
 * @param {number} rh_pct
 * @returns {number} WBGT, °C
 */
export function wbgtIndoorC(air_temp_c, rh_pct) {
  const tnwb = wetBulbStullC(air_temp_c, rh_pct);
  return 0.7 * tnwb + 0.3 * air_temp_c;
}

/**
 * Simplified globe-temperature estimate. Coefficient tuned against five
 * published Liljegren 2008 reference cases (RMSE 0.76 °C / 1.37 °F);
 * see notes/wbgt-tuning.md for the fit.
 * @param {number} air_temp_c
 * @param {number} solar_w_m2 — solar irradiance, W/m²
 * @param {number} wind_mph
 * @returns {number} globe temperature estimate, °C
 */
function globeTempC(air_temp_c, solar_w_m2, wind_mph) {
  const wind_ms = Math.max(0.1, wind_mph * 0.44704);
  return air_temp_c + 0.0125 * solar_w_m2 / Math.pow(wind_ms, 0.3);
}

/**
 * Outdoor WBGT with simplified globe-temp model.
 * WBGT_outdoor = 0.7 * Tnwb + 0.2 * Tg + 0.1 * Ta
 * @param {number} air_temp_c
 * @param {number} rh_pct
 * @param {number} wind_mph
 * @param {number} solar_w_m2
 * @returns {number} WBGT, °C
 */
export function wbgtOutdoorC(air_temp_c, rh_pct, wind_mph, solar_w_m2) {
  const tnwb = wetBulbStullC(air_temp_c, rh_pct);
  const tg = globeTempC(air_temp_c, solar_w_m2 ?? 0, wind_mph ?? 4);
  return 0.7 * tnwb + 0.2 * tg + 0.1 * air_temp_c;
}
