import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QuizRunner } from '@/components/content/QuizRunner';
import { getQuizBySlug, getQuizEntries } from '@/lib/content';
import { isLocale, locales } from '@/i18n/routing';

export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap((locale) => getQuizEntries().map((quiz) => ({ locale, chapter: quiz.slug }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; chapter: string }> }): Promise<Metadata> { const { locale, chapter } = await params; const quiz = getQuizBySlug(chapter); return quiz ? { title: locale === 'bn' ? quiz.title_bn : quiz.title_en, description: quiz.description_en } : {}; }
export default async function QuizChapterPage({ params }: { params: Promise<{ locale: string; chapter: string }> }) { const { locale, chapter } = await params; if (!isLocale(locale)) notFound(); const quiz = getQuizBySlug(chapter); if (!quiz) notFound(); return <section className="page-shell section-space"><QuizRunner quiz={quiz} /></section>; }
