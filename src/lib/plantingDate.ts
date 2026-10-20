// The farmer's planting date, kept on the device in localStorage. Client-only.
import { isIsoDate } from '@/lib/dates'
import { store, useStored } from '@/lib/deviceStore'

const KEY = 'crop-guardian:planting-date'

// null while unset, and during server rendering and hydration.
export function usePlantingDate(): string | null {
  const value = useStored(KEY)
  return value && isIsoDate(value) ? value : null
}

// Saves (or with null, clears) the date. Returns false if the device would not store it.
export function savePlantingDate(date: string | null): boolean {
  return store(KEY, date)
}
