'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HISTORY_TURNS, MAX_QUESTION } from '@/lib/assistant/guard'
import { store, useStored } from '@/lib/deviceStore'
import { primaryClass } from './Buttons'
import { SendIcon } from './icons'
import ListenButton from './ListenButton'

type Source = { id: string; title: string; source: string; href: string }
type Answer = { answer: string; sources: Source[]; escalate: boolean; note: string | null }
type Turn = { q: string; a: Answer }

const EXAMPLES = ['কুয়াশা পড়ছে, আলুতে কী করব?', 'আজ আমার এলাকায় ধসার ঝুঁকি কেমন?', 'আলু হিমাগারে কীভাবে রাখব?', 'ঢলে পড়া রোগ কীভাবে চিনব?']
const OFFLINE = 'নেট নেই। নেট এলে আবার জিজ্ঞেস করুন। ততক্ষণ «আলু চাষের পরামর্শ» পাতা নেট ছাড়াও খোলে।'
// Kept on this phone only, so earlier answers can be read again offline; nothing is kept on the server.
const STORE = 'cg-ask'
const KEPT_TURNS = 20

function parseTurns(raw: string | null): Turn[] {
  try {
    const turns = JSON.parse(raw ?? '[]')
    return Array.isArray(turns) ? turns : []
  } catch {
    return []
  }
}

export default function AskChat() {
  const raw = useStored(STORE)
  const turns = useMemo(() => parseTurns(raw), [raw])
  const [input, setInput] = useState('')
  // The question being answered, shown until the answer arrives.
  const [pending, setPending] = useState<string | null>(null)
  const busy = pending !== null
  // The question box; scrolled to after each turn, so the newest answer sits just above it.
  const box = useRef<HTMLFormElement>(null)

  useEffect(() => box.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [turns, pending])

  async function send(question: string) {
    const q = question.trim()
    if (!q || busy) return
    setPending(q)
    setInput('')
    let a: Answer
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, history: turns.slice(-HISTORY_TURNS).map((t) => ({ q: t.q, a: t.a.answer })) }),
      })
      a = await res.json()
      if (typeof a.answer !== 'string') throw new Error('No answer')
    } catch {
      a = { answer: OFFLINE, sources: [], escalate: false, note: null }
    }
    store(STORE, JSON.stringify([...turns, { q, a }].slice(-KEPT_TURNS)))
    setPending(null)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pb-3">
        {turns.length === 0 && (
          <div className="stitch-lg flex flex-col gap-2.5 rounded-[20px] p-4">
            <p className="m-0 text-[16px] leading-[1.45]">
              আলুর রোগ, চাষ, ধানের ব্লাস্ট বা অ্যাপ নিয়ে প্রশ্ন লিখুন। অ্যাপের পরামর্শ থেকে উত্তর দেব, সাথে সূত্র।
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button key={e} type="button" onClick={() => send(e)} className="rounded-full border-0 bg-sand px-3 py-1.5 text-left text-[14px] font-semibold text-ink">
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className="flex flex-col gap-2">
            <p className="m-0 max-w-[85%] self-end rounded-[18px] rounded-br-[6px] bg-teal px-3.5 py-2.5 text-[16px] leading-[1.4] text-white">{t.q}</p>
            <div className="stitch-lg flex max-w-[92%] flex-col gap-2 rounded-[18px] rounded-bl-[6px] p-3.5">
              <p className="m-0 text-[16px] leading-[1.5]">{t.a.answer}</p>
              {t.a.sources.length > 0 && (
                <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px]">
                  {t.a.sources.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="font-semibold text-teal">
                        {s.title}
                      </Link>
                      <span className="text-muted"> · {s.source}</span>
                    </li>
                  ))}
                </ul>
              )}
              {t.a.escalate && (
                <div className="flex flex-wrap gap-2">
                  <Link href="/camera" className="rounded-full bg-sun px-3 py-1.5 text-[14px] font-bold text-ink no-underline">
                    পাতার ছবি তুলুন
                  </Link>
                </div>
              )}
              {t.a.note && <p className="m-0 text-[12px] leading-[1.4] text-muted">{t.a.note}</p>}
              <ListenButton text={t.a.answer} label="উত্তর পড়ে শোনান" className="self-start" />
            </div>
          </div>
        ))}

        {pending && (
          <>
            <p className="m-0 max-w-[85%] self-end rounded-[18px] rounded-br-[6px] bg-teal px-3.5 py-2.5 text-[16px] leading-[1.4] text-white">{pending}</p>
            <p role="status" className="m-0 self-start text-[15px] font-semibold text-muted">
              ভেবে দেখছি…
            </p>
          </>
        )}
        {turns.length > 0 && !pending && (
          <button type="button" onClick={() => store(STORE, null)} className="self-center border-0 bg-transparent text-[14px] font-semibold text-muted">
            আলাপ মুছে ফেলুন
          </button>
        )}
      </div>

      <div className="min-h-2 flex-1" />

      <form
        ref={box}
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex shrink-0 items-end gap-2 border-t-[1.5px] border-dashed border-stitch bg-paper px-4 py-3"
      >
        <label className="sr-only" htmlFor="ask-input">
          আপনার প্রশ্ন
        </label>
        <textarea
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_QUESTION}
          rows={2}
          placeholder="প্রশ্ন লিখুন…"
          className="min-h-14 flex-1 resize-none rounded-[14px] border-2 border-line bg-paper px-3 py-2 text-[17px] leading-[1.35] text-ink focus:border-teal focus:outline-none"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="পাঠান" className={`${primaryClass} size-14 shrink-0 disabled:opacity-50`}>
          <SendIcon size={24} weight={2.2} />
        </button>
      </form>
    </div>
  )
}
