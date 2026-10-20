'use client'

import { useEffect } from 'react'
import { syncCases } from '@/lib/shareCase'

/** Uploads cases that were sent offline or signed out, when the app opens and whenever the phone comes back online. */
export default function CaseSync() {
  useEffect(() => {
    const sync = () => {
      if (navigator.onLine) syncCases().catch((err) => console.error('Case sync failed', err))
    }
    sync()
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [])
  return null
}
