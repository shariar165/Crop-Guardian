// Calendar dates as YYYY-MM-DD strings in Bangladesh time, independent of the server's time zone.

export const LOCAL_TZ = 'Asia/Dhaka'

// Today's calendar date in the given time zone.
export function todayIn(timeZone: string = LOCAL_TZ): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

// The calendar date of a moment (ms since the epoch) in the given time zone.
export function dateOf(ms: number, timeZone: string = LOCAL_TZ): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date(ms))
}

export function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// The same day `n` months later (earlier if negative), clamped to the month's last day (31 Mar → 28 Feb).
export function addMonths(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const index = y * 12 + (m - 1) + n
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`
}

// Whole days from `from` to `to` (negative if `to` is earlier).
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86_400_000)
}

// A real calendar date written as YYYY-MM-DD. Date rolls 2025-02-30 over to March, so round-trip it.
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}
