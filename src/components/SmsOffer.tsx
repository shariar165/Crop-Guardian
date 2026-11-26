'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { setAlerts } from '@/app/account/actions'
import { store, useHydrated, useStored } from '@/lib/deviceStore'
import { readFields, useFields } from '@/lib/fields'
import { tealClass } from './Buttons'

// Set by "এখন না"; the offer then stays away on this phone (the account page still has the switch).
const DISMISSED_KEY = 'crop-guardian:sms-offer-dismissed'

// Back to /planting after signing in, where `alerts=1` turns them on.
const AFTER_SIGN_IN = '/planting?alerts=1'
export const SIGN_IN_FOR_ALERTS = `/sign-in?next=${encodeURIComponent(AFTER_SIGN_IN)}`

type State = 'idle' | 'busy' | 'done' | 'error'

/**
 * "বিপদের আগে SMS পেতে চান?" until the farmer has alerts on or says "এখন না". Signed in, it turns
 * them on here; signed out, it goes to sign-in and back to /planting. `auto` (on /planting after
 * that sign-in) turns them on once without a tap. On /planting (`needsField`) it waits for a field.
 */
export default function SmsOffer({
  signedIn,
  enabled,
  hasUnion,
  needsField = false,
  auto = false,
  className = '',
}: {
  signedIn: boolean
  enabled: boolean
  hasUnion: boolean
  needsField?: boolean
  auto?: boolean
  className?: string
}) {
  const router = useRouter()
  const hydrated = useHydrated()
  const dismissed = useStored(DISMISSED_KEY) === '1'
  const fields = useFields()
  // Already busy when it will turn them on by itself (below), so the button never flashes first.
  const [state, setState] = useState<State>(() => (auto && signedIn && hasUnion && !enabled ? 'busy' : 'idle'))
  const [error, setError] = useState('')
  const autoRan = useRef(false)

  function turnOn() {
    setState('busy')
    enable()
  }

  async function enable() {
    const ok = await setAlerts(true, readFields()).catch(() => null)
    if (ok) {
      setState('done')
      router.refresh()
      return
    }
    setState('error')
    setError(ok === false ? 'আগে আপনার ইউনিয়ন বেছে নিন।' : 'নেট নেই, পরে আবার চেষ্টা করুন।')
  }

  // Back from sign-in: the farmer already said yes, so turn them on once and drop the flag from
  // the address, so a reload doesn't do it again.
  useEffect(() => {
    if (!auto || autoRan.current || !signedIn || !hasUnion) return
    autoRan.current = true
    router.replace('/planting', { scroll: false })
    if (!enabled) enable()
    // enable only reads values that are stable for this page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, signedIn, hasUnion, enabled])

  if (state === 'done') {
    return (
      <p role="status" className={`m-0 rounded-[14px] bg-leaf-soft px-3.5 py-2.5 text-base font-bold text-leaf ${className}`}>
        SMS চালু হয়েছে। বিপদের আগের দিন বিকেলে জানাব।
      </p>
    )
  }
  if (!hydrated || enabled || dismissed || (needsField && (!hasUnion || fields.length === 0))) return null

  return (
    <div className={`flex flex-col gap-2 rounded-[16px] border-2 border-teal/40 bg-mist px-3.5 py-3 ${className}`}>
      <span className="text-base leading-[1.35] font-bold">বিপদের আগে SMS পেতে চান?</span>
      <div className="flex items-center gap-3">
        {signedIn ? (
          <button
            type="button"
            onClick={turnOn}
            disabled={state === 'busy'}
            className={`${tealClass} min-h-12 flex-1 px-3 text-base font-bold disabled:opacity-60`}
          >
            {state === 'busy' ? 'একটু দাঁড়ান…' : 'হ্যাঁ, চালু করুন'}
          </button>
        ) : (
          <Link href={SIGN_IN_FOR_ALERTS} className={`${tealClass} min-h-12 flex-1 px-3 text-base font-bold`}>
            হ্যাঁ, চালু করুন
          </Link>
        )}
        <button type="button" onClick={() => store(DISMISSED_KEY, '1')} className="min-h-12 border-0 bg-transparent px-2 text-base font-bold text-muted-2">
          এখন না
        </button>
      </div>
      {!signedIn && <span className="text-sm leading-[1.4] text-muted">মোবাইল নম্বর দিয়ে ঢুকতে হবে। SMS-এ একটা কোড যাবে।</span>}
      {state === 'error' && (
        <p role="alert" className="m-0 text-[0.9375rem] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
