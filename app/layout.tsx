import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const inter = localFont({
  src: '../public/fonts/noto-sans-latin.ttf',
  variable: '--font-inter',
  weight: '400',
  display: 'swap'
});

// Keep a dedicated variable for Bangla text so a real Noto Sans Bengali or Hind Siliguri
// installed by the visitor is selected per glyph; the bundled latin fallback keeps builds offline.
const bengali = localFont({
  src: '../public/fonts/noto-sans-latin.ttf',
  variable: '--font-bengali',
  weight: '400',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://physchem-lab.vercel.app'),
  title: {
    default: 'PhysChem Lab — Learn it. See it. Try it.',
    template: '%s · PhysChem Lab'
  },
  description: 'A free bilingual physics and chemistry learning lab for Bangladesh: equations, experiments and interactive simulations.',
  applicationName: 'PhysChem Lab',
  keywords: ['physics', 'chemistry', 'Bangla', 'NCTB', 'National University', 'simulations', 'equations'],
  authors: [{ name: 'PhysChem Lab community' }],
  creator: 'PhysChem Lab',
  openGraph: {
    type: 'website',
    siteName: 'PhysChem Lab',
    title: 'PhysChem Lab — Learn it. See it. Try it.',
    description: 'A free bilingual browser laboratory for physics and chemistry learners.',
    images: [{ url: '/og/physchem-lab.svg', width: 1200, height: 630, alt: 'PhysChem Lab' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PhysChem Lab',
    description: 'See science move in your browser.',
    images: ['/og/physchem-lab.svg']
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icons/icon-192.png'
  },
  appleWebApp: {
    capable: true,
    title: 'PhysChem Lab',
    statusBarStyle: 'default'
  },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#075db1' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1926' }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${inter.variable} ${bengali.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
