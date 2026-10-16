'use client';

import { BookOpenCheck, ChevronDown, Search } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import type { QuestionTopic } from '@/lib/question-bank';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 24;
type SubjectFilter = 'all' | 'physics' | 'chemistry';

export function QuestionAnswerLibrary({
  topics,
  initialSubject = 'all'
}: {
  topics: QuestionTopic[];
  initialSubject?: SubjectFilter;
}) {
  const locale = useLocale() as 'bn' | 'en';
  const bn = locale === 'bn';
  const [subject, setSubject] = useState<SubjectFilter>(initialSubject);
  const [topicSlug, setTopicSlug] = useState('all');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openId, setOpenId] = useState<string | null>(null);
  const totalCount = topics.reduce((total, topic) => total + topic.questions.length, 0);

  const availableTopics = useMemo(
    () => topics.filter((topic) => subject === 'all' || topic.subject === subject),
    [subject, topics]
  );

  const questions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return availableTopics.flatMap((topic) => topic.questions.map((question, index) => ({
      ...question,
      id: `${topic.slug}-${index + 1}`,
      topicSlug: topic.slug,
      topicTitle: bn ? topic.title_bn : topic.title_en,
      subject: topic.subject
    }))).filter((item) => {
      const matchesTopic = topicSlug === 'all' || item.topicSlug === topicSlug;
      const text = `${item.q} ${item.q_bn} ${item.a} ${item.a_bn} ${item.topicTitle}`.toLocaleLowerCase(locale);
      return matchesTopic && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [availableTopics, bn, locale, query, topicSlug]);

  const changeSubject = (value: SubjectFilter) => {
    setSubject(value);
    setTopicSlug('all');
    setVisibleCount(PAGE_SIZE);
    setOpenId(null);
  };

  return (
    <section id="question-bank" className="scroll-mt-24" aria-labelledby="question-bank-title">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow">{bn ? 'দ্রুত রিভিশন · প্রশ্ন ও উত্তর' : 'Quick revision · Questions & answers'}</p>
          <h2 id="question-bank-title" className="section-title mt-2 text-2xl sm:text-3xl">
            {bn ? `${totalCount}টি দ্বিভাষিক প্রশ্নোত্তর` : `${totalCount} bilingual questions & answers`}
          </h2>
          <p className="mt-3 text-sm leading-6 muted">
            {bn
              ? 'ফিজিক্স ও কেমিস্ট্রির সিমুলেশন, সূত্র এবং ব্যবহারিক ভাইভার গুরুত্বপূর্ণ ধারণা খুঁজে পড়ুন।'
              : 'Search the key ideas behind physics and chemistry simulations, formulas and practical viva questions.'}
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <BookOpenCheck size={24} />
        </span>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[auto_minmax(12rem,18rem)_minmax(16rem,1fr)] lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label={bn ? 'বিষয় বাছাই' : 'Filter by subject'}>
          {(['all', 'physics', 'chemistry'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={subject === item}
              onClick={() => changeSubject(item)}
              className={cn(
                'min-h-10 rounded-xl border px-3 py-2 text-sm font-bold transition',
                subject === item
                  ? 'border-amber-600 bg-amber-600 text-white'
                  : 'border-[var(--line)] bg-[var(--surface)] hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950'
              )}
            >
              {item === 'all' ? (bn ? 'সব' : 'All') : item === 'physics' ? (bn ? 'পদার্থবিজ্ঞান' : 'Physics') : (bn ? 'রসায়ন' : 'Chemistry')}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="sr-only">{bn ? 'বিষয় নির্বাচন' : 'Choose a topic'}</span>
          <select
            className="input"
            value={topicSlug}
            onChange={(event) => { setTopicSlug(event.target.value); setVisibleCount(PAGE_SIZE); setOpenId(null); }}
          >
            <option value="all">{bn ? 'সব টপিক' : 'All topics'}</option>
            {availableTopics.map((topic) => <option key={topic.slug} value={topic.slug}>{bn ? topic.title_bn : topic.title_en}</option>)}
          </select>
        </label>

        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="search"
            className="input pl-10"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); setOpenId(null); }}
            placeholder={bn ? 'প্রশ্ন, উত্তর বা টপিক খুঁজুন…' : 'Search a question, answer or topic…'}
          />
        </label>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold muted">
        <span>{bn ? `${questions.length}টি প্রশ্ন পাওয়া গেছে` : `${questions.length} questions found`}</span>
        <span>{bn ? 'উত্তর দেখতে প্রশ্নে চাপ দিন' : 'Select a question to reveal its answer'}</span>
      </div>

      {questions.length > 0 ? (
        <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {questions.slice(0, visibleCount).map((item) => {
            const open = openId === item.id;
            return (
              <article key={item.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`answer-${item.id}`}
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-[var(--surface-soft)] sm:p-5"
                >
                  <span className="min-w-0">
                    <span className="mb-2 flex flex-wrap gap-2">
                      <Badge tone={item.subject === 'physics' ? 'physics' : 'chemistry'}>{item.topicTitle}</Badge>
                    </span>
                    <span className="block text-sm font-extrabold leading-6 sm:text-base">{bn ? item.q_bn : item.q}</span>
                  </span>
                  <ChevronDown size={18} className={cn('mt-1 shrink-0 transition', open && 'rotate-180')} />
                </button>
                {open && (
                  <div id={`answer-${item.id}`} className="border-t border-[var(--line)] bg-[var(--surface-soft)] px-4 py-4 text-sm leading-7 muted sm:px-5">
                    <strong className="mr-2 text-[var(--ink)]">{bn ? 'উত্তর:' : 'Answer:'}</strong>
                    {bn ? item.a_bn : item.a}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm muted">
          {bn ? 'এই খোঁজে কোনো প্রশ্ন পাওয়া যায়নি।' : 'No questions match this search.'}
        </div>
      )}

      {visibleCount < questions.length && (
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            {bn ? 'আরও প্রশ্ন দেখুন' : 'Show more questions'}
          </Button>
        </div>
      )}
    </section>
  );
}
