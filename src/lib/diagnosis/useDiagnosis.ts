'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { type DiagnosisRecord, getDiagnosis } from '@/lib/captureStore'
import type { CropId } from '@/lib/crops'
import type { RiskAssessment } from '@/lib/risk'
import { type DiagnosisConfig, loadConfig } from './config'
import { configUrlOf, cropOfRecord } from './crops'
import type { TodayRisk } from './explain'
import { belongsOn, screenFor } from './flow'

export type DiagnosisView =
  | { status: 'loading' }
  // No photos diagnosed yet (or the config can't be read).
  | { status: 'empty' }
  | { status: 'ready'; crop: CropId; config: DiagnosisConfig; record: DiagnosisRecord }

// The current diagnosis from the device.
// On a screen it doesn't belong on (an old link, the back button), moves to the right one.
export function useDiagnosis(): DiagnosisView {
  const [view, setView] = useState<DiagnosisView>({ status: 'loading' })
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const record = await getDiagnosis()
        if (!record) {
          if (!cancelled) setView({ status: 'empty' })
          return
        }
        const crop = cropOfRecord(record)
        const config = await loadConfig(configUrlOf(crop))
        if (!cancelled) setView({ status: 'ready', crop, config, record })
      } catch (err) {
        console.error('Could not read the diagnosis', err)
        if (!cancelled) setView({ status: 'empty' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const misplaced = view.status === 'ready' && !belongsOn(pathname, view.record)
  const target = misplaced ? screenFor(view.record) : null
  useEffect(() => {
    if (target) router.replace(target)
  }, [target, router])

  return misplaced ? { status: 'loading' } : view
}

// Lets a screen update the diagnosis it shows (the questions screen records answers).
export function useDiagnosisState() {
  const view = useDiagnosis()
  const [override, setOverride] = useState<DiagnosisRecord | null>(null)
  const current: DiagnosisView = view.status === 'ready' && override ? { ...view, record: override } : view
  return [current, setOverride] as const
}

// Today's weather risk for the crop from /api/risk; 'unavailable' when offline or the forecast fails.
export function useTodayRisk(crop: CropId): TodayRisk | null {
  const [risk, setRisk] = useState<TodayRisk | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(`/api/risk?crop=${crop}`)
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
  }, [crop])
  return risk
}
