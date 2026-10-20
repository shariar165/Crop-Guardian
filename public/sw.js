// Offline support for the leaf diagnosis. Registered in production only (src/components/ServiceWorker.tsx).
// The model, its config and the wasm runtime are cached by the model worker itself (Cache API
// 'crop-guardian-model'), so this worker leaves /model/ and /ort/ alone.

const SHELL = 'crop-guardian-shell-v2'
// Hashed build files never change, so they are kept across versions.
const STATIC = 'crop-guardian-static'
const KEEP = [SHELL, STATIC, 'crop-guardian-model']

// The screens of the diagnosis flow and the guide, which must open with no internet. Home is not
// here: its weather risk would be stale, so offline it shows /offline instead.
const PAGES = ['/camera', '/result', '/result/uncertain', '/questions', '/unknown', '/offline', '/guide']

const ASSET = /\/_next\/static\/[^"'\s\\)]+/g

async function precache() {
  const shell = await caches.open(SHELL)
  const assets = new Set()
  for (const page of PAGES) {
    const res = await fetch(page, { cache: 'reload' })
    if (!res.ok) throw new Error(`${page}: HTTP ${res.status}`)
    const html = await res.clone().text()
    for (const url of html.match(ASSET) ?? []) assets.add(url)
    await shell.put(page, res)
  }
  const statics = await caches.open(STATIC)
  await Promise.all(
    [...assets].map(async (url) => {
      if (await statics.match(url)) return
      const res = await fetch(url)
      if (res.ok) await statics.put(url, res)
    }),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

async function staticFirst(request) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) await cache.put(request, res.clone())
  return res
}

// Online: the fresh page (and a fresh copy for later). Offline: the saved page, or /offline.
async function page(request) {
  const path = new URL(request.url).pathname
  const shell = await caches.open(SHELL)
  try {
    const res = await fetch(request)
    if (res.ok && PAGES.includes(path)) await shell.put(path, res.clone())
    return res
  } catch (err) {
    return (await shell.match(path)) ?? (await shell.match('/offline')) ?? Promise.reject(err)
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/_next/static/')) return event.respondWith(staticFirst(request))
  if (request.mode === 'navigate') return event.respondWith(page(request))
  // Everything else (the risk API, the model, client-side navigation data) goes to the network as usual.
})
