'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { readChemPracticalProgress } from '@/lib/chemPracticalProgress';
import { useLabI18n } from '@/lib/i18n';

/** Small "3/8 readings" badge on catalog cards, read from the learner's saved simulation sessions. */
export function SimulationProgress({ slug, minReadings }: { slug: string; minReadings: number }) {
  const { locale } = useLabI18n();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    setCount(readChemPracticalProgress()[slug] ?? 0);
  }, [slug]);
  if (!count) return null;
  const done = count >= minReadings;
  return (
    <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-[var(--surface-soft)] text-[var(--muted)]'}`}>
      {done && <CheckCircle2 size={11} />}
      {locale === 'bn' ? `${count}/${minReadings} পাঠ` : `${count}/${minReadings} readings`}
    </span>
  );
}
