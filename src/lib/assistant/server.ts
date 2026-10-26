// The assistant on the server: the app's database, the farmer's place from their cookie, and a
// daily question limit per device.
import 'server-only'
import { createHash } from 'node:crypto'
import { todayIn } from '@/lib/dates'
import { db } from '@/lib/db'
import { getPlace } from '@/lib/place'
import { riskAt } from '@/lib/riskAt'
import { ask, type AskResult } from './answer'

// Enough for a farmer's real questions in a day; stops a script from running up the model bill.
export const DAILY_LIMIT = 30

export async function askOnServer(question: string, history: unknown): Promise<AskResult> {
  const place = await getPlace()
  const pool = db()
  return ask(
    { question, history, place: place.name, today: todayIn() },
    { query: (sql, params) => pool.query(sql, params), risk: (crop) => riskAt(place, crop) },
  )
}

// Counted per hashed IP address and day; the address itself is never stored.
export async function underDailyLimit(ip: string): Promise<boolean> {
  const key = createHash('sha256')
    .update(`${process.env.BETTER_AUTH_SECRET ?? ''}:${ip}`)
    .digest('hex')
    .slice(0, 32)
  const { rows } = await db().query(
    `INSERT INTO ask_rate ("key", "day", "count") VALUES ($1, $2, 1)
     ON CONFLICT ("key", "day") DO UPDATE SET "count" = ask_rate."count" + 1
     RETURNING "count"`,
    [key, todayIn()],
  )
  return Number(rows[0].count) <= DAILY_LIMIT
}
