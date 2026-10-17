# Crop-Guardian

**মাঠের সৎ ডাক্তার** — a Bengali, mobile-first UI for advising potato farmers on late blight: daily risk from the weather, leaf photo diagnosis that admits uncertainty, an area risk map, and a season savings ledger.

Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm test         # risk engine unit tests (node:test)
npm run typecheck
npm run lint
```

## Screens

| Route | Screen |
|---|---|
| `/` | Home: today's live risk, 5-day forecast, today's decision (`?risk=safe\|watch\|danger` forces a demo state, `?replay=YYYY-MM-DD` replays past weather) |
| `/camera` | Leaf photo |
| `/result/uncertain` | "Not sure": candidate list |
| `/questions` | Two questions that narrow the candidates |
| `/result` | Final diagnosis (late blight) |
| `/unknown` | Can't identify: send to agriculture officer |
| `/map` | Union-level risk map |
| `/ledger` | Season savings |
| `/planting` | Planting date, saved on the device (from Home and the Ledger header) |

## Late-blight risk

Home's risk is computed from the weather, with no ML. `src/lib/weather.ts` fetches a 5-day hourly forecast (temperature, relative humidity) for Shibganj, Bogura from [Open-Meteo](https://open-meteo.com/) (no API key, cached for 1 hour, 5 s timeout). `src/lib/risk.ts` applies the Hutton criteria to it:

- A day **qualifies** when its min temperature is ≥ 10°C and RH ≥ 90% for ≥ 6 hours.
- **বিপদ (danger)**: the day and the day before or after it both qualify (a Hutton period).
- **সতর্ক (watch)**: the day qualifies alone, or is ≥ 10°C with 4–5 humid hours.
- **নিরাপদ (safe)**: otherwise.
- Today's overall risk is today's level, raised to watch if a danger day falls within the next 2 days.

The same result is served as JSON at `GET /api/risk` (optional `lat`, `lon`). If the forecast can't be fetched, Home falls back to the sample data and shows "পুরনো তথ্য — নেট নেই".

The header line under the risk and the text under today's decision are generated from the forecast numbers. When a danger day is ahead it is named from the forecast (e.g. "বুধবার থেকে ঝুঁকি বাড়বে। কাল বিকেলে আবার জানাব।"), never as a fixed weekday. Both are kept to two lines on a phone; the tests guard their length.

### Replay

`/?replay=YYYY-MM-DD` runs the same engine on observed weather for the 5 days starting that date, from the [Open-Meteo archive](https://open-meteo.com/en/docs/historical-weather-api). The screen shows a "রিপ্লে: {date}" chip in place of "today". If the date is invalid, not yet over, or the archive can't be reached, it shows an error instead of sample data. The **রিপ্লে** demo pill opens `2026-01-14`, the start of a real Hutton period at Shibganj.

To find more replay dates, list every danger day in the last three Dec–Feb winters:

```bash
npx tsx scripts/find-hutton-periods.ts
```

### Season

Risk is shown only while the crop is in the field (`src/lib/season.ts`): from planting + 15 days (emergence) to planting + 100 days (harvest). The planting date is set on `/planting` and kept on the device in localStorage. Without one, Home assumes the usual season, 15 Nov – 15 Mar, and asks "আলু কবে লাগিয়েছেন?". Outside the window Home shows "এখন ধসা রোগের মৌসুম নয়" and the date alerts start, instead of a risk. Replay and the `?risk=` demos ignore the season.

The server can't read localStorage, so Home is rendered as if no planting date is set, and a saved date takes over right after the page loads.

Everything else (diagnosis, map, ledger) is still static sample data in `src/lib/data.ts`.
