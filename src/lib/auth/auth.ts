// Accounts: sign-in with a Bangladeshi mobile number and an SMS code, for farmers and agriculture
// officers. Users, sessions and codes are kept in Postgres (Neon). Run `npm run auth:migrate` after
// changing this file. No `server-only` here: the Better Auth CLI loads this file outside Next.
import { Pool } from '@neondatabase/serverless'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { phoneNumber } from 'better-auth/plugins'
import type { Role } from '@/lib/auth/roles'
import { normalizeBdPhone } from '@/lib/phone'
import { otpMessage, sendSms } from '@/lib/sms'

const DAY = 60 * 60 * 24

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  user: {
    additionalFields: {
      // Everyone signs up as a farmer. Officers are set with scripts/set-role.ts, never by the client.
      role: { type: 'string', defaultValue: 'farmer' satisfies Role, input: false },
    },
  },
  // A farmer should rarely need a new code: a month, renewed on any visit after a day.
  session: { expiresIn: 30 * DAY, updateAge: DAY },
  // Each code costs SMS credit on the gateway phone. Kept in the database: serverless instances
  // don't share memory.
  rateLimit: {
    enabled: true,
    storage: 'database',
    customRules: {
      '/phone-number/send-otp': { window: 60, max: 3 },
      '/phone-number/verify': { window: 60, max: 10 },
    },
  },
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber, code }) => sendSms(phoneNumber, otpMessage(code)),
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      // Only E.164 BD mobiles are stored; the sign-in form normalizes what the farmer typed.
      phoneNumberValidator: (phone) => normalizeBdPhone(phone) === phone,
      // The first verified code creates the account. Better Auth needs an email; this one is never used.
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.slice(1)}@phone.crop-guardian.invalid`,
        getTempName: (phone) => phone,
      },
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
