# Late-blight risk backtest

How often the risk engine would have alerted at Shibganj, Bogura (25.02, 89.32) in the last 3 winters (Dec–Feb), using past weather from two sources: the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (reanalysis) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time).

> These are weather-only counts. They have not been validated against real late-blight outbreak records.

| Winter | Source | Rule: hours at RH ≥ 90% | Danger days | Alerts | Avg. days between alerts |
|---|---|---|--:|--:|--:|
| 2023–24 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 47 of 91 | 7 | 12.7 |
| 2023–24 | Open-Meteo archive | Stricter, ≥ 10 h | 21 of 91 | 5 | 17.3 |
| 2023–24 | NASA POWER | Hutton, ≥ 6 h (app) | 33 of 91 | 5 | 16.8 |
| 2023–24 | NASA POWER | Stricter, ≥ 10 h | 2 of 91 | 1 | — |
| 2024–25 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 48 of 90 | 5 | 18.5 |
| 2024–25 | Open-Meteo archive | Stricter, ≥ 10 h | 25 of 90 | 5 | 16.5 |
| 2024–25 | NASA POWER | Hutton, ≥ 6 h (app) | 31 of 90 | 4 | 15.0 |
| 2024–25 | NASA POWER | Stricter, ≥ 10 h | 0 of 90 | 0 | — |
| 2025–26 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 48 of 90 | 3 | 23.0 |
| 2025–26 | Open-Meteo archive | Stricter, ≥ 10 h | 14 of 90 | 3 | 8.5 |
| 2025–26 | NASA POWER | Hutton, ≥ 6 h (app) | 27 of 90 | 2 | 32.0 |
| 2025–26 | NASA POWER | Stricter, ≥ 10 h | 5 of 90 | 1 | — |

## Do the two sources agree?

Danger days under the app's rule (Hutton, ≥ 6 h (app)).

| Winter | On both | Open-Meteo archive only | NASA POWER only |
|---|--:|--:|--:|
| 2023–24 | 23 | 24 | 10 |
| 2024–25 | 18 | 30 | 13 |
| 2025–26 | 15 | 33 | 12 |

Both sources are weather models, not a station in the field, and the rule counts hours of very high humidity, where models differ most. A Bangladesh Meteorological Department station record, and the dates of real outbreaks, would show which is closer.

A day qualifies when its min temperature is ≥ 10°C and RH ≥ 90% lasts at least the rule's hours, and is a danger day when the day before or after also qualifies. A new alert is a danger day after at least 2 non-danger days; the gap is measured from one alert's start to the next. The app uses the Hutton rule; the stricter one is only compared here.

Generated on 2026-10-21 by `npx tsx scripts/find-hutton-periods.ts --write`.
