'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { authClient } from '@/lib/auth/client'
import { outlineClass } from './Buttons'

export default function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    const { error } = await authClient.signOut().catch((err) => ({ error: err }))
    if (error) {
      console.error('Sign-out failed', error)
      setBusy(false)
      return
    }
    router.replace('/')
    router.refresh()
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} aria-busy={busy} className={`${outlineClass} h-[52px] text-base font-bold disabled:opacity-50`}>
      {busy ? 'বের হচ্ছি…' : 'বের হন'}
    </button>
  )
}
