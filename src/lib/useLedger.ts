'use client'

import { useEffect, useState } from 'react'
import { addDays, todayIn } from '@/lib/dates'
import { useHydrated } from '@/lib/deviceStore'
import { buildLedger, type Ledger, ledgerSpan } from '@/lib/ledger'
import { usePlantingDate } from '@/lib/plantingDate'
import type { StripDay } from '@/lib/risk'
import { EMERGENCE_DAYS } from '@/lib/season'
import { useSprayCost, useSprays } from '@/lib/sprayLog'

export type LedgerState =
  | { status: 'loading' }
  | { status: 'noPlanting' }
  // Planted, but the crop hasn't emerged: the ledger starts on `from`.
  | { status: 'notYet'; planting: string; from: string }
  | { status: 'error'; planting: string }
  | { status: 'ready'; planting: string; ledger: Ledger; cost: number; sprays: string[] }

type Weather = { from: string; days: StripDay[] } | { from: string; error: true }

// The season ledger from this device's planting date and sprays, and the weather since emergence.
export function useLedger(): LedgerState {
  const hydrated = useHydrated()
  const planting = usePlantingDate()
  const sprays = useSprays()
  const cost = useSprayCost()
  const today = todayIn()
  const span = planting ? ledgerSpan(planting, today) : null
  const from = span?.from ?? null
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    if (!from) return
    let cancelled = false
    fetch(`/api/risk/season?from=${from}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(
        (body: { days: StripDay[] }) => {
          if (!cancelled) setWeather({ from, days: body.days })
        },
        (err) => {
          console.error('Season weather unavailable', err)
          if (!cancelled) setWeather({ from, error: true })
        },
      )
    return () => {
      cancelled = true
    }
  }, [from])

  // The planting date is only readable on the device, after hydration.
  if (!hydrated) return { status: 'loading' }
  if (!planting) return { status: 'noPlanting' }
  if (!span) return { status: 'notYet', planting, from: addDays(planting, EMERGENCE_DAYS) }
  if (!weather || weather.from !== span.from) return { status: 'loading' }
  if ('error' in weather) return { status: 'error', planting }
  return { status: 'ready', planting, cost, sprays, ledger: buildLedger({ planting, today, days: weather.days, sprays, cost }) }
}
