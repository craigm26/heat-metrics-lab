# scripts/_metrics.py — Python sister of src/metrics.js.
# Translations are line-for-line. If src/metrics.js changes, this file MUST
# change in lockstep, and scripts/05_drift_check.py validates against the same
# reference-cases.json.
import math


def heat_index_c(air_temp_c: float, rh_pct: float) -> float:
    """Rothfusz 1990 (NWS Tech Memo SR-90) heat index.

    Returns heat index in °C given air temp in °C and relative humidity (0-100).
    """
    T = air_temp_c * 9 / 5 + 32  # the polynomial is fitted in °F
    R = rh_pct
    simple = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (R * 0.094))
    avg = (simple + T) / 2
    if avg < 80:
        return (simple - 32) * 5 / 9
    HI = (
        -42.379
        + 2.04901523 * T
        + 10.14333127 * R
        - 0.22475541 * T * R
        - 0.00683783 * T * T
        - 0.05481717 * R * R
        + 0.00122874 * T * T * R
        + 0.00085282 * T * R * R
        - 0.00000199 * T * T * R * R
    )
    if R < 13 and 80 <= T <= 112:
        HI -= ((13 - R) / 4) * math.sqrt((17 - abs(T - 95)) / 17)
    if R > 85 and 80 <= T <= 87:
        HI += ((R - 85) / 10) * ((87 - T) / 5)
    return (HI - 32) * 5 / 9


def _wet_bulb_stull_c(t: float, rh: float) -> float:
    """Stull 2011 closed-form psychrometric wet-bulb. Valid 5% <= RH <= 99%."""
    a = t * math.atan(0.151977 * math.sqrt(rh + 8.313659))
    b = math.atan(t + rh) - math.atan(rh - 1.676331)
    c = 0.00391838 * (rh ** 1.5) * math.atan(0.023101 * rh)
    return a + b + c - 4.686035


def wbgt_indoor_c(air_temp_c: float, rh_pct: float) -> float:
    """Psychrometric WBGT (no solar load). WBGT_indoor = 0.7*Tnwb + 0.3*Ta."""
    tnwb = _wet_bulb_stull_c(air_temp_c, rh_pct)
    return 0.7 * tnwb + 0.3 * air_temp_c


def _globe_temp_c(air_temp_c: float, solar_w_m2: float, wind_mph: float) -> float:
    """Simplified globe-temp estimate. Coefficient tuned against five published
    Liljegren reference cases; see notes/wbgt-tuning.md. RMSE 0.76 °C / 1.37 °F."""
    wind_ms = max(0.1, wind_mph * 0.44704)
    return air_temp_c + 0.0125 * solar_w_m2 / (wind_ms ** 0.3)


def wbgt_outdoor_c(air_temp_c: float, rh_pct: float, wind_mph: float,
                   solar_w_m2: float) -> float:
    """Outdoor WBGT with simplified globe-temp model.
    WBGT_outdoor = 0.7*Tnwb + 0.2*Tg + 0.1*Ta."""
    tnwb = _wet_bulb_stull_c(air_temp_c, rh_pct)
    tg = _globe_temp_c(air_temp_c, solar_w_m2 if solar_w_m2 else 0,
                       wind_mph if wind_mph else 4)
    return 0.7 * tnwb + 0.2 * tg + 0.1 * air_temp_c


if __name__ == "__main__":
    # Quick smoke test when run directly.
    print(f"HI(80°F, 40%RH) = {heat_index_c(26.67, 40) * 9/5 + 32:.1f} °F")
    print(f"HI(95°F, 50%RH) = {heat_index_c(35.0, 50) * 9/5 + 32:.1f} °F")
    print(f"WBGT_in(32°C, 60%RH) = {wbgt_indoor_c(32, 60):.2f} °C")
    print(f"WBGT_out(32°C, 60%RH, 5mph, 900W/m²) = {wbgt_outdoor_c(32, 60, 5, 900):.2f} °C")
