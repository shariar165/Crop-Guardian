'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type DiagnosisRecord, getDiagnosis } from '@/lib/captureStore'
import type { RiskAssessment } from '@/lib/risk'
import { type DiagnosisConfig, loadConfig } from './config'
import type { TodayRisk } from './explain'
import { belongsOn, parseAnswers, screenFor, withMock } from './flow'
import { type Mock, mockDiagnosis } from './mock'

export type DiagnosisView =
  | { status: 'loading' }
  // No photos diagnosed yet (or the config can't be read).
  | { status: 'empty' }
  | { status: 'ready'; config: DiagnosisConfig; record: DiagnosisRecord }

// The current diagnosis from the device, or the demo one for `?mock=` (with its answers from the URL).
// On a screen it doesn't belong on (an old link, the back button), moves to the right one.
export function useDiagnosis(mock?: Mock, mockAnswers?: string): DiagnosisView {
  const [view, setView] = useState<DiagnosisView>({ status: 'loading' })
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const config = await loadConfig()
        const record = mock ? { ...mockDiagnosis(mock, config), answers: parseAnswers(mockAnswers) } : await getDiagnosis()
        if (!cancelled) setView(record ? { status: 'ready', config, record } : { status: 'empty' })
      } catch (err) {
        console.error('Could not read the diagnosis', err)
        if (!cancelled) setView({ status: 'empty' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mock, mockAnswers])

  const misplaced = view.status === 'ready' && !belongsOn(pathname, view.record)
  const target = misplaced ? withMock(screenFor(view.record), mock, view.record.answers) : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  return misplaced ? { status: 'loading' } : view
}

// Lets a screen update the diagnosis it shows (the questions screen records answers).
export function useDiagnosisState(mock?: Mock, mockAnswers?: string) {
  const view = useDiagnosis(mock, mockAnswers)
  const [override, setOverride] = useState<DiagnosisRecord | null>(null)
  const current: DiagnosisView = view.status === 'ready' && override ? { ...view, record: override } : view
  return [current, setOverride] as const
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
