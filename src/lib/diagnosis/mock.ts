// Demo results for `?mock=` on the camera and result screens, built through the real combine().
import type { DiagnosisRecord } from '../captureStore'
import { combine } from './combine'
import type { DiagnosisConfig } from './config'
import type { Decision, PhotoResult } from './decide'
import { RESULT_PATH } from './flow'

export const MOCKS = ['confident', 'healthy', 'uncertain', 'unknown'] as const
export type Mock = (typeof MOCKS)[number]

export function parseMock(value: string | string[] | undefined): Mock | undefined {
  return MOCKS.find((m) => m === value)
}

// A photo the model is sure about, if `id` is a class this model knows.
function sure(id: string, config: DiagnosisConfig): PhotoResult {
  const probs = config.diseases.map((d) => (d === id ? 0.96 : 0.04 / (config.diseases.length - 1)))
  return { decision: 'confident', candidates: [id], probs, oodScore: 0 }
}

function unsure(config: DiagnosisConfig): PhotoResult {
  return { decision: 'unknown', candidates: [], probs: config.diseases.map(() => 1 / config.diseases.length), oodScore: 0 }
}

export function mockDiagnosis(mock: Mock, config: DiagnosisConfig): DiagnosisRecord {
  const [early, healthy, late] = ['early_blight', 'healthy', 'late_blight'].map((id) =>
    config.diseases.includes(id) ? id : config.diseases[0],
  )
  const [top, under] = {
    confident: [sure(late, config), sure(late, config)],
    healthy: [sure(healthy, config), sure(healthy, config)],
    // Each photo is sure, but they disagree.
    uncertain: [sure(early, config), sure(late, config)],
    unknown: [sure(late, config), unsure(config)],
  }[mock]
  return { createdAt: Date.now(), result: combine(top, under, config), answers: [] }
}

const MOCK_RESULT: Record<Mock, Decision> = {
  confident: 'confident',
  healthy: 'confident',
  uncertain: 'uncertain',
  unknown: 'unknown',
}

export const mockPath = (mock: Mock) => RESULT_PATH[MOCK_RESULT[mock]]
