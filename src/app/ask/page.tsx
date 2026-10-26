import AskChat from '@/components/AskChat'
import TopBar from '@/components/TopBar'

export const metadata = { title: 'কৃষি সহায়ক — Crop Guardian' }

// Questions answered from the app's own advice (src/lib/assistant). Needs the network, so it is not
// cached for offline use: offline, public/sw.js shows /offline.
export default function AskPage() {
  return (
    <div className="flex flex-1 flex-col">
      <TopBar back="/" title="কৃষি সহায়ক" right={<span className="size-11" />} />
      <AskChat />
    </div>
  )
}
