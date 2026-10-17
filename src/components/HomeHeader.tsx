import type { RiskView } from '@/lib/data'
import { PinIcon } from './icons'
import { FieldStrip, LogoMark, SkyScene } from './illustrations'
import ListenButton from './ListenButton'

/* The sky header on Home: logo, read-aloud, location, then `children` in the text column. */
export default function HomeHeader({
  view,
  speech,
  locationNote,
  children,
}: {
  view: RiskView
  speech: string
  locationNote?: React.ReactNode
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
        <ListenButton text={speech} label="পুরো স্ক্রিন পড়ে শোনান" variant="sky" />
      </div>

      <div className="relative flex max-w-[220px] flex-col gap-2 px-[18px] pt-3.5">
        {/* Kept on one line; it may run past the column into empty sky rather than push the text down. */}
        <div className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap">
          <PinIcon size={16} />
          বগুড়া, শিবগঞ্জ
          {locationNote}
        </div>
        {children}
      </div>

      <FieldStrip />
    </header>
  )
}
