'use client'

import { useState, useSyncExternalStore } from 'react'

// Chrome's install prompt, which it offers once per page load, often before this component mounts,
// so it is caught at module load and kept here.
type InstallPrompt = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallPrompt | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallPrompt
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    notify()
  })
}

type Mode = 'none' | 'prompt' | 'ios'

function currentMode(): Mode {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (installed || standalone) return 'none'
  if (deferred) return 'prompt'
  // Safari on iPhone and iPad has no install prompt, only Share → Add to Home Screen.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'ios' : 'none'
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * "ফোনে অ্যাপ হিসেবে রাখুন": installs the app where the browser offers it (Chrome on Android), shows
 * Share → Add to Home Screen on an iPhone, and hides itself once installed or where neither applies.
 */
export default function InstallButton({ className = '' }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, currentMode, () => 'none' as Mode)
  const [busy, setBusy] = useState(false)

  if (mode === 'none') return null
  if (mode === 'ios') {
    return (
      <p className={`m-0 rounded-[14px] bg-mist px-3.5 py-2.5 text-[0.9375rem] leading-[1.45] text-teal-deep ${className}`}>
        ফোনে অ্যাপ হিসেবে রাখতে: Safari-র নিচে শেয়ার বোতাম (□↑) চাপুন, তারপর «Add to Home Screen»।
      </p>
    )
  }

  async function install() {
    const prompt = deferred
    if (!prompt) return
    setBusy(true)
    await prompt.prompt()
    await prompt.userChoice.catch(() => null)
    // A prompt can only be used once; Chrome offers a new one later if the farmer said no.
    deferred = null
    setBusy(false)
    notify()
  }

  return (
    <button
      type="button"
      onClick={install}
      disabled={busy}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-[16px] border-2 border-teal bg-paper px-4 text-base font-bold text-teal disabled:opacity-60 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M12 7.5v7M9 11.5l3 3 3-3" />
      </svg>
      ফোনে অ্যাপ হিসেবে রাখুন
    </button>
  )
}
