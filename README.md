# Crop-Guardian

**মাঠের সৎ ডাক্তার** — a Bengali, mobile-first UI for advising potato farmers on late blight: daily risk from the weather, leaf photo diagnosis that admits uncertainty, an area risk map, and a season savings ledger.

Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm test         # risk engine and photo-quality unit tests (node:test)
npm run typecheck
npm run lint
```

## Screens

| Route | Screen |
|---|---|
| `/` | Home: today's live risk, 5-day forecast, today's decision (`?risk=safe\|watch\|danger` forces a demo state, `?replay=YYYY-MM-DD` replays past weather) |
| `/camera` | Leaf photos (top, then underside) and on-device diagnosis |
| `/result/uncertain` | "Not sure": the candidates the photos left |
| `/questions` | Two questions that narrow the candidates |
| `/result` | Final diagnosis, including "healthy" |
| `/unknown` | Can't identify: send to agriculture officer |

The camera and the three result screens take `?mock=confident|healthy|uncertain|unknown` for demos, without the model or photos.
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
npx tsx scripts/find-hutton-periods.ts            # add --write to update docs/risk-backtest.md
```

[docs/risk-backtest.md](docs/risk-backtest.md) compares how often the app's rule and a stricter one (≥ 10 humid hours) would have alerted in those winters.

## Camera

`/camera` opens the phone's rear camera (`getUserMedia`) inside the leaf frame and checks every ~300 ms, on a 160 px copy of the visible frame, with no ML (`src/lib/imageQuality.ts`):

- **Light**: mean luma below 60 → "আলো কম", above 215 → "আলো খুব বেশি".
- **Focus**: variance of the Laplacian below `BLUR_THRESHOLD` (100) → "ফোন স্থির রাখুন". In dev the values are logged to the console as `[quality]` for tuning.
- **Leaf**: share of Excess-Green (2G − R − B) pixels inside the leaf frame: almost none → "পাতা ফ্রেমের ভেতরে আনুন", too few → "আরো কাছে আনুন".

The farmer takes two photos (top of the leaf, then the underside). A photo that fails the checks asks "… তবুও রাখবেন?" before it is kept. Photos are saved on the device as JPEGs (≤ 1024 px, quality 0.85) in IndexedDB (`src/lib/captureStore.ts`) for a future diagnosis upload, and the top photo is shown on `/result/uncertain`.

**The camera needs a secure context: HTTPS, or `http://localhost`.** Opening the dev server from a phone over `http://<LAN-IP>:3000` has no `getUserMedia`, so the screen falls back to the phone's own camera app via a file picker. To test the live camera on a real phone, use `next dev --experimental-https` or an HTTPS tunnel. If camera permission is denied, the screen shows "ক্যামেরার অনুমতি দিন" with a retry button.

### Season

Risk is shown only while the crop is in the field (`src/lib/season.ts`): from planting + 15 days (emergence) to planting + 100 days (harvest). The planting date is set on `/planting` and kept on the device in localStorage. Without one, Home assumes the usual season, 15 Nov – 15 Mar, and asks "আলু কবে লাগিয়েছেন?". Outside the window Home shows "এখন ধসা রোগের মৌসুম নয়" and the date alerts start, instead of a risk. Replay and the `?risk=` demos ignore the season.

The server can't read localStorage, so Home is rendered as if no planting date is set, and a saved date takes over right after the page loads.

## Diagnosis

The leaf photos are diagnosed on the phone, with no server. The model (EfficientNet-B0, `public/model/crop_guardian_v2.onnx`) and its calibrated config (`crop_guardian_config.json`) come from the training notebook's export. Classes, Bengali labels, preprocessing, temperature and thresholds are all read from the config; none are written in the code.

- `src/lib/diagnosis/worker.ts` runs [onnxruntime-web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) (wasm, one thread) in a Web Worker, so the camera never freezes. The camera screen starts it; the first time it downloads the model and the wasm (about 30 MB, "মডেল নামাচ্ছি… একবারই লাগবে") and keeps them in the Cache API. The wasm is copied from `node_modules` into `public/ort/<version>/` by `scripts/copy-ort.mjs` on install, dev and build: nothing comes from a CDN.
- `preprocess.ts`: shorter side to 255, centre crop 224, scale, mean/std, NCHW float32, with torchvision's rounding.
- `decide.ts` follows `decision` in the config exactly: softmax of the disease logits at temperature T, the conformal set `p ≥ 1 − qhat`, and the OOD score. A photo is **unknown** if the OOD score is over the threshold or the set is empty, **confident** if the set has one class, otherwise **uncertain**. With the current config (`1 − qhat ≈ 0.89`), one photo is never uncertain.
- `combine.ts` decides each photo on its own (the thresholds were calibrated per photo) and keeps the more cautious result: unknown > uncertain > confident. Two confident photos that disagree become uncertain with both classes.

Confident opens `/result`, uncertain `/result/uncertain`, unknown `/unknown`. From uncertain, `/questions` asks only the questions that split the candidates left (`src/lib/diagnosis/questions.ts`): rings inside the spots, and white growth under the leaf. "জানি না" rules nothing out. If one class is left, `/result` shows it as "ছবি আর আপনার উত্তর মিলিয়ে", not "নিশ্চিত", because the answers aren't calibrated like the model. In demos the answers ride in the URL (`/result?mock=uncertain&a=rings.no`). The result is kept on the device (IndexedDB) with the photos. "কেন মনে হলো?" lists only real inputs: what each photo gave, today's weather risk from `/api/risk`, and the farmer's answers. Advice per class is fixed text in `content.ts` that never gives a dose (always "লেবেল অনুযায়ী") and should be reviewed by an agronomist. Every result says "পরীক্ষামূলক: ইন্দোনেশিয়ার মাঠের ছবিতে যাচাই করা": the thresholds were fitted on Indonesian field photos, not Bangladeshi ones.

"কৃষি কর্মকর্তাকে পাঠান / দেখান" (on every result screen and at the end of the questions) uses the phone's share sheet (Web Share API) with both leaf photos and a short Bengali summary: date, place, the app's result and candidates, and the farmer's answers (`src/lib/shareCase.ts`). Where sharing isn't available it opens a WhatsApp link with the text only. Each sent case is kept on the device (IndexedDB `cases`) for the ledger to show later. No server is involved.

### Offline

After one visit with internet, the diagnosis works with none. The model worker keeps the model, config and wasm in the Cache API. `public/sw.js` (a hand-written service worker, registered in production builds only) precaches `/camera`, the result screens, `/questions` and `/offline`, plus every hashed `/_next/static` file they use. Pages are network-first, so they stay fresh when online. Home isn't cached: offline it opens `/offline` ("নেট নেই — আবহাওয়ার ঝুঁকি দেখা যাচ্ছে না") with a button to the camera, so an old risk is never shown as today's. On the result screens, the weather row says the forecast is unavailable.

To try it, run `npm run build && npm start`, open `/camera` once, then stop the server (or switch the phone to airplane mode) and take the photos again. A service worker and the camera both need a secure context: `localhost`, or HTTPS on a phone. Offline, `?mock=` is ignored: the cached pages are saved without their query, so they show the last real result.

`src/lib/diagnosis/__fixtures__/parity/` holds the notebook's reference outputs. `decide.test.ts` and `parity.test.ts` (which runs the real model with onnxruntime-node) check the app makes the same decisions on 12 notebook images (4 healthy, 4 late blight, 4 diseases the model never saw).

The map and ledger are still static sample data in `src/lib/data.ts`.
