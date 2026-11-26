'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CameraIcon, ChatQuestionIcon, HomeIcon, LedgerIcon, MapIcon } from './icons'

const ITEMS = [
  { href: '/', label: 'হোম', Icon: HomeIcon },
  { href: '/map', label: 'ম্যাপ', Icon: MapIcon },
  { href: '/camera', label: 'ছবি', Icon: CameraIcon, raised: true },
  { href: '/ledger', label: 'হিসাব', Icon: LedgerIcon },
  { href: '/ask', label: 'প্রশ্ন', Icon: ChatQuestionIcon },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      // mt-5: room for the raised camera button, so it never covers the last line of a page.
      aria-label="মূল মেনু"
      className="sticky bottom-0 z-10 mt-5 grid h-[72px] shrink-0 grid-cols-5 border-t-[1.5px] border-dashed border-stitch bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      {ITEMS.map(({ href, label, Icon, raised }) => {
        const active = pathname === href
        // The camera is the app's main job, so it is a big round button lifted above the bar.
        if (raised) {
          return (
            <Link key={href} href={href} className="relative flex flex-col items-center justify-end pb-2 text-sm leading-none font-bold text-ink no-underline">
              <span className="absolute -top-5 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full border-4 border-paper bg-sun shadow-[0_3px_0_#B8901C]">
                <Icon size={28} weight={2.2} />
              </span>
              {label}
            </Link>
          )
        }
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-sm no-underline ${
              active ? 'font-bold text-ink' : 'font-semibold text-muted-2'
            }`}
          >
            {active ? (
              <span className="flex h-[30px] w-[52px] items-center justify-center rounded-[15px] bg-sun">
                <Icon size={22} weight={2.2} />
              </span>
            ) : (
              <span className="flex h-[30px] items-center">
                <Icon size={22} />
              </span>
            )}
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
