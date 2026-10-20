'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { CheckIcon } from '@/components/icons'
import type { DiagnosisRecord } from '@/lib/captureStore'
import type { DiagnosisConfig } from '@/lib/diagnosis/config'
import { todayIn } from '@/lib/dates'
import { shareCase, type UploadOutcome } from '@/lib/shareCase'

const UPLOAD_NOTE: Record<Exclude<UploadOutcome, 'signedOut'>, string> = {
  uploaded: 'কর্মকর্তার তালিকাতেও গেছে',
  failed: 'নেট এলে কর্মকর্তার তালিকায় যাবে',
}

/** Shares the leaf photos and a short summary with the agriculture officer, and uploads the case. */
export default function OfficerShareButton({
  record,
  config,
  className,
  children,
}: {
  record: DiagnosisRecord
  config: DiagnosisConfig
  className: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [state, setState] = useState<'idle' | 'busy' | UploadOutcome>('idle')

  async function send() {
    setState('busy')
    try {
      const outcome = await shareCase(record, config, todayIn())
      setState(outcome === 'cancelled' ? 'idle' : outcome.upload)
    } catch (err) {
      console.error('Could not share the case', err)
      setState('idle')
    }
  }

  const sent = state !== 'idle' && state !== 'busy'
  return (
    <div className="flex flex-col gap-1">
      <button type="button" onClick={send} disabled={state === 'busy'} aria-busy={state === 'busy'} className={className}>
        {sent ? (
          <>
            <CheckIcon size={24} weight={2.6} />
            পাঠানো হয়েছে · আবার পাঠান
          </>
        ) : (
          children
        )}
      </button>
      {sent && (
        <p role="status" className="m-0 text-center text-[13px] leading-[1.4] font-semibold text-muted">
          {state === 'signedOut' ? (
            <>
              কর্মকর্তার তালিকা আর ম্যাপে দেখাতে{' '}
              <Link href={`/sign-in?next=${encodeURIComponent(pathname)}`} className="text-teal underline">
                মোবাইল নম্বর দিয়ে ঢুকুন
              </Link>
            </>
          ) : (
            UPLOAD_NOTE[state]
          )}
        </p>
      )}
    </div>
  )
}
