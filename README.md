# Crop-Guardian

**মাঠের সৎ ডাক্তার** — a Bengali, mobile-first UI for advising potato farmers on late blight: daily risk from the weather, leaf photo diagnosis that admits uncertainty, an area risk map, and a season savings ledger. Every number on screen comes from a real source: the weather forecast, the farmer's own records on the phone, or cases an agriculture officer has confirmed. There is no sample or demo data.

Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
npm test         # unit tests (node:test)
npm run typecheck
npm run lint
```

## Screens

| Route | Screen |
|---|---|
| `/` | Home: today's live risk at the farmer's union, 5-day forecast, today's decision; a 4-card intro on first open |
| `/camera` | Leaf photos (top, then underside) and on-device diagnosis |
| `/result/uncertain` | "Not sure": the candidates the photos left |
| `/questions` | Two questions that narrow the candidates |
| `/result` | Final diagnosis, including "healthy" |
| `/unknown` | Can't identify: send to agriculture officer |
| `/map` | Shibganj's unions: today's weather risk and officer-confirmed cases |
| `/ledger` | Season savings from the real weather and the sprays the farmer logged |
| `/planting` | "আমার জমি": the farmer's union and planting date |
| `/guide` | How to use the app, in plain Bengali, each part read aloud |
| `/sign-in` | Mobile number, then the SMS code (`?next=` is where to go after) |
| `/account` | The signed-in number and role, sign out (from the person button on Home) |
| `/officer` | Agriculture officers only: where farmers' cases will be listed |

## Late-blight risk

Home's risk is computed from the weather, with no ML. `src/lib/weather.ts` fetches a 5-day hourly forecast (temperature, relative humidity) at the centroid of the farmer's union (or Shibganj upazila, Bogura, before one is chosen) from [Open-Meteo](https://open-meteo.com/) (no API key, cached for 1 hour, 5 s timeout). `src/lib/risk.ts` applies the Hutton criteria to it:

- A day **qualifies** when its min temperature is ≥ 10°C and RH ≥ 90% for ≥ 6 hours.
- **বিপদ (danger)**: the day and the day before or after it both qualify (a Hutton period).
- **সতর্ক (watch)**: the day qualifies alone, or is ≥ 10°C with 4–5 humid hours.
- **নিরাপদ (safe)**: otherwise.
- Today's overall risk is today's level, raised to watch if a danger day falls within the next 2 days.

The same result is served as JSON at `GET /api/risk` (optional `lat`, `lon`; by default the farmer's union). If the forecast can't be fetched, Home says so ("আবহাওয়ার তথ্য আনা যায়নি") and shows no risk at all, never an old or made-up one.

The header line under the risk and the text under today's decision are generated from the forecast numbers. When a danger day is ahead it is named from the forecast (e.g. "বুধবার থেকে ঝুঁকি বাড়বে। কাল বিকেলে আবার জানাব।"), never as a fixed weekday. Both are kept to two lines on a phone; the tests guard their length.

### Past weather

To check the rule against past winters, list every danger day in the last three Dec–Feb winters:

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

Risk is shown only while the crop is in the field (`src/lib/season.ts`): from planting + 15 days (emergence) to planting + 100 days (harvest). The planting date is set on `/planting` and kept on the device in localStorage. Without one, Home assumes the usual season, 15 Nov – 15 Mar, and asks for the union and date. Outside the window Home shows "এখন ধসা রোগের মৌসুম নয়" and the date alerts start, instead of a risk.

The server can't read localStorage, so Home is rendered as if no planting date is set, and a saved date takes over right after the page loads.

## Diagnosis

The leaf photos are diagnosed on the phone, with no server. The model (EfficientNet-B0, `public/model/crop_guardian_v2.onnx`) and its calibrated config (`crop_guardian_config.json`) come from the training notebook's export. Classes, Bengali labels, preprocessing, temperature and thresholds are all read from the config; none are written in the code.

- `src/lib/diagnosis/worker.ts` runs [onnxruntime-web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) (wasm, one thread) in a Web Worker, so the camera never freezes. The camera screen starts it; the first time it downloads the model and the wasm (about 30 MB, "মডেল নামাচ্ছি… একবারই লাগবে") and keeps them in the Cache API. The wasm is copied from `node_modules` into `public/ort/<version>/` by `scripts/copy-ort.mjs` on install, dev and build: nothing comes from a CDN.
- `preprocess.ts`: shorter side to 255, centre crop 224, scale, mean/std, NCHW float32, with torchvision's rounding.
- `decide.ts` follows `decision` in the config exactly: softmax of the disease logits at temperature T, the conformal set `p ≥ 1 − qhat`, and the OOD score. A photo is **unknown** if the OOD score is over the threshold or the set is empty, **confident** if the set has one class, otherwise **uncertain**. With the current config (`1 − qhat ≈ 0.89`), one photo is never uncertain.
- `combine.ts` decides each photo on its own (the thresholds were calibrated per photo) and keeps the more cautious result: unknown > uncertain > confident. Two confident photos that disagree become uncertain with both classes.

Confident opens `/result`, uncertain `/result/uncertain`, unknown `/unknown`. From uncertain, `/questions` asks only the questions that split the candidates left (`src/lib/diagnosis/questions.ts`): rings inside the spots, and white growth under the leaf. "জানি না" rules nothing out. If one class is left, `/result` shows it as "ছবি আর আপনার উত্তর মিলিয়ে", not "নিশ্চিত", because the answers aren't calibrated like the model. The result is kept on the device (IndexedDB) with the photos. "কেন মনে হলো?" lists only real inputs: what each photo gave, today's weather risk from `/api/risk`, and the farmer's answers. Advice per class is fixed text in `content.ts` that never gives a dose (always "লেবেল অনুযায়ী") and should be reviewed by an agronomist. Every result says "পরীক্ষামূলক: ইন্দোনেশিয়ার মাঠের ছবিতে যাচাই করা": the thresholds were fitted on Indonesian field photos, not Bangladeshi ones.

"কৃষি কর্মকর্তাকে পাঠান / দেখান" (on every result screen and at the end of the questions) uses the phone's share sheet (Web Share API) with both leaf photos and a short Bengali summary: date, place, the app's result and candidates, and the farmer's answers (`src/lib/shareCase.ts`). Where sharing isn't available it opens a WhatsApp link with the text only. Each sent case is kept on the device (IndexedDB `cases`), and uploaded to the server when the farmer is signed in (see [Cases](#cases)).

### Unions

`src/lib/unions.json` holds the 12 unions of Shibganj and its pourashava, with their real boundaries (geoBoundaries BGD ADM4) projected for the map and their centroids for the forecast. A union belongs to the upazila when its centroid lies inside the OCHA COD-AB polygon for Shibganj, Bogura. To rebuild it, download both files (links at the top of the script) and run:

```bash
npx tsx scripts/build-unions.ts <geoBoundaries-BGD-ADM4_simplified.geojson> <bgd_admin3.geojson>
```

The farmer picks a union on `/planting`. It is kept in the `cg-union` cookie (not httpOnly; it holds nothing private) so the server can forecast for it.

## Season ledger

`/ledger` is built on the phone from the planting date, the sprays the farmer logs with "আজ স্প্রে করেছি" (on the ledger, and on Home's decision card on danger days), and the real weather since emergence. That weather comes from `GET /api/risk/season?from=YYYY-MM-DD`, which uses the forecast API's `past_days` (up to 92, no archive delay) at the farmer's union. Sprays and the cost per spray (default ৳800, changed with "বদলান") are kept in localStorage.

`src/lib/ledger.ts` compares the season with the usual habit of one calendar spray a week. Each week from emergence is one of:

- no danger day, no spray: one calendar spray **saved** (+cost);
- a danger day and a spray: **sprayed in time**;
- a danger day, no spray: shown as a warning, no savings;
- a spray without danger: shown, no savings;
- the current week, or a week with any day of weather missing: nothing counted.

Before a planting date is set, the ledger and Home's pill ask for one instead of showing numbers. Cases sent to the officer (IndexedDB `cases`) are listed under the weeks.

### Offline

After one visit with internet, the diagnosis works with none. The model worker keeps the model, config and wasm in the Cache API. `public/sw.js` (a hand-written service worker, registered in production builds only) precaches `/camera`, the result screens, `/questions`, `/guide` and `/offline`, plus every hashed `/_next/static` file they use. Pages are network-first, so they stay fresh when online. Home isn't cached: offline it opens `/offline` ("নেট নেই — আবহাওয়ার ঝুঁকি দেখা যাচ্ছে না") with a button to the camera, so an old risk is never shown as today's. On the result screens, the weather row says the forecast is unavailable.

To try it, run `npm run build && npm start`, open `/camera` once, then stop the server (or switch the phone to airplane mode) and take the photos again. A service worker and the camera both need a secure context: `localhost`, or HTTPS on a phone.

`src/lib/diagnosis/__fixtures__/parity/` holds the notebook's reference outputs. `decide.test.ts` and `parity.test.ts` (which runs the real model with onnxruntime-node) check the app makes the same decisions on 12 notebook images (4 healthy, 4 late blight, 4 diseases the model never saw).

## Sign-in

Farmers and agriculture officers sign in with a Bangladeshi mobile number and a 6-digit SMS code. Nothing else needs an account: Home, the map, the ledger and the whole diagnosis flow work signed out, and offline as before. `src/proxy.ts` only guards `/account` and `/officer`.

Accounts use [Better Auth](https://www.better-auth.com/) (`src/lib/auth/auth.ts`, served at `/api/auth/*`) with its phone-number plugin. Users, sessions, codes and rate limits are kept in Postgres ([Neon](https://vercel.com/marketplace/neon), free plan, from the Vercel Marketplace).

- The number is written to E.164 (`+8801XXXXXXXXX`) from any local form, Bengali digits included (`src/lib/phone.ts`). The server accepts only that form.
- Codes are sent by [SMS Gate](https://sms-gate.app) (`src/lib/sms.ts`), an Android phone with a SIM in Cloud mode. A code lasts 5 minutes and allows 3 tries. Each IP address can ask for 3 codes a minute, because every code costs SMS credit on that phone.
- The first verified code creates the account, as a **farmer**. Sessions last 30 days.
- Roles can't be changed from the app. To make someone an officer, after they have signed in once:

  ```bash
  npx tsx scripts/set-role.ts 01712345678 officer     # or farmer
  ```

### Setup

```bash
npm i -g vercel && vercel link
vercel integration add neon            # provisions DATABASE_URL
vercel env add BETTER_AUTH_SECRET      # random, e.g. `openssl rand -base64 32`
vercel env add BETTER_AUTH_URL         # the site's URL, e.g. https://crop-guardian.vercel.app
vercel env add SMS_GATE_USERNAME       # from the SMS Gate app's Home tab (Cloud mode)
vercel env add SMS_GATE_PASSWORD
vercel env pull .env.local
npm run auth:migrate                   # creates the tables; run again after changing auth.ts
```

In development without `SMS_GATE_*`, the SMS is printed to the server console instead of sent, so you can sign in without a phone. In production a missing gateway is an error.

`/account`, `/officer` and `/sign-in` are not cached by the service worker, so no signed-in page is ever kept on the phone. Offline they open `/offline`.

## Cases

After sharing, the phone also sends the case to `POST /api/cases` (multipart: a `case` JSON part checked by `src/lib/cases.ts`, and the two JPEGs, each up to 1.5 MB). Only signed-in users can upload, so the officer knows whom to call; signed out, the button says "মোবাইল নম্বর দিয়ে ঢুকুন". A case that couldn't be uploaded (offline, signed out, or no database) stays on the phone with `uploaded: false`, and `src/components/CaseSync.tsx` retries when the app opens or the phone comes back online.

Cases are kept in the `"case"` table in Postgres, photos included as `bytea` (`src/lib/caseDb.ts`). Create it once, after `npm run auth:migrate`:

```bash
npm run db:migrate
```

`/officer` lists the cases newest first: union, date, the farmer's number (tap to call), the app's result and answers, and both photos (`/api/cases/[id]/photo/[slot]`, officers only). The officer marks each one **নাবি ধসা নিশ্চিত** or **নাবি ধসা নয়** (and can change it). The map counts only cases marked late blight, per union, in the last 7 or 30 days. Without the database the map still shows the weather risk and says the case counts are unavailable.

## Guide

`/guide` explains each part of the app in short Bengali, with a read-aloud button per section (`src/lib/guide.ts` holds the text; keep it in step with the screens). Home's "কীভাবে ব্যবহার করবেন" button opens it, "কেন এই পরামর্শ?" links to its risk section, and it is cached for offline use. The first time the app opens, `FirstRunIntro` shows four cards (risk colours, leaf photos, spray log, set up) and ends on `/planting`. It is not shown again on that phone.
