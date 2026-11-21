import type { MetadataRoute } from 'next'

// Lets the app be installed on a phone's home screen (served at /manifest.webmanifest). The icons
// are drawn from src/app/icon.svg by scripts/make-icons.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'সবুজবিধি',
    short_name: 'সবুজবিধি',
    description: 'আলুর ধসা আর ধানের ব্লাস্ট রোগের ঝুঁকি, ছবি দেখে রোগ চেনা আর মৌসুমের হিসাব।',
    lang: 'bn',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FBF6EC',
    // The same as the page's theme colour (layout.tsx), so the bar doesn't change colour on launch.
    theme_color: '#FBF6EC',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
