import type { Metadata } from 'next';
import { QuestionAnswerLibrary } from '@/components/content/QuestionAnswerLibrary';
import { QuizCard } from '@/components/content/QuizCard';
import { getQuizEntries } from '@/lib/content';
import { questionTopics } from '@/lib/question-bank';

export const metadata: Metadata = {
  title: 'Quiz',
  description: 'Bilingual physics and chemistry quizzes plus 100+ searchable questions and answers.'
};

export default function QuizPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams?: { subject?: string };
}) {
  const locale = params.locale as 'bn' | 'en';
  const bn = locale === 'bn';
  const selectedSubject = searchParams?.subject === 'physics' || searchParams?.subject === 'chemistry'
    ? searchParams.subject
    : undefined;
  const quizzes = getQuizEntries().filter((quiz) => !selectedSubject || quiz.subject === selectedSubject);

  return (
    <section className="page-shell section-space">
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow">PhysChem Lab · Practice</p>
        <h1 className="display-title mt-3">কুইজ <span className="text-amber-600 dark:text-amber-200">/ Quiz</span></h1>
        <p className="mt-4 text-base leading-7 muted">
          {bn
            ? 'তাৎক্ষণিক ব্যাখ্যাসহ কুইজ দিন এবং ১০০টির বেশি দ্বিভাষিক প্রশ্নোত্তর দিয়ে দ্রুত রিভিশন করুন। কোনো account দরকার নেই।'
            : 'Take quizzes with instant explanations and revise with more than 100 bilingual questions and answers. No account is needed.'}
        </p>
      </div>

      <QuestionAnswerLibrary topics={questionTopics} initialSubject={selectedSubject ?? 'all'} />

      <section className="mt-14" aria-labelledby="quiz-list-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{bn ? 'স্কোরসহ অনুশীলন' : 'Practice with scoring'}</p>
            <h2 id="quiz-list-title" className="section-title mt-2 text-2xl">{bn ? 'ইন্টার‌্যাক্টিভ কুইজ' : 'Interactive quizzes'}</h2>
          </div>
          <span className="text-sm font-bold muted">{bn ? `${quizzes.length}টি কুইজ` : `${quizzes.length} quizzes`}</span>
        </div>
        {quizzes.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {quizzes.map((quiz) => <QuizCard key={quiz.slug} quiz={quiz} />)}
          </div>
        ) : (
          <div className="card p-6 text-sm muted">{bn ? 'এই বিষয়ে এখনো কুইজ যোগ করা হয়নি।' : 'No quizzes have been added for this subject yet.'}</div>
        )}
      </section>
    </section>
  );
}
