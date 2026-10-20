// Bangladeshi mobile numbers, as a farmer types them ("০১৭১২-৩৪৫৬৭৮", "+880 1712 345678"), in the
// E.164 form the accounts and the SMS gateway use ("+8801712345678").
import { fromBnDigits, toBnDigits } from '@/lib/bn'

const BD_MOBILE = /^(?:\+?880|0)?(1[3-9]\d{8})$/

export function normalizeBdPhone(input: string): string | null {
  const match = BD_MOBILE.exec(fromBnDigits(input).replace(/[\s-]/g, ''))
  return match ? `+880${match[1]}` : null
}

// "+8801712345678" → "০১৭১২-৩৪৫৬৭৮", the way the number is written locally. Better Auth types the
// user's number as optional, though every account here is created from one.
export function formatBdPhone(e164: string | null | undefined): string {
  if (!e164) return ''
  const local = '0' + e164.slice(4)
  return toBnDigits(`${local.slice(0, 5)}-${local.slice(5)}`)
}
