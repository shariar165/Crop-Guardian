import Link from 'next/link'
import { outlineClass } from '@/components/Buttons'
import { CameraIcon, CheckIcon, SearchIcon, SendIcon, SyncIcon } from '@/components/icons'
import { UnknownArt } from '@/components/illustrations'
import ListenButton from '@/components/ListenButton'
import TopBar from '@/components/TopBar'

export const metadata = { title: 'চিনতে পারিনি — Crop Guardian' }

const SPEECH =
  'এটা আমি চিনতে পারছি না। ভুল পরামর্শ দেওয়ার চেয়ে সৎভাবে না বলা ভালো। দাগগুলো আমার জানা ১২টা সমস্যার কোনোটার সাথে মিলছে না। কৃষি কর্মকর্তাকে পাঠান, অথবা আবার ছবি তুলুন।'

export default function UnknownPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/camera" title="ফলাফল" right={<ListenButton text={SPEECH} label="পড়ে শোনান" />} />

      <div className="flex shrink-0 justify-center pt-2">
        <UnknownArt />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1.5 px-6 pt-2.5 text-center">
        <h1 className="m-0 font-display text-[30px] leading-[1.15] font-extrabold">এটা আমি চিনতে পারছি না</h1>
        <p className="m-0 text-base leading-[1.45] text-[#4A3B2F]">ভুল পরামর্শ দেওয়ার চেয়ে সৎভাবে না বলা ভালো।</p>
      </div>

      <section className="stitch-lg mx-4 mt-4 flex shrink-0 flex-col gap-2.5 rounded-[20px] px-4 py-3.5">
        <h2 className="m-0 font-display text-lg font-bold">কেন?</h2>
        <div className="flex items-start gap-2.5">
          <SearchIcon size={22} weight={2.2} className="mt-px text-amber" />
          <span className="text-[15px] leading-[1.45]">দাগগুলো আমার জানা ১২টা সমস্যার কোনোটার সাথে মিলছে না</span>
        </div>
        <div className="flex items-start gap-2.5">
          <CheckIcon size={22} weight={2.4} className="mt-px text-leaf" />
          <span className="text-[15px] leading-[1.45]">ছবি পরিষ্কার ছিল, তাই এটা নতুন ধরনের সমস্যা হতে পারে</span>
        </div>
      </section>

      <div className="mx-4 mt-3 flex shrink-0 items-center gap-2.5 rounded-2xl bg-mist px-3.5 py-2.5 text-teal-deep">
        <SyncIcon size={26} />
        <span className="text-sm leading-[1.4] font-medium">
          কর্মকর্তা নিশ্চিত করলে আমি এটা শিখে নেব, আপনার এলাকায় পরের বার চিনতে পারব।
        </span>
      </div>

      <div className="min-h-4 flex-1" />

      <div className="flex shrink-0 flex-col gap-2.5 px-4 pb-[18px]">
        <button
          type="button"
          className="flex min-h-[72px] items-center justify-center gap-3 rounded-[20px] border-0 bg-teal px-4 py-2 text-white shadow-[0_4px_0_#133C44]"
        >
          <SendIcon size={28} weight={2.2} />
          <span className="flex flex-col items-start leading-[1.2]">
            <span className="font-display text-xl font-extrabold">কৃষি কর্মকর্তাকে পাঠান</span>
            <span className="text-[13px] font-medium text-[#D4E6E3]">উপসহকারী কৃষি কর্মকর্তা · [নাম]</span>
          </span>
        </button>
        <Link href="/camera" className={`${outlineClass} min-h-[58px] gap-2.5 text-lg font-bold`}>
          <CameraIcon size={24} weight={2.2} />
          আবার ছবি তুলুন
        </Link>
      </div>
    </div>
  )
}
