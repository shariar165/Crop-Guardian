// The page's side of the model worker. The worker (and onnxruntime) only loads when loadModel() is first called.
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
      setState({ phase: 'ready', config: msg.config })
      break
    case 'error':
      console.error('Diagnosis model failed to load:', msg.message)
      setState({ phase: 'error', offline: msg.offline })
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

// Starts loading (or retries after an error) and reports every state change, starting with the current one.
export function loadModel(onState: (s: ModelState) => void): () => void {
  if (state.phase === 'error' || !worker) {
    setState({ phase: 'loading' })
    send({ type: 'load' })
  }
  listeners.add(onState)
  onState(state)
  return () => {
    listeners.delete(onState)
  }
}

export function whenReady(): Promise<DiagnosisConfig> {
  return new Promise((resolve, reject) => {
    const off = loadModel((s) => {
      if (s.phase === 'ready') resolve(s.config)
      else if (s.phase === 'error') reject(new Error('Diagnosis model unavailable'))
      else return
      queueMicrotask(off)
    })
  })
}

export async function diagnose(blob: Blob): Promise<PhotoResult> {
  await whenReady()
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    send({ type: 'diagnose', id, blob })
  })
}
