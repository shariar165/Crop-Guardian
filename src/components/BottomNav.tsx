'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CameraIcon, HomeIcon, LedgerIcon, MapIcon } from './icons'

const ITEMS = [
  { href: '/', label: 'হোম', Icon: HomeIcon },
  { href: '/camera', label: 'ছবি', Icon: CameraIcon },
  { href: '/map', label: 'ম্যাপ', Icon: MapIcon },
  { href: '/ledger', label: 'হিসাব', Icon: LedgerIcon },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="মূল মেনু"
      className="grid h-[72px] shrink-0 grid-cols-4 border-t-[1.5px] border-dashed border-stitch bg-paper pb-[env(safe-area-inset-bottom)]"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-[13px] no-underline ${
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
