# Potato risk, version 2: plan

Status: plan only, no code. Paddy (rice blast) stays as it is.

## Why

[rule-comparison.md](rule-comparison.md) ("What this shows") found three things. On station humidity, the Hutton rules call danger in most weeks of every winter. No 7-day humid-hour level marks when an outbreak starts. And no threshold can be validated with the records available today. A daily বিপদ / সতর্ক / নিরাপদ for potato therefore claims more than we know. Its নিরাপদ days also tell farmers that spraying isn't needed ("শুধু শুধু ওষুধ দিয়ে টাকা নষ্ট করবেন না"), and nothing supports that.

The app stops showing a daily potato risk level. Three things take its place. Each says only what it can back up:

| | What it says | What it does not say |
|---|---|---|
| **Pressure gauge** | How wet the last 7 days and the next 5 are, compared with this place's own past winters | Whether late blight will come |
| **Protection clock** | How long ago the farmer last sprayed, against the interval on their label, and how much rain has fallen since | A dose, a brand, or "no need to spray" |
| **First sighting** | When farmers nearby say they first saw spots, as counts per union and upazila, labelled unverified | That the disease is confirmed, or where a farmer lives |

## a. Pressure gauge

**What it shows.** It shows the hours at RH ≥ 90% over the last 7 days and over the next 5. Each number is set against the same place's past winters from the same model, for example «এখানকার শীতের ১০টা সপ্তাহের ৮টার চেয়ে ভেজা». The gauge is a neutral wet/dry bar (শুকনো → ভেজা) in one colour scale. It does not use the risk colours or the words বিপদ, সতর্ক or নিরাপদ.

**Why "against its own history".** The live forecast is ECMWF IFS 9 km. [rule-comparison.md](rule-comparison.md) showed that the Open-Meteo Historical Forecast API returns the same series, to the hour, from 2022. A rank inside that series carries the model's dry bias on both sides, so no station correction is needed. The station gap (about 3 humid hours a day) stays a finding in the report and is not applied.

**Data.**
- History: Historical Forecast API, winters 2022–23 to 2025–26 (four winters, about 360 days a place). Before 2022 the archive's model is not checked to be the same, so those years are not used unless they are checked (open question 1).
- `scripts/build-humid-climate.ts` builds, per Open-Meteo grid cell (unions share 9 km cells), the deciles of every 7-day and 5-day humid-hour sum ending between 1 Dec and the end of February. The output is a small static JSON on the server (`src/lib/climate/humid-deciles.json`): 2 × 11 numbers a cell. It is rebuilt once a year after the winter, and the file records the winters and model it came from.
- Live: the last 7 days come from the forecast API's `past_days`, which is the same stitched series the history is, so the comparison is like with like. The next 5 days are forecast at longer leads, where the humidity can differ. They are therefore ranked against the 5-day history separately, not added to the last 7 (open question 2).

**Pure module.** `src/lib/pressure.ts`, with no fetch and no React:
- `humidHours(days)`
- `rankAgainst(sum, deciles)`, which returns 0–10, or null without history
- `pressureText(rank, hours)`, the two-line Bengali text

**Missing data.** If the forecast fails, there is no gauge (as Home does now). If a cell has no history, the hours are shown without a rank.

## b. Protection clock

**What it shows.** «শেষ স্প্রে ৫ দিন আগে · লেবেলে লেখা ব্যবধান ৭ দিন · এর মধ্যে বৃষ্টি ১২ মিমি».

**After the interval.** Once the interval has passed, it says «লেবেলে লেখা ব্যবধান পেরিয়ে গেছে». That is a fact about the label, not advice to spray.

**Before any spray is logged.** «এই মৌসুমে কোনো স্প্রে লেখা নেই».

**Never.** It never shows a dose or a brand. It never says the field is safe, protected or that a spray isn't needed.

