'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { toBnDigits } from '@/lib/bn'
import { type CropId, CROP_IDS, CROPS, SEASONS } from '@/lib/crops'
import { DAY_STATE, type Risk } from '@/lib/data'
import { todayIn } from '@/lib/dates'
import { mainField, useChosenSeason, useFields } from '@/lib/fields'
import { chooseUnion } from '@/app/planting/actions'
import { CheckIcon, SyncIcon } from './icons'

export type UnionRisk = { id: string; risk: Risk }
// The upazila on the map: its name and its unions in the map's SVG coordinates.
export type MapArea = { name: string; viewBox: string; unions: { id: string; nameBn: string; label: [number, number]; path: string }[] }
// Officer-confirmed late blight per union id, sent in the last week and month.
export type CaseCounts = Record<Period, Record<string, number>>

type Period = 'week' | 'month'

const PERIODS: Record<Period, { tab: string; caseLabel: string }> = {
  week: { tab: 'এই সপ্তাহ', caseLabel: 'নিশ্চিত কেস, গত ৭ দিনে' },
  month: { tab: 'গত মাস', caseLabel: 'নিশ্চিত কেস, গত ৩০ দিনে' },
}

const ORDER: Risk[] = ['danger', 'watch', 'safe']

function LegendSwatch({ risk }: { risk: Risk }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
      {risk === 'danger' && (
        <>
          <rect width="16" height="16" rx="3" fill="#F2C9BE" />
          <path d="M0 8L8 0M4 16L16 4M10 16L16 10M0 2L2 0" stroke="#C2412D" strokeWidth="2" />
        </>
      )}
      {risk === 'watch' && (
        <>
          <rect width="16" height="16" rx="3" fill="#F7E6AE" />
          {[[4, 4], [12, 4], [4, 12], [12, 12]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="#B07A00" />
          ))}
        </>
      )}
      {risk === 'safe' && <rect width="16" height="16" rx="3" fill="#D6E8D3" />}
    </svg>
  )
}

