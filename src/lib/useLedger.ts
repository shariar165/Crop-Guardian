'use client'

import { useEffect, useState } from 'react'
import { SEASONS } from '@/lib/crops'
import { addDays, todayIn } from '@/lib/dates'
import { useHydrated } from '@/lib/deviceStore'
import type { Field } from '@/lib/fields'
import { buildLedger, type Ledger, ledgerSpan } from '@/lib/ledger'
import type { StripDay } from '@/lib/risk'
import { useSprayCost, useSprays } from '@/lib/sprayLog'

export type LedgerState =
  | { status: 'loading' }
  | { status: 'noPlanting' }
  // Planted, but the crop hasn't emerged: the ledger starts on `from`.
  | { status: 'notYet'; planting: string; from: string }
  | { status: 'error'; planting: string }
  | { status: 'ready'; planting: string; ledger: Ledger; cost: number; sprays: string[] }

type Weather = { key: string; days: StripDay[] } | { key: string; error: true }

// The season ledger of one field (see fields.ts): its sprays, and the weather since emergence
// judged by its crop's rule.
export function useLedger(field: Field | null): LedgerState {
  const hydrated = useHydrated()
  const sprays = useSprays(field?.season ?? 'potato')
  const cost = useSprayCost()
  const today = todayIn()
  const span = field ? ledgerSpan(field.planted, today, field.season) : null
  const crop = field ? SEASONS[field.season].crop : null
  const key = span && crop ? `${crop}:${span.from}` : null
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    if (!key) return
    const [cropId, from] = key.split(':')
    let cancelled = false
    fetch(`/api/risk/season?from=${from}&crop=${cropId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(
        (body: { days: StripDay[] }) => {
          if (!cancelled) setWeather({ key, days: body.days })
        },
        (err) => {
          console.error('Season weather unavailable', err)
          if (!cancelled) setWeather({ key, error: true })
        },
      )
    return () => {
      cancelled = true
    }
  }, [key])

  // The fields are only readable on the device, after hydration.
  if (!hydrated) return { status: 'loading' }
  if (!field) return { status: 'noPlanting' }
  const planting = field.planted
  if (!span) return { status: 'notYet', planting, from: addDays(planting, SEASONS[field.season].startDays) }
  if (!weather || weather.key !== key) return { status: 'loading' }
  if ('error' in weather) return { status: 'error', planting }
  return {
    status: 'ready',
    planting,
    cost,
    sprays,
    ledger: buildLedger({ planting, today, days: weather.days, sprays, cost, season: field.season }),
  }
}
