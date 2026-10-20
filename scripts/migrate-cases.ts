// Creates the table for cases farmers send to the agriculture officer. Safe to run again.
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
`

async function main() {
  if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(SQL)
    console.log('The "case" table is ready.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
