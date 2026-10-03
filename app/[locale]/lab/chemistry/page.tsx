import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ChemistryLab } from '@/components/lab/ChemistryLab';
import { ViewTracker } from '@/components/content/ViewTracker';
import { labT } from '@/lib/i18n';
import { datasetStats } from '@/lib/labData';
import { isLocale } from '@/i18n/routing';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : 'en';
  return {
    title: labT(locale, 'brand.title'),
    description: labT(locale, 'brand.tagline'),
    alternates: { canonical: '/lab/chemistry' }
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

export default function ChemistryLabPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;

  return (
    <>
      <ViewTracker item={{ slug: 'chemistry', kind: 'lab', href: '/lab/chemistry', title: labT(locale, 'brand.title') }} />
      <Suspense fallback={<LabFallback />}>
        <ChemistryLab />
      </Suspense>
      <section className="page-shell pb-14">
        <div className="card grid gap-4 p-5 sm:grid-cols-4">
          {[
            { value: datasetStats.shelfChemicals, label: labT(locale, 'shelf.chemicals') },
            { value: datasetStats.apparatus, label: labT(locale, 'shelf.apparatus') },
            { value: datasetStats.reactions, label: locale === 'bn' ? 'বিক্রিয়া নিয়ম' : 'Reaction rules' },
            { value: datasetStats.experiments, label: labT(locale, 'experiment.title') }
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-2xl font-black text-chemistry-600 dark:text-chemistry-200">{stat.value}</p>
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
            name: labT('en', 'brand.title'),
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            inLanguage: ['bn', 'en'],
            description: labT('en', 'brand.tagline')
          })
        }}
      />
    </>
  );
}
