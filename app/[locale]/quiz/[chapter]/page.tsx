import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QuizRunner } from '@/components/content/QuizRunner';
import { getQuizBySlug, getQuizEntries } from '@/lib/content';
import { isLocale, locales } from '@/i18n/routing';

export const dynamicParams = false;
export function generateStaticParams() { return locales.flatMap((locale) => getQuizEntries().map((quiz) => ({ locale, chapter: quiz.slug }))); }
export async function generateMetadata({ params }: { params: { locale: string; chapter: string } }): Promise<Metadata> { const quiz = getQuizBySlug(params.chapter); return quiz ? { title: params.locale === 'bn' ? quiz.title_bn : quiz.title_en, description: quiz.description_en } : {}; }
export default function QuizChapterPage({ params }: { params: { locale: string; chapter: string } }) { if (!isLocale(params.locale)) notFound(); const quiz = getQuizBySlug(params.chapter); if (!quiz) notFound(); return <section className="page-shell section-space"><QuizRunner quiz={quiz} /></section>; }
