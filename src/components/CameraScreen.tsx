'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import CameraControls from '@/components/CameraControls'
import { CameraIcon, CheckIcon, ClockIcon, OfflineIcon, RestartIcon, WarnIcon } from '@/components/icons'
import { ViewfinderBackdrop, ViewfinderOutline } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'
import { toBnDigits } from '@/lib/bn'
import { clearCaptures, saveCapture, saveDiagnosis } from '@/lib/captureStore'
import type { Capture } from '@/lib/captureStore'
import { diagnose, loadModel, type ModelState, whenReady } from '@/lib/diagnosis/client'
import { combine } from '@/lib/diagnosis/combine'
import { type Mock, MOCK_RESULT, RESULT_PATH, withMock } from '@/lib/diagnosis/mock'
import { ANALYSIS_WIDTH, assessQuality, confirmText, coverSourceRect, isAcceptable, topHint } from '@/lib/imageQuality'
import type { QualityReport } from '@/lib/imageQuality'

// Saved photos: longest side in px, and JPEG quality.
const MAX_SIDE = 1024
const JPEG_QUALITY = 0.85
const ANALYSIS_INTERVAL_MS = 300

type Status = 'starting' | 'live' | 'denied' | 'unsupported'
type Step = 1 | 2
type Crop = { sx: number; sy: number; sw: number; sh: number }

const STEPS: Record<Step, { title: string; sub: string; counter: string }> = {
  1: { title: 'পাতার উপরের দিকটা তুলুন', sub: 'পুরো পাতা ফ্রেমের ভেতরে রাখুন', counter: 'পাতার উপরের দিক' },
  2: { title: 'এবার পাতার নিচের দিকটা তুলুন', sub: 'দাগ চিনতে নিচের দিকটা জরুরি', counter: 'উপরের দিক তোলা হয়েছে' },
}

const LIGHT_LABEL = { ok: 'আলো ভালো', dark: 'আলো কম', bright: 'আলো বেশি' }
const LEAF_LABEL = { ok: 'দূরত্ব ঠিক', far: 'কাছে আনুন', absent: 'পাতা নেই' }
const FOCUS_LABEL = { ok: 'ফোকাস ঠিক', blurry: 'স্থির রাখুন' }

type Pill = { label: string; state: 'ok' | 'warn' | 'wait' }

function pills(r: QualityReport | null): Pill[] {
  if (!r) return ['আলো', 'দূরত্ব', 'ফোকাস'].map((l) => ({ label: `${l} দেখছি…`, state: 'wait' }))
  return [
    { label: LIGHT_LABEL[r.light], state: r.light === 'ok' ? 'ok' : 'warn' },
    { label: LEAF_LABEL[r.leaf], state: r.leaf === 'ok' ? 'ok' : 'warn' },
    { label: FOCUS_LABEL[r.focus], state: r.focus === 'ok' ? 'ok' : 'warn' },
  ]
}

