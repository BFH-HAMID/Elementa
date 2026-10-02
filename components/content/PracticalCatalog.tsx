'use client';

import Link from 'next/link';
import { ChevronDown, FlaskConical, Search, X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import practicalCatalog from '@/content/practical-topics.json';
import { Badge } from '@/components/ui/Badge';
import { Tex } from './Tex';

type SubjectFilter = 'all' | 'physics' | 'chemistry';
type StageFilter = 'all' | 'school' | 'hsc';

export function PracticalCatalog({ initialSubject = 'all' }: { initialSubject?: SubjectFilter }) {
  const locale = useLocale() as 'bn' | 'en';
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<SubjectFilter>(initialSubject);
  const [stage, setStage] = useState<StageFilter>('all');
  const updateSubject = (value: SubjectFilter) => {
    setSubject(value);
    const params = new URLSearchParams(window.location.search);
    if (value === 'all') params.delete('subject');
    else params.set('subject', value);
    const queryString = params.toString();
    router.replace(`${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`, { scroll: false });
  };
  const searchTerm = query.trim().toLocaleLowerCase();

  const visibleGroups = useMemo(() => practicalCatalog.groups
    .filter((group) => subject === 'all' || group.subject === subject)
    .filter((group) => stage === 'all' || group.stage === stage)
    .map((group) => ({
      ...group,
      topics: group.topics.filter((topic) => !searchTerm || [
        topic.title_en,
        topic.title_bn,
        topic.note_en,
        topic.note_bn,
        topic.category_en,
        topic.category_bn,
        topic.equation ?? ''
      ].join(' ').toLocaleLowerCase().includes(searchTerm))
    }))
    .filter((group) => group.topics.length > 0),
  [searchTerm, stage, subject]);

  const visibleCount = visibleGroups.reduce((count, group) => count + group.topics.length, 0);
  const hasFilters = query.length > 0 || subject !== 'all' || stage !== 'all';
  const clearFilters = () => { setQuery(''); updateSubject('all'); setStage('all'); };

  useEffect(() => setSubject(initialSubject), [initialSubject]);

  useEffect(() => {
    const revealHashTarget = () => {
      if (!window.location.hash) return;
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!target) return;
      let parent: HTMLElement | null = target;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    };
    revealHashTarget();
    window.addEventListener('hashchange', revealHashTarget);
    return () => window.removeEventListener('hashchange', revealHashTarget);
  }, []);

  return (
    <section id="practical-catalog" className="mt-12 scroll-mt-24">
      <div className="mb-5 max-w-3xl">
        <div className="mb-3 flex items-center gap-2 text-chemistry-700 dark:text-chemistry-200">
          <FlaskConical size={18} />
          <p className="text-xs font-black uppercase tracking-[0.18em]">{locale === 'bn' ? 'পাঠ্যসূচির ব্যবহারিক তালিকা' : 'Syllabus practical index'}</p>
        </div>
        <h2 className="section-title">{locale === 'bn' ? 'পদার্থবিজ্ঞান ও রসায়নের ল্যাব বিষয়' : 'Physics and chemistry lab topics'}</h2>
        <p className="mt-2 text-sm leading-6 muted">
          {locale === 'bn'
            ? 'স্কুল (৬–১০) ও এইচএসসি স্তরের তালিকাটি খুঁজে দেখুন। প্রতিটি বিষয়ের উদ্দেশ্য, মূল ধারণা/সম্পর্ক এবং সতর্কতা সংক্ষেপে দেওয়া আছে; যেসব বিষয়ে পূর্ণ নির্দেশিকা আছে, সেখান থেকে সেটি খুলুন।'
            : 'Browse the school (Classes 6–10) and HSC lists. Each topic has a short purpose, key relation or idea, and a safety/measurement note; open a full guide where one is available.'}
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} />
          <input
            className="input pl-10 pr-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={locale === 'bn' ? 'ব্যবহারিক বিষয় খুঁজুন…' : 'Search practical topics…'}
            aria-label={locale === 'bn' ? 'ব্যবহারিক বিষয় খুঁজুন' : 'Search practical topics'}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 muted" aria-label={locale === 'bn' ? 'খোঁজা মুছুন' : 'Clear search'}>
              <X size={15} />
            </button>
          )}
        </label>
        <select value={subject} onChange={(event) => updateSubject(event.target.value as SubjectFilter)} className="input" aria-label={locale === 'bn' ? 'বিষয় বাছাই' : 'Filter by subject'}>
          <option value="all">{locale === 'bn' ? 'সব বিষয়' : 'All subjects'}</option>
          <option value="physics">{locale === 'bn' ? 'পদার্থবিজ্ঞান' : 'Physics'}</option>
          <option value="chemistry">{locale === 'bn' ? 'রসায়ন' : 'Chemistry'}</option>
        </select>
        <select value={stage} onChange={(event) => setStage(event.target.value as StageFilter)} className="input" aria-label={locale === 'bn' ? 'স্তর বাছাই' : 'Filter by stage'}>
          <option value="all">{locale === 'bn' ? 'সব স্তর' : 'All levels'}</option>
          <option value="school">{locale === 'bn' ? 'স্কুল · ৬–১০' : 'School · 6–10'}</option>
          <option value="hsc">HSC</option>
        </select>
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn-secondary min-h-11 px-3 text-sm">
            {locale === 'bn' ? 'ফিল্টার মুছুন' : 'Clear filters'}
          </button>
        )}
      </div>

      <p className="mb-3 text-sm font-bold muted">
        {visibleCount} {locale === 'bn' ? 'টি ব্যবহারিক বিষয়' : 'practical topics'}
      </p>

      {visibleGroups.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-extrabold">{locale === 'bn' ? 'কোনো বিষয় মেলেনি।' : 'No practical topics found.'}</p>
          <button type="button" onClick={clearFilters} className="btn-secondary mt-4 min-h-9 px-3 text-xs">
            {locale === 'bn' ? 'সব বিষয় দেখুন' : 'Show all topics'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group) => {
            const categories = Array.from(new Set(group.topics.map((topic) => topic.category_en)));
            return (
              <details key={group.id} className="card overflow-hidden" open={Boolean(searchTerm)}>
                <summary className="group flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${group.subject === 'physics' ? 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100' : 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100'}`}>
                    <FlaskConical size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{locale === 'bn' ? group.title_bn : group.title_en}</span>
                    <span className="mt-1 block text-xs muted">{locale === 'bn' ? group.description_bn : group.description_en}</span>
                  </span>
                  <Badge tone={group.subject === 'physics' ? 'physics' : 'chemistry'}>{group.topics.length}</Badge>
                  <ChevronDown size={18} className="shrink-0 muted transition group-open:rotate-180" />
                </summary>

                <div className="space-y-6 border-t border-[var(--line)] px-4 pb-5 pt-5 sm:px-5">
                  {categories.map((category) => {
                    const topics = group.topics.filter((topic) => topic.category_en === category);
                    const categoryBn = topics[0]?.category_bn ?? category;
                    return (
                      <div key={category}>
                        <h3 className="mb-3 text-xs font-black uppercase tracking-[0.14em] muted">{locale === 'bn' ? categoryBn : category}</h3>
                        <div className="grid gap-2 md:grid-cols-2">
                          {topics.map((topic) => (
                            <details id={`lab-${topic.slug}`} key={topic.slug} className="group min-w-0 scroll-mt-24 rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                              <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                                <span className="min-w-0 flex-1">{locale === 'bn' ? topic.title_bn : topic.title_en}</span>
                                {topic.guide_slug && <Badge>{locale === 'bn' ? 'পূর্ণ নির্দেশিকা' : 'Full guide'}</Badge>}
                                <ChevronDown size={15} className="shrink-0 muted transition group-open:rotate-180" />
                              </summary>
                              <div className="space-y-3 border-t border-[var(--line)] px-3 pb-3 pt-3">
                                <p className="text-sm leading-6 muted">{locale === 'bn' ? topic.note_bn : topic.note_en}</p>
                                {topic.equation && (
                                  <div className="equation-display rounded-lg bg-[var(--surface-soft)] px-3 py-1">
                                    <Tex latex={topic.equation} />
                                  </div>
                                )}
                                {topic.guide_slug && (
                                  <Link href={`/${locale}/experiments/${topic.guide_slug}`} className="inline-flex items-center gap-1 text-sm font-extrabold text-physics-700 hover:underline dark:text-physics-200">
                                    {locale === 'bn' ? 'পূর্ণ ব্যবহারিক নির্দেশিকা খুলুন' : 'Open the full practical guide'}
                                    <span aria-hidden="true">→</span>
                                  </Link>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 muted">
        {locale === 'bn'
          ? 'এটি পাঠ্যসূচি-ভিত্তিক পুনরাবৃত্তি সহায়িকা; কোনো ব্যবহারিক পরীক্ষা করার আগে শিক্ষক ও প্রতিষ্ঠানের নিরাপত্তা নির্দেশনা মেনে চলুন।'
          : 'This is a syllabus revision index, not a substitute for a supervised lab manual. Follow your teacher’s and institution’s safety instructions before performing any experiment.'}
      </p>
    </section>
  );
}
