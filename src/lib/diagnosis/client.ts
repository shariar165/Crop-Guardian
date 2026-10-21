// The page's side of the model worker. The worker (and onnxruntime) only loads when loadModel() is first called.
// It holds one crop's model at a time, named by the crop's config URL.
import type { DiagnosisConfig } from './config'
import type { PhotoResult } from './decide'
import type { WorkerRequest, WorkerResponse } from './messages'

export type ModelState =
  | { phase: 'loading' }
  // `total` is 0 when the size isn't known.
  | { phase: 'downloading'; loaded: number; total: number }
  | { phase: 'ready'; config: DiagnosisConfig }
  | { phase: 'error'; offline: boolean }

let worker: Worker | null = null
// The model asked for last, and its state.
let current: string | null = null
let state: ModelState = { phase: 'loading' }
const listeners = new Set<(s: ModelState) => void>()
const pending = new Map<number, { resolve: (r: PhotoResult) => void; reject: (e: Error) => void }>()
let nextId = 1

function setState(s: ModelState) {
  state = s
  listeners.forEach((l) => l(s))
}

function onMessage(e: MessageEvent<WorkerResponse>) {
  const msg = e.data
  switch (msg.type) {
    case 'progress':
      setState({ phase: 'downloading', loaded: msg.loaded, total: msg.total })
      break
    case 'ready':
      // A model that finished loading after the farmer switched crops is not the current one.
      if (msg.configUrl === current) setState({ phase: 'ready', config: msg.config })
      break
    case 'error':
      console.error('Diagnosis model failed to load:', msg.message)
      if (msg.configUrl === current) setState({ phase: 'error', offline: msg.offline })
      break
    case 'result':
    case 'failed': {
      const p = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.type === 'result') p?.resolve(msg.result)
      else p?.reject(new Error(msg.message))
    }
  }
}

function send(msg: WorkerRequest) {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = onMessage
  }
  worker.postMessage(msg)
}

// Starts loading the crop's model (or retries after an error, or switches from another crop's) and
// reports every state change, starting with the current one.
export function loadModel(configUrl: string, onState: (s: ModelState) => void): () => void {
  if (configUrl !== current || state.phase === 'error' || !worker) {
    current = configUrl
    setState({ phase: 'loading' })
    send({ type: 'load', configUrl })
  }
  listeners.add(onState)
  onState(state)
  return () => {
    listeners.delete(onState)
  }
}

export function whenReady(configUrl: string): Promise<DiagnosisConfig> {
  return new Promise((resolve, reject) => {
    const off = loadModel(configUrl, (s) => {
      if (s.phase === 'ready') resolve(s.config)
      else if (s.phase === 'error') reject(new Error('Diagnosis model unavailable'))
      else return
      queueMicrotask(off)
    })
  })
}

export async function diagnose(configUrl: string, blob: Blob): Promise<PhotoResult> {
  await whenReady(configUrl)
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    send({ type: 'diagnose', id, configUrl, blob })
  })
}
