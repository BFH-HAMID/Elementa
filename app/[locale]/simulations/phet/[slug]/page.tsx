import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { PhetSimulationEmbed } from '@/components/sim/PhetSimulationEmbed';
import { Badge } from '@/components/ui/Badge';
import { getPhetSimulationMeta, phetSimulationMetas } from '@/lib/phet-simulations';
import { isLocale, locales, type Locale } from '@/i18n/routing';

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => phetSimulationMetas.map((simulation) => ({ locale, slug: simulation.slug })));
}

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const simulation = getPhetSimulationMeta(params.slug);
  if (!simulation) return {};
  return {
    title: `${simulation.title} · PhET`,
    description: `Play the official PhET HTML5 simulation: ${simulation.title}.`
  };
}

export default function PhetSimulationPage({ params }: { params: { locale: string; slug: string } }) {
  if (!isLocale(params.locale)) notFound();
  const simulation = getPhetSimulationMeta(params.slug);
  if (!simulation) notFound();

  const locale = params.locale as Locale;
  const isBangla = locale === 'bn';

  return (
    <section className="page-shell section-space">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold muted">
        <Link href={`/${locale}/simulations`} className="inline-flex items-center gap-1 hover:text-physics-600">
          <ArrowLeft size={15} />{isBangla ? 'সিমুলেশন' : 'Simulations'}
        </Link>
        <ChevronRight size={15} />
        <span>PhET</span>
        <ChevronRight size={15} />
        <span>{simulation.title}</span>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>PhET · HTML5</Badge>
            {simulation.subjects.map((subject) => (
              <Badge key={subject} tone={subject === 'physics' ? 'physics' : 'chemistry'}>
                {subject === 'physics' ? (isBangla ? 'পদার্থবিজ্ঞান' : 'Physics') : (isBangla ? 'রসায়ন' : 'Chemistry')}
              </Badge>
            ))}
          </div>
          <h1 className="display-title max-w-4xl">{simulation.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 muted">
            {isBangla
              ? 'PhET-এর অফিসিয়াল ইন্টার‌্যাক্টিভ সিমুলেশন। সর্বশেষ HTML5 সংস্করণটি PhET-এর সার্ভার থেকে লোড হয়।'
              : 'Official interactive PhET simulation. The latest HTML5 version is loaded directly from PhET.'}
          </p>
        </div>
      </div>

      <PhetSimulationEmbed simulation={simulation} locale={locale} />
    </section>
  );
}
