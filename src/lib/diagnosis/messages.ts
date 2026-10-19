// Messages between the page (client.ts) and the model worker (worker.ts).
import type { DiagnosisConfig } from './config'
import type { PhotoResult } from './decide'

export type WorkerRequest = { type: 'load' } | { type: 'diagnose'; id: number; blob: Blob }

export type WorkerResponse =
  // `total` is 0 when the download size isn't known.
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'ready'; config: DiagnosisConfig }
  | { type: 'error'; message: string; offline: boolean }
  | { type: 'result'; id: number; result: PhotoResult }
  | { type: 'failed'; id: number; message: string }
