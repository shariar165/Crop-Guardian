'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BN_MONTHS, bnDate, toBnDigits } from '@/lib/bn'
import { todayIn } from '@/lib/dates'
import { savePlantingDate, usePlantingDate } from '@/lib/plantingDate'
import { seasonFor } from '@/lib/season'
import { outlineClass, primaryClass } from './Buttons'

const pad = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const SELECT = 'h-14 w-full rounded-[14px] border-2 border-line bg-paper px-3 text-lg font-semibold text-ink'

export default function PlantingPicker({ back }: { back: string }) {
  const stored = usePlantingDate()
  // Remount once the stored date is read on the client, so the form starts from it.
  return <PickerForm key={stored ?? 'unset'} stored={stored} back={back} />
}

function PickerForm({ stored, back }: { stored: string | null; back: string }) {
  const router = useRouter()
  const today = todayIn()
  const [date, setDate] = useState(stored ?? today)
  const [error, setError] = useState<string | null>(null)

  const [year, month, day] = date.split('-').map(Number)
  const thisYear = Number(today.slice(0, 4))
  const future = date > today
  const season = seasonFor(today, date)

  // Keep the day valid when the month or year changes (31 Jan → Feb).
  function change(y: number, m: number, d: number) {
    setDate(`${y}-${pad(m)}-${pad(Math.min(d, daysInMonth(y, m)))}`)
    setError(null)
  }

  function save(value: string | null) {
    if (savePlantingDate(value)) router.push(back)
    else setError('এই ফোনে তারিখ রাখা গেল না।')
  }

  return (
    <div className="mt-3 flex shrink-0 flex-col gap-4 px-4">
      <p className="m-0 text-[15px] leading-[1.45]">
        আলু কবে লাগিয়েছেন? তারিখ দিলে চারা গজানো থেকে ফসল তোলা পর্যন্ত ঠিক সময়ে ঝুঁকির খবর পাবেন, আর মৌসুমের হিসাব শুরু হবে।
      </p>

      <div className="grid grid-cols-[1fr_1.6fr_1.3fr] gap-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
          দিন
          <select className={SELECT} value={day} onChange={(e) => change(year, month, Number(e.target.value))}>
            {Array.from({ length: daysInMonth(year, month) }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {toBnDigits(i + 1)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
          মাস
          <select className={SELECT} value={month} onChange={(e) => change(year, Number(e.target.value), day)}>
            {BN_MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
          বছর
          <select className={SELECT} value={year} onChange={(e) => change(Number(e.target.value), month, day)}>
            {[thisYear - 1, thisYear].map((y) => (
              <option key={y} value={y}>
                {toBnDigits(y)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p role="status" className="stitch m-0 rounded-[16px] px-4 py-3 text-[15px] leading-[1.45]">
        {future ? (
          <span className="font-semibold text-danger">ভবিষ্যতের তারিখ দেওয়া যাবে না।</span>
        ) : (
          <>
            রোপণ: <b>{bnDate(date)}</b>
            <br />
            ঝুঁকির খবর পাবেন: {bnDate(season.start)} থেকে {bnDate(season.end)}
          </>
        )}
      </p>

      {error && (
        <p role="alert" className="m-0 text-[15px] font-semibold text-danger">
          {error}
        </p>
      )}

      <button type="button" disabled={future} onClick={() => save(date)} className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold disabled:opacity-50`}>
        তারিখ রাখুন
      </button>
      {stored && (
        <button type="button" onClick={() => save(null)} className={`${outlineClass} h-[52px] text-base font-bold`}>
          তারিখ মুছে ফেলুন
        </button>
      )}
    </div>
  )
}
