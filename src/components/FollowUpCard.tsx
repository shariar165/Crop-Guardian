'use client'

import { useEffect } from 'react'
import { PrimaryLink } from '@/components/Buttons'
import { CameraIcon } from '@/components/icons'
import { toBnDigits } from '@/lib/bn'
import { todayIn } from '@/lib/dates'
import { store, useStored } from '@/lib/deviceStore'
import { PHOTO_SPECS } from '@/lib/diagnosis/crops'
import { FOLLOW_UP_KEY, followUpState, parseFollowUp } from '@/lib/followUp'

/**
 * Home's reminder, from day 5 after a result that wasn't healthy: "<n> দিন আগে নাবি ধসা পেয়েছিলেন
 * — আবার পাতার ছবি তুলুন". A new diagnosis replaces it; after day 14 it is dropped.
 */
export default function FollowUpCard() {
  const followUp = parseFollowUp(useStored(FOLLOW_UP_KEY))
  const state = followUp ? followUpState(followUp, todayIn()) : null
  const expired = state !== null && !state.show && state.expired

  useEffect(() => {
    if (expired) store(FOLLOW_UP_KEY, null)
  }, [expired])

  if (!followUp || !state?.show) return null
  const disease = PHOTO_SPECS[followUp.crop].labelsBn[followUp.id] ?? 'অন্য রোগ'

  return (
    <section className="mx-4 mt-3 flex shrink-0 flex-col gap-2.5 rounded-[18px] border-2 border-amber bg-amber-soft p-3.5">
      <p className="m-0 text-base leading-[1.4] font-bold">
        {toBnDigits(state.days)} দিন আগে {disease} পেয়েছিলেন — আবার পাতার ছবি তুলুন
      </p>
      <PrimaryLink href={`/camera?crop=${followUp.crop}`} className="min-h-12 gap-2 self-start px-4 text-base font-bold">
        <CameraIcon size={22} weight={2.2} />
        পাতার ছবি তুলুন
      </PrimaryLink>
    </section>
  )
}
