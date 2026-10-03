'use client';

import { useEffect } from 'react';
import { useLabStore } from '@/lib/store';

export function ViewTracker({ item }: { item: { slug: string; kind: 'equation' | 'experiment' | 'simulation' | 'quiz' | 'lab'; href: string; title: string } }) {
  const addRecent = useLabStore((state) => state.addRecent);
  const markProgress = useLabStore((state) => state.markProgress);
  useEffect(() => { addRecent(item); markProgress(`${item.kind}:${item.slug}`, 100); }, [addRecent, item, markProgress]);
  return null;
}