**Data.**
- Sprays are the ones already logged (`sprayLog.ts`, per field, on the device).
- The interval is a new per-field number the farmer enters from the label, default 7, allowed 1–21 days (open question 5). It is entered with Bengali or Latin digits (`fromBnDigits`) and stored as `crop-guardian:spray-interval:<season>`.
- Rain since the spray is hourly `precipitation` from the forecast API's `past_days` at the union. `weather.ts` already reads it from the archive; it needs adding to the forecast request.
- The clock shows millimetres only. It states no wash-off threshold, because we have no validated one, and labels differ (open question 4).

**Spray button.** «আজ স্প্রে করেছি» is always on the clock card. It no longer appears only on danger days.

**Pure module.** `src/lib/protection.ts`:
- `protectionState({ sprays, interval, today })`, which returns `{ lastSpray, daysSince, overdue }`
- `rainSince(hourly, lastSpray)`
- `protectedDays(sprays, interval, from, to)`, used by the ledger and /practice

## c. First sighting

**The question.** It is asked once a season per potato field, on Home, from emergence to harvest: «প্রথম দাগ কবে দেখলেন?». The answers are a date or «এখনো দেখিনি». «এখনো দেখিনি» is asked again a week later. A date can be changed but not moved into the future or before emergence.

**Photo results.** A confident late-blight photo result can be added with a tap: «এলাকার হিসাবে যোগ করব?». The phone sends only the date, union, crop and class, never the photo. Uncertain and unknown results are not counted.

**Who counts.**
- One phone counts once a season.
- Recommended: only signed-in numbers count, so a number can't be counted twice and nothing can be faked from an anonymous device (open question 6).
- Each report is stored with its union, the first-sighting date, the source (`answer` or `photo`) and the season. It has no location finer than the union.

**What is shown.**
- Counts per union and per upazila, only when at least *k* phones have reported (recommended *k* = 3 for a union and 5 for an upazila; open question 6).
- The earliest date is shown, and every count is labelled «যাচাই হয়নি».
- Officer-confirmed cases (the existing `"case"` verdicts) are shown separately as confirmed. They are never added into the unverified count.

**Why it matters.** This is the only signal about when the disease begins. It also builds the record this study found missing: dated first sightings per union, across winters. Officers confirming a sample of them would turn it into a record that can test a threshold later (open question 11).

**Storage and modules.**
- New table `"sighting"` (`npm run db:migrate`).
- `POST /api/sightings` requires sign-in.
- The pure rules go in `src/lib/sightings.ts`: `parseSighting`, `isValidSightingDate`, `countsByArea` with the minimum, and `sightingText`.

## Surface by surface

### Home (`src/app/page.tsx`, `FieldsGate`, `HomeHeader`, `FirstRunIntro`)

