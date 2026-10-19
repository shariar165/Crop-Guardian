'use client'

import { useEffect } from 'react'

/** Registers public/sw.js, which keeps the diagnosis screens working offline. Production only, so it never serves stale dev builds. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch((err) => {
      console.error('Service worker registration failed', err)
    })
  }, [])
  return null
}
