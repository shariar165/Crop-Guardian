'use client'

import Link from 'next/link'
import { toBnDigits } from '@/lib/bn'
import { daysBetween, todayIn } from '@/lib/dates'
import { usePlantingDate } from '@/lib/plantingDate'

// "রোপণের X দিন" from the saved planting date (else the sample count); opens the date picker.
export default function PlantingDays({ sampleDays }: { sampleDays: number }) {
  const planting = usePlantingDate()
  const days = planting ? daysBetween(planting, todayIn()) : sampleDays
  return (
    <Link href="/planting?from=ledger" className="text-teal underline decoration-dotted underline-offset-2">
      রোপণের {toBnDigits(days)} দিন
    </Link>
  )
}
