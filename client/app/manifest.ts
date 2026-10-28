// Web App Manifest: makes Beacon installable from the browser (PWA).
export default function manifest() {
  return {
    name: 'Beacon: Peer Supporter Training',
    short_name: 'Beacon',
    description: 'Training and support platform for university peer supporters.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f3f8fb',
    theme_color: '#0f8b7e',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
