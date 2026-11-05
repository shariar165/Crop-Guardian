// The assistant on the server: the app's database, the farmer's place from their cookie, and a
// daily question limit per device.
import 'server-only'
import { createHash } from 'node:crypto'
import { todayIn } from '@/lib/dates'
import { db } from '@/lib/db'
import { getPlace } from '@/lib/place'
import { riskAt } from '@/lib/riskAt'
import type { CropId } from '@/lib/crops'
import { ask, type AskResult } from './answer'
import type { AnswerCache } from './cache'

// Enough for a farmer's real questions in a day; stops a script from running up the model bill.
export const DAILY_LIMIT = 30

const answerCache = (): AnswerCache => ({
  get: async (key) => (await db().query('SELECT "answer" FROM ask_cache WHERE "key" = $1', [key])).rows[0]?.answer ?? null,
  set: async (key, value) => {
    await db().query('INSERT INTO ask_cache ("key", "answer") VALUES ($1, $2) ON CONFLICT ("key") DO NOTHING', [key, JSON.stringify(value)])
  },
})

export async function askOnServer(question: string, history: unknown, field: CropId | null): Promise<AskResult> {
  const place = await getPlace()
  const pool = db()
  return ask(
    { question, history, today: todayIn(), field },
    { query: (sql, params) => pool.query(sql, params), risk: (crop) => riskAt(place, crop), cache: answerCache() },
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