- **Changes:** the potato panel becomes three cards: the gauge, the clock and first sighting (the question while it is unanswered, then the local counts). The paddy panel is unchanged.
- **Removed for potato:**
  - today's risk colour and `riskTitle`
  - the 5-day strip of risk glyphs (replaced by the 5 days' humid hours as plain numbers)
  - `DECISION` and the header line from `buildDecision`
  - the «SMS-এ জানাব» promise
  - the danger-only `SprayButton`
  - first-run card 1 («রোজ সকালে ঝুঁকির রং দেখুন … কবে স্প্রে লাগবে, কবে লাগবে না»), which is rewritten around the gauge and the clock
- **Tests:**
  - `pressure.test.ts`: decile ranking at the edges, null history, two-line length of `pressureText`
  - `protection.test.ts`: days since the spray, the interval boundary, no sprays, rain summed over the right hours
  - a copy test that no potato Home text uses বিপদ/সতর্ক/নিরাপদ or a "no need to spray" phrase. This needs a new `saysNoNeed` check beside `hasDose` and `hasBrand` in `guard.ts`.
  - `fields.test.ts` and the off-season tests stay as they are.

### SMS alerts (`alerts.ts`, `alertRun.ts`, `crops.ts`)

- **Changes:** potato no longer gets "danger tomorrow" texts, and `cropsToAlert` drops potato. Recommended replacement: one text when first sightings in the farmer's upazila first reach *k* this season, for example «Crop Guardian: আপনার উপজেলায় ৫ জন আলুতে দাগ দেখেছেন (যাচাই হয়নি)», which must fit 70 characters. A clock reminder would need the sprays copied to the server, so it is left as open question 7.
- **Removed:** the potato `smsWarning` and potato rows in `"alert_state"`. Their rows are ignored, not deleted, until the change ships.
- **Tests:**
  - `alerts.test.ts`: potato fields give no danger alert, while paddy alerts are unchanged
  - the sighting message is ≤ 70 characters and contains «যাচাই হয়নি»
  - one text per upazila per season
  - nothing is sent below *k*

### Ledger (`ledger.ts`, `LedgerView`, `LedgerPill`, `/api/risk/season`)

- **Changes:** each potato week shows the sprays logged, how many of its days were inside the label interval («৭ দিনের ৫ দিন স্প্রের ব্যবধানের মধ্যে»), the week's humid hours with its rank, and rain after a spray. The cost of the sprays logged (sprays × cost) stays, as money spent.
- **Removed for potato:** the week kinds `saved`, `onTime`, `missed` and `extra`, the ৳ "saved" total, and the calendar baseline (`calendarBaseline: false` for potato too). All of these were defined by danger days. `LedgerPill` shows sprays and money spent instead of savings.
- **Tests:**
  - `ledger.test.ts`: potato weeks carry protected days and humid hours and no `saved` kind
  - paddy ledger tests unchanged
  - `protectedDays` checked across a season boundary and with overlapping sprays

### Map (`/map`, `MapView`)

- **Changes:**
  - Potato unions are coloured by the gauge rank, on the neutral wet/dry scale with its own legend. Neighbouring unions often share a grid cell, and the legend says so.
  - First-sighting counts are shown per union, only at *k* or more, labelled unverified.
  - The officer-confirmed counts stay, marked as confirmed.
- **Removed for potato:** the risk colouring and the বিপদ/সতর্ক/নিরাপদ legend.
- **Tests:**
  - `countsByArea` hides counts below *k* and never mixes confirmed and unverified counts
  - the map's potato data carries no `Risk` values (a type change, so it is checked by `typecheck`)

### /practice (paused, not built)

- **Changes:**
  - The weekly "spray this week?" game scored by `buildLedger` against danger weeks is dropped, since danger weeks no longer exist.
  - In its place: the learner plays one past winter at their union day by day, seeing the gauge's raw hours and rank, night temperature and rain, and logs sprays on the clock with a label interval.
  - **Scoring against reports, considered.** A learner's spray dates could be scored on whether the field was inside the label interval on each of the 14 days before a real report from `outbreaks.ts`. The limits:
    - Only winters with a report naming the learner's district can be scored. For Shibganj, Bogura that is 2016–17 and 2023–24; many districts have none.
    - Reports lag the disease by an unknown time, so the 14 days before a report may fall after onset.
    - Weekly calendar spraying is always "protected", so the only thing a learner can win on is fewer sprays. A learner who learns to time sprays to a news date is being taught a precision this study says we don't have.
  - **Recommendation:** make /practice unscored practice in reading the gauge and keeping the clock, with no right answer. At the end, show the season's real reports, if any, as a dated line labelled «খবরের তারিখ, রোগ শুরুর তারিখ নয়», and show how many of its days the learner's field was inside the interval. Scoring against reports would still be possible later, once first sightings give dated records (open question 9).
- **Removed:** the plan's ledger-based score and its calendar comparison.
- **Tests:**
  - `practice.test.ts`: the learner sees only the past and the 5-day outlook (no peeking)
  - protected days are computed with `protectedDays`
  - the report line appears only for a report naming the district, and carries the label
  - `!hasDose`, `!hasBrand` and `!saysNoNeed` on all copy

### Assistant KB (`kb.ts`, `guide.ts`, `prompts.ts`, `answer.ts`, `/api/mcp`)

- **Changes:**
  - The `risk.potato` chunk (built from `DECISION`) is replaced by chunks built from the gauge, clock and sighting screen texts.
  - The guide sections `risk`, `ledger` and `map` are rewritten. The Hutton sentence and the "saved a spray" line go from them.
  - `todayRisk` for potato returns the gauge (hours and rank) and the local sighting counts, with no level.
  - The MCP tools `get_risk` and `get_season_risk` do the same for potato.
  - `prompts.ts`'s "today's or this week's disease risk" wording changes, and `PROMPT_VERSION` is bumped.
  - Afterwards, re-run `npx tsx scripts/build-kb.ts`, and then the eval. Groq allows one clean eval a day.
- **Removed:** `RISK_MEANING`'s potato lines, including «স্প্রে লাগবে না, টাকা বাঁচান».
- **Tests:**
  - a KB test that no potato chunk fails `saysNoNeed`, `hasDose` or `hasBrand`
  - `mcpTools.test.ts`: potato results carry no `Risk`
  - `evalSet.ts` potato-risk items are rewritten, and the `docs/assistant-eval.md` run is redone

### /docs (`src/app/docs/page.tsx`, `docsData.ts`)

- **Changes:** "Weather risk: Hutton criteria" becomes the gauge, clock and first-sighting description. A new section, "Why we stopped showing a potato risk level", links to [rule-comparison.md](rule-comparison.md) and summarises its "What this shows". The limits list says the gauge describes weather and predicts nothing, and that sightings are unverified until officers confirm them.
- **Removed:** the chart of alerts the potato rule would have sent against weekly spraying (from `risk-backtest.md`). The paddy blast backtest stays.
- **Tests:**
  - `docsData.test.ts` updated for the new parsed sections
  - if a line is parsed from `rule-comparison.md`, a test pins the heading it reads, so a report rewrite can't silently drop it

### Also touched

- **Rule code and API:**
  - `crops.ts`: potato's `assess`, `classify` and `decision` become optional, or move behind a `signal: 'risk' | 'pressure'` field on `CropSpec`.
  - `risk.ts` keeps the Hutton code for the scripts and backtests.
  - `GET /api/risk?crop=potato` returns the gauge instead of a level, or is removed (open question 12).
- **Docs:** README (Screens, Late-blight risk, Season ledger, SMS alerts, Limitations) and CLAUDE.md's weather-risk paragraph.
- **Service worker:** the cache list doesn't change, because Home stays uncached.

## Order of work

1. `pressure.ts`, `protection.ts`, `sightings.ts` with tests, and the climate build script. Nothing user-facing changes yet.
2. Home and the ledger, together, because `LedgerPill` and the spray button span both.
3. The `"sighting"` table and API, then the map.
4. SMS alerts.
5. Guide, KB, prompts and the eval; then /docs; then README and CLAUDE.md.
6. /practice, if you want it, on the new pieces.

## Open questions for you

1. **History.** Use only the Historical Forecast winters from 2022 (four winters, same model checked), or check the archive's model for 2017–2021 to get more winters?
2. **Gauge window.** Two numbers (last 7 days, next 5 days, each ranked) as recommended, or one 12-day number? Rank against all of Dec–Feb ("8 of 10 winter weeks") or only the same fortnight in past winters (fairer for January, thinner data)?
3. **Night temperature.** Show it beside the gauge, as plain context with no rule attached?
4. **Rain.** Millimetres since the spray only, or also point the farmer to the label's rain-free hours?
5. **Interval.** Is 1–21 days the right range, and default 7?
6. **First sighting.** Signed-in phones only? *k* = 3 per union and 5 per upazila? Should a photo result ask for consent every time, or once?
7. **Potato SMS.** Local sightings only (recommended), also a clock reminder (which puts each farmer's spray dates on the server), or no potato SMS at all?
8. **Ledger money.** Keep "money spent" for potato, or drop ৳ from the potato ledger entirely?
9. **/practice.** Unscored with the report line (recommended), scored against reports with the caveats above, or left paused?
10. **Current potato SMS subscribers.** Send them one text explaining the change?
11. **Officer confirmation.** Should officers confirm a sample of first sightings? And may the dated sightings be shared with DAE or BARI as a research record? That needs consent wording on the question.
12. **API.** Should `/api/risk?crop=potato` and the MCP potato tools return the gauge, or be removed?
13. **Naming.** The gauge's Bengali name, for example «ভেজা আবহাওয়ার মাপ».
