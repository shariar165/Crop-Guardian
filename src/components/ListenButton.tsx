'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { store } from '@/lib/deviceStore'
import { BENGALI_VOICE_STEPS } from '@/lib/guide'
import { SpeakerIcon, StopIcon } from './icons'

const TIP_SEEN_KEY = 'crop-guardian:voice-tip-seen'

type Variant = 'sand' | 'glass' | 'sky' | 'outline'

const VARIANT: Record<Variant, string> = {
  sand: 'h-11 px-3.5 rounded-full bg-sand text-ink text-[15px] font-semibold gap-1.5',
  glass: 'h-11 px-3.5 rounded-full bg-white/12 text-cream text-[15px] font-semibold gap-1.5',
  sky: 'h-11 px-3.5 rounded-full bg-white/78 text-ink text-[15px] font-semibold gap-1.5',
  outline: 'min-h-[66px] rounded-[20px] border-2 border-ink bg-transparent text-ink text-lg font-bold gap-2 justify-center',
}

export const bengaliVoice = (synth: SpeechSynthesis) => synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('bn'))

/**
 * Reads `text` aloud in Bengali using the browser's speech synthesis.
 * With `requireVoice`, it stays silent when no Bengali voice is installed. With `voiceTip`, the
 * first tap on a phone without one shows how to install it instead of reading with a voice that
 * can't say Bengali; later taps read with whatever voice there is.
 */
export default function ListenButton({
  text,
  label,
  variant = 'sand',
  className = '',
  requireVoice = false,
  voiceTip = false,
}: {
  text: string
  label: string
  variant?: Variant
  className?: string
  requireVoice?: boolean
  voiceTip?: boolean
}) {
  const [speaking, setSpeaking] = useState(false)
  const [tip, setTip] = useState(false)

  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    // Some browsers (Chrome) load voices asynchronously; asking for them starts the load.
    synth.getVoices()
    return () => synth.cancel()
  }, [])

  function toggle() {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const voice = bengaliVoice(synth)
    if (!voice && requireVoice) return
    // An empty list means the voices haven't loaded yet, not that there is no Bengali one.
    if (!voice && voiceTip && synth.getVoices().length > 0 && localStorage.getItem(TIP_SEEN_KEY) !== '1') {
      store(TIP_SEEN_KEY, '1')
      setTip(true)
      return
    }
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'bn-BD'
    if (voice) utterance.voice = voice
    utterance.rate = 0.9
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    synth.speak(utterance)
  }

  const Glyph = speaking ? StopIcon : SpeakerIcon
  return (
    <>
      <button
        type="button"
        aria-label={speaking ? 'পড়া থামান' : label}
        aria-pressed={speaking}
        onClick={toggle}
        className={`flex items-center border-0 ${VARIANT[variant]} ${className}`}
      >
        <Glyph size={variant === 'outline' ? 24 : 22} weight={variant === 'outline' ? 2.2 : 2} />
        {speaking ? 'থামান' : 'শুনুন'}
      </button>
      {tip && <VoiceTip onClose={() => setTip(false)} />}
    </>
  )
}

function VoiceTip({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 mx-auto flex max-w-[390px] items-end bg-black/50 p-3" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-tip-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-3 rounded-[20px] bg-cream p-4 text-ink"
      >
        <h2 id="voice-tip-title" className="m-0 font-display text-xl leading-[1.3] font-extrabold">
          ফোনে বাংলা কণ্ঠ নেই
        </h2>
        <p className="m-0 text-[15px] leading-[1.45]">একবার নামিয়ে নিলে «শুনুন» বাংলায় পড়বে:</p>
        <ol className="m-0 flex flex-col gap-1.5 pl-5 text-[15px] leading-[1.45]">
          {BENGALI_VOICE_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="flex items-center gap-3">
          <button type="button" autoFocus onClick={onClose} className="h-12 flex-1 rounded-full border-0 bg-sun text-base font-bold text-ink">
            ঠিক আছে
          </button>
          <Link href="/guide#listen" className="text-[15px] font-bold text-teal">
            নির্দেশিকায় দেখুন
          </Link>
        </div>
      </div>
    </div>
  )
}
