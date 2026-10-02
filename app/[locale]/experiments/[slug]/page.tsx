import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExperimentDetail } from '@/components/content/ExperimentDetail';
import { getExperimentBySlug, getExperimentEntries } from '@/lib/content';
import { isLocale, locales } from '@/i18n/routing';

export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap((locale) => getExperimentEntries().map((experiment) => ({ locale, slug: experiment.slug }))); }
export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> { const experiment = getExperimentBySlug(params.slug); return experiment ? { title: params.locale === 'bn' ? experiment.title_bn : experiment.title_en, description: experiment.aim } : {}; }
export default function ExperimentPage({ params }: { params: { locale: string; slug: string } }) { if (!isLocale(params.locale)) notFound(); const experiment = getExperimentBySlug(params.slug); if (!experiment) notFound(); return <ExperimentDetail experiment={experiment} />; }
