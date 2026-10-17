# Crop-Guardian

**মাঠের সৎ ডাক্তার** — a Bengali, mobile-first UI for advising potato farmers on late blight: daily risk from the weather, leaf photo diagnosis that admits uncertainty, an area risk map, and a season savings ledger.

Built with Next.js (App Router), TypeScript and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Screens

| Route | Screen |
|---|---|
| `/` | Home: today's risk header (`?risk=safe\|watch\|danger`), 5-day forecast, today's decision |
| `/camera` | Leaf photo |
| `/result/uncertain` | "Not sure": candidate list |
| `/questions` | Two questions that narrow the candidates |
| `/result` | Final diagnosis (late blight) |
| `/unknown` | Can't identify: send to agriculture officer |
| `/map` | Union-level risk map |
| `/ledger` | Season savings |

All data is static sample data in `src/lib/data.ts`; there is no backend or disease model yet.
