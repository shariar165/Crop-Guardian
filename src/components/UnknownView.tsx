'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { outlineClass } from '@/components/Buttons'
import { Loading, NoDiagnosis, ValidationBadge, WhyCard } from '@/components/DiagnosisParts'
import { CameraIcon, CheckIcon, SearchIcon, SendIcon, WarnIcon } from '@/components/icons'
import { UnknownArt } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import OfficerShareButton from '@/components/OfficerShareButton'
import TopBar from '@/components/TopBar'
import { getCapture } from '@/lib/captureStore'
import { CONFIDENCE_WORD, knownList } from '@/lib/diagnosis/explain'
import type { Mock } from '@/lib/diagnosis/mock'
import { useDiagnosis } from '@/lib/diagnosis/useDiagnosis'
import { isAcceptable } from '@/lib/imageQuality'

// Whether both photos passed the light, focus and leaf checks; null until known (or in demos).
function usePhotosClear(enabled: boolean): boolean | null {
  const [clear, setClear] = useState<boolean | null>(null)
  useEffect(() => {
    if (!enabled) return
    Promise.all([getCapture('top'), getCapture('under')])
      .then((caps) => setClear(caps.every((c) => c && isAcceptable(c.quality))))
      .catch(() => {})
  }, [enabled])
  return clear
}

export default function UnknownView({ mock }: { mock?: Mock }) {
  const view = useDiagnosis(mock)
  const clear = usePhotosClear(!mock)
  if (view.status === 'loading') return <Loading />
  if (view.status === 'empty') return <NoDiagnosis />

  const { config, record } = view
  const known = `আমি শুধু চিনি: ${knownList(config)}`
  const photoNote =
    clear === null ? null : clear ? 'ছবি পরিষ্কার ছিল, তাই এটা অন্য কোনো সমস্যা হতে পারে' : 'ছবি পুরো পরিষ্কার ছিল না — আলোয় স্থির হাতে আবার তুলে দেখুন'
  const speech = `এটা আমি চিনতে পারছি না। ভুল পরামর্শ দেওয়ার চেয়ে সৎভাবে না বলা ভালো। ${known}। ${photoNote ? photoNote + '। ' : ''}কৃষি কর্মকর্তাকে পাঠান, অথবা আবার ছবি তুলুন।`

  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/camera" title="ফলাফল" right={<ListenButton text={speech} label="পড়ে শোনান" />} />

      <div className="flex shrink-0 justify-center pt-2">
        <UnknownArt />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5 px-6 pt-2.5 text-center">
        <h1 className="m-0 font-display text-[30px] leading-[1.15] font-extrabold">এটা আমি চিনতে পারছি না</h1>
        <p className="m-0 text-base leading-[1.45] text-[#4A3B2F]">ভুল পরামর্শ দেওয়ার চেয়ে সৎভাবে না বলা ভালো।</p>
        <ValidationBadge className="self-center" />
      </div>

      <section className="stitch-lg mx-4 mt-4 flex shrink-0 flex-col gap-2.5 rounded-[20px] px-4 py-3.5">
        <h2 className="m-0 font-display text-lg font-bold">কেন?</h2>
        <div className="flex items-start gap-2.5">
          <SearchIcon size={22} weight={2.2} className="mt-px text-amber" />
          <span className="text-[15px] leading-[1.45]">{known}। ছবি এগুলোর কোনোটার সাথে যথেষ্ট মেলেনি</span>
        </div>
        {photoNote && (
          <div className="flex items-start gap-2.5">
            {clear ? (
              <CheckIcon size={22} weight={2.4} className="mt-px text-leaf" />
            ) : (
              <WarnIcon size={22} weight={2.2} className="mt-px text-amber" />
            )}
            <span className="text-[15px] leading-[1.45]">{photoNote}</span>
          </div>
        )}
      </section>

      <WhyCard record={record} config={config} title={`ছবি আর আবহাওয়া · ${CONFIDENCE_WORD.unknown}`} photos={!mock} />

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2.5 px-4 pt-3 pb-[18px]">
        <OfficerShareButton
          record={record}
          config={config}
          demo={!!mock}
          className="flex min-h-[72px] items-center justify-center gap-3 rounded-[20px] border-0 bg-teal px-4 py-2 text-white shadow-[0_4px_0_#133C44]"
        >
          <SendIcon size={28} weight={2.2} />
          <span className="flex flex-col items-start leading-[1.2]">
            <span className="font-display text-xl font-extrabold">কৃষি কর্মকর্তাকে পাঠান</span>
            <span className="text-[13px] font-medium text-[#D4E6E3]">উপসহকারী কৃষি কর্মকর্তা</span>
          </span>
        </OfficerShareButton>
        <Link href="/camera" className={`${outlineClass} min-h-[58px] gap-2.5 text-lg font-bold`}>
          <CameraIcon size={24} weight={2.2} />
          আবার ছবি তুলুন
        </Link>
      </div>
    </div>
  )
}
