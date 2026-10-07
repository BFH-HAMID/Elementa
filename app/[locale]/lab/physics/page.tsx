import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PhysicsLab } from '@/components/physics/PhysicsLab';
import { ViewTracker } from '@/components/content/ViewTracker';
import { physicsT } from '@/lib/i18n';
import { physicsDatasetStats } from '@/lib/physicsData';
import { isLocale } from '@/i18n/routing';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  return {
    title: physicsT(locale, 'brand.title'),
    description: physicsT(locale, 'brand.tagline'),
    alternates: { canonical: '/lab/physics' }
  };
}

function LabFallback() {
  return (
    <div className="page-shell space-y-4" aria-busy="true">
      <div className="card h-32 animate-pulse p-5" />
      <div className="card h-14 animate-pulse p-3" />
      <div className="grid gap-4 xl:grid-cols-[minmax(290px,340px)_minmax(0,1fr)_minmax(300px,370px)]">
        <div className="card h-[420px] animate-pulse" />
        <div className="card h-[420px] animate-pulse" />
        <div className="card h-[420px] animate-pulse" />
      </div>
    </div>
  );
}

export default function PhysicsLabPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;

  return (
    <>
      <ViewTracker item={{ slug: 'physics', kind: 'lab', href: '/lab/physics', title: physicsT(locale, 'brand.title') }} />
      <Suspense fallback={<LabFallback />}>
        <PhysicsLab />
      </Suspense>
      <section className="page-shell pb-14">
        <div className="card grid gap-4 p-5 sm:grid-cols-3">
          {[
            { value: physicsDatasetStats.equipment, label: locale === 'bn' ? 'পদার্থবিজ্ঞান যন্ত্রপাতি' : 'Physics equipment instruments' },
            { value: physicsDatasetStats.categories, label: locale === 'bn' ? 'মূল ক্ষেত্র ও বিভাগ' : 'Physics domains & categories' },
            { value: physicsDatasetStats.experiments, label: locale === 'bn' ? 'গাইডেড ল্যাব পরীক্ষা' : 'Guided lab experiments' }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-2xl font-black text-physics-600 dark:text-physics-300">{stat.value}</p>
              <p className="mt-1 text-xs font-bold muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: physicsT('en', 'brand.title'),
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            inLanguage: ['bn', 'en'],
            description: physicsT('en', 'brand.tagline')
          })
        }}
      />
    </>
  );
}
