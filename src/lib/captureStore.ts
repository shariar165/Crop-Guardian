// Leaf photos kept on the device (IndexedDB) until they can be sent for diagnosis.

import type { QualityReport } from './imageQuality'

export type CaptureSlot = 'top' | 'under'

export type Capture = {
  blob: Blob
  takenAt: number
  quality: QualityReport
}

const DB_NAME = 'crop-guardian'
const STORE = 'captures'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const req = op(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function saveCapture(slot: CaptureSlot, capture: Capture): Promise<void> {
  await run('readwrite', (s) => s.put(capture, slot))
}

export async function getCapture(slot: CaptureSlot): Promise<Capture | undefined> {
  return run<Capture | undefined>('readonly', (s) => s.get(slot))
}

export async function clearCaptures(): Promise<void> {
  await run('readwrite', (s) => s.clear())
}