function ModelStatus({ state, onRetry }: { state: ModelState; onRetry: () => void }) {
  if (state.phase === 'ready') {
    return (
      <div className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-[#CDBFA9]">
        <OfflineIcon size={16} />
        নেট ছাড়াও চলবে
      </div>
    )
  }
  if (state.phase === 'error') {
    return (
      <div role="alert" className="flex items-center justify-center gap-2 text-[13px] font-semibold text-[#F3CE5B]">
        <WarnIcon size={16} />
        {state.offline ? 'প্রথমবার মডেল নামাতে নেট লাগবে' : 'মডেল চালু হলো না'}
        <button type="button" onClick={onRetry} className="h-8 rounded-full border-0 bg-sun px-3 text-[13px] font-bold text-ink">
          আবার চেষ্টা
        </button>
      </div>
    )
  }
  const pct = state.phase === 'downloading' && state.total > 0 ? Math.floor((state.loaded / state.total) * 100) : null
  const size = state.phase === 'downloading' && state.total === 0 ? ` · ${toBnDigits(Math.round(state.loaded / 1e6))} MB` : ''
  return (
    <div className="flex flex-col items-center gap-1.5" aria-live="polite">
      <span className="text-[13px] font-medium text-[#CDBFA9]">
        {state.phase === 'downloading'
          ? `মডেল নামাচ্ছি… একবারই লাগবে${pct === null ? size : ` · ${toBnDigits(pct)}%`}`
          : 'মডেল চালু হচ্ছে…'}
      </span>
      {pct !== null && (
        <span className="h-1.5 w-40 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <span className="block h-full rounded-full bg-sun transition-[width]" style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  )
}

// The part of the video frame the farmer actually sees in the (object-cover) viewfinder.
function visibleCrop(video: HTMLVideoElement): Crop {
  return coverSourceRect(video.videoWidth, video.videoHeight, video.clientWidth, video.clientHeight)
}

function drawScaled(source: CanvasImageSource, crop: Crop, width: number, canvas = document.createElement('canvas')) {
  const height = Math.max(1, Math.round((width * crop.sh) / crop.sw))
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas unavailable')
  ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height)
  return { canvas, ctx, height }
}

/** Compresses the cropped image to a JPEG and checks the quality of what was actually captured. */
async function makeCapture(source: CanvasImageSource, crop: Crop): Promise<Capture> {
  const width = Math.round(crop.sw * Math.min(1, MAX_SIDE / Math.max(crop.sw, crop.sh)))
  const { canvas } = drawScaled(source, crop, width)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  if (!blob) throw new Error('JPEG encoding failed')
  const small = drawScaled(canvas, { sx: 0, sy: 0, sw: canvas.width, sh: canvas.height }, ANALYSIS_WIDTH)
  const quality = assessQuality(small.ctx.getImageData(0, 0, ANALYSIS_WIDTH, small.height))
  return { blob, takenAt: Date.now(), quality }
}

export default function CameraScreen({ mock }: { mock?: Mock }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('starting')
  const [attempt, setAttempt] = useState(0)
  const [report, setReport] = useState<QualityReport | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Capture | null>(null)
  const [model, setModel] = useState<ModelState>({ phase: 'loading' })
  const [analysis, setAnalysis] = useState<'idle' | 'running' | 'failed'>('idle')
  const photos = useRef<Partial<Record<'top' | 'under', Capture>>>({})

  // Load (or download, the first time) the model while the farmer takes the photos. Demos don't need it.
  useEffect(() => (mock ? undefined : loadModel(setModel)), [mock])

  // Each visit starts a fresh pair of photos.
  useEffect(() => {
    clearCaptures().catch(() => {})
  }, [])

  useEffect(() => {
    const video = videoRef.current
    let cancelled = false
    let stream: MediaStream | null = null

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('getUserMedia unavailable', 'NotSupportedError')
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
    }

    start().then(
      (s) => {
        stream = s
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        if (video) {
          video.srcObject = s
          video.play().catch(() => {})
        }
        setStatus('live')
      },
      (err: unknown) => {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
      },
    )

    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      if (video) video.srcObject = null
    }
  }, [attempt])

  // Live quality checks on a small copy of the visible frame.
  useEffect(() => {
    if (status !== 'live' || pending) return
    const canvas = document.createElement('canvas')
    const id = setInterval(() => {
      const video = videoRef.current
      if (!video || video.readyState < 2 || !video.videoWidth || document.hidden) return
      const { ctx, height } = drawScaled(video, visibleCrop(video), ANALYSIS_WIDTH, canvas)
      const r = assessQuality(ctx.getImageData(0, 0, ANALYSIS_WIDTH, height))
      if (process.env.NODE_ENV === 'development') {
        console.debug('[quality]', { luma: Math.round(r.luma), sharpness: Math.round(r.sharpness), green: r.green.toFixed(2) })
      }
      setReport(r)
    }, ANALYSIS_INTERVAL_MS)
    return () => clearInterval(id)
  }, [status, pending])

  // Diagnoses each photo on its own, combines them, and opens the matching result screen.
  async function analyse() {
    if (mock) return router.push(withMock(RESULT_PATH[MOCK_RESULT[mock]], mock))
    const { top, under } = photos.current
    if (!top || !under) return
    setAnalysis('running')
    try {
      const config = await whenReady()
      const result = combine(await diagnose(top.blob), await diagnose(under.blob), config)
      await saveDiagnosis({ createdAt: Date.now(), result, answers: [] })
      router.push(RESULT_PATH[result.decision])
    } catch (err) {
      console.error('Diagnosis failed', err)
      setAnalysis('failed')
    }
  }

  async function keep(capture: Capture) {
    setPending(null)
    const slot = step === 1 ? 'top' : 'under'
    photos.current[slot] = capture
    try {
      await saveCapture(slot, capture)
    } catch (err) {
      console.error('Could not save the photo', err)
    }
    if (step === 1) {
      setStep(2)
      setBusy(false)
    } else {
      analyse()
    }
  }

  async function take(getCapture: () => Promise<Capture>) {
    if (busy) return
    setBusy(true)
    try {
      const capture = await getCapture()
      if (isAcceptable(capture.quality)) return keep(capture)
      setPending(capture)
    } catch (err) {
      console.error('Could not take the photo', err)
    }
    setBusy(false)
  }

  function onShutter() {
    const video = videoRef.current
    if (status !== 'live' || !video?.videoWidth) {
      fileRef.current?.click()
      return
    }
    take(() => makeCapture(video, visibleCrop(video)))
  }

  function onPickFile(file: File) {
    take(async () => {
      const bitmap = await createImageBitmap(file)
      try {
        return await makeCapture(bitmap, { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height })
      } finally {
        bitmap.close()
      }
    })
  }

  function retry() {
    setStatus('starting')
    setAttempt((a) => a + 1)
  }

  const live = status === 'live'
  const { title: stepTitle, sub, counter } = STEPS[step]
  const hint = live && report ? topHint(report) : null
  const title = hint ?? stepTitle
  const HintGlyph = hint ? WarnIcon : step === 2 ? RestartIcon : CameraIcon
  const speech = `${title}। ${hint ? stepTitle + '। ' : ''}${sub}। ছবি ${toBnDigits(step)} এর ২।`

  return (
    <div className="flex flex-1 flex-col bg-night text-cream">
      <TopBar
        back="/"
        title="পাতার ছবি"
        height={72}
        dark
        right={<ListenButton variant="glass" label="নির্দেশনা পড়ে শোনান" text={speech} requireVoice />}
      />

      <div className="relative mx-3 h-[540px] shrink-0 overflow-hidden rounded-3xl bg-[#1F2A17]">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 size-full object-cover" />
        {!live && <ViewfinderBackdrop />}
        <ViewfinderOutline className="absolute top-[104px] left-1/2 h-[380px] w-[300px] -translate-x-1/2" />

        <div
          className="absolute top-3.5 right-3.5 left-3.5 flex items-center gap-2.5 rounded-2xl bg-sun px-3.5 py-3 text-ink"
          aria-live="polite"
        >
          <HintGlyph size={30} weight={2.2} />
          <div className="flex flex-col leading-[1.3]">
            <span className="font-display text-lg font-extrabold">{title}</span>
            <span className="text-sm font-medium">{hint ? stepTitle : sub}</span>
          </div>
        </div>

        {(status === 'denied' || status === 'unsupported') && (
          <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 rounded-2xl bg-[rgba(23,18,14,0.88)] p-5 text-center">
            <CameraIcon size={36} />
            <p className="m-0 font-display text-xl font-extrabold">
              {status === 'denied' ? 'ক্যামেরার অনুমতি দিন' : 'লাইভ ক্যামেরা চালু হচ্ছে না'}
            </p>
            <p className="m-0 text-sm leading-[1.45] text-[#CDBFA9]">
              {status === 'denied'
                ? 'ব্রাউজারের ঠিকানার পাশে ক্যামেরা চিহ্নে চাপ দিয়ে অনুমতি দিন, তারপর আবার চেষ্টা করুন।'
                : 'নিচের বোতাম চেপে ফোনের ক্যামেরা দিয়ে ছবি তুলুন।'}
            </p>
            {status === 'denied' && (
              <button
                type="button"
                onClick={retry}
                className="flex h-12 items-center gap-2 rounded-full border-0 bg-sun px-5 text-base font-bold text-ink"
              >
                <RestartIcon size={20} />
                আবার চেষ্টা করুন
              </button>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-12 items-center gap-2 rounded-full border-2 border-cream/60 bg-transparent px-5 text-base font-bold text-cream"
            >
              <CameraIcon size={20} />
              ছবি তুলুন
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) onPickFile(file)
          }}
        />

        {live && (
          <ul className="absolute right-3.5 bottom-3.5 left-3.5 m-0 flex list-none flex-wrap gap-2 p-0">
            {pills(report).map((p) => (
              <li
                key={p.label}
                className={`flex h-9 items-center gap-[5px] rounded-full bg-[rgba(23,18,14,0.82)] px-3 text-sm font-semibold ${
                  p.state === 'ok' ? 'text-[#BFE3B4]' : 'text-[#F3CE5B]'
                }`}
              >
                {p.state === 'ok' ? (
                  <CheckIcon size={18} weight={2.6} />
                ) : p.state === 'warn' ? (
                  <WarnIcon size={18} weight={2.2} />
                ) : (
                  <ClockIcon size={18} weight={2.2} className="animate-spin [animation-duration:3s]" />
                )}
                {p.label}
              </li>
            ))}
          </ul>
        )}

        {analysis !== 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(23,18,14,0.82)] p-6" aria-live="assertive">
            {analysis === 'running' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <ClockIcon size={40} weight={2.2} className="animate-spin [animation-duration:3s]" />
                <span className="font-display text-2xl font-extrabold">পাতা দেখছি…</span>
                {model.phase === 'downloading' && <span className="text-sm text-[#CDBFA9]">মডেল নামানো শেষ হলেই দেখব</span>}
              </div>
            ) : (
              <div role="alert" className="flex flex-col items-center gap-3 text-center">
                <WarnIcon size={36} />
                <span className="font-display text-xl font-extrabold">
                  {model.phase === 'error' && model.offline ? 'প্রথমবার মডেল নামাতে নেট লাগবে' : 'ছবি দেখা গেল না'}
                </span>
                <span className="text-sm leading-[1.45] text-[#CDBFA9]">ছবি দুটো রাখা আছে। নেট চালু করে আবার চেষ্টা করুন।</span>
                <button
                  type="button"
                  onClick={analyse}
                  className="flex h-12 items-center gap-2 rounded-full border-0 bg-sun px-5 text-base font-bold text-ink"
                >
                  <RestartIcon size={20} />
                  আবার চেষ্টা করুন
                </button>
              </div>
            )}
          </div>
        )}

        {pending && (
          <div className="absolute inset-0 flex items-end bg-black/55 p-3.5">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              className="flex w-full flex-col gap-3 rounded-2xl bg-cream p-4 text-ink"
            >
              <div className="flex items-center gap-2.5">
                <WarnIcon size={28} weight={2.2} />
                <span id="confirm-title" className="font-display text-lg leading-[1.3] font-extrabold">
                  {confirmText(pending.quality)}
                </span>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setPending(null)}
                  className="h-12 flex-1 rounded-full border-0 bg-sun text-base font-bold text-ink"
                >
                  আবার তুলুন
                </button>
                <button
                  type="button"
                  onClick={() => keep(pending)}
                  className="h-12 flex-1 rounded-full border-2 border-ink bg-transparent text-base font-bold text-ink"
                >
                  তবুও রাখুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 px-6 pt-3 pb-2.5">
        <div className="flex items-center justify-center gap-2 text-[15px] font-semibold">
          {([1, 2] as const).map((n) => (
            <span
              key={n}
              aria-hidden="true"
              className={`box-border size-2.5 rounded-full ${n < step ? 'bg-sun' : 'border-2 border-sun'}`}
            />
          ))}
          <span>
            ছবি {toBnDigits(step)} / ২ · {counter}
          </span>
        </div>
        <CameraControls onShutter={onShutter} onPickFile={onPickFile} busy={busy || !!pending} />
        {!mock && <ModelStatus state={model} onRetry={() => loadModel(setModel)} />}
      </div>
    </div>
  )
}
