import BottomNav from '@/components/BottomNav'
import SettingsView from '@/components/SettingsView'
import TopBar from '@/components/TopBar'

export const metadata = { title: 'সেটিংস — সবুজবিধি' }

// Opened from the gear in Home's header. Cached for offline use (public/sw.js): all of it is on the phone.
export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="সেটিংস" right={<span className="size-11" />} />
      <SettingsView />
      <div className="min-h-4 flex-1" />
      <BottomNav />
    </div>
  )
}
