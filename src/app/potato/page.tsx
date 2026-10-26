import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import GuideIcon from '@/components/GuideIcon'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { speechOf } from '@/lib/guide'
import { POTATO_GUIDE, POTATO_SOURCES } from '@/lib/potatoGuide'

export const metadata = { title: 'আলু চাষের পরামর্শ — Crop Guardian' }

// Growing, harvest, storage and disease advice for Bangladesh, each part with its own read-aloud.
// Cached for offline use (public/sw.js), since it is read in the field.
export default function PotatoPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="আলু চাষের পরামর্শ" right={<span className="size-11" />} />

      <nav aria-label="পরামর্শের অংশ" className="mx-4 flex shrink-0 flex-wrap gap-1.5">
        {POTATO_GUIDE.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full bg-sand px-3 py-1 text-[13px] font-semibold text-muted-2 no-underline">
            {toBnDigits(i + 1)}. {s.title.split(':')[0]}
          </a>
        ))}
      </nav>

      <ol className="m-0 mt-3 flex shrink-0 list-none flex-col gap-3 px-4 pb-4">
        {POTATO_GUIDE.map((s, i) => (
          <li key={s.id} id={s.id} className="stitch-lg flex scroll-mt-4 flex-col gap-2.5 rounded-[20px] p-4">
            <div className="flex items-center gap-3">
              <GuideIcon kind={s.icon} />
              <h2 className="m-0 flex-1 font-display text-[19px] leading-[1.2] font-extrabold">
                {toBnDigits(i + 1)}. {s.title}
              </h2>
            </div>

            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[1.45]">
              {s.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <p className="m-0 text-[13px] text-muted">সূত্র: {s.source}</p>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <ListenButton text={speechOf(s)} label={`${s.title} পড়ে শোনান`} />
              {s.link && (
                <Link href={s.link.href} className="text-[15px] font-bold text-teal">
                  {s.link.label} →
                </Link>
              )}
            </div>
          </li>
        ))}

        <li id="sources" className="stitch-lg flex scroll-mt-4 flex-col gap-2.5 rounded-[20px] p-4">
          <div className="flex items-center gap-3">
            <GuideIcon kind="doc" />
            <h2 className="m-0 flex-1 font-display text-[19px] leading-[1.2] font-extrabold">সূত্র</h2>
          </div>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.45]">
            {POTATO_SOURCES.map((s) =>
              s.href ? (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="text-teal">
                    {s.label}
                  </a>
                </li>
              ) : (
                <li key={s.label}>{s.label}</li>
              ),
            )}
          </ul>
          <p className="m-0 text-[14px] leading-[1.45]">পরামর্শগুলো পরীক্ষামূলক। ওষুধ সবসময় লেবেল অনুযায়ী দিন, সন্দেহ হলে উপসহকারী কৃষি কর্মকর্তার পরামর্শ নিন।</p>
        </li>
      </ol>

      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
