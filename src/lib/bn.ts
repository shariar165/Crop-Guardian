const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toBnDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

export const BN_WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

// Weekday name for a calendar date (YYYY-MM-DD), independent of the server's time zone.
export function bnWeekday(isoDate: string): string {
  return BN_WEEKDAYS[new Date(isoDate + 'T00:00:00Z').getUTCDay()]
}

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

// "2026-01-14" → "১৪ জানুয়ারি ২০২৬"
export function bnDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${toBnDigits(d)} ${BN_MONTHS[m - 1]} ${toBnDigits(y)}`
}
