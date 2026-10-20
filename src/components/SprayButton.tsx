'use client'

import { SprayBottleIcon } from '@/components/icons'
import { todayIn } from '@/lib/dates'
import { useHydrated } from '@/lib/deviceStore'
import { addSpray, removeSpray, useSprays } from '@/lib/sprayLog'

/** "আজ স্প্রে করেছি": logs today's spray on the device for the season ledger, with undo. */
export default function SprayButton({ className = '' }: { className?: string }) {
  const hydrated = useHydrated()
  const sprays = useSprays()
  const today = todayIn()
  if (!hydrated) return null

  if (sprays.includes(today)) {
    return (
      <p role="status" className={`m-0 flex flex-wrap items-center gap-x-2 text-[15px] font-semibold text-leaf ${className}`}>
        আজকের স্প্রে হিসাবে লেখা হয়েছে
        <button type="button" onClick={() => removeSpray(today)} className="border-0 bg-transparent p-0 text-[15px] font-bold text-teal underline">
          মুছুন
        </button>
      </p>
    )
  }
  return (
    <button
      type="button"
      onClick={() => addSpray(today)}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-[16px] border-2 border-ink bg-paper px-4 text-base font-bold text-ink ${className}`}
    >
      <SprayBottleIcon size={22} weight={2.2} />
      আজ স্প্রে করেছি
    </button>
  )
}
