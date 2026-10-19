'use client'

// Pieces shared by the three diagnosis result screens.
import Link from 'next/link'
import { primaryClass } from '@/components/Buttons'
import { PhotoChip } from '@/components/CapturedThumb'
import { CameraIcon, ChatCheckIcon, MistCloudIcon, SearchIcon } from '@/components/icons'
import TopBar from '@/components/TopBar'
import type { DiagnosisRecord } from '@/lib/captureStore'
import type { DiagnosisConfig } from '@/lib/diagnosis/config'
import { photoLine, riskLine } from '@/lib/diagnosis/explain'
import { useTodayRisk } from '@/lib/diagnosis/useDiagnosis'

/** Honest about where the model was checked. */
export function ValidationBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-1.5 self-start rounded-lg bg-sand px-2.5 py-1 text-[12px] font-semibold text-muted ${className}`}>
      <SearchIcon size={14} weight={2.2} />
      পরীক্ষামূলক: ইন্দোনেশিয়ার মাঠের ছবিতে যাচাই করা
    </span>
  )
}

type Row = { icon: React.ReactNode; text: string }

/** "কেন মনে হলো?" from real inputs only: the photos, today's weather risk, and the farmer's answers. */
export function WhyCard({
  record,
  config,
  answers = [],
  title = 'কেন মনে হলো?',
  photos = true,
}: {
  record: DiagnosisRecord
  config: DiagnosisConfig
  answers?: string[]
  title?: string
  photos?: boolean
}) {
  const risk = useTodayRisk()
  const rows: Row[] = [
    { icon: <PhotoChip enabled={photos} />, text: photoLine(record.result, config) },
    {
      icon: (
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-mist text-teal">
          <MistCloudIcon size={26} />
        </span>
      ),
      text: risk ? riskLine(risk) : 'আজকের আবহাওয়া দেখছি…',
    },
    ...answers.map((text) => ({
      icon: (
        <span className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-sun-soft text-amber">
          <ChatCheckIcon size={26} />
        </span>
      ),
      text,
    })),
  ]
  return (
    <section className="stitch-lg mx-4 mt-3.5 flex shrink-0 flex-col gap-2.5 rounded-[20px] px-4 py-3.5">
      <h2 className="m-0 font-display text-lg font-bold">{title}</h2>
      {rows.map((r) => (
        <div key={r.text} className="flex items-center gap-3">
          {r.icon}
          <span className="text-[15px] leading-[1.4]" aria-live={r.text.includes('আবহাওয়া') ? 'polite' : undefined}>
            {r.text}
          </span>
        </div>
      ))}
    </section>
  )
}

/** Shown when no photos have been diagnosed yet. */
export function NoDiagnosis() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="ফলাফল" right={<span className="size-11" />} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="font-display text-[26px] font-extrabold">এখনো কোনো ছবি দেখা হয়নি</span>
        <span className="text-base leading-[1.45] text-muted">পাতার উপরের আর নিচের দিকের ছবি তুললে ফলাফল এখানে দেখাব।</span>
        <Link href="/camera" className={`${primaryClass} min-h-[64px] w-full gap-2.5 font-display text-xl font-extrabold`}>
          <CameraIcon size={26} weight={2.2} />
          পাতার ছবি তুলুন
        </Link>
      </div>
    </div>
  )
}

export function Loading() {
  return <div className="flex flex-1 items-center justify-center text-muted" aria-busy="true" />
}
