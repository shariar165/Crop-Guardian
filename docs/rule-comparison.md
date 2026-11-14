# Late-blight rules compared

Three weather rules for late blight replayed at Shibganj, Bogura (25.02, 89.32) over the winters 2019–20, 2023–24, 2024–25, 2025–26 (1 Dec to the end of February), from two past-weather sources: the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (reanalysis) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time). The app uses the first rule; the other two are only compared here.

> Weather-only counts. None of these rules has been validated against late-blight records in Bangladesh, and the one outbreak report below is a single event, not a validation.

## The rules

- **Hutton, ≥ 6 h (app)**: a day qualifies when its minimum temperature is ≥ 10°C and RH ≥ 90% lasts ≥ 6 hours; a qualifying day next to another is a danger day.
- **Stricter, ≥ 10 h**: the same with ≥ 10 hours.
- **JHULSACAST** (CPRI, tuned with 7 years of station weather at Kalyani, West Bengal; Sharma, [Potato Journal 42(1)](https://epubs.icar.org.in/index.php/PotatoJ/article/view/47731)). Late blight first appears within 14 days when either holds: the 7-day moving sums of hours at RH ≥ 90% (≥ 105) and hours at 7.2–26.6°C (≥ 150) hold for 7 consecutive days; or the 5-day sums (≥ 65 and ≥ 105) hold for 5 consecutive days and the rain on two consecutive days sums to ≥ 2.5 mm. A danger day here is a day either condition is met on. Two readings of the abstract: a moving sum covers the last n calendar days including the day, and the two rainy days lie within the 5 days the condition holds. Rain is Open-Meteo `precipitation` and NASA POWER `PRECTOTCORR`. Weather is fetched from 1 Nov, so any rule can already be firing on 1 Dec.

## Shibganj

| Winter | Source | Rule | Danger days | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires | Sprays saved vs weekly |
|---|---|---|--:|--:|---|---|--:|
| 2019–20 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 53 of 91 | 10 of 12 | `●●●●●●●●●··●` | 1 Dec (already on 30 Nov) | 2 of 12 |
| 2019–20 | Open-Meteo archive | Stricter, ≥ 10 h | 20 of 91 | 6 of 12 | `··●●●●●●····` | 21 Dec | 6 of 12 |
| 2019–20 | Open-Meteo archive | JHULSACAST | 0 of 91 | 0 of 12 | `············` | never | 12 of 12 |
| 2019–20 | NASA POWER | Hutton, ≥ 6 h (app) | 29 of 91 | 8 of 12 | `●●●●●●·●●···` | 1 Dec (already on 30 Nov) | 4 of 12 |
| 2019–20 | NASA POWER | Stricter, ≥ 10 h | 6 of 91 | 3 of 12 | `·●●··●······` | 14 Dec | 9 of 12 |
| 2019–20 | NASA POWER | JHULSACAST | 0 of 91 | 0 of 12 | `············` | never | 12 of 12 |
| 2023–24 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 47 of 91 | 12 of 12 | `●●●●●●●●●●●●` | 7 Dec | 0 of 12 |
| 2023–24 | Open-Meteo archive | Stricter, ≥ 10 h | 21 of 91 | 9 of 12 | `●●··●●●●●●●·` | 7 Dec | 3 of 12 |
| 2023–24 | Open-Meteo archive | JHULSACAST | 0 of 91 | 0 of 12 | `············` | never | 12 of 12 |
| 2023–24 | NASA POWER | Hutton, ≥ 6 h (app) | 33 of 91 | 8 of 12 | `●●●●●●●··●··` | 1 Dec (already on 30 Nov) | 4 of 12 |
| 2023–24 | NASA POWER | Stricter, ≥ 10 h | 2 of 91 | 2 of 12 | `●●··········` | 7 Dec | 10 of 12 |
| 2023–24 | NASA POWER | JHULSACAST | 0 of 91 | 0 of 12 | `············` | never | 12 of 12 |
| 2024–25 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 48 of 90 | 10 of 12 | `·●●●●●●●●●·●` | 10 Dec | 2 of 12 |
| 2024–25 | Open-Meteo archive | Stricter, ≥ 10 h | 25 of 90 | 7 of 12 | `··●●●●●●●···` | 19 Dec | 5 of 12 |
| 2024–25 | Open-Meteo archive | JHULSACAST | 0 of 90 | 0 of 12 | `············` | never | 12 of 12 |
| 2024–25 | NASA POWER | Hutton, ≥ 6 h (app) | 31 of 90 | 7 of 12 | `●●●●●●●·····` | 1 Dec (already on 30 Nov) | 5 of 12 |
| 2024–25 | NASA POWER | Stricter, ≥ 10 h | 0 of 90 | 0 of 12 | `············` | never | 12 of 12 |
| 2024–25 | NASA POWER | JHULSACAST | 0 of 90 | 0 of 12 | `············` | never | 12 of 12 |
| 2025–26 | Open-Meteo archive | Hutton, ≥ 6 h (app) | 48 of 90 | 9 of 12 | `·●●●●●●●●●··` | 11 Dec | 3 of 12 |
| 2025–26 | Open-Meteo archive | Stricter, ≥ 10 h | 14 of 90 | 3 of 12 | `···●●●······` | 23 Dec | 9 of 12 |
| 2025–26 | Open-Meteo archive | JHULSACAST | 0 of 90 | 0 of 12 | `············` | never | 12 of 12 |
| 2025–26 | NASA POWER | Hutton, ≥ 6 h (app) | 27 of 90 | 5 of 12 | `●●●●●·······` | 1 Dec (already on 30 Nov) | 7 of 12 |
| 2025–26 | NASA POWER | Stricter, ≥ 10 h | 5 of 90 | 1 of 12 | `···●········` | 23 Dec | 11 of 12 |
| 2025–26 | NASA POWER | JHULSACAST | 0 of 90 | 0 of 12 | `············` | never | 12 of 12 |

**Danger weeks** and **Sprays saved** come from the season ledger (`buildLedger`) over the 12 full weeks from 1 Dec (the crop planted on 16 Nov), with no sprays logged: a week with a danger day is one the farmer should have sprayed, and a week without one is a calendar spray saved against spraying every week. In the week marks, ● is a danger week and · a quiet one. For JHULSACAST, "→ by" is the latest date its forecast gives for the disease to appear (14 days).

## Why JHULSACAST never fires here

Its 7-day condition needs 105 hours at RH ≥ 90% in a week, about 15 hours a day, held for 7 days running. Its 5-day condition needs 65 hours in 5 days, held for 5 days running, with rain, and these are dry winters. The temperature condition also fails in cold spells, when nights drop below 7.2°C, but humidity alone rules the rule out: no week came near 105 hours.

| Place | Winter | Source | Hours at RH ≥ 90%, mean a day | Largest 7-day sum (needs 105) | Largest 5-day sum (needs 65) | Two-day spells ≥ 2.5 mm |
|---|---|---|--:|--:|--:|--:|
| Shibganj | 2019–20 | Open-Meteo archive | 7.4 | 89 | 68 | 8 |
| Shibganj | 2019–20 | NASA POWER | 5.1 | 75 | 56 | 6 |
| Shibganj | 2023–24 | Open-Meteo archive | 7.0 | 91 | 66 | 7 |
| Shibganj | 2023–24 | NASA POWER | 4.2 | 70 | 56 | 15 |
| Shibganj | 2024–25 | Open-Meteo archive | 6.8 | 85 | 64 | 0 |
| Shibganj | 2024–25 | NASA POWER | 4.4 | 62 | 47 | 4 |
| Shibganj | 2025–26 | Open-Meteo archive | 6.2 | 82 | 60 | 0 |
| Shibganj | 2025–26 | NASA POWER | 4.2 | 73 | 54 | 0 |
| Lalmonirhat Sadar | 2019–20 | Open-Meteo archive | 6.0 | 72 | 55 | 5 |
| Lalmonirhat Sadar | 2019–20 | NASA POWER | 4.2 | 67 | 48 | 5 |

JHULSACAST was tuned on station humidity in the field at Kalyani; both sources here are reanalysis, which smooths the foggy nights when a field sits near saturation. So "never fires" may say as much about reanalysis humidity as about the rule. The same bias runs the other way for the app's rule: if the field is more humid than the reanalysis, the 6 h rule would call danger on even more days than the table above shows. A season of Bangladesh Meteorological Department station data from a potato district would settle both.

## One dated report: Lalmonirhat, 2019–20

New Age reported on 4 Feb 2020 a late-blight outbreak in northern districts, including Lalmonirhat, Thakurgaon and Panchagarh (the date is from our note; we didn't find the article online). The Daily Star had already reported late blight in Thakurgaon Sadar and Panchagarh's Boda upazila on 21 Jan 2020 ([Late blight attack worries potato growers](https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268)), so the outbreak began some time before the report. Weather at Lalmonirhat Sadar (25.8787, 89.4534), with the 28 days before the report:

| Source | Rule | Danger days, 7 Jan – 3 Feb | Danger days in December | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires |
|---|---|--:|--:|--:|---|---|
| Open-Meteo archive | Hutton, ≥ 6 h (app) | 18 of 28 | 9 of 31 | 9 of 12 | `●·●●●●●●●··●` | 1 Dec (already on 30 Nov) |
| Open-Meteo archive | Stricter, ≥ 10 h | 3 of 28 | 5 of 31 | 4 of 12 | `··●●·●●·····` | 20 Dec |
| Open-Meteo archive | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | Hutton, ≥ 6 h (app) | 6 of 28 | 12 of 31 | 7 of 12 | `●●●·●●●·●···` | 1 Dec (already on 30 Nov) |
| NASA POWER | Stricter, ≥ 10 h | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |

A rule that fired in the weeks before the report agrees with it; a rule that was also firing all December and January would have agreed with any date. One report gives neither the date the disease first appeared nor the days without it, so it cannot show which rule is right.

Generated on 2026-11-15 by `npx tsx scripts/compare-blight-rules.ts --write`.
