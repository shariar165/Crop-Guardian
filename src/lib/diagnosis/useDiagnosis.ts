'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type DiagnosisRecord, getDiagnosis } from '@/lib/captureStore'
import type { RiskAssessment } from '@/lib/risk'
import { type DiagnosisConfig, loadConfig } from './config'
import type { TodayRisk } from './explain'
import { type Mock, mockDiagnosis, RESULT_PATH, withMock } from './mock'

export type DiagnosisView =
  | { status: 'loading' }
  // No photos diagnosed yet (or the config can't be read).
  | { status: 'empty' }
  | { status: 'ready'; config: DiagnosisConfig; record: DiagnosisRecord }

// The current diagnosis from the device, or the demo one for `?mock=`. On the wrong result
// screen for it (an old link, the back button), moves to the right one.
export function useDiagnosis(mock?: Mock): DiagnosisView {
  const [view, setView] = useState<DiagnosisView>({ status: 'loading' })
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const config = await loadConfig()
        const record = mock ? mockDiagnosis(mock, config) : await getDiagnosis()
        if (!cancelled) setView(record ? { status: 'ready', config, record } : { status: 'empty' })
      } catch (err) {
        console.error('Could not read the diagnosis', err)
        if (!cancelled) setView({ status: 'empty' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mock])

  const expected = view.status === 'ready' ? RESULT_PATH[view.record.result.decision] : null
  useEffect(() => {
    if (expected && expected !== pathname) router.replace(withMock(expected, mock))
  }, [expected, pathname, mock, router])

  return expected && expected !== pathname ? { status: 'loading' } : view
}

// Today's weather risk from /api/risk; 'unavailable' when offline or the forecast fails.
export function useTodayRisk(): TodayRisk | null {
  const [risk, setRisk] = useState<TodayRisk | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/risk')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(
        (r: RiskAssessment) => {
          if (!cancelled) setRisk({ today: r.today, reason: r.reason })
        },
        () => {
          if (!cancelled) setRisk('unavailable')
        },
      )
    return () => {
      cancelled = true
    }
  }, [])
  return risk
}
