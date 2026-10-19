// The result for the pair of photos (top of the leaf, underside). Each photo is decided on its own,
// because the thresholds were calibrated per photo; the pair is never more confident than either one.
import type { DiagnosisConfig } from './config'
import type { Decision, PhotoResult } from './decide'

export type CombinedResult = {
  decision: Decision
  candidates: string[]
  photos: { top: PhotoResult; under: PhotoResult }
}

const CAUTION: Record<Decision, number> = { confident: 0, uncertain: 1, unknown: 2 }

export function combine(top: PhotoResult, under: PhotoResult, config: DiagnosisConfig): CombinedResult {
  const photos = { top, under }
  const decision: Decision = CAUTION[top.decision] >= CAUTION[under.decision] ? top.decision : under.decision
  if (decision === 'unknown') return { decision, candidates: [], photos }

  // Every class either photo kept, most probable (in either photo) first.
  const best = (id: string) => {
    const i = config.diseases.indexOf(id)
    return Math.max(top.probs[i], under.probs[i])
  }
  const candidates = [...new Set([...top.candidates, ...under.candidates])].sort((a, b) => best(b) - best(a))

  // Two confident photos that disagree are not a confident pair.
  return { decision: candidates.length > 1 ? 'uncertain' : decision, candidates, photos }
}
