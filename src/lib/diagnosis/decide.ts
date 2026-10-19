// One photo's decision from the model's logits, following `decision` in the exported config exactly.
import type { DiagnosisConfig } from './config'

export type Decision = 'confident' | 'uncertain' | 'unknown'

export type PhotoResult = {
  decision: Decision
  // Class ids in the conformal set, most probable first. Empty when unknown.
  candidates: string[]
  // Calibrated probability of each class in `config.diseases`, in that order.
  probs: number[]
  oodScore: number
}

function logSumExp(xs: number[]): number {
  const max = Math.max(...xs)
  return max + Math.log(xs.reduce((sum, x) => sum + Math.exp(x - max), 0))
}

export function softmax(xs: number[]): number[] {
  const lse = logSumExp(xs)
  return xs.map((x) => Math.exp(x - lse))
}

export function decide(logits: ArrayLike<number>, config: DiagnosisConfig): PhotoResult {
  const all = Array.from(logits)
  if (all.length !== config.classes.length) {
    throw new Error(`Expected ${config.classes.length} logits, got ${all.length}`)
  }
  const T = config.temperature
  const scaled = all.slice(0, config.diseases.length).map((x) => x / T)
  const probs = softmax(scaled)

  let oodScore: number
  switch (config.ood.method) {
    case 'p_other':
      // At T = 1, over all outputs including "other".
      oodScore = softmax(all)[all.length - 1]
      break
    case 'energy':
      oodScore = -T * logSumExp(scaled)
      break
    case 'msp':
      oodScore = -Math.max(...probs)
      break
  }

  const candidates = config.diseases
    .map((id, i) => ({ id, p: probs[i] }))
    .filter(({ p }) => p >= 1 - config.qhat)
    .sort((a, b) => b.p - a.p)
    .map(({ id }) => id)

  const decision: Decision =
    oodScore > config.ood.threshold || candidates.length === 0
      ? 'unknown'
      : candidates.length === 1
        ? 'confident'
        : 'uncertain'

  return { decision, candidates: decision === 'unknown' ? [] : candidates, probs, oodScore }
}
