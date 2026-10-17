// The farmer's planting date, kept on the device in localStorage. Client-only.
import { useSyncExternalStore } from 'react'
import { isIsoDate } from '@/lib/dates'

const KEY = 'crop-guardian:planting-date'
// `storage` only fires in other tabs, so this tab announces its own changes.
const CHANGE_EVENT = 'crop-guardian:planting-date-change'

function read(): string | null {
  try {
    const value = localStorage.getItem(KEY)
    return value && isIsoDate(value) ? value : null
  } catch {
    return null // storage blocked (e.g. some private modes)
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

// null while unset, and during server rendering and hydration.
export function usePlantingDate(): string | null {
  return useSyncExternalStore(subscribe, read, () => null)
}

// Saves (or with null, clears) the date. Returns false if the device would not store it.
export function savePlantingDate(date: string | null): boolean {
  try {
    if (date) localStorage.setItem(KEY, date)
    else localStorage.removeItem(KEY)
  } catch {
    return false
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return true
}
