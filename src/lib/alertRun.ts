// The afternoon SMS run: every farmer with alerts on hears about danger today or tomorrow for the
// crops in their field, at their union. Called by the cron route (src/app/api/cron/alerts).
import 'server-only'
import { claimAlert, listSubscribers, releaseAlert, type Subscriber } from '@/lib/alertDb'
import { alertMessage, cropsToAlert, nextAlert } from '@/lib/alerts'
import { type Place, placeOf, unionById } from '@/lib/areas'
import { type CropId, CROPS } from '@/lib/crops'
import { todayIn } from '@/lib/dates'
import type { RiskAssessment } from '@/lib/risk'
import { sendSms } from '@/lib/sms'
import { fetchHourlyForecastMany, type HourlyForecast } from '@/lib/weather'

// Unions per Open-Meteo request: one upazila's worth takes it 3–4 s.
const FORECAST_CHUNK = 50
// An alert sent late in the evening is still worth it; one the next morning is not.
const ALERT_TTL_S = 6 * 60 * 60
// Below sign-in codes, which use priority 100, so a farmer signing in isn't kept waiting.
const ALERT_PRIORITY = 0

export type AlertRunResult = { subscribers: number; sent: number; skipped: number; failed: number }

// One forecast per place, keyed by placeKey. A failed request leaves its places out.
async function forecasts(places: Map<string, Place>): Promise<Map<string, HourlyForecast>> {
  const byPlace = new Map<string, HourlyForecast>()
  const keys = [...places.keys()]
  for (let i = 0; i < keys.length; i += FORECAST_CHUNK) {
    const chunk = keys.slice(i, i + FORECAST_CHUNK)
    try {
      const list = await fetchHourlyForecastMany(chunk.map((k) => places.get(k)!))
      chunk.forEach((k, j) => byPlace.set(k, list[j]))
    } catch (err) {
      // Those farmers are skipped today; the others still hear.
      console.error(`Alert forecasts failed for ${chunk.length} places`, err)
    }
  }
  return byPlace
}

// An unknown union (e.g. renamed since) falls back to the default place, as Home does.
const placeKey = (s: Subscriber) => placeOf(unionById(s.unionId)).union?.id ?? 'default'

export async function runAlerts(today = todayIn()): Promise<AlertRunResult> {
  const subscribers = await listSubscribers()
  const result: AlertRunResult = { subscribers: subscribers.length, sent: 0, skipped: 0, failed: 0 }
  const places = new Map(subscribers.map((s) => [placeKey(s), placeOf(unionById(s.unionId))]))
  const byPlace = await forecasts(places)

  const assessed = new Map<string, RiskAssessment | null>()
  const assess = (place: string, crop: CropId): RiskAssessment | null => {
    const key = `${place}:${crop}`
    if (!assessed.has(key)) {
      const hourly = byPlace.get(place)
      let risk: RiskAssessment | null = null
      try {
        risk = hourly ? CROPS[crop].assess(hourly, today) : null
      } catch (err) {
        console.error(`Alert risk failed for ${key}`, err)
      }
      assessed.set(key, risk)
    }
    return assessed.get(key)!
  }

  // One at a time: the SMS gateway is a single phone.
  for (const s of subscribers) {
    for (const crop of cropsToAlert(s.fields, today)) {
      const risk = assess(placeKey(s), crop)
      if (!risk) {
        result.failed++
        continue
      }
      const previous = s.lastDanger[crop] ?? null
      const next = nextAlert(risk.days, previous)
      if (!next) continue
      const sending = next.send !== -1
      if (!(await claimAlert(s.userId, crop, previous, next.lastDanger, sending)) || !sending) {
        result.skipped++
        continue
      }
      try {
        await sendSms(s.phone, alertMessage(crop, risk.days, next.send), process.env, { ttlS: ALERT_TTL_S, priority: ALERT_PRIORITY })
        result.sent++
      } catch (err) {
        console.error(`Alert SMS failed for ${s.userId}`, err)
        await releaseAlert(s.userId, crop, previous).catch((e) => console.error('Alert release failed', e))
        result.failed++
      }
    }
  }
  return result
}
