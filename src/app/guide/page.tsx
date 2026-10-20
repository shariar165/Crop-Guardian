import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import GuideIcon from '@/components/GuideIcon'
import { DayGlyph } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { DAY_STATE } from '@/lib/data'
import { GUIDE, RISK_MEANING, speechOf } from '@/lib/guide'

export const metadata = { title: 'কীভাবে ব্যবহার করবেন — Crop Guardian' }

const RISK_SPEECH = RISK_MEANING.map((m) => `${DAY_STATE[m.risk].word}: ${m.text}`).join(' ')

// How to use the app, step by step, each part with its own read-aloud. Cached for offline use (public/sw.js).
export default function GuidePage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="কীভাবে ব্যবহার করবেন" right={<span className="size-11" />} />

      <nav aria-label="নির্দেশিকার অংশ" className="mx-4 flex shrink-0 flex-wrap gap-1.5">
        {GUIDE.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full bg-sand px-3 py-1 text-[13px] font-semibold text-muted-2 no-underline">
            {toBnDigits(i + 1)}. {s.title.split(':')[0]}
          </a>
        ))}
      </nav>

      <ol className="m-0 mt-3 flex shrink-0 list-none flex-col gap-3 px-4 pb-4">
        {GUIDE.map((s, i) => (
          <li key={s.id} id={s.id} className="stitch-lg flex scroll-mt-4 flex-col gap-2.5 rounded-[20px] p-4">
            <div className="flex items-center gap-3">
              <GuideIcon kind={s.icon} />
              <h2 className="m-0 flex-1 font-display text-[19px] leading-[1.2] font-extrabold">
                {toBnDigits(i + 1)}. {s.title}
              </h2>
            </div>

            {s.id === 'risk' && (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {RISK_MEANING.map((m) => (
                  <li key={m.risk} className="flex items-center gap-3 rounded-[14px] bg-cream px-2.5 py-2">
                    <span className="flex w-14 shrink-0 flex-col items-center">
                      <DayGlyph risk={m.risk} />
                      <span className="text-xs font-bold" style={{ color: DAY_STATE[m.risk].color }}>
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
                <Link href={s.link.href} className="text-[15px] font-bold text-teal">
                  {s.link.label} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
