// Makes a signed-up user an agriculture officer, or a farmer again. Only this script sets roles:
// everyone signs up as a farmer, and no one can change their own role from the app.
// Run: npx tsx scripts/set-role.ts <phone> <farmer|officer>   (DATABASE_URL from .env.local)
import { existsSync } from 'node:fs'
import { Pool } from '@neondatabase/serverless'
import { isRole, ROLES } from '@/lib/auth/roles'
import { normalizeBdPhone } from '@/lib/phone'

async function main() {
  const [input = '', role] = process.argv.slice(2)
  const phone = normalizeBdPhone(input)
  if (!phone || !isRole(role)) {
    console.error(`Usage: npx tsx scripts/set-role.ts <phone> <${ROLES.join('|')}>`)
    process.exit(1)
  }

  if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const { rowCount } = await pool.query('UPDATE "user" SET "role" = $1, "updatedAt" = now() WHERE "phoneNumber" = $2', [role, phone])
    if (!rowCount) {
      console.error(`No account for ${phone}. They need to sign in once first.`)
      process.exitCode = 1
    } else {
      console.log(`${phone} is now ${role}.`)
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
