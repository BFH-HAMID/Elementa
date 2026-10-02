import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExperimentDetail } from '@/components/content/ExperimentDetail';
import { getExperimentBySlug, getExperimentEntries } from '@/lib/content';
import { isLocale, locales } from '@/i18n/routing';

export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap((locale) => getExperimentEntries().map((experiment) => ({ locale, slug: experiment.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> { const { locale, slug } = await params; const experiment = getExperimentBySlug(slug); return experiment ? { title: locale === 'bn' ? experiment.title_bn : experiment.title_en, description: experiment.aim } : {}; }
export default async function ExperimentPage({ params }: { params: Promise<{ locale: string; slug: string }> }) { const { locale, slug } = await params; if (!isLocale(locale)) notFound(); const experiment = getExperimentBySlug(slug); if (!experiment) notFound(); return <ExperimentDetail experiment={experiment} />; }
