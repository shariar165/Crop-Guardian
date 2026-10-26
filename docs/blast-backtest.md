# Rice-blast risk backtest

How often the draft rice-blast rule would have alerted at Shibganj, Bogura (25.02, 89.32) in the last 3 Boro (Jan–Apr) and Aman (Aug–Oct) seasons, using observed weather from the Open-Meteo archive.

> These are weather-only counts. The rule is a draft: it has not been validated against real blast outbreak records, and should be reviewed with BRRI before farmers rely on it.

| Season | Rule: wet hours | Danger days | Alerts | Avg. days between alerts |
|---|---|--:|--:|--:|
| Boro 2024 | ≥ 8 h (looser) | 7 of 121 | 3 | 5.0 |
| Boro 2024 | ≥ 10 h (app) | 2 of 121 | 1 | — |
| Boro 2024 | ≥ 12 h (stricter) | 0 of 121 | 0 | — |
| Boro 2025 | ≥ 8 h (looser) | 8 of 120 | 3 | 9.0 |
| Boro 2025 | ≥ 10 h (app) | 4 of 120 | 2 | 12.0 |
| Boro 2025 | ≥ 12 h (stricter) | 2 of 120 | 1 | — |
| Boro 2026 | ≥ 8 h (looser) | 27 of 120 | 5 | 12.0 |
| Boro 2026 | ≥ 10 h (app) | 14 of 120 | 5 | 12.0 |
| Boro 2026 | ≥ 12 h (stricter) | 5 of 120 | 2 | 28.0 |
| Aman 2023 | ≥ 8 h (looser) | 49 of 92 | 7 | 13.3 |
| Aman 2023 | ≥ 10 h (app) | 37 of 92 | 5 | 19.8 |
| Aman 2023 | ≥ 12 h (stricter) | 25 of 92 | 5 | 13.8 |
| Aman 2024 | ≥ 8 h (looser) | 59 of 92 | 8 | 11.0 |
| Aman 2024 | ≥ 10 h (app) | 40 of 92 | 8 | 11.7 |
| Aman 2024 | ≥ 12 h (stricter) | 34 of 92 | 8 | 12.1 |
| Aman 2025 | ≥ 8 h (looser) | 56 of 92 | 5 | 22.5 |
| Aman 2025 | ≥ 10 h (app) | 42 of 92 | 6 | 12.2 |
| Aman 2025 | ≥ 12 h (stricter) | 33 of 92 | 6 | 12.4 |

A wet hour has RH ≥ 90% at 18–28°C. A day qualifies when it has at least the rule's wet hours, and is a danger day when the day before or after also qualifies. A new alert is a danger day after at least 2 non-danger days; the gap is measured from one alert's start to the next. The app uses the middle rule; the others are only compared here.

Generated on 2026-10-20 by `npx tsx scripts/find-blast-periods.ts --write`.
