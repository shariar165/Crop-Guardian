const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

export function toBnDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}
