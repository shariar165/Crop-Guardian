import { insertCase, type PhotoSlot } from '@/lib/caseDb'
import { isJpeg, MAX_PHOTO_BYTES, parseCaseUpload } from '@/lib/cases'
import { getSession } from '@/lib/auth/session'

// A farmer's case from the phone: multipart with "case" (JSON, see src/lib/cases.ts) and up to two
// JPEGs, "top" and "under". Signed-in users only, so the officer knows whom to call back.
export async function POST(request: Request) {
  // Without the database there are no sessions either; the phone keeps the case and tries again later.
  const session = await getSession().catch((err) => {
    console.error('Session check failed', err)
    return undefined
  })
  if (session === undefined) return Response.json({ error: 'Cases are unavailable right now' }, { status: 503 })
  if (!session) return Response.json({ error: 'Sign in to send cases' }, { status: 401 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  let json: unknown
  try {
    json = JSON.parse(String(form.get('case') ?? ''))
  } catch {
    return Response.json({ error: 'case must be JSON' }, { status: 400 })
  }
  const upload = parseCaseUpload(json)
  if ('error' in upload) return Response.json({ error: upload.error }, { status: 400 })

  const photos: Partial<Record<PhotoSlot, Buffer>> = {}
  for (const slot of ['top', 'under'] as const) {
    const file = form.get(slot)
    if (file === null) continue
    if (!(file instanceof Blob) || file.size > MAX_PHOTO_BYTES) {
      return Response.json({ error: `${slot} must be a JPEG under ${MAX_PHOTO_BYTES} bytes` }, { status: 400 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    if (!isJpeg(bytes)) return Response.json({ error: `${slot} must be a JPEG` }, { status: 400 })
    photos[slot] = bytes
  }

  try {
    const id = await insertCase(session.user.id, upload, photos)
    return Response.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Could not save the case', err)
    return Response.json({ error: 'Could not save the case' }, { status: 500 })
  }
}
