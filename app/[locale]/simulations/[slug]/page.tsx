import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, FlaskConical, Info } from 'lucide-react';
import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ViewTracker } from '@/components/content/ViewTracker';
import { getSimulationMeta, simulationMetas } from '@/lib/simulations';
import { isLocale, locales, type Locale } from '@/i18n/routing';

export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap((locale) => simulationMetas.map((simulation) => ({ locale, slug: simulation.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale, slug } = await params; const simulation = getSimulationMeta(slug); return simulation ? { title: locale === 'bn' ? simulation.title_bn : simulation.title_en, description: locale === 'bn' ? simulation.description_bn : simulation.description_en } : {}; }

export default async function SimulationDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const simulation = getSimulationMeta(slug); if (!simulation) notFound();
  const title = locale === 'bn' ? simulation.title_bn : simulation.title_en;
  return <section className="page-shell section-space"><ViewTracker item={{ slug: simulation.slug, kind: 'simulation', href: `/simulations/${simulation.slug}`, title }} /><div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold muted"><Link href={`/${locale}/simulations`} className="inline-flex items-center gap-1 hover:text-physics-600"><ArrowLeft size={15} />{locale === 'bn' ? 'সিমুলেশন' : 'Simulations'}</Link><ChevronRight size={15} />{title}</div><div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex flex-wrap gap-2"><Badge tone={simulation.subject === 'physics' ? 'physics' : 'chemistry'}>{simulation.subject === 'physics' ? 'Physics' : 'Chemistry'}</Badge><Badge>{simulation.level === 'honours' ? 'Honours' : simulation.level.replace('class-', 'Class ')}</Badge></div><h1 className="display-title max-w-4xl">{title}</h1><p className="mt-4 max-w-3xl text-base leading-7 muted">{locale === 'bn' ? simulation.description_bn : simulation.description_en}</p></div><div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-mono font-bold"><FlaskConical size={16} className="text-chemistry-600" />{simulation.formula}</div></div><SimulationWorkbench meta={simulation} /><div className="mt-5 flex items-start gap-3 rounded-2xl border border-physics-200 bg-physics-50 p-4 text-sm leading-6 text-physics-900 dark:border-physics-700 dark:bg-physics-900/50 dark:text-physics-100"><Info size={18} className="mt-0.5 shrink-0" /><p>{locale === 'bn' ? 'এই মডেলটি শেখার জন্য সরলীকৃত। বাস্তব পরীক্ষায় একক, সীমা ও measurement uncertainty আলাদা করে যাচাই করুন।' : 'This model is intentionally simplified for learning. In a real experiment, check units, limits and measurement uncertainty separately.'}</p></div><Card className="mt-5"><CardHeader><CardTitle>{locale === 'bn' ? 'কীভাবে ব্যবহার করবেন' : 'How to use this lab'}</CardTitle></CardHeader><CardBody><div className="grid gap-4 text-sm leading-6 muted sm:grid-cols-3"><p><strong className="text-[var(--ink)]">01 · Predict.</strong><br />Choose a value and say what you expect before moving it.</p><p><strong className="text-[var(--ink)]">02 · Observe.</strong><br />Watch the readout and graph change together.</p><p><strong className="text-[var(--ink)]">03 · Record.</strong><br />Save a few data points and export them as CSV.</p></div></CardBody></Card><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'LearningResource', name: title, description: simulation.description_en, learningResourceType: 'interactive simulation', isAccessibleForFree: true, inLanguage: ['bn', 'en'] }) }} /></section>;
}
