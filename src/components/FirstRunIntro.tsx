'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { primaryClass } from '@/components/Buttons'
import GuideIcon from '@/components/GuideIcon'
import ListenButton from '@/components/ListenButton'
import { toBnDigits } from '@/lib/bn'
import { store, useHydrated, useStored } from '@/lib/deviceStore'
import { INTRO, speechOf } from '@/lib/guide'

const SEEN_KEY = 'crop-guardian:intro-seen'

/** Four short cards over Home, the first time the app opens on this phone; then never again. */
export default function FirstRunIntro() {
  const hydrated = useHydrated()
  const seen = useStored(SEEN_KEY)
  const router = useRouter()
  const [step, setStep] = useState(0)
  if (!hydrated || seen) return null

  const card = INTRO[step]
  const last = step === INTRO.length - 1
  const done = (to?: string) => {
    store(SEEN_KEY, '1')
    if (to) router.push(to)
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="intro-title" className="absolute inset-0 z-20 flex flex-col bg-cream">
      <div className="flex shrink-0 items-center justify-between px-4 pt-4">
        <span className="text-sm font-bold text-muted">
          {toBnDigits(step + 1)} / {toBnDigits(INTRO.length)}
        </span>
        <button type="button" onClick={() => done()} className="min-h-11 border-0 bg-transparent px-2 text-base font-bold text-teal">
          বাদ দিন
        </button>
      </div>

      <div key={step} className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <GuideIcon kind={card.icon} size="lg" />
        <h1 id="intro-title" className="m-0 font-display text-[28px] leading-[1.2] font-extrabold">
          {card.title}
        </h1>
        <p className="m-0 text-[17px] leading-[1.5]">{card.text}</p>
        <ListenButton text={speechOf(card)} label="পড়ে শোনান" />
      </div>

      <div className="flex shrink-0 justify-center gap-2 pb-4" aria-hidden="true">
        {INTRO.map((c, i) => (
          <span key={c.title} className={`h-2 rounded-full ${i === step ? 'w-6 bg-ink' : 'w-2 bg-line'}`} />
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-4 pb-6">
        {last ? (
          <>
            <button type="button" onClick={() => done('/planting?from=intro')} className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold`}>
              জমির খবর দিন
            </button>
            <button type="button" onClick={() => done()} className="min-h-12 border-0 bg-transparent text-base font-bold text-teal">
              পরে দেব
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setStep(step + 1)} className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold`}>
            পরের
          </button>
        )}
      </div>
    </div>
  )
}
