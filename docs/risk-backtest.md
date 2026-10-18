# Late-blight risk backtest

How often the risk engine would have alerted at Shibganj, Bogura (25.02, 89.32) in the last 3 winters (Dec–Feb), using observed weather from the Open-Meteo archive.

> These are weather-only counts. They have not been validated against real late-blight outbreak records.

| Winter | Rule: hours at RH ≥ 90% | Danger days | Alerts | Avg. days between alerts |
|---|---|--:|--:|--:|
| 2023–24 | Hutton, ≥ 6 h (app) | 47 of 91 | 7 | 12.7 |
| 2023–24 | Stricter, ≥ 10 h | 21 of 91 | 5 | 17.3 |
| 2024–25 | Hutton, ≥ 6 h (app) | 48 of 90 | 5 | 18.5 |
| 2024–25 | Stricter, ≥ 10 h | 25 of 90 | 5 | 16.5 |
| 2025–26 | Hutton, ≥ 6 h (app) | 48 of 90 | 3 | 23.0 |
| 2025–26 | Stricter, ≥ 10 h | 14 of 90 | 3 | 8.5 |

A day qualifies when its min temperature is ≥ 10°C and RH ≥ 90% lasts at least the rule's hours, and is a danger day when the day before or after also qualifies. A new alert is a danger day after at least 2 non-danger days; the gap is measured from one alert's start to the next. The app uses the Hutton rule; the stricter one is only compared here.

Generated on 2026-10-18 by `npx tsx scripts/find-hutton-periods.ts --write`.
