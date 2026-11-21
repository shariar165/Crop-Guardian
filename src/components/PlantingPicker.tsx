'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { syncAlertFields } from '@/app/account/actions'
import { BN_MONTHS, bnDate, bnDayMonth, toBnDigits } from '@/lib/bn'
import { type CropId, CROPS, isSeasonId, paddySeasonFor, SEASONS, type SeasonId } from '@/lib/crops'
import { todayIn } from '@/lib/dates'
import { useHydrated } from '@/lib/deviceStore'
import { type Field, readFields, saveField, useFields } from '@/lib/fields'
import { plantingChips } from '@/lib/plantingChips'
import { seasonFor } from '@/lib/season'
import { primaryClass } from './Buttons'

const pad = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

const SELECT = 'h-14 w-full rounded-[14px] border-2 border-line bg-paper px-3 text-lg font-semibold text-ink'

// The farmer's fields (one per season) and a form to add, change or remove one. `start` picks the
// season the form opens on (e.g. ?season=boro from the ledger).
export default function PlantingPicker({ back, start }: { back: string; start: string | null }) {
  const hydrated = useHydrated()
  const fields = useFields()
  const [season, setSeason] = useState<SeasonId | null>(isSeasonId(start) ? start : null)
  // Until the farmer picks, open on the first field they have, else potato.
  const current: SeasonId = season ?? fields[0]?.season ?? 'potato'
  const field = fields.find((f) => f.season === current) ?? null
  if (!hydrated) return null

  return (
    <div className="mt-3 flex shrink-0 flex-col gap-4 px-4">
      {fields.length > 0 && <FieldList fields={fields} onPick={setSeason} />}
      <CropChoice season={current} onChange={setSeason} />
      {/* Remount per season and saved date, so the form starts from that field's date. */}
      <DateForm key={`${current}:${field?.planted ?? 'new'}`} season={current} field={field} back={back} />
    </div>
  )
}

