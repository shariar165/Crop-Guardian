// Runs the model off the main thread, so the camera never freezes. Started by client.ts.
/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm'
import { cacheAvailable, type DiagnosisConfig, loadConfig, MODEL_CACHE, modelUrl } from './config'
import { decide } from './decide'
import { preprocessBitmap } from './preprocess'
import type { WorkerRequest, WorkerResponse } from './messages'

const WASM_URL = `/ort/${ort.env.versions.web}/ort-wasm-simd-threaded.wasm`

const post = (msg: WorkerResponse) => self.postMessage(msg)

type Loaded = { session: ort.InferenceSession; config: DiagnosisConfig }
// One crop's model at a time: a phone has little memory to spare for a second ~16 MB session.
let loaded: { configUrl: string; model: Promise<Loaded> } | null = null

// Real file sizes, written at build time by scripts/copy-ort.mjs. A compressed response has no
// usable Content-Length, so this is what the progress bar measures against.
const SIZES_URL = '/ort/sizes.json'

async function knownSizes(): Promise<Record<string, number>> {
  try {
    const res = await fetch(SIZES_URL, { cache: 'no-store' })
    return res.ok ? await res.json() : {}
  } catch {
    return {}
  }
}

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
  const known = await knownSizes()
  const sizes = urls.map((u, i) => (hits[i] ? 0 : known[u] || 0))
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

async function load(configUrl: string): Promise<Loaded> {
  const config = await loadConfig(configUrl)
  const [wasm, model] = await fetchAll([WASM_URL, modelUrl(configUrl, config.modelFile)])
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

function modelFor(configUrl: string): Promise<Loaded> {
  if (loaded?.configUrl !== configUrl) {
    const previous = loaded?.model
    loaded = { configUrl, model: load(configUrl) }
    previous?.then((p) => p.session.release()).catch(() => {})
  }
  return loaded.model
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'load') {
    try {
      const { config } = await modelFor(msg.configUrl)
      post({ type: 'ready', configUrl: msg.configUrl, config })
    } catch (err) {
      if (loaded?.configUrl === msg.configUrl) loaded = null
      post({ type: 'error', configUrl: msg.configUrl, message: String(err), offline: !navigator.onLine })
    }
    return
  }
  try {
    // A photo is only ever diagnosed by the model it was taken for.
    if (loaded?.configUrl !== msg.configUrl) throw new Error('Model not loaded')
    post({ type: 'result', id: msg.id, result: await diagnose(msg.blob, await loaded.model) })
  } catch (err) {
    post({ type: 'failed', id: msg.id, message: String(err) })
  }
}
