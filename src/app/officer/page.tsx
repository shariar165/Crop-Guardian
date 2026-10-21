import { DocIcon } from '@/components/icons'
import TopBar from '@/components/TopBar'
import { requireOfficer } from '@/lib/auth/session'
import { bnDate } from '@/lib/bn'
import { listCases, type OfficerCase } from '@/lib/caseDb'
import type { Verdict } from '@/lib/cases'
import { LOCAL_TZ } from '@/lib/dates'
import { parseConfig } from '@/lib/diagnosis/config'
import { CONFIDENCE_WORD, labelOf, orList } from '@/lib/diagnosis/explain'
import { answerLine } from '@/lib/diagnosis/questions'
import { formatBdPhone } from '@/lib/phone'
import { fullName, unionById } from '@/lib/areas'
import rawConfig from '../../../public/model/crop_guardian_config.json'
import { reviewCase } from './actions'

export const metadata = { title: 'কৃষি কর্মকর্তা — Crop Guardian' }

const config = parseConfig(rawConfig)

const VERDICT_LABEL: Record<Verdict, string> = { late_blight: 'নাবি ধসা নিশ্চিত', not_late_blight: 'নাবি ধসা নয়' }

function appResult(c: OfficerCase): string {
  if (c.decision === 'confident') return `${CONFIDENCE_WORD.confident} — ${labelOf(c.candidates[0], config)}`
  if (c.decision === 'uncertain') {
    const narrowed = c.finalId ? ` (উত্তর মিলিয়ে: ${labelOf(c.finalId, config)})` : ''
    return `${CONFIDENCE_WORD.uncertain} — ${orList(c.candidates, config)}${narrowed}`
  }
  return CONFIDENCE_WORD.unknown
}

const sentOn = (d: Date) => bnDate(new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL_TZ }).format(d))

function CaseCard({ c }: { c: OfficerCase }) {
  const union = unionById(c.unionId)
  const photos = (['top', 'under'] as const).filter((slot) => (slot === 'top' ? c.hasTop : c.hasUnder))
  return (
    <li className="stitch flex flex-col gap-2.5 rounded-[20px] p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="font-display text-lg font-extrabold">{union ? fullName(union) : 'ইউনিয়ন জানা নেই'}</span>
        <span className="text-[13px] font-semibold text-muted">{sentOn(c.sentAt)}</span>
      </div>
      {c.phone && (
        <a href={`tel:${c.phone}`} className="self-start text-[15px] font-bold text-teal">
          {formatBdPhone(c.phone)}
        </a>
      )}
      <p className="m-0 text-[15px] leading-[1.4]">
        <span className="font-semibold text-muted">অ্যাপের ফল: </span>
        {appResult(c)}
      </p>
      {c.answers.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-sm leading-[1.4]">
          {c.answers.map((a) => (
            <li key={a.question}>{answerLine(a)}</li>
          ))}
        </ul>
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((slot) => (
            <a key={slot} href={`/api/cases/${c.id}/photo/${slot}`} target="_blank" rel="noreferrer">
              {/* Served from the database to officers only, so not through next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/cases/${c.id}/photo/${slot}`}
                alt={slot === 'top' ? 'পাতার উপরের দিক' : 'পাতার নিচের দিক'}
                loading="lazy"
                className="aspect-square w-full rounded-xl bg-[#1F2A17] object-cover"
              />
            </a>
          ))}
        </div>
      )}
      {c.verdict ? (
        <form action={reviewCase} className="flex items-center justify-between gap-2">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="verdict" value="" />
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              c.verdict === 'late_blight' ? 'bg-danger-soft text-danger-deep' : 'bg-leaf-soft text-leaf'
            }`}
          >
            {VERDICT_LABEL[c.verdict]}
          </span>
          <button type="submit" className="border-0 bg-transparent p-0 text-sm font-bold text-teal underline">
            বদলান
          </button>
        </form>
      ) : (
        <form action={reviewCase} className="grid grid-cols-2 gap-2">
          <input type="hidden" name="id" value={c.id} />
          <button
            type="submit"
            name="verdict"
            value="late_blight"
            className="min-h-12 rounded-[14px] border-0 bg-danger px-2 text-[15px] font-bold text-white"
          >
            {VERDICT_LABEL.late_blight}
          </button>
          <button
            type="submit"
            name="verdict"
            value="not_late_blight"
            className="min-h-12 rounded-[14px] border-2 border-ink bg-transparent px-2 text-[15px] font-bold text-ink"
          >
            {VERDICT_LABEL.not_late_blight}
          </button>
        </form>
      )}
    </li>
  )
}

// Agriculture officers only: the cases farmers sent, to check and confirm. Only confirmed late
// blight is counted on the map.
export default async function OfficerPage() {
  const { user } = await requireOfficer('/officer')
  let cases: OfficerCase[] | null = null
  try {
    cases = await listCases()
  } catch (err) {
    console.error('Could not list cases', err)
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/account" title="কৃষি কর্মকর্তা" right={<span className="size-11" />} />
      <div className="flex shrink-0 flex-col gap-3 px-4 pb-6">
        <p className="m-0 text-[15px] font-medium text-muted">ঢুকেছেন: {formatBdPhone(user.phoneNumber)}</p>
        <h1 className="m-0 font-display text-[23px] leading-[1.2] font-extrabold">কৃষকদের পাঠানো কেস</h1>
        <p className="m-0 text-sm leading-[1.45] text-muted">
          ছবি দেখে বা মাঠে গিয়ে যাচাই করুন। শুধু “নাবি ধসা নিশ্চিত” কেসগুলোই এলাকার ম্যাপে গোনা হয়।
        </p>
        {cases === null ? (
          <p role="alert" className="m-0 rounded-[16px] bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger-deep">
            কেসগুলো আনা যায়নি। একটু পরে আবার চেষ্টা করুন।
          </p>
        ) : cases.length === 0 ? (
          <section className="stitch flex flex-col items-center gap-3 rounded-[20px] px-4 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-mist text-teal">
              <DocIcon size={30} />
            </span>
            <p className="m-0 text-[15px] leading-[1.45]">এখনো কোনো কেস আসেনি। কৃষকেরা অ্যাপে ঢুকে ছবি পাঠালে এখানে দেখা যাবে।</p>
          </section>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