/** An upazila's unions with today's weather risk at each, officer-confirmed cases, and the farmer's own union. */
export default function MapView({
  area,
  risksByCrop,
  counts,
  mine,
}: {
  area: MapArea
  risksByCrop: Record<CropId, UnionRisk[]> | null
  counts: CaseCounts | null
  mine: string | null
}) {
  const unions = area.unions
  const [period, setPeriod] = useState<Period>('week')
  const fields = useFields()
  const chosen = useChosenSeason()
  const [picked, setPicked] = useState<CropId | null>(null)
  // Open on the crop of the field Home shows, until the farmer picks one here.
  const main = mainField(fields, todayIn(), chosen)
  const crop = picked ?? (main ? SEASONS[main.season].crop : 'potato')
  const risks = risksByCrop?.[crop] ?? null
  const uid = useId().replace(/:/g, '')
  const hatch = `hatch-${uid}`
  const dots = `dots-${uid}`

  const riskOf = (id: string) => risks?.find((r) => r.id === id)?.risk ?? null
  const fillFor = (risk: Risk | null) =>
    risk === 'danger' ? `url(#${hatch})` : risk === 'watch' ? `url(#${dots})` : risk === 'safe' ? '#D6E8D3' : '#E9E1D0'
  // Officers confirm late blight only, until paddy diagnosis sends paddy cases.
  const casesShown = crop === 'potato'
  const caseCount = (id: string) => (casesShown ? (counts?.[period][id] ?? 0) : 0)

  const totalCases = counts && casesShown ? unions.reduce((n, u) => n + caseCount(u.id), 0) : null
  const dangerCount = risks ? risks.filter((r) => r.risk === 'danger').length : null

  const groups = ORDER.flatMap((r) => {
    const names = unions.filter((u) => riskOf(u.id) === r).map((u) => u.nameBn)
    return names.length ? [`${DAY_STATE[r].word}: ${names.join(', ')}`] : []
  })
  const ariaLabel = risks ? `ইউনিয়নভিত্তিক আজকের ঝুঁকির ম্যাপ: ${groups.join('; ')}` : `${area.name} উপজেলার ইউনিয়নের ম্যাপ, ঝুঁকির তথ্য নেই`
  const mineUnion = unions.find((u) => u.id === mine)
  // The union whose sheet is open, from a tap on the map.
  const [open, setOpen] = useState<string | null>(null)
  const openUnion = unions.find((u) => u.id === open)

  return (
    <>
      <div role="group" aria-label="কোন ফসলের ঝুঁকি" className="mx-4 mt-3 flex shrink-0 gap-2">
        {CROP_IDS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === crop}
            onClick={() => setPicked(c)}
            className={`h-11 flex-1 rounded-full border-2 px-3 text-base font-bold ${
              c === crop ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'
            }`}
          >
            {CROPS[c].nameBn} · {CROPS[c].diseaseBn}
          </button>
        ))}
      </div>

      {!risks && (
        <p role="alert" className="mx-4 mt-3 mb-0 shrink-0 rounded-[16px] bg-amber-soft px-4 py-2.5 text-[0.9375rem] leading-[1.4] font-semibold text-[#6B4A00]">
          আবহাওয়ার তথ্য আনা যায়নি — নেট নেই? ঝুঁকির রং দেখানো যাচ্ছে না।
        </p>
      )}

      <div className="stitch mx-4 mt-3 shrink-0 rounded-[20px] p-2.5">
        <svg role="img" aria-label={ariaLabel} viewBox={area.viewBox} className="block h-auto w-full rounded-xl bg-[#F3EEE2]">
          <defs>
            <pattern id={hatch} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#F2C9BE" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#C2412D" strokeWidth="2.4" />
            </pattern>
            <pattern id={dots} width="9" height="9" patternUnits="userSpaceOnUse">
              <rect width="9" height="9" fill="#F7E6AE" />
              <circle cx="4.5" cy="4.5" r="1.6" fill="#B07A00" />
            </pattern>
          </defs>

          {unions.map((u) => (
            <path
              key={u.id}
              d={u.path}
              fill={fillFor(riskOf(u.id))}
              stroke="#7A6852"
              strokeWidth={u.id === mine ? 3 : 1.2}
              strokeDasharray={u.id === mine ? undefined : '4 3'}
              strokeLinejoin="round"
              role="button"
              tabIndex={0}
              aria-label={u.nameBn}
              className="cursor-pointer outline-none focus-visible:stroke-ink"
              onClick={() => setOpen(u.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen(u.id)
                }
              }}
            />
          ))}

          {/* Labels let taps through to the union under them. */}
          <g pointerEvents="none" fontFamily="var(--font-hind), sans-serif" fontSize="11" fontWeight="700" fill="#2B1E16" textAnchor="middle">
            {unions.map((u) => {
              const lines = u.nameBn.split(' ')
              const [x, y] = u.label
              return (
                <text key={u.id} x={x} y={y - (lines.length - 1) * 6} paintOrder="stroke" stroke="#FBF6EC" strokeWidth="3">
                  {lines.map((line, i) => (
                    <tspan key={line} x={x} dy={i === 0 ? 0 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              )
            })}
          </g>

          <g pointerEvents="none" fontFamily="var(--font-baloo), sans-serif" fontSize="12" fontWeight="800" textAnchor="middle">
            {unions.map((u) => {
              const n = caseCount(u.id)
              if (!n) return null
              const [x, y] = u.label
              return (
                <g key={u.id}>
                  <circle cx={x} cy={y + 16} r="10" fill="#2B1E16" />
                  <text x={x} y={y + 20.5} fill="#FFFFFF">
                    {toBnDigits(n)}
                  </text>
                </g>
              )
            })}
          </g>

          {mineUnion && (
            <g pointerEvents="none" fontFamily="var(--font-hind), sans-serif" fontSize="11" fontWeight="700" textAnchor="middle">
              <rect x={mineUnion.label[0] - 22} y={mineUnion.label[1] - 30} width="44" height="18" rx="9" fill="#E8B931" stroke="#2B1E16" strokeWidth="2" />
              <text x={mineUnion.label[0]} y={mineUnion.label[1] - 17.5} fill="#2B1E16">
                আপনি
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mx-[18px] mt-2.5 flex shrink-0 flex-wrap gap-3 text-sm font-semibold">
        <span className="text-muted">
          আজকের {CROPS[crop].diseaseBn} ঝুঁকি{CROPS[crop].experimental ? ' (পরীক্ষামূলক)' : ''}:
        </span>
        {ORDER.map((r) => (
          <span key={r} className="flex items-center gap-[5px]">
            <LegendSwatch risk={r} />
            {DAY_STATE[r].word}
          </span>
        ))}
        <span className="flex items-center gap-[5px]">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
            <circle cx="8" cy="8" r="7" fill="#2B1E16" />
          </svg>
          কর্মকর্তার নিশ্চিত কেস
        </span>
      </div>

      <div className="mx-4 mt-3 grid shrink-0 grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-line bg-paper px-3.5 py-3">
          <span className="font-display text-[1.875rem] leading-[1.1] font-extrabold">{totalCases === null ? '—' : `${toBnDigits(totalCases)}টা`}</span>
          <span className="text-sm leading-[1.35]">
            {!casesShown ? 'ধানের কেস এখনো গোনা হয় না' : totalCases === null ? 'কেসের তথ্য এখন আনা যায়নি' : PERIODS[period].caseLabel}
          </span>
          {/* Only the case count depends on the period; the map's colours are today's forecast. */}
          {casesShown && counts && (
            <div role="group" aria-label="কেস গোনার সময়" className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-sand p-0.5">
              {(Object.keys(PERIODS) as Period[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={t === period}
                  onClick={() => setPeriod(t)}
                  className={`min-h-9 rounded-[10px] border-0 px-1 text-sm ${t === period ? 'bg-paper font-bold text-ink' : 'bg-transparent font-semibold text-muted-2'}`}
                >
                  {PERIODS[t].tab}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-line bg-paper px-3.5 py-3">
          <span className="font-display text-[1.875rem] leading-[1.1] font-extrabold text-danger-deep">
            {dangerCount === null ? '—' : `${toBnDigits(dangerCount)}টা`}
          </span>
          <span className="text-sm leading-[1.35]">ইউনিয়নে আজ বিপদ সংকেত</span>
        </div>
      </div>

      {!mineUnion && (
        <Link
          href="/planting"
          className="mx-4 mt-2.5 flex shrink-0 items-center justify-between gap-2 rounded-[14px] bg-sun-soft px-3.5 py-2 text-base leading-[1.35] font-semibold text-ink no-underline"
        >
          আপনার ইউনিয়ন বেছে নিন, ম্যাপে দেখাব
          <span className="shrink-0 text-teal">বেছে নিন</span>
        </Link>
      )}

      {openUnion && (
        <UnionSheet
          name={openUnion.nameBn}
          id={openUnion.id}
          risk={riskOf(openUnion.id)}
          disease={CROPS[crop].diseaseBn}
          cases={caseCount(openUnion.id)}
          mine={openUnion.id === mine}
          onClose={() => setOpen(null)}
        />
      )}

      <div className="mx-4 mt-2.5 flex shrink-0 items-start gap-2.5 rounded-2xl bg-mist px-3.5 py-2.5 text-teal-deep">
        <SyncIcon size={24} className="mt-0.5 shrink-0" />
        <span className="text-sm leading-[1.4] font-medium">
          রং আসে প্রতিটা ইউনিয়নের আবহাওয়ার পূর্বাভাস থেকে; কাছাকাছি ইউনিয়নে প্রায়ই একই রং হয়। কেস গোনা হয় শুধু কৃষি কর্মকর্তা যাচাই করলে।
        </span>
      </div>
    </>
  )
}

// A tapped union: its name, today's risk, and a way to make it the farmer's own (saved like a tap
// on /planting's list, after which the page shows it as "আপনি").
function UnionSheet({
  name,
  id,
  risk,
  disease,
  cases,
  mine,
  onClose,
}: {
  name: string
  id: string
  risk: Risk | null
  disease: string
  cases: number
  mine: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-[390px] items-end bg-black/45 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="union-sheet-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-2.5 rounded-[20px] bg-cream p-4 text-ink"
      >
        <h2 id="union-sheet-title" className="m-0 font-display text-2xl leading-[1.2] font-extrabold">
          {name}
        </h2>
        <p className="m-0 flex items-center gap-2 text-base font-semibold">
          {risk ? (
            <>
              <LegendSwatch risk={risk} />
              আজ {disease} ঝুঁকি: <span style={{ color: DAY_STATE[risk].color }}>{DAY_STATE[risk].word}</span>
            </>
          ) : (
            'আজকের ঝুঁকি জানা যায়নি'
          )}
        </p>
        {cases > 0 && <p className="m-0 text-[0.9375rem]">কর্মকর্তার নিশ্চিত কেস: {toBnDigits(cases)}টা</p>}
        {mine ? (
          <p className="m-0 flex items-center gap-1.5 text-base font-bold text-leaf">
            <CheckIcon size={20} weight={2.6} />
            এটাই আপনার ইউনিয়ন
          </p>
        ) : (
          <form action={chooseUnion}>
            <button type="submit" name="union" value={id} className="h-12 w-full rounded-full border-0 bg-sun text-base font-bold text-ink">
              এটা আমার ইউনিয়ন
            </button>
          </form>
        )}
        <button type="button" autoFocus onClick={onClose} className="h-12 rounded-full border-2 border-ink bg-transparent text-base font-bold text-ink">
          বন্ধ করুন
        </button>
      </div>
    </div>
  )
}
