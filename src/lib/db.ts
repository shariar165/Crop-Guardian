// Postgres (Neon), shared by the server code that isn't Better Auth's. Created on first use, so pages
// that don't touch the database still build and run without DATABASE_URL.
import 'server-only'
import { Pool } from '@neondatabase/serverless'

let pool: Pool | undefined

export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}
