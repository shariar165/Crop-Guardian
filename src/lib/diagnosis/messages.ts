// Messages between the page (client.ts) and the model worker (worker.ts).
import type { DiagnosisConfig } from './config'
import type { PhotoResult } from './decide'

// `configUrl` picks the crop's model; loading another one replaces the current one.
export type WorkerRequest = { type: 'load'; configUrl: string } | { type: 'diagnose'; id: number; configUrl: string; blob: Blob }

export type WorkerResponse =
  // `total` is 0 when the download size isn't known.
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'ready'; configUrl: string; config: DiagnosisConfig }
  | { type: 'error'; configUrl: string; message: string; offline: boolean }
  | { type: 'result'; id: number; result: PhotoResult }
  | { type: 'failed'; id: number; message: string }
