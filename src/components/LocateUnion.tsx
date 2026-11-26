'use client'

import { useState, useSyncExternalStore } from 'react'
import { chooseUnion, findUnionNear } from '@/app/planting/actions'
import { PinIcon } from './icons'

type State =
  | { step: 'idle' }
  | { step: 'locating' }
  | { step: 'found'; id: string; name: string }
  | { step: 'error'; message: string }

const MESSAGE = {
  denied: 'অবস্থান জানার অনুমতি দেওয়া হয়নি। নিচের তালিকা থেকে বেছে নিন।',
  unavailable: 'অবস্থান পাওয়া গেল না। ফোনের লোকেশন চালু করে আবার চেষ্টা করুন, বা তালিকা থেকে বেছে নিন।',
  outside: 'আপনার এলাকা এখনো যুক্ত হয়নি — তালিকা থেকে বেছে নিন',
  offline: 'নেট নেই। নেট চালু করে আবার চেষ্টা করুন, বা তালিকা থেকে বেছে নিন।',
}

const noSubscribe = () => () => {}

/**
 * "আমার অবস্থান": finds the union nearest the phone and asks the farmer to confirm it, then saves it
 * like a tap on the list. Hidden where the browser has no geolocation (and before hydration).
 */
export default function LocateUnion({ next }: { next: string }) {
  const supported = useSyncExternalStore(noSubscribe, () => 'geolocation' in navigator, () => false)
  const [state, setState] = useState<State>({ step: 'idle' })
  if (!supported) return null

  function locate() {
    setState({ step: 'locating' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        findUnionNear(coords.latitude, coords.longitude).then(
          (union) => setState(union ? { step: 'found', ...union } : { step: 'error', message: MESSAGE.outside }),
          () => setState({ step: 'error', message: MESSAGE.offline }),
        )
      },
      (err) => setState({ step: 'error', message: err.code === err.PERMISSION_DENIED ? MESSAGE.denied : MESSAGE.unavailable }),
      // A union is several km across, so a coarse, recent fix is enough and comes faster.
      { timeout: 10_000, maximumAge: 5 * 60_000, enableHighAccuracy: false },
    )
  }

  if (state.step === 'found') {
    return (
      <form action={chooseUnion} className="flex flex-col gap-2.5 rounded-[16px] border-2 border-ink bg-sun-soft p-3.5">
        <input type="hidden" name="next" value={next} />
        <span className="text-[0.9375rem] font-semibold">আপনার অবস্থানের সবচেয়ে কাছের ইউনিয়ন:</span>
        <span className="font-display text-xl leading-[1.3] font-extrabold">{state.name}</span>
        <span className="text-base font-bold">এটাই?</span>
        <div className="flex gap-2.5">
          <button type="submit" name="union" value={state.id} className="h-12 flex-1 rounded-full border-0 bg-sun text-base font-bold text-ink">
            হ্যাঁ, এটাই
          </button>
          <button
            type="button"
            onClick={() => setState({ step: 'idle' })}
            className="h-12 flex-1 rounded-full border-2 border-ink bg-transparent text-base font-bold text-ink"
          >
            না, তালিকা থেকে
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={locate}
        disabled={state.step === 'locating'}
        className="flex min-h-14 items-center justify-center gap-2 rounded-[16px] border-2 border-ink bg-sun px-4 text-[1.0625rem] font-bold text-ink disabled:opacity-70"
      >
        <PinIcon size={24} weight={2.2} />
        {state.step === 'locating' ? 'অবস্থান খুঁজছি…' : 'আমার অবস্থান থেকে বেছে নিন'}
      </button>
      {state.step === 'error' && (
        <p role="alert" className="m-0 text-[0.9375rem] leading-[1.45] font-semibold text-[#8A3424]">
          {state.message}
        </p>
      )}
    </div>
  )
}
