// The follow-up after a diagnosis that wasn't healthy: Home reminds the farmer to photograph the
// leaves again from day 5, since the advice says to look again in 5–7 days, and stops after day 14.
// Pure (no storage or React), so it is tested on its own.
import { type CropId, isCropId } from '@/lib/crops'
import { daysBetween, isIsoDate } from '@/lib/dates'

export const FOLLOW_UP_KEY = 'crop-guardian:follow-up'
export const FOLLOW_UP_FROM_DAY = 5
export const FOLLOW_UP_UNTIL_DAY = 14

export type FollowUp = { crop: CropId; id: string; date: string }

export function parseFollowUp(raw: string | null): FollowUp | null {
  try {
    const v = JSON.parse(raw ?? 'null')
    return v && isCropId(v.crop) && typeof v.id === 'string' && typeof v.date === 'string' && isIsoDate(v.date)
      ? { crop: v.crop, id: v.id, date: v.date }
      : null
  } catch {
    return null
  }
}

// What Home should do with a follow-up today: show it (with the days since), wait, or drop it.
export function followUpState(f: FollowUp, today: string): { show: true; days: number } | { show: false; expired: boolean } {
  const days = daysBetween(f.date, today)
  if (days > FOLLOW_UP_UNTIL_DAY) return { show: false, expired: true }
  if (days < FOLLOW_UP_FROM_DAY) return { show: false, expired: false }
  return { show: true, days }
}
