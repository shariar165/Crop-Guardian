// SMS risk alerts: which crops a farmer hears about, when, and in what words. The afternoon cron
// (src/app/api/cron/alerts, run by src/lib/alertRun.ts) keeps the promise Home's decision makes:
// "… বিকেলে SMS-এ জানাব".
import { ALERT_QUIET_DAYS } from '@/lib/backtest'
import { CROP_IDS, type CropId, CROPS, SEASONS } from '@/lib/crops'
import { daysBetween } from '@/lib/dates'
import { type Field, inSeason } from '@/lib/fieldList'
import { dangerFrom, type StripDay } from '@/lib/risk'
import { riskActive, seasonFor } from '@/lib/season'

// A Bengali SMS is UCS-2: anything longer is sent, and paid for, as two.
export const SMS_MAX_CHARS = 70

// The crops in the field today. With no field given, the usual potato season, as Home assumes.
export function cropsToAlert(fields: Field[], today: string): CropId[] {
  if (fields.length === 0) return riskActive(seasonFor(today, null, 'potato')) ? ['potato'] : []
  const crops = new Set(fields.filter((f) => inSeason(f, today)).map((f) => SEASONS[f.season].crop))
  return CROP_IDS.filter((c) => crops.has(c))
}

// What one afternoon run does for one crop. `days` start today. `send` is the index of the danger
// day to warn about, or -1. `lastDanger` is the latest danger day seen, to remember, so a run of
// danger days gets one SMS, not one a day. Like the backtest's alerts (backtest.ts), a danger day
// starts a new warning only after ALERT_QUIET_DAYS without danger. Null when today and tomorrow
// are not danger.
export function nextAlert(days: StripDay[], lastDanger: string | null): { send: number; lastDanger: string } | null {
  const soon = days.slice(0, 2).filter((d) => d.risk === 'danger')
  if (soon.length === 0) return null
  const first = soon[0].date
  const latest = soon.at(-1)!.date
  const isNew = lastDanger === null || daysBetween(lastDanger, first) - 1 >= ALERT_QUIET_DAYS
  return {
    send: isNew ? days.indexOf(soon[0]) : -1,
    lastDanger: lastDanger !== null && lastDanger > latest ? lastDanger : latest,
  }
}

export function alertMessage(crop: CropId, days: StripDay[], index: number): string {
  const from = index === 0 ? 'আজ' : dangerFrom(days, index)
  return `Crop Guardian: ${from} থেকে ${CROPS[crop].smsWarning}`
}
