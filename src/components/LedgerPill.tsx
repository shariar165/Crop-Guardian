'use client'

import Link from 'next/link'
import { CheckIcon, LedgerIcon } from '@/components/icons'
import { toBnDigits } from '@/lib/bn'
import { formatTaka } from '@/lib/data'
import { useLedger } from '@/lib/useLedger'

const PILL =
  'mx-4 mt-2.5 flex min-h-[46px] shrink-0 items-center justify-between gap-2 rounded-full bg-mist px-3.5 text-[15px] font-semibold text-teal-deep no-underline'

/** Home's link to the ledger, with this season's real savings once there are any. */
export default function LedgerPill() {
  const state = useLedger()
  if (state.status === 'ready' && state.ledger.savedCount > 0) {
    return (
      <Link href="/ledger" className={PILL}>
        <span className="flex items-center gap-2">
          <CheckIcon size={20} />
          এই মৌসুমে {toBnDigits(state.ledger.savedCount)}টা স্প্রে বাঁচিয়েছেন
        </span>
        <span className="font-display text-lg font-extrabold">{formatTaka(state.ledger.savedTotal)}</span>
      </Link>
    )
  }
  const text =
    state.status === 'noPlanting'
      ? 'রোপণের তারিখ দিন, হিসাব শুরু হবে'
      : state.status === 'notYet'
        ? 'চারা গজালে মৌসুমের হিসাব শুরু হবে'
        : 'মৌসুমের হিসাব দেখুন'
  return (
    <Link href={state.status === 'noPlanting' ? '/planting' : '/ledger'} className={PILL}>
      <span className="flex items-center gap-2">
        <LedgerIcon size={20} />
        {text}
      </span>
      <span aria-hidden="true">›</span>
    </Link>
  )
}
