import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import GuideIcon from '@/components/GuideIcon'
import { DayGlyph } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import OpenOnHash from '@/components/OpenOnHash'
import TopBar from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { DAY_STATE } from '@/lib/data'
import { GUIDE, GUIDE_SUMMARY, RISK_MEANING, speechOf } from '@/lib/guide'

export const metadata = { title: 'কীভাবে ব্যবহার করবেন — সবুজবিধি' }

const RISK_SPEECH = RISK_MEANING.map((m) => `${DAY_STATE[m.risk].word}: ${m.text}`).join(' ')

// How to use the app, step by step, each part with its own read-aloud. Cached for offline use (public/sw.js).
export default function GuidePage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="কীভাবে ব্যবহার করবেন" right={<span className="size-11" />} />

      <section aria-labelledby="summary-title" className="mx-4 flex shrink-0 flex-col gap-2 rounded-[20px] bg-sun-soft p-4">
        <h2 id="summary-title" className="m-0 font-display text-xl font-extrabold">
          এক নজরে
        </h2>
        <ol className="m-0 flex flex-col gap-1.5 pl-5 text-base leading-[1.45]">
          {GUIDE_SUMMARY.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <ListenButton text={GUIDE_SUMMARY.join(' ')} label="এক নজরে পড়ে শোনান" className="self-start" />
      </section>

      <nav aria-label="নির্দেশিকার অংশ" className="mx-4 mt-3 flex shrink-0 flex-wrap gap-1.5">
        {GUIDE.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full bg-sand px-3 py-1 text-base font-semibold text-muted-2 no-underline">
            {toBnDigits(i + 1)}. {s.title.split(':')[0]}
          </a>
        ))}
      </nav>

      <OpenOnHash />
      {/* Collapsed, so the 12 parts fit on a screen or two; only the first starts open. */}
      <ol className="m-0 mt-3 flex shrink-0 list-none flex-col gap-3 px-4 pb-4">
        {GUIDE.map((s, i) => (
          <li key={s.id}>
            <details id={s.id} open={i === 0} className="group stitch-lg flex scroll-mt-4 flex-col rounded-[20px] p-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                <GuideIcon kind={s.icon} />
                <h2 className="m-0 flex-1 font-display text-[19px] leading-[1.2] font-extrabold">
                  {toBnDigits(i + 1)}. {s.title}
                </h2>
                <span aria-hidden="true" className="shrink-0 text-2xl font-bold text-teal transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {s.id === 'risk' && (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {RISK_MEANING.map((m) => (
                      <li key={m.risk} className="flex items-center gap-3 rounded-[14px] bg-cream px-2.5 py-2">
                        <span className="flex w-14 shrink-0 flex-col items-center">
                          <DayGlyph risk={m.risk} />
                          <span className="text-sm font-bold" style={{ color: DAY_STATE[m.risk].color }}>
                            {DAY_STATE[m.risk].word}
                          </span>
                        </span>
                        <span className="text-[15px] leading-[1.4]">{m.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.45]">
                  {s.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ListenButton text={s.id === 'risk' ? `${speechOf(s)}। ${RISK_SPEECH}` : speechOf(s)} label={`${s.title} পড়ে শোনান`} />
                  {s.link && (
                    <Link href={s.link.href} className="text-base font-bold text-teal">
                      {s.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            </details>
          </li>
        ))}
      </ol>

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
