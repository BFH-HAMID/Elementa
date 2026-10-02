'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Atom, Beaker, Search, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  phetSimulationCounts,
  phetSimulationMetas,
  phetThumbnailUrl,
  type PhetSimulationMeta,
  type PhetSubject
} from '@/lib/phet-simulations';

const PAGE_SIZE = 18;
type SubjectFilter = 'all' | PhetSubject;

export function PhetSimulationCatalog({ initialSubject = 'all' }: { initialSubject?: SubjectFilter }) {
  const locale = useLocale() as 'bn' | 'en';
  const [subject, setSubject] = useState<SubjectFilter>(initialSubject);
  useEffect(() => setSubject(initialSubject), [initialSubject]);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const isBangla = locale === 'bn';

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return phetSimulationMetas.filter((simulation) => {
      const matchesSubject = subject === 'all' || simulation.subjects.includes(subject);
      const matchesQuery = !normalizedQuery || `${simulation.title} ${simulation.slug}`.toLocaleLowerCase().includes(normalizedQuery);
      return matchesSubject && matchesQuery;
    });
  }, [query, subject]);

  const tabs: Array<{ id: SubjectFilter; label: string; count: number; icon: typeof Atom }> = [
    { id: 'all', label: isBangla ? 'সব HTML5' : 'All HTML5', count: phetSimulationCounts.unique, icon: Sparkles },
    { id: 'physics', label: isBangla ? 'পদার্থবিজ্ঞান' : 'Physics', count: phetSimulationCounts.physics, icon: Atom },
    { id: 'chemistry', label: isBangla ? 'রসায়ন' : 'Chemistry', count: phetSimulationCounts.chemistry, icon: Beaker }
  ];

  return (
    <section className="mt-16" aria-labelledby="phet-library-title">
      <div className="mb-6 max-w-4xl">
        <div className="eyebrow">PhET · Official HTML5 library</div>
        <h2 id="phet-library-title" className="section-title mt-3 text-2xl sm:text-3xl">
          {isBangla ? 'PhET-এর ইন্টার‌্যাক্টিভ সিমুলেশন' : 'Explore PhET simulations'}
        </h2>
        <p className="mt-3 text-sm leading-6 muted">
          {isBangla
            ? 'PhET-এর অফিসিয়াল HTML5 সিমুলেশনগুলো এই পেজে সাজানো হয়েছে; চালু করলে সিমুলেশন সরাসরি PhET-এর সার্ভার থেকে লোড হবে।'
            : 'Browse the official PhET HTML5 simulations here. Each interactive simulation is loaded from PhET when you open it.'}
        </p>
        <p className="mt-2 text-xs leading-5 muted">
          Simulation by PhET Interactive Simulations, University of Colorado Boulder, licensed under{' '}
          <a className="font-bold text-physics-700 underline dark:text-physics-200" href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a>{' '}
          (<a className="font-bold text-[var(--ink)] underline" href="https://phet.colorado.edu" target="_blank" rel="noreferrer">https://phet.colorado.edu</a>).
          {' '}{isBangla
            ? 'কেবল non-commercial ব্যবহার; commercial বা বিজ্ঞাপন-সমর্থিত ব্যবহারে আলাদা লাইসেন্স লাগতে পারে।'
            : 'Non-commercial use only; commercial or ad-supported use may require a separate license.'}{' '}
          <a className="font-bold text-physics-700 underline dark:text-physics-200" href="https://phet.colorado.edu/en/licensing" target="_blank" rel="noreferrer">
            {isBangla ? 'লাইসেন্সের শর্ত' : 'License terms'}
          </a>
        </p>
        <p className="mt-2 text-xs muted">
          {isBangla
            ? 'ক্যাটালগে ৬৭টি Physics ও ৩৫টি Chemistry subject-entry আছে; কিছু সিম দুই বিভাগেই পড়ে, তাই মোট ৮১টি আলাদা HTML5 সিম।'
            : 'The catalog contains 67 Physics and 35 Chemistry subject entries; some appear in both, for 81 unique HTML5 simulations.'}
        </p>
      </div>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_minmax(16rem,24rem)] lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label={isBangla ? 'বিষয় বেছে নিন' : 'Filter by subject'}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = subject === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={active}
                onClick={() => { setSubject(tab.id); setVisibleCount(PAGE_SIZE); }}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition ${active ? 'border-physics-600 bg-physics-600 text-white shadow-sm' : 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-physics-300 hover:bg-physics-50 dark:hover:bg-physics-900'}`}
              >
                <Icon size={16} />{tab.label}<span className={active ? 'rounded-full bg-white/20 px-2 py-0.5 text-xs' : 'rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs'}>{tab.count}</span>
              </button>
            );
          })}
        </div>
        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="input pl-10"
            type="search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }}
            placeholder={isBangla ? 'সিমুলেশন খুঁজুন…' : 'Search simulations…'}
            aria-label={isBangla ? 'PhET সিমুলেশন খুঁজুন' : 'Search PhET simulations'}
          />
        </label>
      </div>

      <div className="mb-4 flex items-center justify-between text-xs font-semibold muted">
        <span>{isBangla ? `${filtered.length}টি সিমুলেশন` : `${filtered.length} simulations`}</span>
        <span>{isBangla ? 'নতুন সিমগুলো খুললে লোড হবে' : 'Sims load only when opened'}</span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.slice(0, visibleCount).map((simulation) => (
            <PhetSimulationCard key={simulation.slug} simulation={simulation} locale={locale} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm muted">
          {isBangla ? 'এই নামে কোনো সিমুলেশন পাওয়া যায়নি।' : 'No simulations match that search.'}
        </Card>
      )}

      {visibleCount < filtered.length && (
        <div className="mt-7 flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            {isBangla ? 'আরও সিমুলেশন দেখুন' : 'Show more simulations'}
          </Button>
        </div>
      )}
    </section>
  );
}

function PhetSimulationCard({ simulation, locale }: { simulation: PhetSimulationMeta; locale: 'bn' | 'en' }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const isBangla = locale === 'bn';

  return (
    <Link href={`/${locale}/simulations/phet/${simulation.slug}`} className="group block h-full">
      <Card className="card-hover flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-100 dark:from-sky-950 dark:via-blue-950 dark:to-emerald-950">
          {!thumbnailFailed && (
            <Image
              src={phetThumbnailUrl(simulation.slug)}
              alt=""
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              onError={() => setThumbnailFailed(true)}
            />
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge>PhET</Badge>
            <Badge>HTML5</Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {simulation.subjects.map((item) => (
              <Badge key={item} tone={item === 'physics' ? 'physics' : 'chemistry'}>
                {item === 'physics' ? (isBangla ? 'পদার্থবিজ্ঞান' : 'Physics') : (isBangla ? 'রসায়ন' : 'Chemistry')}
              </Badge>
            ))}
          </div>
          <h3 className="text-base font-extrabold leading-snug">{simulation.title}</h3>
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-black text-physics-600 transition group-hover:gap-2 dark:text-physics-200">
            {isBangla ? 'সিমুলেশন খুলুন' : 'Open simulation'} <ArrowRight size={15} />
          </span>
        </div>
      </Card>
    </Link>
  );
}
