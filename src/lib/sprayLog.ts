// The sprays the farmer logs ("আজ স্প্রে করেছি") and their cost per spray, kept on the device.
import { useMemo } from 'react'
import { SPRAY_COST } from '@/lib/data'
import { isIsoDate } from '@/lib/dates'
import { store, useStored } from '@/lib/deviceStore'

const SPRAYS_KEY = 'crop-guardian:sprays'
const COST_KEY = 'crop-guardian:spray-cost'
export const MAX_SPRAY_COST = 100_000

export function parseSprays(raw: string | null): string[] {
  try {
    const list: unknown = JSON.parse(raw ?? '[]')
    return Array.isArray(list) ? [...new Set(list.filter((d): d is string => typeof d === 'string' && isIsoDate(d)))].sort() : []
  } catch {
    return []
  }
}

export function parseCost(raw: string | null): number {
  const n = Number(raw)
  return raw !== null && Number.isInteger(n) && n > 0 && n <= MAX_SPRAY_COST ? n : SPRAY_COST
}

export function useSprays(): string[] {
  const raw = useStored(SPRAYS_KEY)
  return useMemo(() => parseSprays(raw), [raw])
}

function readSprays(): string[] {
  try {
    return parseSprays(localStorage.getItem(SPRAYS_KEY))
  } catch {
    return []
  }
}

export function addSpray(date: string): boolean {
  return store(SPRAYS_KEY, JSON.stringify(parseSprays(JSON.stringify([...readSprays(), date]))))
}

export function removeSpray(date: string): boolean {
  return store(SPRAYS_KEY, JSON.stringify(readSprays().filter((d) => d !== date)))
}

export function useSprayCost(): number {
  return parseCost(useStored(COST_KEY))
}

export function saveSprayCost(cost: number): boolean {
  return store(COST_KEY, String(cost))
}
