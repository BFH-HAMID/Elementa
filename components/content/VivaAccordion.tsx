'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { ExperimentFrontmatter } from '@/lib/schemas';
import { cn } from '@/lib/utils';

export function VivaAccordion({ items, locale }: { items: ExperimentFrontmatter['viva']; locale: 'bn' | 'en' }) {
  const [open, setOpen] = useState<number | null>(null);
  return <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">{items.map((item, index) => { const isOpen = index === open; return <div key={item.q}><button type="button" onClick={() => setOpen(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-extrabold" aria-expanded={isOpen}><span>{locale === 'bn' ? item.q_bn ?? item.q : item.q}</span><ChevronDown size={17} className={cn('shrink-0 transition', isOpen && 'rotate-180')} /></button>{isOpen && <div className="px-4 pb-4 text-sm leading-6 muted">{locale === 'bn' ? item.a_bn ?? item.a : item.a}</div>}</div>; })}</div>;
}
