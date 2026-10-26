// SMS risk alerts in Postgres: who asked for them, for which union and fields, and the latest
// danger day each was warned about (see src/lib/alerts.ts). Tables from scripts/migrate-cases.ts.
import 'server-only'
import { getSessionCookie } from 'better-auth/cookies'
import { headers } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import type { CropId } from '@/lib/crops'
import { getSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { type Field, validFields } from '@/lib/fieldList'

export type Alert = { enabled: boolean; unionId: string; fields: Field[] }

export async function getAlert(userId: string): Promise<Alert | null> {
  const { rows } = await db().query(`SELECT "enabled", "unionId", "fields" FROM "alert" WHERE "userId" = $1`, [userId])
  return rows[0] ? { enabled: rows[0].enabled, unionId: rows[0].unionId, fields: validFields(rows[0].fields) } : null
}

export async function saveAlert(userId: string, alert: Alert): Promise<void> {
  await db().query(
    `INSERT INTO "alert" ("userId", "enabled", "unionId", "fields") VALUES ($1, $2, $3, $4)
     ON CONFLICT ("userId") DO UPDATE
       SET "enabled" = EXCLUDED."enabled", "unionId" = EXCLUDED."unionId", "fields" = EXCLUDED."fields", "updatedAt" = now()`,
    [userId, alert.enabled, alert.unionId, JSON.stringify(alert.fields)],
  )
}

// Keeps a farmer's alert in step when the phone's union or fields change. Nothing without one.
export async function updateAlert(userId: string, change: Partial<Pick<Alert, 'unionId' | 'fields'>>): Promise<void> {
  await db().query(
    `UPDATE "alert" SET "unionId" = COALESCE($2, "unionId"), "fields" = COALESCE($3, "fields"), "updatedAt" = now()
      WHERE "userId" = $1`,
    [userId, change.unionId ?? null, change.fields ? JSON.stringify(change.fields) : null],
  )
}

// The signed-in user's id, without touching the database when there is no session cookie.
export async function signedInUserId(): Promise<string | null> {
  if (!getSessionCookie(await headers())) return null
  return (await getSession())?.user.id ?? null
}

// Whether Home may promise an SMS: the viewer is signed in with alerts on. Any failure is "no".
export async function viewerHasAlerts(): Promise<boolean> {
  try {
    const userId = await signedInUserId()
    return userId !== null && (await getAlert(userId))?.enabled === true
  } catch (err) {
    // Next's own signals (e.g. that the page is dynamic) must pass through.
    unstable_rethrow(err)
    console.error('Alert check failed', err)
    return false
  }
}

export type Subscriber = Alert & { userId: string; phone: string; lastDanger: Partial<Record<CropId, string>> }

// Everyone with alerts on and a phone number, with the danger days they were last warned about.
export async function listSubscribers(): Promise<Subscriber[]> {
  const { rows } = await db().query(
    `SELECT a."userId", a."unionId", a."fields", u."phoneNumber" AS phone,
            COALESCE(jsonb_object_agg(s."crop", to_char(s."lastDanger", 'YYYY-MM-DD')) FILTER (WHERE s."crop" IS NOT NULL), '{}') AS "lastDanger"
       FROM "alert" a
       JOIN "user" u ON u."id" = a."userId"
       LEFT JOIN "alert_state" s ON s."userId" = a."userId"
      WHERE a."enabled" AND u."phoneNumber" IS NOT NULL
      GROUP BY a."userId", a."unionId", a."fields", u."phoneNumber"`,
  )
  return rows.map((r) => ({ ...r, enabled: true, fields: validFields(r.fields) }))
}

// Records `lastDanger` for the farmer's crop, only if no other run changed it since `previous` was
// read, so two runs can't both send. True when this run may go ahead (and send, if `sending`).
export async function claimAlert(
  userId: string,
  crop: CropId,
  previous: string | null,
  lastDanger: string,
  sending: boolean,
): Promise<boolean> {
  const { rows } = await db().query(
    `INSERT INTO "alert_state" ("userId", "crop", "lastDanger", "lastSentAt")
     VALUES ($1, $2, $3, CASE WHEN $5 THEN now() END)
     ON CONFLICT ("userId", "crop") DO UPDATE
       SET "lastDanger" = EXCLUDED."lastDanger", "lastSentAt" = COALESCE(EXCLUDED."lastSentAt", "alert_state"."lastSentAt")
       WHERE "alert_state"."lastDanger" = $4::date
     RETURNING 1`,
    [userId, crop, lastDanger, previous, sending],
  )
  return rows.length > 0
}

// Undoes a claim whose SMS could not be sent, so tomorrow's run tries again.
export async function releaseAlert(userId: string, crop: CropId, previous: string | null): Promise<void> {
  if (previous === null) await db().query(`DELETE FROM "alert_state" WHERE "userId" = $1 AND "crop" = $2`, [userId, crop])
  else await db().query(`UPDATE "alert_state" SET "lastDanger" = $3 WHERE "userId" = $1 AND "crop" = $2`, [userId, crop, previous])
}
