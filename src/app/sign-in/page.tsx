import { redirect } from 'next/navigation'
import SignInForm from '@/components/SignInForm'
import TopBar from '@/components/TopBar'
import { getSession } from '@/lib/auth/session'
import { safeNext } from '@/lib/auth/signIn'

export const metadata = { title: 'ঢুকুন — Crop Guardian' }

// ?next= is where to go after signing in (a path on this site; /account otherwise).
export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const next = safeNext((await searchParams).next)
  if (await getSession()) redirect(next)
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="মোবাইল নম্বরে ঢুকুন" right={<span className="size-11" />} />
      <SignInForm next={next} />
    </div>
  )
}
