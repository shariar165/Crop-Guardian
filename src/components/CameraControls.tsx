'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { CameraIcon, FlashIcon, GalleryIcon } from './icons'

export default function CameraControls() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label="গ্যালারি থেকে ছবি নিন"
        onClick={() => fileRef.current?.click()}
        className="flex size-[58px] items-center justify-center rounded-[18px] border-2 border-white/25 bg-[#2E4A2A] text-cream"
      >
        <GalleryIcon size={26} />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.length) router.push('/result/uncertain')
        }}
      />
      <Link
        href="/result/uncertain"
        aria-label="ছবি তুলুন"
        className="box-border flex size-[86px] items-center justify-center rounded-full border-[5px] border-sun no-underline active:scale-95"
      >
        <span className="flex size-[66px] items-center justify-center rounded-full bg-cream text-ink">
          <CameraIcon size={28} weight={2.2} />
        </span>
      </Link>
      <button
        type="button"
        aria-label="ফ্ল্যাশ চালু করুন"
        className="flex size-[58px] items-center justify-center rounded-[18px] border-2 border-white/25 bg-transparent text-cream"
      >
        <FlashIcon size={26} />
      </button>
    </div>
  )
}
