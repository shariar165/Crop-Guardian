# Late-blight rules compared

Three weather rules for late blight replayed at Shibganj, Bogura (25.02, 89.32) over the winters 2019–20, 2023–24, 2024–25, 2025–26 (1 Dec to the end of February), from two past-weather sources: the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (its default model here is ECMWF IFS at 9 km, the model the live app's forecast uses) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time). The app uses the first rule; the other two are only compared here.

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

JHULSACAST was tuned on station humidity at Kalyani; both sources here are models. The next section measures how far their humidity is from three stations.

## Stations: the humidity gap

Observed weather from three Bangladesh Meteorological Department synoptic stations, from NOAA's [Integrated Surface Database](https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database) (ISD, FM-12 SYNOP reports, on the [NOAA open-data bucket](https://noaa-global-hourly-pds.s3.amazonaws.com/index.html)), against three models read at each station's coordinates: the Open-Meteo archive, the [Open-Meteo Historical Forecast API](https://open-meteo.com/en/docs/historical-forecast-api) (the model the live app's forecast comes from, replayed; from 2022 only) and NASA POWER.

- The stations report every 3 hours (00, 03, … 21 UTC). **Each reading stands for the 3 hours from its time**, so a reading at RH ≥ 90% counts as 3 humid hours; when one reading is missing, the one before stands for 6. A day counts only when all its 24 hours are covered.
- RH is computed from temperature and dew point (Magnus form). The rules' rain is the 24-hour total reported at 09:00 local, put on the day before.
- Every source is compared on the station's days only, so a gap in the station record is a gap for all four.
- The Open-Meteo archive and Historical Forecast columns agree to the hour: at these places both APIs' default is ECMWF IFS at 9 km, which is also what the live forecast's default returns (checked on the raw responses against `models=ecmwf_ifs`). So the archive used throughout this report already is the live app's model; ERA5 (`models=era5`) is a different series and is not used here.
- Meteostat's bulk data was checked and not used: for these stations it is model output, not observations (at the SYNOP hours of Jan–Feb 2024, 8 of 478 temperatures matched ISD; Dinajpur is not in it).

### Coverage

| Station | Winter | Days with full readings | Days missing |
|---|---|--:|---|
| Bogura (41883) | 2019–20 | 47 of 91 | 7 Jan – 19 Feb |
| Bogura (41883) | 2023–24 | 89 of 91 | 9 Dec – 10 Dec |
| Bogura (41883) | 2024–25 | 0 of 90 | all (no ISD file yet) |
| Bogura (41883) | 2025–26 | 0 of 90 | all (no ISD file yet) |
| Rangpur (41859) | 2019–20 | 47 of 91 | 7 Jan – 19 Feb |
| Rangpur (41859) | 2023–24 | 90 of 91 | 10 Dec |
| Rangpur (41859) | 2024–25 | 85 of 90 | 1 Dec – 2 Dec, 4 Dec, 18 Dec, 28 Feb |
| Rangpur (41859) | 2025–26 | 0 of 90 | all (no ISD file yet) |
| Dinajpur (41863) | 2019–20 | 47 of 91 | 7 Jan – 19 Feb |
| Dinajpur (41863) | 2023–24 | 83 of 91 | 9 Dec – 10 Dec, 12 Dec – 13 Dec, 25 Jan – 26 Jan, 10 Feb, 19 Feb |
| Dinajpur (41863) | 2024–25 | 84 of 90 | 1 Dec – 2 Dec, 4 Dec, 18 Dec, 14 Feb, 28 Feb |
| Dinajpur (41863) | 2025–26 | 0 of 90 | all (no ISD file yet) |

### Hours a day at RH ≥ 90%, by month

| Station | Month | Days | Station (ISD) | Open-Meteo archive | Historical forecast | NASA POWER |
|---|---|--:|--:|--:|--:|--:|
| Bogura | Dec 2019 | 31 | 11.4 | 9.1 | — | 8.2 |
| Bogura | Jan 2020 | 6 | 11.5 | 10.3 | — | 9.0 |
| Bogura | Feb 2020 | 10 | 6.6 | 7.1 | — | 1.3 |
| Bogura | Dec 2023 | 29 | 6.2 | 6.4 | 6.4 | 7.0 |
| Bogura | Jan 2024 | 31 | 11.6 | 11.8 | 11.8 | 3.9 |
| Bogura | Feb 2024 | 29 | 4.4 | 4.5 | 4.5 | 1.4 |
| Rangpur | Dec 2019 | 31 | 12.1 | 7.2 | — | 8.7 |
| Rangpur | Jan 2020 | 6 | 8.5 | 7.3 | — | 9.2 |
| Rangpur | Feb 2020 | 10 | 8.7 | 7.8 | — | 1.2 |
| Rangpur | Dec 2023 | 30 | 11.4 | 7.1 | 7.1 | 6.5 |
| Rangpur | Jan 2024 | 31 | 15.5 | 11.5 | 11.5 | 3.5 |
| Rangpur | Feb 2024 | 29 | 7.8 | 4.5 | 4.5 | 1.1 |
| Rangpur | Dec 2024 | 27 | 10.9 | 7.0 | 7.0 | 8.4 |
| Rangpur | Jan 2025 | 31 | 11.3 | 9.8 | 9.8 | 4.7 |
| Rangpur | Feb 2025 | 27 | 7.1 | 5.1 | 5.1 | 0.7 |
| Dinajpur | Dec 2019 | 31 | 13.4 | 6.0 | — | 8.4 |
| Dinajpur | Jan 2020 | 6 | 11.5 | 8.2 | — | 8.8 |
| Dinajpur | Feb 2020 | 10 | 11.4 | 5.8 | — | 0.9 |
| Dinajpur | Dec 2023 | 27 | 10.8 | 6.3 | 6.3 | 7.1 |
| Dinajpur | Jan 2024 | 29 | 14.9 | 11.1 | 11.1 | 3.2 |
| Dinajpur | Feb 2024 | 27 | 6.2 | 4.2 | 4.2 | 1.1 |
| Dinajpur | Dec 2024 | 27 | 10.6 | 5.9 | 5.9 | 8.3 |
| Dinajpur | Jan 2025 | 31 | 12.3 | 9.2 | 9.2 | 4.1 |
| Dinajpur | Feb 2025 | 26 | 8.1 | 4.6 | 4.6 | 0.8 |

### The most humid week

The 7 consecutive station days with the most hours at RH ≥ 90% (JHULSACAST's 7-day condition needs 105).

| Station | Winter | Station (ISD) | Open-Meteo archive | Historical forecast | NASA POWER |
|---|---|---|---|---|---|
| Bogura | 2019–20 | 120 h (from 21 Dec) | 77 h (from 22 Dec) | — | 75 h (from 13 Dec) |
| Bogura | 2023–24 | 105 h (from 9 Jan) | 98 h (from 14 Jan) | 98 h (from 14 Jan) | 69 h (from 2 Dec) |
| Rangpur | 2019–20 | 126 h (from 18 Dec) | 76 h (from 23 Dec) | — | 74 h (from 13 Dec) |
| Rangpur | 2023–24 | 141 h (from 10 Jan) | 102 h (from 12 Jan) | 102 h (from 12 Jan) | 63 h (from 3 Dec) |
| Rangpur | 2024–25 | 105 h (from 7 Dec) | 85 h (from 19 Jan) | 85 h (from 19 Jan) | 68 h (from 22 Dec) |
| Dinajpur | 2019–20 | 111 h (from 20 Dec) | 67 h (from 22 Dec) | — | 84 h (from 13 Dec) |
| Dinajpur | 2023–24 | 138 h (from 11 Jan) | 96 h (from 12 Jan) | 96 h (from 12 Jan) | 66 h (from 2 Dec) |
| Dinajpur | 2024–25 | 114 h (from 20 Jan) | 78 h (from 17 Jan) | 78 h (from 17 Jan) | 65 h (from 19 Dec) |

### The rules on station data

Danger weeks out of the 12 full weeks from 1 Dec (first day the rule fires), for station-winters with at least 80 days of full readings, with the models at the same place and on the same days. A quiet week with a day missing is not counted as quiet.

| Station | Winter | Source | Hutton, ≥ 6 h (app) | Stricter, ≥ 10 h | JHULSACAST |
|---|---|---|---|---|---|
| Bogura | 2023–24 | Station (ISD) | 12 of 12 (7 Dec) | 7 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Bogura | 2023–24 | Open-Meteo archive | 12 of 12 (7 Dec) | 9 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Bogura | 2023–24 | Historical forecast | 12 of 12 (7 Dec) | 9 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Bogura | 2023–24 | NASA POWER | 8 of 12 (1 Dec, already on 30 Nov) | 2 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Rangpur | 2023–24 | Station (ISD) | 12 of 12 (2 Dec) | 9 of 12 (3 Dec) | 2 of 12 (17 Jan), 1 quiet without full data |
| Rangpur | 2023–24 | Open-Meteo archive | 12 of 12 (6 Dec) | 9 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Rangpur | 2023–24 | Historical forecast | 12 of 12 (6 Dec) | 9 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Rangpur | 2023–24 | NASA POWER | 7 of 12 (1 Dec, already on 30 Nov) | 2 of 12 (7 Dec) | 0 of 12 (never), 1 quiet without full data |
| Rangpur | 2024–25 | Station (ISD) | 12 of 12 (5 Dec) | 8 of 12 (5 Dec), 1 quiet without full data | 0 of 12 (never), 2 quiet without full data |
| Rangpur | 2024–25 | Open-Meteo archive | 10 of 12 (9 Dec), 1 quiet without full data | 6 of 12 (9 Dec), 2 quiet without full data | 0 of 12 (never), 2 quiet without full data |
| Rangpur | 2024–25 | Historical forecast | 10 of 12 (9 Dec), 1 quiet without full data | 6 of 12 (9 Dec), 2 quiet without full data | 0 of 12 (never), 2 quiet without full data |
| Rangpur | 2024–25 | NASA POWER | 6 of 12 (8 Dec), 1 quiet without full data | 2 of 12 (12 Dec), 1 quiet without full data | 0 of 12 (never), 2 quiet without full data |
| Dinajpur | 2023–24 | Station (ISD) | 11 of 12 (1 Dec, already on 30 Nov), 1 quiet without full data | 10 of 12 (7 Dec), 1 quiet without full data | 2 of 12 (18 Jan), 4 quiet without full data |
| Dinajpur | 2023–24 | Open-Meteo archive | 12 of 12 (7 Dec) | 7 of 12 (7 Dec), 2 quiet without full data | 0 of 12 (never), 5 quiet without full data |
| Dinajpur | 2023–24 | Historical forecast | 12 of 12 (7 Dec) | 7 of 12 (7 Dec), 2 quiet without full data | 0 of 12 (never), 5 quiet without full data |
| Dinajpur | 2023–24 | NASA POWER | 6 of 12 (1 Dec, already on 30 Nov), 4 quiet without full data | 3 of 12 (7 Dec), 4 quiet without full data | 0 of 12 (never), 5 quiet without full data |
| Dinajpur | 2024–25 | Station (ISD) | 12 of 12 (7 Dec) | 10 of 12 (7 Dec), 1 quiet without full data | 0 of 12 (never), 3 quiet without full data |
| Dinajpur | 2024–25 | Open-Meteo archive | 11 of 12 (5 Dec) | 5 of 12 (31 Dec), 3 quiet without full data | 0 of 12 (never), 3 quiet without full data |
| Dinajpur | 2024–25 | Historical forecast | 11 of 12 (5 Dec) | 5 of 12 (31 Dec), 3 quiet without full data | 0 of 12 (never), 3 quiet without full data |
| Dinajpur | 2024–25 | NASA POWER | 7 of 12 (5 Dec), 1 quiet without full data | 1 of 12 (22 Dec), 3 quiet without full data | 0 of 12 (never), 3 quiet without full data |

### Which model threshold matches the station's 90%

For each model, the RH threshold (in 0.5% steps) at which its mean humid hours a day, Dec–Feb, equal the stations' hours at RH ≥ 90%, pooled over every station-day above. Reported, not applied: the app still counts hours at 90% on its forecast.

| Source | Station-days | Station, h/day at RH ≥ 90% | Model, h/day at ≥ 90% | Model threshold that matches | Model, h/day there | Daily error at 90% → there | Threshold, by station-winter |
|---|--:|--:|--:|--:|--:|---|---|
| Open-Meteo archive | 572 | 10.4 | 7.4 | **84%** | 10.5 | 4.2 → 3.4 h | 78–90% |
| Historical forecast | 431 | 10.0 | 7.4 | **85%** | 10.0 | 4.0 → 3.3 h | 82–90% |
| NASA POWER | 572 | 10.4 | 4.8 | **78%** | 10.3 | 6.6 → 5.1 h | 71–84.5% |

Counting a model only at the station's 8 reading times, as the station is counted, changes its mean by Open-Meteo archive -0.31 h/day, Historical forecast -0.31 h/day, NASA POWER 0.07 h/day: the 3-hour sampling alone does not explain the gap.

## One dated report: Lalmonirhat, 2019–20

New Age, 2 Feb 2020, from Lalmonirhat: [Late blight attack worries potato farmers in northern districts](https://www.newagebd.net/article/98379/late-blight-attack-worries-potato-farmers-in-northern-districts) (Rezaul Karim Manik), naming Rangpur, Kurigram, Lalmonirhat, Gaibandha, Dinajpur, Nilphamari, Thakurgaon and Panchagarh, after prolonged cold and dense fog; it gives no date for when the disease appeared. The Daily Star had already reported late blight in Thakurgaon Sadar and Panchagarh's Boda upazila on 21 Jan 2020 ([Late blight attack worries potato growers](https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268)), so the outbreak began some time before the report. The Rangpur and Dinajpur stations can't speak to it: their records for that winter miss Rangpur 7 Jan – 19 Feb; Dinajpur 7 Jan – 19 Feb. Weather at Lalmonirhat Sadar (25.8787, 89.4534), with the 28 days before the report:

| Source | Rule | Danger days, 5 Jan – 1 Feb | Danger days in December | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires |
|---|---|--:|--:|--:|---|---|
| Open-Meteo archive | Hutton, ≥ 6 h (app) | 20 of 28 | 9 of 31 | 9 of 12 | `●·●●●●●●●··●` | 1 Dec (already on 30 Nov) |
| Open-Meteo archive | Stricter, ≥ 10 h | 5 of 28 | 5 of 31 | 4 of 12 | `··●●·●●·····` | 20 Dec |
| Open-Meteo archive | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | Hutton, ≥ 6 h (app) | 7 of 28 | 12 of 31 | 7 of 12 | `●●●·●●●·●···` | 1 Dec (already on 30 Nov) |
| NASA POWER | Stricter, ≥ 10 h | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |

A rule that fired in the weeks before the report agrees with it; a rule that was also firing all December and January would have agreed with any date. One report gives neither the date the disease first appeared nor the days without it, so it cannot show which rule is right.

Generated on 2026-11-15 by `npx tsx scripts/compare-blight-rules.ts --write`.
