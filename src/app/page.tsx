import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { outlineClass, PrimaryLink } from '@/components/Buttons'
import { CameraIcon, CheckIcon, MicIcon, PinIcon, SprayIcon, WarnIcon } from '@/components/icons'
import { DayGlyph, FieldStrip, LogoMark, SkyScene } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import { DAY_STATE, FORECAST, formatTaka, parseRiskOverride, RISK_VIEW, RISKS, SAVED_COUNT, SAVED_TOTAL } from '@/lib/data'
import type { Risk } from '@/lib/data'
import { bnWeekday, toBnDigits } from '@/lib/bn'
import { assessRisk } from '@/lib/risk'
import { addDays, DEFAULT_LOCATION, fetchHourlyForecast, todayIn } from '@/lib/weather'

const STALE_NOTE = 'পুরনো তথ্য — নেট নেই'

// Live forecast by default; ?risk= forces a sample state for demos (no network).
// If the forecast can't be fetched, fall back to the "watch" sample and mark it stale.
async function loadRisk(override: Risk | undefined) {
  const today = todayIn()
  const sample = (risk: Risk) => ({
    risk,
    days: FORECAST[risk].map((r, i) => ({ date: addDays(today, i), risk: r })),
    sub: RISK_VIEW[risk].sub,
    stale: false,
  })
  if (override) return sample(override)
  try {
    const live = assessRisk(await fetchHourlyForecast(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon), today)
    return { risk: live.today, days: live.days, sub: live.reason, stale: false }
  } catch (err) {
    console.error('Live risk unavailable, showing sample data:', err)
    return { ...sample('watch'), stale: true }
  }
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const override = parseRiskOverride((await searchParams).risk)
  const { risk, days: forecast, sub, stale } = await loadRisk(override)
  const view = RISK_VIEW[risk]
  const days = forecast.map((d, i) => ({ ...d, name: i === 0 ? 'আজ' : bnWeekday(d.date), ...DAY_STATE[d.risk] }))

  const speech = [
    'বগুড়া, শিবগঞ্জ। আজকের ধসা রোগের ঝুঁকি:',
    view.word + '।',
    sub + '।',
    view.title + '।',
    view.body,
    stale && STALE_NOTE + '।',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-1 flex-col">
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
            {stale && (
              <span className="ml-1 rounded-full border border-current px-1.5 text-[11px] leading-[18px]">
                {STALE_NOTE}
              </span>
            )}
          </div>
          <span className="text-[15px] font-medium">আজকের ধসা রোগের ঝুঁকি</span>
          <div
            className="flex items-center gap-2 self-start rounded-[14px] pt-1 pr-4 pb-0.5 pl-3"
            style={{ background: view.badgeBg, color: view.badgeInk }}
          >
            <WarnIcon size={26} weight={2.4} />
            <span className="font-display text-[34px] leading-[1.15] font-extrabold">{view.word}</span>
          </div>
          <span className="text-[15px] leading-[1.4] font-medium">{sub}</span>
        </div>

        <FieldStrip />
      </header>

      <section aria-label="৫ দিনের পূর্বাভাস" className="stitch mx-4 mt-3.5 grid shrink-0 grid-cols-5 gap-1 rounded-[18px] px-2.5 py-3">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-[3px]">
            <span className="text-[13px] font-semibold">{d.name}</span>
            <DayGlyph risk={d.risk} />
            <span className="text-xs font-bold" style={{ color: d.color }}>
              {d.word}
            </span>
          </div>
        ))}
      </section>

      <nav aria-label="ডেমো: ঝুঁকির অবস্থা বদলান" className="mx-4 mt-2 flex shrink-0 justify-center gap-1.5">
        {[undefined, ...RISKS].map((r) => (
          <Link
            key={r ?? 'live'}
            href={r ? `/?risk=${r}` : '/'}
            scroll={false}
            replace
            aria-current={r === override ? 'true' : undefined}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold no-underline ${
              r === override ? 'bg-ink text-cream' : 'bg-sand text-muted-2'
            }`}
          >
            {r ? DAY_STATE[r].word : 'লাইভ'}
          </Link>
        ))}
      </nav>

      <section className="stitch-lg mx-4 mt-2 flex shrink-0 items-start gap-3.5 rounded-[20px] p-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full"
          style={{ background: view.accentSoft, color: view.accent }}
        >
          <SprayIcon size={32} crossed={view.noSpray} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] font-semibold text-muted">আজকের সিদ্ধান্ত</span>
          <h1 className="m-0 font-display text-[25px] leading-[1.15] font-extrabold">{view.title}</h1>
          <p className="m-0 text-[15px] leading-[1.45]">{view.body}</p>
          <Link href="/map" className="mt-0.5 text-[15px] font-semibold text-teal">
            কেন এই পরামর্শ?
          </Link>
        </div>
      </section>

      <Link
        href="/ledger"
        className="mx-4 mt-2.5 flex min-h-[46px] shrink-0 items-center justify-between rounded-full bg-mist px-3.5 text-[15px] font-semibold text-teal-deep no-underline"
      >
        <span className="flex items-center gap-2">
          <CheckIcon size={20} />
          এই মৌসুমে {toBnDigits(SAVED_COUNT)}টা স্প্রে বাঁচিয়েছেন
        </span>
        <span className="font-display text-lg font-extrabold">{formatTaka(SAVED_TOTAL)}</span>
      </Link>

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2.5 px-4 pb-3.5">
        <PrimaryLink href="/camera" className="h-[70px] gap-3">
          <CameraIcon size={30} weight={2.2} />
          <span className="font-display text-[23px] font-extrabold">পাতার ছবি তুলুন</span>
        </PrimaryLink>
        <button type="button" className={`${outlineClass} h-[58px] gap-2.5 text-lg font-bold`}>
          <MicIcon size={24} weight={2.2} />
          বলে জিজ্ঞেস করুন
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