function FieldList({ fields, onPick }: { fields: Field[]; onPick: (s: SeasonId) => void }) {
  const today = todayIn()
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {fields.map((f) => {
        const s = seasonFor(today, f.planted, f.season)
        return (
          <li key={f.season}>
            <button
              type="button"
              onClick={() => onPick(f.season)}
              className="stitch flex w-full items-center justify-between gap-2 rounded-[16px] bg-paper px-4 py-3 text-left text-ink"
            >
              <span className="flex flex-col">
                <span className="text-base font-bold">
                  {SEASONS[f.season].nameBn} · রোপণ {bnDate(f.planted)}
                </span>
                <span className="text-[13px] text-muted">
                  ঝুঁকির খবর: {bnDate(s.start)} থেকে {bnDate(s.end)}
                </span>
              </span>
              <span className="shrink-0 text-[15px] font-semibold text-teal">বদলান</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Toggle({ options, value, onChange, label }: { options: [string, string][]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-2">
      {options.map(([id, name]) => (
        <button
          key={id}
          type="button"
          aria-pressed={id === value}
          onClick={() => onChange(id)}
          className={`h-12 rounded-[14px] border-2 text-lg font-bold ${id === value ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'}`}
        >
          {name}
        </button>
      ))}
    </div>
  )
}

function CropChoice({ season, onChange }: { season: SeasonId; onChange: (s: SeasonId) => void }) {
  const crop = SEASONS[season].crop
  const crops: [CropId, string][] = [
    ['potato', CROPS.potato.nameBn],
    ['paddy', CROPS.paddy.nameBn],
  ]
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-muted">কোন ফসল?</span>
      <Toggle
        label="ফসল"
        options={crops}
        value={crop}
        onChange={(c) => onChange(c === 'paddy' ? paddySeasonFor(todayIn()) : 'potato')}
      />
      {crop === 'paddy' && (
        <Toggle
          label="ধানের মৌসুম"
          options={[
            ['boro', 'বোরো'],
            ['aman', 'আমন'],
          ]}
          value={season}
          onChange={(s) => onChange(s as SeasonId)}
        />
      )}
    </div>
  )
}

function DateForm({ season, field, back }: { season: SeasonId; field: Field | null; back: string }) {
  const router = useRouter()
  const today = todayIn()
  const crop = CROPS[SEASONS[season].crop]
  const [date, setDate] = useState(field?.planted ?? today)
  const [error, setError] = useState<string | null>(null)
  const chips = plantingChips(today, season)
  // The dropdowns open for "অন্য তারিখ", or for a saved date no chip matches.
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [custom, setCustom] = useState(field !== null && !chips.some((c) => c.date === field.planted))

  const [year, month, day] = date.split('-').map(Number)
  const thisYear = Number(today.slice(0, 4))
  const future = date > today

  // Keep the day valid when the month or year changes (31 Jan → Feb).
  function change(y: number, m: number, d: number) {
    setDate(`${y}-${pad(m)}-${pad(Math.min(d, daysInMonth(y, m)))}`)
    setError(null)
  }

  function save(value: string | null) {
    if (!saveField(season, value)) {
      setError('এই ফোনে তারিখ রাখা গেল না।')
      return
    }
    // SMS alerts follow the crops in the field. Offline or signed out, the phone's copy is enough.
    syncAlertFields(readFields()).catch(() => {})
    router.push(back)
  }

  return (
    <>
      <p className="m-0 text-[15px] leading-[1.45]">
        {crop.plantedQuestion} তারিখ দিলে চারা থেকে ফসল তোলা পর্যন্ত ঠিক সময়ে {crop.diseaseBn} রোগের ঝুঁকির খবর পাবেন, আর মৌসুমের হিসাব শুরু হবে।
      </p>

      <div role="group" aria-label="কবে লাগিয়েছেন" className="grid grid-cols-3 gap-2">
        {chips.map((c) => {
          const on = !custom && c.date === date
          return (
            <button
              key={c.label}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setCustom(false)
                setDate(c.date)
                setError(null)
              }}
              className={`flex min-h-[60px] flex-col items-center justify-center rounded-[14px] border-2 px-1 leading-[1.25] ${
                on ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'
              }`}
            >
              <span className="text-base font-bold">{c.label}</span>
              <span className={`text-sm ${on ? 'text-cream/80' : 'text-muted'}`}>{bnDayMonth(c.date)}</span>
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setCustom(true)}
          className={`min-h-[60px] rounded-[14px] border-2 px-1 text-base leading-[1.25] font-bold ${custom ? 'border-ink bg-ink text-cream' : 'border-line bg-paper text-ink'}`}
        >
          অন্য তারিখ
        </button>
      </div>

      {custom && (
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
      )}

      {/* Only the dropdowns can reach a future date; the chips show their dates themselves. */}
      {future && (
        <p role="alert" className="m-0 text-[15px] font-semibold text-danger">
          ভবিষ্যতের তারিখ দেওয়া যাবে না।
        </p>
      )}

      {error && (
        <p role="alert" className="m-0 text-[15px] font-semibold text-danger">
          {error}
        </p>
      )}

      <button type="button" disabled={future} onClick={() => save(date)} className={`${primaryClass} h-[64px] font-display text-[22px] font-extrabold disabled:opacity-50`}>
        তারিখ রাখুন
      </button>
      {field &&
        // Deleting loses the field's date and its ledger, so it asks once, in place.
        (confirmDelete ? (
          <div role="alertdialog" aria-labelledby="delete-q" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-1">
            <span id="delete-q" className="text-base font-bold">
              মুছে ফেলবেন?
            </span>
            <button type="button" onClick={() => save(null)} className="min-h-11 rounded-full border-0 bg-danger px-4 text-base font-bold text-white">
              হ্যাঁ, মুছুন
            </button>
            <button type="button" autoFocus onClick={() => setConfirmDelete(false)} className="min-h-11 rounded-full border-2 border-ink bg-transparent px-5 text-base font-bold text-ink">
              না
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 self-center border-0 bg-transparent px-2 text-base font-bold text-danger underline">
            এই জমি মুছে ফেলুন
          </button>
        ))}
    </>
  )
}
