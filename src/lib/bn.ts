const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toBnDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

// "০১৭" → "017": what a farmer types on a Bengali keyboard, as ASCII digits.
export function fromBnDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
}

export const BN_WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

// Weekday name for a calendar date (YYYY-MM-DD), independent of the server's time zone.
export function bnWeekday(isoDate: string): string {
  return BN_WEEKDAYS[new Date(isoDate + 'T00:00:00Z').getUTCDay()]
}

export const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

// The possessive: "নাবি ধসা" → "নাবি ধসার", "সুস্থ" → "সুস্থের". A word ending in a vowel takes র,
// one ending in a consonant (with its inherent vowel) takes ের.
export function bnGenitive(word: string): string {
  return /[\u0985-\u0994\u09BE-\u09CC]$/.test(word) ? `${word}র` : `${word}ের`
}

// "2026-01-14" → "১৪ জানুয়ারি", where the year is plain from context.
export function bnDayMonth(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number)
  return `${toBnDigits(d)} ${BN_MONTHS[m - 1]}`
}

// A span of days: "১২–১৮ নভেম্বর", or across months "২৮ নভেম্বর–৪ ডিসেম্বর".
export function bnDateRange(start: string, end: string): string {
  if (start === end) return bnDayMonth(start)
  return start.slice(0, 7) === end.slice(0, 7)
    ? `${toBnDigits(Number(start.slice(8)))}–${bnDayMonth(end)}`
    : `${bnDayMonth(start)}–${bnDayMonth(end)}`
}

// "2026-01-14" → "১৪ জানুয়ারি ২০২৬"
export function bnDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${toBnDigits(d)} ${BN_MONTHS[m - 1]} ${toBnDigits(y)}`
}
