import { runAlerts } from '@/lib/alertRun'

// Sends the afternoon SMS risk alerts. Vercel Cron calls it daily (vercel.json) with
// `Authorization: Bearer $CRON_SECRET`; nobody else may, since each SMS costs credit.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  // In development without a secret it can be run by hand; without SMS_GATE_* the SMS are only logged.
  const open = !secret && process.env.NODE_ENV === 'development'
  if (!open && (!secret || request.headers.get('authorization') !== `Bearer ${secret}`)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    return Response.json(await runAlerts())
  } catch (err) {
    console.error('Alert run failed:', err)
    return Response.json({ error: 'alert run failed' }, { status: 500 })
  }
}
