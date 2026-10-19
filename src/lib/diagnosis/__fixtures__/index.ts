// Shared test inputs: the real exported config, a small synthetic one, and the parity fixtures.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type DiagnosisConfig, parseConfig } from '../config'
import type { Decision } from '../decide'

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
  image: string
  logits: number[]
  decision: Decision
  candidates: string[]
  probs?: number[]
  ood_score?: number
}

export const parityFixtures: ParityFixture[] = JSON.parse(readFileSync(join(PARITY_DIR, 'expected.json'), 'utf8'))

export const PARITY_SKIP = parityFixtures.length === 0 ? 'parity fixtures not exported yet (see __fixtures__/parity/README.md)' : false
