// Small values kept on the device in localStorage, readable as React state. Client-only.
import { useSyncExternalStore } from 'react'

// `storage` only fires in other tabs, so this tab announces its own changes.
const CHANGE_EVENT = 'crop-guardian:store-change'

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null // storage blocked (e.g. some private modes)
  }
}

// The raw string (stable between renders, as useSyncExternalStore needs); null while unset,
// and during server rendering and hydration.
export function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  )
}

// Saves (or with null, clears) the value. Returns false if the device would not store it.
export function store(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    return false
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return true
}

// Whether this device has been seen before; false on the server and during hydration.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
