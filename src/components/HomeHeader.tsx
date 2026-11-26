import Link from 'next/link'
import type { SpeechPart } from '@/lib/audioKeys'
import type { RiskView } from '@/lib/data'
import { GearIcon, PinIcon } from './icons'
import { FieldStrip, LogoMark, SkyScene } from './illustrations'
import ListenButton from './ListenButton'

/* The sky header on Home: logo, read-aloud, guide, settings, the farmer's place, then `children` in the text column. */
export default function HomeHeader({
  view,
  place,
  speech,
  children,
}: {
  view: RiskView
  place: string
  speech: string | SpeechPart[]
  children: React.ReactNode
}) {
  return (
    <header className="relative min-h-[262px] shrink-0 overflow-hidden transition-colors duration-500" style={{ background: view.sky, color: view.ink }}>
      <SkyScene view={view} />

      <div className="relative flex items-center justify-between px-[18px] pt-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="flex flex-col leading-[1.1]">
            <span className="font-display text-[1.1875rem] font-extrabold">সবুজবিধি</span>
            <span className="text-sm font-medium">মাঠের সৎ ডাক্তার</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ListenButton text={speech} label="পুরো স্ক্রিন পড়ে শোনান" variant="sky" voiceTip />
          <Link
            href="/guide"
            aria-label="কীভাবে ব্যবহার করবেন"
            className="flex size-11 items-center justify-center rounded-full bg-white/78 font-display text-[1.375rem] font-extrabold text-ink no-underline"
          >
            ?
          </Link>
          {/* Settings, not the account: most farmers never sign in, and the account is its first row. */}
          <Link href="/settings" aria-label="সেটিংস" className="flex size-11 items-center justify-center rounded-full bg-white/78 text-ink">
            <GearIcon size={22} />
          </Link>
        </div>
      </div>

      {/* Text ends 202px from the left; SkyScene sizes itself to stay right of that. The bottom
          padding keeps the text above FieldStrip, and with large text the header grows instead
          of cutting it off. */}
      <div className="relative flex max-w-[220px] flex-col gap-2 px-[18px] pt-3.5 pb-[34px]">
        {/* Kept on one line; it may run past the column into empty sky rather than push the text down. */}
        <div className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
          <PinIcon size={16} />
          <Link href="/planting" className="text-inherit no-underline">
            {place}
          </Link>
        </div>
        {children}
      </div>

      <FieldStrip />
    </header>
  )
}
