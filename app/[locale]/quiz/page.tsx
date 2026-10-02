import type { Metadata } from 'next';
import { QuizCard } from '@/components/content/QuizCard';
import { getQuizEntries } from '@/lib/content';

export const metadata: Metadata = { title: 'Quiz', description: 'Short bilingual physics and chemistry quizzes with instant feedback.' };
export default function QuizPage() { const quizzes = getQuizEntries(); return <section className="page-shell section-space"><div className="mb-8 max-w-3xl"><p className="eyebrow">PhysChem Lab · Practice</p><h1 className="display-title mt-3">কুইজ <span className="text-amber-600 dark:text-amber-200">/ Quiz</span></h1><p className="mt-4 text-base leading-7 muted">Short, friendly questions with instant explanations. No account is needed; score history stays on this device.</p></div><div className="grid gap-5 md:grid-cols-2">{quizzes.map((quiz) => <QuizCard key={quiz.slug} quiz={quiz} />)}</div></section>; }
