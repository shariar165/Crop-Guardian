'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { setAlerts } from '@/app/account/actions'
import { readFields } from '@/lib/fields'
import { tealClass, outlineClass } from './Buttons'

// The farmer's SMS risk alerts on /account. Turning them on sends the phone's fields along, so
// only crops in the field are alerted. They need a union, chosen on /planting.
export default function AlertToggle({ enabled, place }: { enabled: boolean; place: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    const ok = await setAlerts(!enabled, readFields()).catch(() => null)
    setBusy(false)
    if (ok) router.refresh()
    else setError(ok === false ? 'আগে আপনার ইউনিয়ন বেছে নিন।' : 'নেট নেই, পরে আবার চেষ্টা করুন।')
  }

  return (
    <section className="stitch-lg flex flex-col gap-2 rounded-[20px] p-4">
      <h2 className="m-0 text-lg font-bold">SMS-এ ঝুঁকির খবর</h2>
      <p className="m-0 text-[15px] leading-[1.45]">
        {enabled
          ? `চালু আছে। ${place ?? 'আপনার'} এলাকায় রোগের বিপদ এলে আগের দিন বিকেলে SMS পাবেন।`
          : 'বিপদের আগের দিন বিকেলে আপনার ফোনে SMS যাবে। অ্যাপ না খুললেও জানবেন।'}
      </p>
      {place === null && !enabled ? (
        <Link href="/planting?from=account" className="text-[15px] font-bold text-teal">
          আগে ইউনিয়ন বেছে নিন →
        </Link>
      ) : (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-busy={busy}
          className={`${enabled ? outlineClass : tealClass} h-[52px] text-base font-bold disabled:opacity-50`}
        >
          {busy ? 'একটু দাঁড়ান…' : enabled ? 'SMS বন্ধ করুন' : 'SMS চালু করুন'}
        </button>
      )}
      {error && (
        <p role="alert" className="m-0 text-[15px] font-semibold text-danger">
          {error}
        </p>
      )}
    </section>
  )
}
