// Keeps every weather download of a backtest run on disk (.cache/, gitignored), so a run that is
// stopped picks up from what it already has, and a rerun fetches nothing. Past weather doesn't
// change, so nothing expires: delete .cache/ to fetch afresh.
// NOAA ISD station-years go to .cache/isd/<year>/<id>.csv (a file NOAA doesn't have is remembered as
// <id>.csv.missing); everything else to .cache/http/<sha1 of the URL>.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = '.cache'
const ISD = /noaa-global-hourly-pds\.s3\.amazonaws\.com\/(\d{4})\/(\d+)\.csv$/

export function cachePath(url: string): string {
  const isd = url.match(ISD)
  if (isd) return join(ROOT, 'isd', isd[1], `${isd[2]}.csv`)
  return join(ROOT, 'http', createHash('sha1').update(url).digest('hex'))
}

const urlOf = (input: string | URL | Request) => (typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)

// Wraps the global fetch for this process. Only complete, successful bodies are written (to a .part
// file renamed into place), so a download cut off midway is fetched again next time.
export function cacheFetches(): void {
  const realFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const file = cachePath(urlOf(input))
    if (existsSync(file)) return new Response(new Uint8Array(readFileSync(file)))
    if (existsSync(`${file}.missing`)) return new Response(null, { status: 404 })
    const res = await realFetch(input, init)
    mkdirSync(dirname(file), { recursive: true })
    if (res.status === 404 && ISD.test(urlOf(input))) {
      writeFileSync(`${file}.missing`, '')
      return res
    }
    if (!res.ok) return res
    const body = new Uint8Array(await res.arrayBuffer())
    writeFileSync(`${file}.part`, body)
    renameSync(`${file}.part`, file)
    return new Response(body)
  }
}
