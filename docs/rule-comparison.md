# Late-blight rules compared

Three weather rules for late blight replayed at Shibganj, Bogura (25.02, 89.32) over the winters 2019–20, 2023–24, 2024–25, 2025–26 (1 Dec to the end of February), from two past-weather sources: the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api) (its default model here is ECMWF IFS at 9 km, the model the live app's forecast uses) and [NASA POWER](https://power.larc.nasa.gov/) (MERRA-2 reanalysis, about 50 km, hourly in local solar time). The app uses the first rule; the other two are only compared here.

> Weather-only counts. None of these rules has been validated against late-blight records in Bangladesh. The outbreak reports below are dated news reports and bulletins, not a validation.

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
| Rangpur (41859) | 2019–20 | 85 of 91 | 7 Jan – 8 Jan, 21 Jan, 26 Jan, 4 Feb, 19 Feb |
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
| Rangpur | Jan 2020 | 27 | 12.3 | 9.2 | — | 5.7 |
| Rangpur | Feb 2020 | 27 | 9.8 | 4.9 | — | 0.5 |
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
| Rangpur | 2019–20 | 126 h (from 18 Dec) | 79 h (from 11 Jan) | — | 74 h (from 13 Dec) |
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
| Rangpur | 2019–20 | Station (ISD) | 12 of 12 (1 Dec, already on 30 Nov) | 12 of 12 (1 Dec, already on 30 Nov) | 1 of 12 (27 Dec), 5 quiet without full data |
| Rangpur | 2019–20 | Open-Meteo archive | 10 of 12 (3 Dec), 1 quiet without full data | 6 of 12 (19 Dec), 3 quiet without full data | 0 of 12 (never), 5 quiet without full data |
| Rangpur | 2019–20 | NASA POWER | 7 of 12 (1 Dec, already on 30 Nov), 2 quiet without full data | 3 of 12 (4 Dec), 5 quiet without full data | 0 of 12 (never), 5 quiet without full data |
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
| Open-Meteo archive | 610 | 10.5 | 7.4 | **84%** | 10.5 | 4.3 → 3.4 h | 78–90% |
| Historical forecast | 431 | 10.0 | 7.4 | **85%** | 10.0 | 4.0 → 3.3 h | 82–90% |
| NASA POWER | 610 | 10.5 | 4.7 | **77%** | 10.5 | 6.8 → 5.2 h | 71–84.5% |

Counting a model only at the station's 8 reading times, as the station is counted, changes its mean by Open-Meteo archive -0.30 h/day, Historical forecast -0.31 h/day, NASA POWER 0.07 h/day: the 3-hour sampling alone does not explain the gap.

## One dated report: Lalmonirhat, 2019–20

New Age, 2 Feb 2020, from Lalmonirhat: [Late blight attack worries potato farmers in northern districts](https://www.newagebd.net/article/98379/late-blight-attack-worries-potato-farmers-in-northern-districts) (Rezaul Karim Manik), naming Rangpur, Kurigram, Lalmonirhat, Gaibandha, Dinajpur, Nilphamari, Thakurgaon and Panchagarh, after prolonged cold and dense fog; it gives no date for when the disease appeared. The Daily Star had already reported late blight in Thakurgaon Sadar and Panchagarh's Boda upazila on 21 Jan 2020 ([Late blight attack worries potato growers](https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268)), so the outbreak began some time before the report. Station records covering that winter: Rangpur (85 of 91 days, with OGIMET filling NOAA's gap); see the station tables above and the outbreak section below. Dinajpur's record misses 7 Jan – 19 Feb. Weather at Lalmonirhat Sadar (25.8787, 89.4534), with the 28 days before the report:

| Source | Rule | Danger days, 5 Jan – 1 Feb | Danger days in December | Danger weeks | Weeks, 1 Dec → 22 Feb | First fires |
|---|---|--:|--:|--:|---|---|
| Open-Meteo archive | Hutton, ≥ 6 h (app) | 20 of 28 | 9 of 31 | 9 of 12 | `●·●●●●●●●··●` | 1 Dec (already on 30 Nov) |
| Open-Meteo archive | Stricter, ≥ 10 h | 5 of 28 | 5 of 31 | 4 of 12 | `··●●·●●·····` | 20 Dec |
| Open-Meteo archive | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | Hutton, ≥ 6 h (app) | 7 of 28 | 12 of 31 | 7 of 12 | `●●●·●●●·●···` | 1 Dec (already on 30 Nov) |
| NASA POWER | Stricter, ≥ 10 h | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |
| NASA POWER | JHULSACAST | 0 of 28 | 0 of 31 | 0 of 12 | `············` | never |

A rule that fired in the weeks before the report agrees with it; a rule that was also firing all December and January would have agreed with any date. One report gives neither the date the disease first appeared nor the days without it, so it cannot show which rule is right.

## Outbreak reports and the 7-day humid sum

JHULSACAST's 7-day condition (≥ 105 hours at RH ≥ 90% in 7 days) first fired on station data on the same days late blight was already in the news (Rangpur and Dinajpur, 17–18 Jan 2024). This section sets the dated reports beside the 7-day sum at the nearest station, to show what level it had reached before them. It chooses no level.

> No report for a winter is not evidence of no disease: these are the reports we could find and open. Reports also lag the disease, and most give no date for when it began, so the "earliest implied" date is usually the publication date and the disease is older than that.

### The reports

Each entry records what the report itself says (`src/lib/outbreaks.ts`). Warnings say the weather favours late blight; they report no disease. Doses in the bulletins are left out. Reports that could not be opened (a 2023 Business Post article whose site now redirects elsewhere) are not used.

| Published | Kind | Report | Places the text puts it in | Earliest date of disease implied | On what |
|---|---|---|---|---|---|
| 2017-01-21 | Outbreak | The Daily Star: [Farmers frown at fungal attack](https://www.thedailystar.net/backpage/farmers-frown-fungal-attack-1349017) | Parbatipur, Dinajpur (Uttar Bhajanpur); Taraganj, Rangpur (Jhanjira); Ishwardi, Pabna (Muladuli); also: Rangpur, Dinajpur, Naogaon, Lalmonirhat, Kurigram, Rajshahi, Bogra, Mymensingh, Kishoreganj, Pabna | 2017-01-11 | "after a spell of rain on January 10" |
| 2018-01-04 | Outbreak | The Financial Express: [Potato growers take a hit from late blight disease in Rangpur](https://thefinancialexpress.com.bd/print/potato-growers-take-a-hit-from-late-blight-disease-in-rangpur-1515005470) | Mithapukur, Rangpur (Tilakpara) | 2018-01-04 | publication date ("this season", "gradually turning acute"; no start date) |
| 2018-01-14 | Outbreak | The Financial Express: [Late blight disease breaks out in Nilphamari](https://thefinancialexpress.com.bd/print/late-blight-disease-breaks-out-in-nilphamari-1515925814) | Nilphamari | 2018-01-14 | publication date (no start date) |
| 2018-01-15 | Outbreak | The Financial Express: [Late blight disease worries Nilphamari, Joypurhat cultivators](https://today.thefinancialexpress.com.bd/print/late-blight-disease-worries-nilphamari-joypurhat-cultivators-1515940907) | Nilphamari Sadar (Itakhola); Akkelpur, Joypurhat (Madipukur) | 2018-01-14 | dateline "Nilphamari, Jan 14" (no start date) |
| 2018-01-16 | Outbreak | The Daily Star: [Late blight dashes hope](https://www.thedailystar.net/country/potato-growers-farmers-in-dinajpur-and-rangpur-bangladesh-late-blight-dashes-hope-1520854) | Badarganj, Rangpur (Kalupara); Biral, Dinajpur (Polashbari); Gangachara, Rangpur (Teesta char); Rangpur Sadar (Mominpur) | 2018-01-01 | a Badarganj farmer "noticed the late blight infection in his field 15 days ago" |
| 2020-01-21 | Outbreak | The Daily Star: [Late blight attack worries potato growers](https://www.thedailystar.net/country/news/late-blight-attack-worries-potato-growers-1857268) | Thakurgaon Sadar; Boda, Panchagarh | 2020-01-21 | publication date ("ongoing prolonged cold and dense fog"; no start date) |
| 2020-02-02 | Outbreak | New Age: [Late blight attack worries potato farmers in northern districts](https://www.newagebd.net/article/98379/late-blight-attack-worries-potato-farmers-in-northern-districts) | Lalmonirhat (Shail Khowa); also: Rangpur, Kurigram, Gaibandha, Dinajpur, Nilphamari, Thakurgaon, Panchagarh | 2020-02-02 | publication date (no start date) |
| 2023-01-09 | Warning | BAMIS (DAE), Special Agromet Advisory for Cold Wave: [Current weather conditions may attack potato late blight](https://www.bamis.gov.bd/res/public/pages/2023/01/11/25588.pdf) | also: Tangail, Faridpur, Manikganj, Jashore, Chuadanga, Satkhira, Kushtia, Rajshahi, Naogaon, Natore, Chapainawabganj, Bogra, Pabna, Sirajganj, Joypurhat, Rangpur, Gaibandha, Kurigram, Nilphamari, Lalmonirhat, Dinajpur, Thakurgaon, Panchagarh | — | issue date |
| 2024-01-03 | Warning | BAMIS (DAE), National Bulletin, 3–7 Jan 2024: [Present weather condition is congenial for Late Blight infestation](https://www.bamis.gov.bd/en/bulletin/view/32939/) | also: all 14 agricultural regions | — | issue date |
| 2024-01-19 | Outbreak | The Financial Express: [Crop failure feared as late blight attacks potato fields in Rangpur](https://thefinancialexpress.com.bd/national/country/crop-failure-feared-as-late-blight-attacks-potato-fields-in-rangpur) | Rangpur Sadar (Benughat); Taraganj, Rangpur (Alampur) | 2024-01-18 | dateline "RANGPUR, Jan 18" ("the affected areas are increasing day by day"; no start date) |
| 2024-01-20 | Outbreak | The Business Standard: [Farmers fear losses as Boro, potato seeds rot in biting cold](https://www.tbsnews.net/node/778054) | Bogura (DAE: late blight "also occurring"); Joypurhat ("recent outbreak", in its section) | 2024-01-20 | publication date ("recent outbreak"; no start date) |
| 2024-01-24 | Little disease | The Daily Star: [Winter chills bite farming hard](https://www.thedailystar.net/node/3527581) | Rajshahi (DAE: "have not affected many potato farms") | 2024-01-24 | publication date |
| 2024-02-04 | Outbreak | The Financial Express: [Late blight disease dampens potato prospects for Gaibandha, Chandpur](https://today.thefinancialexpress.com.bd/print/late-blight-disease-dampens-potato-prospects-for-gaibandhachandpur-1706974071) | Gaibandha (seven upazilas); Hatibandha, Lalmonirhat (0.37 ha); Haimchar, Chandpur | 2024-02-04 | publication date (Gaibandha: "Dense fog amid intense cold for the past few days"; no start date) |
| 2024-12-28 | Warning | The Daily Observer: [Severe cold, fog threaten our agriculture](https://observerbd.com/news/504751) | also: Bogra, Rajshahi, Joypurhat, Rangpur | — | publication date (a press piece on the risk, no field named) |
| 2025-02-04 | Outbreak | The Financial Express: [Late blight disease dampens farmers' hope of a good yield in Rangpur](https://thefinancialexpress.com.bd/trade/late-blight-disease-dampens-farmers-hope-of-a-good-yield-in-rangpur) | Mithapukur, Rangpur (Jaigirhat); Nilphamari Sadar (Charaikhola); also: Rangpur, Kurigram, Lalmonirhat, Gaibandha, Nilphamari | 2025-02-04 | publication date (after "cold and foggy weather prevailing for more than one week"; no start date) |

The 3 Jan 2024 BAMIS line is the same sentence in the advice for all 14 of the bulletin's regions, from Rangpur to Sylhet and Barishal: it marks the whole country, not the potato districts.

### Which reports can be checked

A report can be checked when a station within 60 km of a place it names has full readings on each of the 14 days before its earliest implied date. 6 of 12 reports can.

| Report | Earliest implied | Nearest station with 14 full days before it | Nearer stations without them (km) |
|---|---|---|---|
| 2017-01-21, The Daily Star | 2017-01-11 | Rajarhat (52 km) | Ishurdi (9), Saidpur (12), Rangpur (21), Dinajpur (24) |
| 2018-01-04, The Financial Express | 2018-01-04 | no station data | Rangpur (18), Rajarhat (38), Saidpur (40), Dinajpur (59) |
| 2018-01-14, The Financial Express | 2018-01-14 | no station data | Saidpur (28), Rangpur (42), Dinajpur (46), Tetulia (51) |
| 2018-01-15, The Financial Express | 2018-01-14 | no station data | Saidpur (22), Bogura (34), Dinajpur (37), Rangpur (44), Tetulia (52) |
| 2018-01-16, The Daily Star | 2018-01-01 | no station data | Rangpur (8), Dinajpur (14), Saidpur (17), Rajarhat (36) |
| 2020-01-21, The Daily Star | 2020-01-21 | no station data | Tetulia (13), Dinajpur (52), Saidpur (58) |
| 2020-02-02, New Age | 2020-02-02 | no station data | Rangpur (36), Rajarhat (42), Saidpur (47) |
| 2024-01-19, The Financial Express | 2024-01-18 | Rangpur (8 km) | — |
| 2024-01-20, The Business Standard | 2024-01-20 | Bogura (3 km) | — |
| 2024-01-24, The Daily Star | 2024-01-24 | Rajshahi (7 km) | — |
| 2024-02-04, The Financial Express | 2024-02-04 | Rangpur (44 km) | — |
| 2025-02-04, The Financial Express | 2025-02-04 | Rangpur (18 km) | — |

### Station coverage

Every BMD station in ISD within 30 km of a union the app covers, except Dhaka airport (METAR only, dew point in whole degrees). Readings as in the section above: each 3-hourly SYNOP reading stands for 3 hours, and a day counts only when all 24 hours are covered.

Days with a full day of readings, of the 90–91 days from 1 Dec to the end of February (— none).

| Station (WMO) | 2016–17 | 2017–18 | 2018–19 | 2019–20 | 2020–21 | 2021–22 | 2022–23 | 2023–24 | 2024–25 |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| Tetulia (41850) | 75 | 65 | 18 | 43 | 50 | — | 56 | 77 | 61 |
| Saidpur (41858) | 78 | 67 | 19 | 47 | 51 | — | 58 | 83 | 79 |
| Rangpur (41859) | 17 | 48 | 8 | 85 | 51 | — | 67 | 90 | 85 |
| Rajarhat (418621) | 79 | 66 | 19 | 46 | 51 | — | 59 | 86 | 83 |
| Dinajpur (41863) | 78 | 67 | 20 | 47 | 51 | — | 58 | 83 | 84 |
| Bogura (41883) | 17 | 47 | 9 | 47 | 51 | — | 64 | 89 | — |
| Rajshahi (41895) | 80 | 68 | 20 | 47 | 51 | — | 56 | 84 | 81 |
| Ishurdi (41907) | 15 | 49 | 8 | 47 | 51 | — | 65 | 89 | 84 |
| Tangail (41909) | 80 | 68 | 20 | 47 | 49 | — | 59 | 86 | 82 |
| Dhaka (Tejgaon) (41923) | 14 | 47 | 8 | 46 | 51 | — | 69 | 88 | 85 |
| Chandpur (41941) | 83 | 67 | 20 | 47 | 50 | — | 58 | 84 | 82 |

Days missing at three quarters of the stations or more, by winter:

- 2016–17: 21 Dec, 29 Jan, 31 Jan, 13 Feb – 14 Feb
- 2017–18: 8 Dec, 31 Dec – 3 Jan, 7 Jan – 10 Jan, 18 Jan – 24 Jan, 2 Feb, 4 Feb – 6 Feb, 16 Feb
- 2018–19: 12 Dec – 31 Dec, 11 Jan – 12 Jan, 14 Jan – 28 Feb
- 2019–20: 7 Jan – 19 Feb
- 2020–21: 1 Dec, 19 Jan – 22 Feb, 26 Feb – 28 Feb
- 2021–22: the whole winter
- 2022–23: 16 Dec, 1 Feb – 7 Feb, 10 Feb, 12 Feb, 15 Feb – 17 Feb, 19 Feb – 25 Feb, 28 Feb
- 2023–24: 9 Dec – 10 Dec
- 2024–25: 1 Dec – 2 Dec, 4 Dec, 18 Dec, 28 Feb

The 7 Jan – 19 Feb 2020 gap is in NOAA's copy, not at the stations: it falls on the same days at every station. For Rangpur (41859) it is filled from [OGIMET](https://www.ogimet.com/)'s SYNOP archive (`src/lib/ogimet.ts`; ISD's readings win where both exist). On the 137 readings both have in 2020-01 – 2020-02, the decoded temperature equals ISD's in 137 and the dew point in 137, and the 24-hour rain in 17 of 17; OGIMET adds 294 readings ISD lacks. The other stations' 2020 gap is not filled.

### The 7-day sum each winter

The moving sum of hours at RH ≥ 90% over the 7 days ending each day, for windows ending 1 Dec to the end of February whose 7 days all have full readings; the same for hours at 7.2–26.6°C; and the first day JHULSACAST fired (with station rain).

| Winter | Station | Full days | 7-day windows | Max humid hours (ending) | Max mild hours | JHULSACAST fires |
|---|---|--:|--:|---|--:|---|
| 2016–17 | Tetulia | 75 | 27 | 99 (10 Jan) | 168 | never |
| 2017–18 | Tetulia | 65 | 20 | 96 (24 Dec) | 168 | never |
| 2018–19 | Tetulia | 18 | 2 | 78 (4 Dec) | 150 | never |
| 2019–20 | Tetulia | 43 | 19 | 99 (2 Dec) | 168 | never |
| 2020–21 | Tetulia | 50 | 35 | 108 (13 Jan) | 168 | never |
| 2022–23 | Tetulia | 56 | 33 | 117 (2 Jan) | 168 | 4 Jan |
| 2023–24 | Tetulia | 77 | 25 | 126 (16 Jan) | 168 | 21 Jan |
| 2024–25 | Tetulia | 61 | 13 | 99 (28 Dec) | 168 | never |
| 2016–17 | Saidpur | 78 | 49 | 96 (11 Jan) | 168 | 30 Dec |
| 2017–18 | Saidpur | 67 | 25 | 114 (17 Jan) | 168 | never |
| 2018–19 | Saidpur | 19 | 2 | 57 (4 Dec) | 138 | never |
| 2019–20 | Saidpur | 47 | 41 | 105 (25 Dec) | 168 | never |
| 2020–21 | Saidpur | 51 | 42 | 102 (16 Dec) | 168 | never |
| 2022–23 | Saidpur | 58 | 34 | 84 (6 Jan) | 168 | never |
| 2023–24 | Saidpur | 83 | 58 | 93 (16 Jan) | 168 | never |
| 2024–25 | Saidpur | 79 | 44 | 90 (12 Dec) | 168 | never |
| 2017–18 | Rangpur | 48 | 9 | 117 (17 Jan) | 168 | never |
| 2018–19 | Rangpur | 8 | 1 | 63 (1 Dec) | 141 | never |
| 2019–20 | Rangpur | 85 | 57 | 126 (24 Dec) | 168 | 27 Dec |
| 2020–21 | Rangpur | 51 | 42 | 120 (16 Dec) | 168 | 16 Dec |
| 2022–23 | Rangpur | 67 | 36 | 111 (3 Jan) | 168 | never |
| 2023–24 | Rangpur | 90 | 84 | 141 (16 Jan) | 168 | 17 Jan |
| 2024–25 | Rangpur | 85 | 72 | 105 (13 Dec) | 168 | never |
| 2016–17 | Rajarhat | 79 | 41 | 102 (25 Jan) | 168 | never |
| 2017–18 | Rajarhat | 66 | 26 | 99 (22 Dec) | 168 | never |
| 2018–19 | Rajarhat | 19 | 2 | 81 (4 Dec) | 165 | never |
| 2019–20 | Rajarhat | 46 | 35 | 123 (21 Dec) | 168 | 26 Dec |
| 2020–21 | Rajarhat | 51 | 42 | 123 (17 Jan) | 168 | 22 Dec |
| 2022–23 | Rajarhat | 59 | 41 | 114 (23 Jan) | 168 | 3 Jan |
| 2023–24 | Rajarhat | 86 | 73 | 123 (21 Jan) | 168 | 20 Jan |
| 2024–25 | Rajarhat | 83 | 63 | 123 (11 Dec) | 168 | 17 Dec |
| 2016–17 | Dinajpur | 78 | 38 | 105 (6 Jan) | 168 | never |
| 2017–18 | Dinajpur | 67 | 29 | 123 (17 Jan) | 168 | never |
| 2019–20 | Dinajpur | 47 | 41 | 111 (26 Dec) | 168 | never |
| 2020–21 | Dinajpur | 51 | 42 | 111 (11 Dec) | 168 | 14 Dec |
| 2022–23 | Dinajpur | 58 | 40 | 99 (4 Jan) | 168 | never |
| 2023–24 | Dinajpur | 83 | 58 | 138 (17 Jan) | 168 | 18 Jan |
| 2024–25 | Dinajpur | 84 | 65 | 114 (26 Jan) | 168 | never |
| 2017–18 | Bogura | 47 | 5 | 108 (17 Jan) | 168 | never |
| 2019–20 | Bogura | 47 | 41 | 120 (27 Dec) | 168 | never |
| 2020–21 | Bogura | 51 | 42 | 126 (12 Dec) | 168 | 16 Dec |
| 2022–23 | Bogura | 64 | 38 | 114 (4 Jan) | 168 | never |
| 2023–24 | Bogura | 89 | 83 | 105 (15 Jan) | 168 | never |
| 2016–17 | Rajshahi | 80 | 48 | 108 (30 Dec) | 168 | never |
| 2017–18 | Rajshahi | 68 | 24 | 111 (15 Dec) | 168 | never |
| 2018–19 | Rajshahi | 20 | 2 | 75 (4 Dec) | 150 | never |
| 2019–20 | Rajshahi | 47 | 41 | 108 (26 Dec) | 168 | 27 Dec |
| 2020–21 | Rajshahi | 51 | 42 | 108 (11 Dec) | 168 | never |
| 2022–23 | Rajshahi | 56 | 20 | 105 (7 Jan) | 168 | never |
| 2023–24 | Rajshahi | 84 | 66 | 108 (18 Jan) | 168 | never |
| 2024–25 | Rajshahi | 81 | 49 | 114 (14 Dec) | 168 | never |
| 2017–18 | Ishurdi | 49 | 5 | 114 (17 Jan) | 168 | never |
| 2019–20 | Ishurdi | 47 | 41 | 111 (14 Dec) | 168 | 26 Dec |
| 2020–21 | Ishurdi | 51 | 42 | 123 (10 Dec) | 168 | 15 Dec |
| 2022–23 | Ishurdi | 65 | 30 | 123 (4 Jan) | 168 | 8 Jan |
| 2023–24 | Ishurdi | 89 | 83 | 117 (21 Jan) | 168 | 21 Jan |
| 2024–25 | Ishurdi | 84 | 65 | 99 (6 Jan) | 168 | never |
| 2016–17 | Tangail | 80 | 49 | 99 (1 Jan) | 168 | never |
| 2017–18 | Tangail | 68 | 30 | 102 (23 Dec) | 168 | never |
| 2018–19 | Tangail | 20 | 5 | 54 (10 Jan) | 168 | never |
| 2019–20 | Tangail | 47 | 41 | 90 (25 Dec) | 168 | never |
| 2020–21 | Tangail | 49 | 34 | 111 (14 Dec) | 168 | never |
| 2022–23 | Tangail | 59 | 41 | 114 (5 Jan) | 168 | never |
| 2023–24 | Tangail | 86 | 73 | 105 (23 Jan) | 168 | never |
| 2024–25 | Tangail | 82 | 52 | 84 (6 Jan) | 168 | never |
| 2017–18 | Dhaka (Tejgaon) | 47 | 5 | 66 (17 Jan) | 168 | never |
| 2019–20 | Dhaka (Tejgaon) | 46 | 34 | 57 (30 Dec) | 168 | never |
| 2020–21 | Dhaka (Tejgaon) | 51 | 42 | 96 (12 Dec) | 168 | never |
| 2022–23 | Dhaka (Tejgaon) | 69 | 38 | 84 (8 Jan) | 168 | never |
| 2023–24 | Dhaka (Tejgaon) | 88 | 76 | 63 (6 Jan) | 168 | never |
| 2024–25 | Dhaka (Tejgaon) | 85 | 72 | 45 (6 Jan) | 168 | never |
| 2016–17 | Chandpur | 83 | 55 | 102 (2 Jan) | 168 | never |
| 2017–18 | Chandpur | 67 | 22 | 90 (17 Dec) | 168 | never |
| 2018–19 | Chandpur | 20 | 4 | 42 (10 Jan) | 165 | never |
| 2019–20 | Chandpur | 47 | 40 | 99 (30 Dec) | 168 | never |
| 2020–21 | Chandpur | 50 | 35 | 90 (9 Dec) | 168 | never |
| 2022–23 | Chandpur | 58 | 35 | 120 (8 Jan) | 168 | never |
| 2023–24 | Chandpur | 84 | 61 | 111 (6 Jan) | 168 | 24 Jan |
| 2024–25 | Chandpur | 82 | 53 | 123 (8 Jan) | 168 | 9 Jan |

### Before each report

For each report of disease (or of little disease), the 7-day humid sum 14 and 7 days before the earliest date it implies, at the station nearest each place it names that has full readings on the 14 days before (as above; nearer stations with gaps are named). A sum is — when its own 7 days reach into a gap. Stations more than 60 km away are not used.

| Report | Kind | Places | Station (km) | Earliest implied | 7-day sum 14 days before | 7-day sum 7 days before | Levels already reached 7 days before (first date) |
|---|---|---|---|---|--:|--:|---|
| 2017-01-21, The Daily Star | Outbreak | Parbatipur, Dinajpur (Uttar Bhajanpur) | no station data (Saidpur, Dinajpur, Rangpur) | 2017-01-11 | — | — | — |
| 2017-01-21, The Daily Star | Outbreak | Taraganj, Rangpur (Jhanjira) | Rajarhat (52); gaps at Saidpur, Rangpur, Dinajpur | 2017-01-11 | 99 | 69 | 60 (1 Dec), 75 (1 Dec), 90 (28 Dec) |
| 2017-01-21, The Daily Star | Outbreak | Ishwardi, Pabna (Muladuli) | no station data (Ishurdi) | 2017-01-11 | — | — | — |
| 2018-01-04, The Financial Express | Outbreak | Mithapukur, Rangpur (Tilakpara) | no station data (Rangpur, Rajarhat, Saidpur, Dinajpur) | 2018-01-04 | — | — | — |
| 2018-01-14, The Financial Express | Outbreak | Nilphamari | no station data (Saidpur, Rangpur, Dinajpur, Tetulia) | 2018-01-14 | — | — | — |
| 2018-01-15, The Financial Express | Outbreak | Nilphamari Sadar (Itakhola) | no station data (Saidpur, Dinajpur, Rangpur, Tetulia) | 2018-01-14 | — | — | — |
| 2018-01-15, The Financial Express | Outbreak | Akkelpur, Joypurhat (Madipukur) | no station data (Bogura) | 2018-01-14 | — | — | — |
| 2018-01-16, The Daily Star | Outbreak | Badarganj, Rangpur (Kalupara) | no station data (Saidpur, Rangpur, Dinajpur, Rajarhat) | 2018-01-01 | — | — | — |
| 2018-01-16, The Daily Star | Outbreak | Biral, Dinajpur (Polashbari) | no station data (Dinajpur, Saidpur) | 2018-01-01 | — | — | — |
| 2018-01-16, The Daily Star | Outbreak | Gangachara, Rangpur (Teesta char) | no station data (Rangpur, Saidpur, Rajarhat, Dinajpur) | 2018-01-01 | — | — | — |
| 2018-01-16, The Daily Star | Outbreak | Rangpur Sadar (Mominpur) | no station data (Rangpur, Saidpur, Rajarhat, Dinajpur) | 2018-01-01 | — | — | — |
| 2020-01-21, The Daily Star | Outbreak | Thakurgaon Sadar | no station data (Tetulia, Dinajpur, Saidpur) | 2020-01-21 | — | — | — |
| 2020-01-21, The Daily Star | Outbreak | Boda, Panchagarh | no station data (Tetulia) | 2020-01-21 | — | — | — |
| 2020-02-02, New Age | Outbreak | Lalmonirhat (Shail Khowa) | no station data (Rangpur, Rajarhat, Saidpur) | 2020-02-02 | — | — | — |
| 2024-01-19, The Financial Express | Outbreak | Rangpur Sadar (Benughat) | Rangpur (8) | 2024-01-18 | 102 | 108 | 60 (6 Dec), 75 (8 Dec), 90 (9 Dec), 105 (5 Jan) |
| 2024-01-19, The Financial Express | Outbreak | Taraganj, Rangpur (Alampur) | Saidpur (12) | 2024-01-18 | 72 | 75 | 60 (29 Dec), 75 (3 Jan) |
| 2024-01-20, The Business Standard | Outbreak | Bogura (DAE: late blight "also occurring"); Joypurhat ("recent outbreak", in its section) | Bogura (3) | 2024-01-20 | 72 | 96 | 60 (17 Dec), 75 (3 Jan), 90 (13 Jan) |
| 2024-01-24, The Daily Star | Little disease | Rajshahi (DAE: "have not affected many potato farms") | Rajshahi (7) | 2024-01-24 | — | 105 | 60 (2 Dec), 75 (3 Dec), 90 (7 Dec), 105 (15 Jan) |
| 2024-02-04, The Financial Express | Outbreak | Gaibandha (seven upazilas) | Bogura (51) | 2024-02-04 | 102 | 78 | 60 (17 Dec), 75 (3 Jan), 90 (13 Jan), 105 (15 Jan) |
| 2024-02-04, The Financial Express | Outbreak | Hatibandha, Lalmonirhat (0.37 ha) | Rangpur (44) | 2024-02-04 | 111 | 93 | 60 (6 Dec), 75 (8 Dec), 90 (9 Dec), 105 (5 Jan) |
| 2025-02-04, The Financial Express | Outbreak | Mithapukur, Rangpur (Jaigirhat) | Rangpur (18) | 2025-02-04 | 75 | 96 | 60 (11 Dec), 75 (11 Dec), 90 (11 Dec), 105 (13 Dec) |
| 2025-02-04, The Financial Express | Outbreak | Nilphamari Sadar (Charaikhola) | Dinajpur (37); gaps at Saidpur | 2025-02-04 | 84 | 102 | 60 (11 Dec), 75 (11 Dec), 90 (11 Dec), 105 (13 Dec) |

In 2024–25, when Mithapukur and Nilphamari reported disease on 4 Feb 2025: Rangpur: largest 7-day sum 105 h (ending 13 Dec), first ≥ 105 on 13 Dec, JHULSACAST never fired (72 windows); Dinajpur: largest 7-day sum 114 h (ending 26 Jan), first ≥ 105 on 13 Dec, JHULSACAST never fired (65 windows); Saidpur: largest 7-day sum 90 h (ending 12 Dec), never ≥ 105, JHULSACAST never fired (44 windows).

### A calendar baseline: is it humidity, or just January?

The reports cluster in January, so the date alone may predict them as well as the humid sum does. If the sum carries information, winters where it crosses a level early should have early reports (1 Jan 2018) and late crossings late ones (4 Feb 2025); if the crossing falls on about the same date every winter, the sum says little more than the calendar.

Per winter: the earliest date of disease any report implies, and the median date the 7-day sum first reached each level across the stations with data (how many of them reached it). Each median is over the stations that reached that level, so the medians need not rise with the level.

| Winter | Earliest implied outbreak | First ≥ 60, median | First ≥ 75, median | First ≥ 90, median | First ≥ 105, median |
|---|---|---|---|---|---|
| 2016–17 | 11 Jan (The Daily Star) | 1 Dec (7 of 7) | 1 Dec (7 of 7) | 28 Dec (7 of 7) | 1 Dec (2 of 7) |
| 2017–18 | 1 Jan (The Daily Star) | 6 Dec (11 of 11) | 15 Dec (10 of 11) | 18 Dec (10 of 11) | 17 Jan (6 of 11) |
| 2018–19 | none found | 4 Dec (4 of 7) | 4 Dec (3 of 7) | never (0 of 7) | never (0 of 7) |
| 2019–20 | 21 Jan (The Daily Star) | 1 Dec (10 of 11) | 1 Dec (10 of 11) | 14 Dec (10 of 11) | 21 Dec (7 of 11) |
| 2020–21 | none found | 8 Dec (11 of 11) | 8 Dec (11 of 11) | 9 Dec (11 of 11) | 10 Dec (8 of 11) |
| 2021–22 | none found | — | — | — | — |
| 2022–23 | none found | 11 Dec (11 of 11) | 15 Dec (11 of 11) | 25 Dec (9 of 11) | 2 Jan (8 of 11) |
| 2023–24 | 18 Jan (The Financial Express) | 3 Dec (11 of 11) | 5 Dec (10 of 11) | 20 Dec (10 of 11) | 12 Jan (9 of 11) |
| 2024–25 | 4 Feb (The Financial Express) | 12 Dec (9 of 10) | 14 Dec (9 of 10) | 12 Dec (8 of 10) | 13 Dec (5 of 10) |

Per station-winter. † marks a date with a missing 7-day window before it (the station's record has a gap), so the level may have been reached earlier, inside the gap.

| Winter | Station | 7-day windows (of ~90) | First ≥ 60 | First ≥ 75 | First ≥ 90 | First ≥ 105 | Earliest implied outbreak |
|---|---|--:|---|---|---|---|---|
| 2016–17 | Tetulia | 27 | 1 Dec | 1 Dec | 14 Dec† | never† | 11 Jan |
| 2017–18 | Tetulia | 20 | 5 Dec† | 5 Dec† | 24 Dec† | never† | 1 Jan |
| 2018–19 | Tetulia | 2 | 4 Dec† | 4 Dec† | never† | never† | — |
| 2019–20 | Tetulia | 19 | 2 Dec† | 2 Dec† | 2 Dec† | never† | 21 Jan |
| 2020–21 | Tetulia | 35 | 8 Dec† | 9 Dec† | 12 Dec† | 13 Jan† | — |
| 2022–23 | Tetulia | 33 | 1 Dec | 1 Dec | 15 Dec† | 29 Dec† | — |
| 2023–24 | Tetulia | 25 | 3 Dec† | 3 Dec† | 15 Jan† | 15 Jan† | 18 Jan |
| 2024–25 | Tetulia | 13 | 28 Dec† | 28 Dec† | 28 Dec† | never† | 4 Feb |
| 2016–17 | Saidpur | 49 | 1 Dec | 11 Dec | 28 Dec† | never† | 11 Jan |
| 2017–18 | Saidpur | 25 | 5 Dec† | 5 Dec† | 18 Dec† | 17 Jan† | 1 Jan |
| 2018–19 | Saidpur | 2 | never† | never† | never† | never† | — |
| 2019–20 | Saidpur | 41 | 1 Dec | 1 Dec | 22 Dec | 25 Dec | 21 Jan |
| 2020–21 | Saidpur | 42 | 8 Dec† | 8 Dec† | 13 Dec† | never† | — |
| 2022–23 | Saidpur | 34 | 11 Dec† | 14 Dec† | never† | never† | — |
| 2023–24 | Saidpur | 58 | 29 Dec† | 3 Jan† | 15 Jan† | never† | 18 Jan |
| 2024–25 | Saidpur | 44 | 11 Dec† | 11 Dec† | 12 Dec† | never† | 4 Feb |
| 2017–18 | Rangpur | 9 | 17 Jan† | 17 Jan† | 17 Jan† | 17 Jan† | 1 Jan |
| 2018–19 | Rangpur | 1 | 1 Dec | never† | never† | never† | — |
| 2019–20 | Rangpur | 57 | 1 Dec | 1 Dec | 20 Dec | 21 Dec | 21 Jan |
| 2020–21 | Rangpur | 42 | 8 Dec† | 8 Dec† | 8 Dec† | 10 Dec† | — |
| 2022–23 | Rangpur | 36 | 4 Dec† | 6 Dec† | 26 Dec† | 2 Jan† | — |
| 2023–24 | Rangpur | 84 | 6 Dec | 8 Dec | 9 Dec | 5 Jan† | 18 Jan |
| 2024–25 | Rangpur | 72 | 11 Dec† | 11 Dec† | 11 Dec† | 13 Dec† | 4 Feb |
| 2016–17 | Rajarhat | 41 | 1 Dec | 1 Dec | 28 Dec† | never† | 11 Jan |
| 2017–18 | Rajarhat | 26 | 15 Dec† | 16 Dec† | 18 Dec† | never† | 1 Jan |
| 2018–19 | Rajarhat | 2 | 4 Dec† | 4 Dec† | never† | never† | — |
| 2019–20 | Rajarhat | 35 | 1 Dec | 1 Dec | 1 Dec | 20 Dec | 21 Jan |
| 2020–21 | Rajarhat | 42 | 8 Dec† | 8 Dec† | 11 Dec† | 16 Dec† | — |
| 2022–23 | Rajarhat | 41 | 1 Dec | 1 Dec | 1 Dec | 28 Dec† | — |
| 2023–24 | Rajarhat | 73 | 1 Dec | 5 Dec | 20 Dec† | 10 Jan† | 18 Jan |
| 2024–25 | Rajarhat | 63 | 11 Dec† | 11 Dec† | 11 Dec† | 11 Dec† | 4 Feb |
| 2016–17 | Dinajpur | 38 | 1 Dec | 1 Dec | 15 Dec† | 6 Jan† | 11 Jan |
| 2017–18 | Dinajpur | 29 | 5 Dec† | 5 Dec† | 17 Dec† | 22 Dec† | 1 Jan |
| 2019–20 | Dinajpur | 41 | 1 Dec | 1 Dec | 14 Dec | 16 Dec | 21 Jan |
| 2020–21 | Dinajpur | 42 | 8 Dec† | 8 Dec† | 8 Dec† | 8 Dec† | — |
| 2022–23 | Dinajpur | 40 | 1 Dec | 15 Dec† | 23 Dec† | never† | — |
| 2023–24 | Dinajpur | 58 | 3 Dec | 5 Dec | 8 Dec | 12 Jan† | 18 Jan |
| 2024–25 | Dinajpur | 65 | 11 Dec† | 11 Dec† | 11 Dec† | 13 Dec† | 4 Feb |
| 2017–18 | Bogura | 5 | 17 Jan† | 17 Jan† | 17 Jan† | 17 Jan† | 1 Jan |
| 2019–20 | Bogura | 41 | 1 Dec | 1 Dec | 23 Dec | 25 Dec | 21 Jan |
| 2020–21 | Bogura | 42 | 8 Dec† | 8 Dec† | 9 Dec† | 10 Dec† | — |
| 2022–23 | Bogura | 38 | 29 Dec† | 30 Dec† | 2 Jan† | 3 Jan† | — |
| 2023–24 | Bogura | 83 | 17 Dec† | 3 Jan† | 13 Jan† | 15 Jan† | 18 Jan |
| 2016–17 | Rajshahi | 48 | 1 Dec | 1 Dec | 1 Dec | 1 Dec | 11 Jan |
| 2017–18 | Rajshahi | 24 | 5 Dec† | 5 Dec† | 15 Dec† | 15 Dec† | 1 Jan |
| 2018–19 | Rajshahi | 2 | 4 Dec† | 4 Dec† | never† | never† | — |
| 2019–20 | Rajshahi | 41 | 1 Dec | 1 Dec | 1 Dec | 26 Dec | 21 Jan |
| 2020–21 | Rajshahi | 42 | 8 Dec† | 8 Dec† | 8 Dec† | 10 Dec† | — |
| 2022–23 | Rajshahi | 20 | 23 Dec† | 23 Dec† | 25 Dec† | 7 Jan† | — |
| 2023–24 | Rajshahi | 66 | 2 Dec | 3 Dec | 7 Dec | 15 Jan† | 18 Jan |
| 2024–25 | Rajshahi | 49 | 14 Dec† | 14 Dec† | 14 Dec† | 14 Dec† | 4 Feb |
| 2017–18 | Ishurdi | 5 | 17 Jan† | 17 Jan† | 17 Jan† | 17 Jan† | 1 Jan |
| 2019–20 | Ishurdi | 41 | 1 Dec | 1 Dec | 1 Dec | 12 Dec | 21 Jan |
| 2020–21 | Ishurdi | 42 | 8 Dec† | 8 Dec† | 8 Dec† | 8 Dec† | — |
| 2022–23 | Ishurdi | 30 | 4 Dec† | 4 Dec† | 23 Dec† | 2 Jan† | — |
| 2023–24 | Ishurdi | 83 | 1 Dec | 1 Dec | 7 Dec | 27 Dec† | 18 Jan |
| 2024–25 | Ishurdi | 65 | 25 Dec† | 25 Dec† | 25 Dec† | never† | 4 Feb |
| 2016–17 | Tangail | 49 | 1 Dec | 10 Dec | 30 Dec† | never† | 11 Jan |
| 2017–18 | Tangail | 30 | 5 Dec† | 15 Dec† | 15 Dec† | never† | 1 Jan |
| 2018–19 | Tangail | 5 | never† | never† | never† | never† | — |
| 2019–20 | Tangail | 41 | 1 Dec | 1 Dec | 25 Dec | never† | 21 Jan |
| 2020–21 | Tangail | 34 | 8 Dec† | 8 Dec† | 9 Dec† | 10 Dec† | — |
| 2022–23 | Tangail | 41 | 11 Dec† | 15 Dec† | 1 Jan† | 4 Jan† | — |
| 2023–24 | Tangail | 73 | 7 Dec | 27 Dec† | 4 Jan† | 23 Jan† | 18 Jan |
| 2024–25 | Tangail | 52 | 13 Dec† | 25 Dec† | never† | never† | 4 Feb |
| 2017–18 | Dhaka (Tejgaon) | 5 | 17 Jan† | never† | never† | never† | 1 Jan |
| 2019–20 | Dhaka (Tejgaon) | 34 | never† | never† | never† | never† | 21 Jan |
| 2020–21 | Dhaka (Tejgaon) | 42 | 9 Dec† | 10 Dec† | 12 Dec† | never† | — |
| 2022–23 | Dhaka (Tejgaon) | 38 | 31 Dec† | 1 Jan† | never† | never† | — |
| 2023–24 | Dhaka (Tejgaon) | 76 | 5 Jan† | never† | never† | never† | 18 Jan |
| 2024–25 | Dhaka (Tejgaon) | 72 | never† | never† | never† | never† | 4 Feb |
| 2016–17 | Chandpur | 55 | 11 Dec | 29 Dec† | 31 Dec† | never† | 11 Jan |
| 2017–18 | Chandpur | 22 | 6 Dec† | 17 Dec† | 17 Dec† | never† | 1 Jan |
| 2018–19 | Chandpur | 4 | never† | never† | never† | never† | — |
| 2019–20 | Chandpur | 40 | 2 Dec† | 2 Dec† | 27 Dec† | never† | 21 Jan |
| 2020–21 | Chandpur | 35 | 8 Dec† | 8 Dec† | 9 Dec† | never† | — |
| 2022–23 | Chandpur | 35 | 14 Dec† | 31 Dec† | 2 Jan† | 6 Jan† | — |
| 2023–24 | Chandpur | 61 | 1 Dec | 20 Dec† | 1 Jan† | 5 Jan† | 18 Jan |
| 2024–25 | Chandpur | 53 | 12 Dec† | 14 Dec† | 15 Dec† | 17 Dec† | 4 Feb |

### Winters with no outbreak report found

The season's largest 7-day humid sum at each station with data. A high sum here and no report is not a false alarm: the disease may have come unreported, or reports may exist that we did not find.

| Winter | Station | 7-day windows | Max 7-day humid hours (ending) |
|---|---|--:|---|
| 2018–19 | Tetulia | 2 | 78 (4 Dec) |
|  | Saidpur | 2 | 57 (4 Dec) |
|  | Rangpur | 1 | 63 (1 Dec) |
|  | Rajarhat | 2 | 81 (4 Dec) |
|  | Rajshahi | 2 | 75 (4 Dec) |
|  | Tangail | 5 | 54 (10 Jan) |
|  | Chandpur | 4 | 42 (10 Jan) |
| 2020–21 | Tetulia | 35 | 108 (13 Jan) |
|  | Saidpur | 42 | 102 (16 Dec) |
|  | Rangpur | 42 | 120 (16 Dec) |
|  | Rajarhat | 42 | 123 (17 Jan) |
|  | Dinajpur | 42 | 111 (11 Dec) |
|  | Bogura | 42 | 126 (12 Dec) |
|  | Rajshahi | 42 | 108 (11 Dec) |
|  | Ishurdi | 42 | 123 (10 Dec) |
|  | Tangail | 34 | 111 (14 Dec) |
|  | Dhaka (Tejgaon) | 42 | 96 (12 Dec) |
|  | Chandpur | 35 | 90 (9 Dec) |
| 2021–22 | no station data | — | — |
| 2022–23 (warning only: 2023-01-09, BAMIS (DAE), Special Agromet Advisory for Cold Wave) | Tetulia | 33 | 117 (2 Jan) |
|  | Saidpur | 34 | 84 (6 Jan) |
|  | Rangpur | 36 | 111 (3 Jan) |
|  | Rajarhat | 41 | 114 (23 Jan) |
|  | Dinajpur | 40 | 99 (4 Jan) |
|  | Bogura | 38 | 114 (4 Jan) |
|  | Rajshahi | 20 | 105 (7 Jan) |
|  | Ishurdi | 30 | 123 (4 Jan) |
|  | Tangail | 41 | 114 (5 Jan) |
|  | Dhaka (Tejgaon) | 38 | 84 (8 Jan) |
|  | Chandpur | 35 | 120 (8 Jan) |

### What this does and does not show

- It shows the 7-day humid sum each station had reached before each dated report, and how often each level was reached in winters with and without reports.
- It does not give the date late blight began anywhere: the reports give their own date, and only 2 of them give an earlier one.
- It cannot tell a level that warns from one that is reached every winter: with reports in only some winters, and no record of the days without disease, a level that is always reached will look like it "came before" every report.
- The stations are points; a report names a district or upazila up to the distance shown from its station.
- Gaps in the station record (above) fall on some of the report dates; those rows use the next station within range or say there is none.

Generated on 2026-11-15 by `npx tsx scripts/compare-blight-rules.ts --write`.
