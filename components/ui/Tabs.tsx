'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, initial = items[0]?.id, className }: { items: TabItem[]; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial);
  const current = items.find((item) => item.id === active) ?? items[0];
  if (!current) return null;
  return (
    <div className={className}>
      <div role="tablist" aria-label="Content sections" className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[var(--line)]">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === active}
            onClick={() => setActive(item.id)}
            className={cn('whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition', item.id === active ? 'border-physics-500 text-physics-700 dark:text-physics-200' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]')}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-6">{current.content}</div>
    </div>
  );
}
