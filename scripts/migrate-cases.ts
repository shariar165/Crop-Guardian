// Creates the app's own tables: cases farmers send to the agriculture officer, and SMS risk alerts.
// Safe to run again.
// Run after `npm run auth:migrate` (it references Better Auth's "user" table):
//   npm run db:migrate   (DATABASE_URL from .env.local)
import { existsSync } from 'node:fs'
import { Pool } from '@neondatabase/serverless'

const SQL = `
CREATE TABLE IF NOT EXISTS "case" (
  "id"          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId"      text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "unionId"     text,
  "sentAt"      timestamptz NOT NULL,
  "createdAt"   timestamptz NOT NULL DEFAULT now(),
  "decision"    text NOT NULL CHECK ("decision" IN ('confident', 'uncertain', 'unknown')),
  "candidates"  jsonb NOT NULL,
  "finalId"     text,
  "answers"     jsonb NOT NULL,
  "photoTop"    bytea,
  "photoUnder"  bytea,
  -- Set by an agriculture officer on /officer. Only 'late_blight' counts on the map.
  "verdict"     text CHECK ("verdict" IN ('late_blight', 'not_late_blight')),
  "verifiedBy"  text REFERENCES "user" ("id") ON DELETE SET NULL,
  "verifiedAt"  timestamptz
);
CREATE INDEX IF NOT EXISTS "case_sentAt_idx" ON "case" ("sentAt" DESC);
CREATE INDEX IF NOT EXISTS "case_verdict_idx" ON "case" ("verdict", "sentAt");
CREATE INDEX IF NOT EXISTS "case_unionId_idx" ON "case" ("unionId");
-- Union ids were bare Shibganj (Bogura) names before more districts were added.
UPDATE "case" SET "unionId" = 'bogura-shibganj.' || "unionId" WHERE "unionId" IS NOT NULL AND position('.' in "unionId") = 0;

-- Farmers who asked for SMS risk alerts (on /account). The fields are a copy of the phone's
-- (season and planting date), so only crops in the field are alerted.
CREATE TABLE IF NOT EXISTS "alert" (
  "userId"    text PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  "enabled"   boolean NOT NULL DEFAULT true,
  "unionId"   text NOT NULL,
  "fields"    jsonb NOT NULL DEFAULT '[]',
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
-- The latest danger day each farmer was warned about per crop, so a run of danger days sends one SMS.
CREATE TABLE IF NOT EXISTS "alert_state" (
  "userId"     text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "crop"       text NOT NULL,
  "lastDanger" date NOT NULL,
  "lastSentAt" timestamptz,
  PRIMARY KEY ("userId", "crop")
);
`

async function main() {
  if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(SQL)
    console.log('The "case", "alert" and "alert_state" tables are ready.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
