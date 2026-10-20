// Farmers' cases in Postgres: uploaded from the phone, reviewed by an officer, counted on the map.
// Photos are sent to Postgres as base64 and decoded there, so the driver never has to encode bytea.
import 'server-only'
import type { AnswerRecord } from '@/lib/captureStore'
import type { CaseUpload, Verdict } from '@/lib/cases'
import { db } from '@/lib/db'
import type { Decision } from '@/lib/diagnosis/decide'

export type PhotoSlot = 'top' | 'under'
const PHOTO_COLUMN: Record<PhotoSlot, string> = { top: '"photoTop"', under: '"photoUnder"' }

export async function insertCase(userId: string, c: CaseUpload, photos: Partial<Record<PhotoSlot, Buffer>>): Promise<number> {
  const { rows } = await db().query(
    `INSERT INTO "case" ("userId", "unionId", "sentAt", "decision", "candidates", "finalId", "answers", "photoTop", "photoUnder")
     VALUES ($1, $2, $3, $4, $5, $6, $7, decode($8, 'base64'), decode($9, 'base64'))
     RETURNING "id"`,
    [
      userId,
      c.unionId,
      c.sentAt.toISOString(),
      c.decision,
      JSON.stringify(c.candidates),
      c.finalId,
      JSON.stringify(c.answers),
      photos.top?.toString('base64') ?? null,
      photos.under?.toString('base64') ?? null,
    ],
  )
  return Number(rows[0].id)
}

export type OfficerCase = {
  id: number
  phone: string | null
  unionId: string | null
  sentAt: Date
  decision: Decision
  candidates: string[]
  finalId: string | null
  answers: AnswerRecord[]
  hasTop: boolean
  hasUnder: boolean
  verdict: Verdict | null
}

// The newest cases first.
export async function listCases(limit = 50): Promise<OfficerCase[]> {
  const { rows } = await db().query(
    `SELECT c."id", u."phoneNumber" AS phone, c."unionId", c."sentAt", c."decision", c."candidates", c."finalId",
            c."answers", c."photoTop" IS NOT NULL AS "hasTop", c."photoUnder" IS NOT NULL AS "hasUnder", c."verdict"
       FROM "case" c JOIN "user" u ON u."id" = c."userId"
      ORDER BY c."sentAt" DESC
      LIMIT $1`,
    [limit],
  )
  return rows.map((r) => ({ ...r, id: Number(r.id), sentAt: new Date(r.sentAt) }))
}

export async function setVerdict(id: number, verdict: Verdict | null, officerId: string): Promise<void> {
  await db().query(
    `UPDATE "case" SET "verdict" = $1, "verifiedBy" = $2, "verifiedAt" = CASE WHEN $1::text IS NULL THEN NULL ELSE now() END
      WHERE "id" = $3`,
    [verdict, verdict ? officerId : null, id],
  )
}

export async function getPhoto(id: number, slot: PhotoSlot): Promise<Buffer | null> {
  const { rows } = await db().query(`SELECT encode(${PHOTO_COLUMN[slot]}, 'base64') AS b64 FROM "case" WHERE "id" = $1`, [id])
  const b64: string | null | undefined = rows[0]?.b64
  return b64 ? Buffer.from(b64, 'base64') : null
}

// Officer-confirmed late blight per union, sent in the last `days` days.
export async function confirmedCounts(days: number): Promise<Map<string, number>> {
  const { rows } = await db().query(
    `SELECT "unionId", count(*)::int AS n FROM "case"
      WHERE "verdict" = 'late_blight' AND "unionId" IS NOT NULL AND "sentAt" >= now() - make_interval(days => $1)
      GROUP BY "unionId"`,
    [days],
  )
  return new Map(rows.map((r) => [r.unionId as string, r.n as number]))
}
