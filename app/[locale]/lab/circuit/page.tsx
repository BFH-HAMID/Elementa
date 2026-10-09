import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ViewTracker } from '@/components/content/ViewTracker';
import { CircuitLabLoader } from '@/components/circuit-lab/CircuitLabLoader';
import { isLocale } from '@/i18n/routing';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';
import { PARTS } from '@/components/circuit-lab/parts/registry';

const COPY = {
  en: {
    title: 'Circuit Lab',
    tagline: 'Build, wire and simulate circuits and microcontroller sketches in your browser.',
    parts: 'Parts',
    examples: 'Example projects',
    sim: 'Simulation',
    simText: 'DC and transient circuit solver, digital logic and sketches run in a Web Worker.',
    docs: 'Guide'
  },
  bn: {
    title: 'সার্কিট ল্যাব',
    tagline: 'ব্রাউজারে সার্কিট ও মাইক্রোকন্ট্রোলার স্কেচ তৈরি, ওয়্যার ও সিমুলেট করুন।',
    parts: 'যন্ত্রাংশ',
    examples: 'উদাহরণ প্রকল্প',
    sim: 'সিমুলেশন',
    simText: 'DC ও ট্রানজিয়েন্ট সার্কিট সলভার, ডিজিটাল লজিক ও স্কেচ Web Worker-এ চলে।',
    docs: 'গাইড'
  }
} as const;

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  return {
    title: COPY[locale].title,
    description: COPY[locale].tagline,
    alternates: { canonical: '/lab/circuit' }
  };
}

function LabFallback() {
  return (
    <div className="page-shell space-y-4" aria-busy="true">
      <div className="card h-32 animate-pulse p-5" />
      <div className="grid gap-4 xl:grid-cols-[minmax(290px,340px)_minmax(0,1fr)_minmax(300px,370px)]">
        <div className="card h-[420px] animate-pulse" />
        <div className="card h-[420px] animate-pulse" />
        <div className="card h-[420px] animate-pulse" />
      </div>
    </div>
  );
}

export default function CircuitLabPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  const copy = COPY[locale];

  return (
    <>
      <ViewTracker item={{ slug: 'circuit', kind: 'lab', href: '/lab/circuit', title: copy.title }} />
      <section className="page-shell pt-6">
        <p className="eyebrow">{locale === 'bn' ? 'ইলেকট্রনিক্স' : 'Electronics'}</p>
        <h1 className="display-title mt-1 text-3xl text-[color:var(--ink)]">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm muted">{copy.tagline}</p>
      </section>
      <section className="page-shell py-4">
        <Suspense fallback={<LabFallback />}>
          <CircuitLabLoader />
        </Suspense>
      </section>
      <section className="page-shell pb-14">
        <div className="card grid gap-4 p-5 sm:grid-cols-4">
          {[
            { value: PARTS.length, label: copy.parts },
            { value: EXAMPLE_PROJECTS.length, label: copy.examples },
            { value: 'Web Worker', label: copy.sim },
            { value: 'SVG', label: copy.docs }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-2xl font-black text-physics-600 dark:text-physics-200">{stat.value}</p>
              <p className="mt-1 text-xs font-bold muted">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs muted">{copy.simText}</p>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: COPY.en.title,
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            inLanguage: ['bn', 'en'],
            description: COPY.en.tagline
          })
        }}
      />
    </>
  );
}
