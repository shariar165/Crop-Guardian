'use client'

import { useState } from 'react'
import { CheckIcon } from '@/components/icons'
import type { DiagnosisRecord } from '@/lib/captureStore'
import type { DiagnosisConfig } from '@/lib/diagnosis/config'
import { todayIn } from '@/lib/dates'
import { caseSummary, shareCase } from '@/lib/shareCase'

/** Shares the leaf photos and a short summary with the agriculture officer. */
export default function OfficerShareButton({
  record,
  config,
  demo = false,
  className,
  children,
}: {
  record: DiagnosisRecord
  config: DiagnosisConfig
  demo?: boolean
  className: string
  children: React.ReactNode
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')

  async function send() {
    setState('busy')
    try {
      const outcome = await shareCase(record, caseSummary(record, config, todayIn()), { demo })
      setState(outcome === 'cancelled' ? 'idle' : 'sent')
    } catch (err) {
      console.error('Could not share the case', err)
      setState('idle')
    }
  }

  return (
    <button type="button" onClick={send} disabled={state === 'busy'} aria-busy={state === 'busy'} className={className}>
      {state === 'sent' ? (
        <>
          <CheckIcon size={24} weight={2.6} />
          পাঠানো হয়েছে · আবার পাঠান
        </>
      ) : (
        children
      )}
    </button>
  )
}
