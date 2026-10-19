'use client'

import { useEffect, useState } from 'react'
import { PhotoLeaf } from '@/components/illustrations'
import { getCapture } from '@/lib/captureStore'

const LABEL = 'text-[11px] font-semibold text-[#F1E8D6]'

/** The farmer's top-of-leaf photo from the camera screen, or the sample drawing if there isn't one. */
export default function CapturedThumb() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    getCapture('top')
      .then((capture) => {
        if (cancelled || !capture) return
        objectUrl = URL.createObjectURL(capture.blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  if (!url) {
    return (
      <>
        <PhotoLeaf />
        <span className={LABEL}>আপনার ছবি</span>
      </>
    )
  }
  return (
    <>
      {/* A blob: URL can't go through next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="আপনার তোলা পাতার ছবি" className="absolute inset-0 size-full object-cover" />
      <span className={`absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center ${LABEL}`}>আপনার ছবি</span>
    </>
  )
}
