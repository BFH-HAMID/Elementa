import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/bn',
    name: 'PhysChem Lab',
    short_name: 'PhysChem Lab',
    description: 'A bilingual browser laboratory for physics and chemistry learners.',
    start_url: '/bn',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f7fafc',
    theme_color: '#075db1',
    lang: 'bn',
    dir: 'ltr',
    categories: ['education', 'science'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    shortcuts: [
      { name: 'Physics Lab', short_name: 'Physics', url: '/bn/lab/physics', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Chemistry Lab', short_name: 'Chemistry', url: '/bn/lab/chemistry', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Equations', short_name: 'Equations', url: '/bn/equations', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }
    ]
  };
}
