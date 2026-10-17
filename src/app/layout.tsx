import type { Metadata, Viewport } from 'next'
import { Baloo_Da_2, Hind_Siliguri } from 'next/font/google'
import PhoneFrame from '@/components/PhoneFrame'
import './globals.css'

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
})

const baloo = Baloo_Da_2({
  subsets: ['bengali', 'latin'],
  weight: ['700', '800'],
  variable: '--font-baloo',
})

export const metadata: Metadata = {
  title: 'Crop Guardian — মাঠের সৎ ডাক্তার',
  description: 'আলুর ধসা রোগের ঝুঁকি, ছবি দেখে রোগ চেনা আর মৌসুমের হিসাব।',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBF6EC',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" className={`${hind.variable} ${baloo.variable}`}>
      <body suppressHydrationWarning>
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  )
}
