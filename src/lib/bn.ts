const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toBnDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

export const BN_WEEKDAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

// Weekday name for a calendar date (YYYY-MM-DD), independent of the server's time zone.
export function bnWeekday(isoDate: string): string {
  return BN_WEEKDAYS[new Date(isoDate + 'T00:00:00Z').getUTCDay()]
}
