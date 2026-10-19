// Kept on the device (IndexedDB): the current pair of leaf photos, their diagnosis, and the cases
// sent to the agriculture officer.

import type { CombinedResult } from './diagnosis/combine'
import type { QualityReport } from './imageQuality'

export type CaptureSlot = 'top' | 'under'

export type Capture = {
  blob: Blob
  takenAt: number
  quality: QualityReport
}

export type Answer = 'yes' | 'no' | 'unsure'
export type AnswerRecord = { question: string; answer: Answer }

export type DiagnosisRecord = {
  createdAt: number
  // The model's result for the two photos.
  result: CombinedResult
  // The farmer's answers on /questions, in the order asked.
  answers: AnswerRecord[]
}

export type CaseRecord = {
  id?: number
  sentAt: number
  diagnosis: DiagnosisRecord
  photos: Blob[]
  via: 'share' | 'whatsapp'
}

const DB_NAME = 'crop-guardian'
const CAPTURES = 'captures'
const DIAGNOSIS = 'diagnosis'
const CASES = 'cases'
const CURRENT = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = (e) => {
      const db = req.result
      if (e.oldVersion < 1) db.createObjectStore(CAPTURES)
      if (e.oldVersion < 2) {
        db.createObjectStore(DIAGNOSIS)
        db.createObjectStore(CASES, { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(storeName: string, mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const req = op(tx.objectStore(storeName))
      tx.oncomplete = () => resolve(req.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function saveCapture(slot: CaptureSlot, capture: Capture): Promise<void> {
  await run(CAPTURES, 'readwrite', (s) => s.put(capture, slot))
}

export async function getCapture(slot: CaptureSlot): Promise<Capture | undefined> {
  return run<Capture | undefined>(CAPTURES, 'readonly', (s) => s.get(slot))
}

// Starts a new pair of photos: the old photos and their diagnosis go.
export async function clearCaptures(): Promise<void> {
  await run(CAPTURES, 'readwrite', (s) => s.clear())
  await run(DIAGNOSIS, 'readwrite', (s) => s.clear())
}

export async function saveDiagnosis(record: DiagnosisRecord): Promise<void> {
  await run(DIAGNOSIS, 'readwrite', (s) => s.put(record, CURRENT))
}

export async function getDiagnosis(): Promise<DiagnosisRecord | undefined> {
  return run<DiagnosisRecord | undefined>(DIAGNOSIS, 'readonly', (s) => s.get(CURRENT))
}

export async function saveCase(record: CaseRecord): Promise<void> {
  await run(CASES, 'readwrite', (s) => s.add(record))
}
