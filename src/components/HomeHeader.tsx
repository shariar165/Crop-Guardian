import Link from 'next/link'
import type { RiskView } from '@/lib/data'
import { PersonIcon, PinIcon } from './icons'
import { FieldStrip, LogoMark, SkyScene } from './illustrations'
import ListenButton from './ListenButton'

/* The sky header on Home: logo, read-aloud, the farmer's place, then `children` in the text column. */
export default function HomeHeader({
  view,
  place,
  speech,
  children,
}: {
  view: RiskView
  place: string
  speech: string
  children: React.ReactNode
}) {
  return (
    <header className="relative h-[262px] shrink-0 overflow-hidden transition-colors duration-500" style={{ background: view.sky, color: view.ink }}>
      <SkyScene view={view} />

      <div className="relative flex items-center justify-between px-[18px] pt-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="flex flex-col leading-[1.1]">
            <span className="font-display text-[19px] font-extrabold">Crop Guardian</span>
            <span className="text-[13px] font-medium">মাঠের সৎ ডাক্তার</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ListenButton text={speech} label="পুরো স্ক্রিন পড়ে শোনান" variant="sky" />
          <Link href="/account" aria-label="আমার অ্যাকাউন্ট" className="flex size-11 items-center justify-center rounded-full bg-white/78 text-ink">
            <PersonIcon size={22} />
          </Link>
        </div>
      </div>

      <div className="relative flex max-w-[220px] flex-col gap-2 px-[18px] pt-3.5">
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
