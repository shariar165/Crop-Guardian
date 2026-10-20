'use client'

import Link from 'next/link'
import { toBnDigits } from '@/lib/bn'
import { daysBetween, todayIn } from '@/lib/dates'
import { usePlantingDate } from '@/lib/plantingDate'

// "রোপণের X দিন" from the saved planting date, or a prompt to give it; opens the date picker.
export default function PlantingDays() {
  const planting = usePlantingDate()
  return (
    <Link href="/planting?from=ledger" className="text-teal underline decoration-dotted underline-offset-2">
      {planting ? `রোপণের ${toBnDigits(daysBetween(planting, todayIn()))} দিন` : 'রোপণের তারিখ দিন'}
    </Link>
  )
}
