import Link from 'next/link'
import AlertToggle from '@/components/AlertToggle'
import BottomNav from '@/components/BottomNav'
import { tealClass } from '@/components/Buttons'
import { PersonIcon } from '@/components/icons'
import SignOutButton from '@/components/SignOutButton'
import TopBar from '@/components/TopBar'
import { isRole, type Role } from '@/lib/auth/roles'
import { requireUser } from '@/lib/auth/session'
import { getAlert } from '@/lib/alertDb'
import { formatBdPhone } from '@/lib/phone'
import { getPlace } from '@/lib/place'

export const metadata = { title: 'আমার অ্যাকাউন্ট — Crop Guardian' }

const ROLE_LABEL: Record<Role, string> = { farmer: 'কৃষক', officer: 'কৃষি কর্মকর্তা' }

export default async function AccountPage() {
  const { user, showcase } = await requireUser('/account')
  const role = isRole(user.role) ? user.role : 'farmer'
  // The showcase officer has no phone to text. The account must open even if alerts can't be read.
  const [alert, place] = showcase
    ? [null, null]
    : await Promise.all([getAlert(user.id).catch((err) => (console.error('Alert read failed', err), null)), getPlace()])
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="আমার অ্যাকাউন্ট" right={<span className="size-11" />} />
      <div className="flex shrink-0 flex-col gap-4 px-4">
        <section className="stitch-lg flex items-center gap-3.5 rounded-[20px] p-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mist text-teal">
            <PersonIcon size={30} />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-muted">{ROLE_LABEL[role]}</span>
            <span className="font-display text-[23px] font-extrabold">{formatBdPhone(user.phoneNumber)}</span>
          </div>
        </section>
        {place && <AlertToggle enabled={alert?.enabled === true} place={place.union ? place.name : null} />}
        {role === 'officer' && (
          <Link href="/officer" className={`${tealClass} h-[58px] text-lg font-bold`}>
            কৃষকদের পাঠানো কেস
          </Link>
        )}
        <Link href="/planting" className="text-center text-base font-bold text-teal">
          আমার জমি: ইউনিয়ন আর রোপণের তারিখ
        </Link>
        <Link href="/guide" className="text-center text-base font-bold text-teal">
          কীভাবে ব্যবহার করবেন
        </Link>
        <SignOutButton />
      </div>
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
