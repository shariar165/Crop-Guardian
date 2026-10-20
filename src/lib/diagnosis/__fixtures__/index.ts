// Shared test inputs: the real exported config, a small synthetic one, and the parity fixtures.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { DiagnosisRecord } from '../../captureStore'
import { combine } from '../combine'
import { type DiagnosisConfig, parseConfig } from '../config'
import type { Decision, PhotoResult } from '../decide'

export const CONFIG_PATH = join(process.cwd(), 'public', 'model', 'crop_guardian_config.json')
export const PARITY_DIR = join(process.cwd(), 'src', 'lib', 'diagnosis', '__fixtures__', 'parity')

export const rawConfig = (): Record<string, unknown> => JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
export const realConfig: DiagnosisConfig = parseConfig(rawConfig())

// Two diseases plus "other", T = 1, so probabilities are easy to set exactly.
export function syntheticConfig(overrides: Partial<DiagnosisConfig> = {}): DiagnosisConfig {
  return {
    ...realConfig,
    classes: ['a', 'b', 'other'],
    diseases: ['a', 'b'],
    labelsBn: { a: 'ক', b: 'খ', other: 'অন্য' },
    temperature: 1,
    qhat: 0.5,
    ood: { method: 'p_other', threshold: 0.9 },
    ...overrides,
  }
}

// Logits whose calibrated disease probabilities are `probs`, with the "other" logit set separately.
export function logitsFor(probs: number[], config: DiagnosisConfig, other = -20): number[] {
  return [...probs.map((p) => config.temperature * Math.log(p)), other]
}

export type ParityFixture = {
  file: string
  group?: string
  source?: string
  logits: number[]
  decision: Decision
  candidates: string[]
  probs?: number[]
  ood_score?: number
}

export const parityFixtures: ParityFixture[] = JSON.parse(readFileSync(join(PARITY_DIR, 'expected.json'), 'utf8'))

export const PARITY_SKIP = parityFixtures.length === 0 ? 'parity fixtures not exported yet (see __fixtures__/parity/README.md)' : false

// Diagnosis records for each kind of result, built through the real combine().
export type FixtureKind = 'confident' | 'healthy' | 'uncertain' | 'unknown'

// A photo the model is sure about, if `id` is a class this model knows.
function sure(id: string, config: DiagnosisConfig): PhotoResult {
  const probs = config.diseases.map((d) => (d === id ? 0.96 : 0.04 / (config.diseases.length - 1)))
  return { decision: 'confident', candidates: [id], probs, oodScore: 0 }
}

function unsure(config: DiagnosisConfig): PhotoResult {
  return { decision: 'unknown', candidates: [], probs: config.diseases.map(() => 1 / config.diseases.length), oodScore: 0 }
}

export function fixtureDiagnosis(kind: FixtureKind, config: DiagnosisConfig): DiagnosisRecord {
  const [early, healthy, late] = ['early_blight', 'healthy', 'late_blight'].map((id) =>
    config.diseases.includes(id) ? id : config.diseases[0],
  )
  const [top, under] = {
    confident: [sure(late, config), sure(late, config)],
    healthy: [sure(healthy, config), sure(healthy, config)],
    // Each photo is sure, but they disagree.
    uncertain: [sure(early, config), sure(late, config)],
    unknown: [sure(late, config), unsure(config)],
  }[kind]
  return { createdAt: Date.now(), result: combine(top, under, config), answers: [] }
}
