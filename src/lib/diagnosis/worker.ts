// Runs the model off the main thread, so the camera never freezes. Started by client.ts.
/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm'
import { cacheAvailable, type DiagnosisConfig, loadConfig, MODEL_CACHE, MODEL_DIR } from './config'
import { decide } from './decide'
import { preprocessBitmap } from './preprocess'
import type { WorkerRequest, WorkerResponse } from './messages'

const WASM_URL = `/ort/${ort.env.versions.web}/ort-wasm-simd-threaded.wasm`

const post = (msg: WorkerResponse) => self.postMessage(msg)

type Loaded = { session: ort.InferenceSession; config: DiagnosisConfig }
let loaded: Promise<Loaded> | null = null

// Each file from the cache, or else downloaded once, with combined progress, and cached.
async function fetchAll(urls: string[]): Promise<ArrayBuffer[]> {
  const cache = cacheAvailable() ? await caches.open(MODEL_CACHE) : null
  const hits = await Promise.all(urls.map((u) => cache?.match(u)))
  if (hits.every(Boolean)) {
    return Promise.all(hits.map((r) => r!.arrayBuffer()))
  }

  const responses = await Promise.all(
    urls.map(async (u, i) => {
      if (hits[i]) return hits[i]!
      const res = await fetch(u)
      if (!res.ok || !res.body) throw new Error(`${u}: HTTP ${res.status}`)
      return res
    }),
  )
  const sizes = responses.map((r, i) => (hits[i] ? 0 : Number(r.headers.get('content-length')) || 0))
  const total = sizes.every((s, i) => s > 0 || hits[i]) ? sizes.reduce((a, b) => a + b, 0) : 0
  const done = urls.map(() => 0)
  const report = () => post({ type: 'progress', loaded: done.reduce((a, b) => a + b, 0), total })
  report()

  return Promise.all(
    responses.map(async (res, i) => {
      if (hits[i]) return res.arrayBuffer()
      const reader = res.body!.getReader()
      const chunks: Uint8Array[] = []
      for (;;) {
        const { done: end, value } = await reader.read()
        if (end) break
        chunks.push(value)
        done[i] += value.byteLength
        report()
      }
      const blob = new Blob(chunks as BlobPart[])
      await cache?.put(urls[i], new Response(blob, { headers: { 'content-type': res.headers.get('content-type') ?? '' } }))
      return blob.arrayBuffer()
    }),
  )
}

async function load(): Promise<Loaded> {
  const config = await loadConfig()
  const [wasm, model] = await fetchAll([WASM_URL, MODEL_DIR + config.modelFile])
  // One thread needs no cross-origin isolation headers; the binary is passed in so ort never fetches it.
  ort.env.wasm.numThreads = 1
  ort.env.wasm.wasmBinary = wasm
  const session = await ort.InferenceSession.create(new Uint8Array(model), { executionProviders: ['wasm'] })
  return { session, config }
}

async function diagnose(blob: Blob, { session, config }: Loaded) {
  const bitmap = await createImageBitmap(blob)
  let input: Float32Array
  try {
    input = preprocessBitmap(bitmap, config)
  } finally {
    bitmap.close()
  }
  const size = config.preprocess.centerCrop
  const output = await session.run({ [config.inputName]: new ort.Tensor('float32', input, [1, 3, size, size]) })
  return decide(output[config.outputName].data as Float32Array, config)
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'load') {
    loaded ??= load()
    try {
      const { config } = await loaded
      post({ type: 'ready', config })
    } catch (err) {
      loaded = null
      post({ type: 'error', message: String(err), offline: !navigator.onLine })
    }
    return
  }
  try {
    if (!loaded) throw new Error('Model not loaded')
    post({ type: 'result', id: msg.id, result: await diagnose(msg.blob, await loaded) })
  } catch (err) {
    post({ type: 'failed', id: msg.id, message: String(err) })
  }
}
