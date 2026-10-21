'use client'

import Link from 'next/link'
import { toBnDigits } from '@/lib/bn'
import { daysBetween, todayIn } from '@/lib/dates'
import type { Field } from '@/lib/fields'

// "রোপণের X দিন" from the field's date, or a prompt to give it; opens the date picker.
export default function PlantingDays({ field }: { field: Field | null }) {
  return (
    <Link href={`/planting?from=ledger${field ? `&season=${field.season}` : ''}`} className="text-teal underline decoration-dotted underline-offset-2">
      {field ? `রোপণের ${toBnDigits(daysBetween(field.planted, todayIn()))} দিন` : 'রোপণের তারিখ দিন'}
    </Link>
  )
}
