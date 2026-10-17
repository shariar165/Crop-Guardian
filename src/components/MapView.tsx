'use client'

import { useId, useState } from 'react'
import { toBnDigits } from '@/lib/bn'
import { DAY_STATE, MAP_DATA, type MapPeriod, type Risk } from '@/lib/data'
import { SyncIcon } from './icons'

// Geometry for each union, in the same order as MAP_DATA unions.
const ZONES: { points: string; label: [number, number][]; split: boolean; badge: [number, number] }[] = [
  { points: '6,6 142,6 152,100 84,128 6,110', label: [[20, 34]], split: false, badge: [70, 72] },
  { points: '142,6 332,6 332,92 236,120 152,100', label: [[200, 34]], split: false, badge: [244, 62] },
  { points: '84,128 152,100 236,120 226,192 112,202', label: [[112, 140]], split: false, badge: [200, 168] },
  { points: '236,120 332,92 332,220 226,192', label: [[252, 150], [252, 166]], split: true, badge: [300, 190] },
  { points: '6,110 84,128 112,202 94,294 6,294', label: [[16, 230], [16, 246]], split: true, badge: [58, 272] },
  { points: '112,202 226,192 332,220 332,294 94,294', label: [[190, 262]], split: false, badge: [262, 232] },
]

const TABS: MapPeriod[] = ['week', 'month']

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

export default function MapView() {
  const [period, setPeriod] = useState<MapPeriod>('week')
  const uid = useId().replace(/:/g, '')
  const hatch = `hatch-${uid}`
  const dots = `dots-${uid}`
  const data = MAP_DATA[period]

  const fillFor = (risk: Risk) => (risk === 'danger' ? `url(#${hatch})` : risk === 'watch' ? `url(#${dots})` : '#D6E8D3')

  const totalCases = data.unions.reduce((n, u) => n + u.cases, 0)
  const dangerCount = data.unions.filter((u) => u.risk === 'danger').length

  const groups = (['danger', 'watch', 'safe'] as Risk[])
    .map((r) => {
      const names = data.unions.filter((u) => u.risk === r).map((u) => u.name)
      return names.length ? `${DAY_STATE[r].word}: ${names.join(' ও ')}` : ''
    })
    .filter(Boolean)
  const ariaLabel = `ইউনিয়নভিত্তিক ঝুঁকির ম্যাপ: ${groups.join(', ')}`

  return (
    <>
      <div role="tablist" aria-label="সময়" className="mx-4 mt-3 grid shrink-0 grid-cols-2 gap-1 rounded-2xl bg-sand p-1">
        {TABS.map((t) => {
          const selected = t === period
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setPeriod(t)}
              className={`h-10 rounded-xl border-0 text-[15px] ${
                selected ? 'bg-paper font-bold text-ink' : 'bg-transparent font-semibold text-muted-2'
              }`}
            >
              {MAP_DATA[t].label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="stitch mx-4 mt-3 shrink-0 rounded-[20px] p-2.5">
        <svg role="img" aria-label={ariaLabel} viewBox="0 0 338 300" className="block h-auto w-full rounded-xl bg-[#F3EEE2]">
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

          {ZONES.map((z, i) => (
            <polygon key={z.points} points={z.points} fill={fillFor(data.unions[i].risk)} />
          ))}

          <g fill="none" stroke="#7A6852" strokeWidth="1.6" strokeDasharray="5 4">
            <polyline points="142,6 152,100 84,128 6,110" />
            <polyline points="152,100 236,120 332,92" />
            <polyline points="84,128 112,202 226,192 236,120" />
            <polyline points="226,192 332,220" />
            <polyline points="112,202 94,294" />
          </g>

          {/* river */}
          <path
            d="M332 40 C 280 70 300 140 250 170 C 200 200 190 250 120 270 C 80 282 40 270 6 286"
            fill="none"
            stroke="#1F5F6B"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.75"
          />

          <g fontFamily="var(--font-hind), sans-serif" fontSize="13" fontWeight="700" fill="#2B1E16">
            {ZONES.map((z, i) => {
              const u = data.unions[i]
              const word = DAY_STATE[u.risk].word
              return z.split ? (
                <g key={u.name}>
                  <text x={z.label[0][0]} y={z.label[0][1]}>{u.name}</text>
                  <text x={z.label[1][0]} y={z.label[1][1]}>{word}</text>
                </g>
              ) : (
                <text key={u.name} x={z.label[0][0]} y={z.label[0][1]}>
                  {u.name} · {word}
                </text>
              )
            })}
          </g>

          <g fontFamily="var(--font-baloo), sans-serif" fontSize="13" fontWeight="800" textAnchor="middle">
            {ZONES.map((z, i) => {
              const u = data.unions[i]
              if (!u.cases) return null
              const [cx, cy] = z.badge
              return (
                <g key={u.name}>
                  <circle cx={cx} cy={cy} r="13" fill="#2B1E16" />
                  <text x={cx} y={cy + 5} fill="#FFFFFF">
                    {toBnDigits(u.cases)}
                  </text>
                </g>
              )
            })}
          </g>

          {/* farmer's own location */}
          <circle cx="150" cy="170" r="10" fill="#E8B931" stroke="#2B1E16" strokeWidth="3.5" />
          <rect x="118" y="184" width="64" height="22" rx="11" fill="#2B1E16" />
          <text x="150" y="199.5" fontFamily="var(--font-hind), sans-serif" fontSize="13" fontWeight="700" fill="#FBF6EC" textAnchor="middle">
            আপনি
          </text>
        </svg>
      </div>

      <div className="mx-[18px] mt-2.5 flex shrink-0 flex-wrap gap-3 text-[13px] font-semibold">
        {(['danger', 'watch', 'safe'] as Risk[]).map((r) => (
          <span key={r} className="flex items-center gap-[5px]">
            <LegendSwatch risk={r} />
            {DAY_STATE[r].word}
          </span>
        ))}
        <span className="flex items-center gap-[5px]">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
            <circle cx="8" cy="8" r="7" fill="#2B1E16" />
          </svg>
          নিশ্চিত কেস
        </span>
      </div>

      <div className="mx-4 mt-3 grid shrink-0 grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-line bg-paper px-3.5 py-3">
          <span className="font-display text-[30px] leading-[1.1] font-extrabold">{toBnDigits(totalCases)}টা</span>
          <span className="text-sm leading-[1.35]">{data.caseLabel}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[18px] border-[1.5px] border-line bg-paper px-3.5 py-3">
          <span className="font-display text-[30px] leading-[1.1] font-extrabold text-danger-deep">{toBnDigits(dangerCount)}টা</span>
          <span className="text-sm leading-[1.35]">ইউনিয়নে বিপদ সংকেত</span>
        </div>
      </div>

      <div className="mx-4 mt-2.5 flex shrink-0 items-center gap-2.5 rounded-2xl bg-mist px-3.5 py-2.5 text-teal-deep">
        <SyncIcon size={24} />
        <span className="text-sm leading-[1.4] font-medium">আপনাদের যাচাই করা ছবিই এই ম্যাপ আর পূর্বাভাসকে আরও নির্ভুল করে</span>
      </div>
    </>
  )
}
