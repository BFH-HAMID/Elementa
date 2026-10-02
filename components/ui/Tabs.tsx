'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, initial = items[0]?.id, className }: { items: TabItem[]; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial);
  const stripRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const current = items.find((item) => item.id === active) ?? items[0];

  // On phones the strip scrolls horizontally; keep the chosen tab in view.
  useEffect(() => {
    const strip = stripRef.current;
    const target = activeRef.current;
    if (!strip || !target || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: target.offsetLeft - (strip.clientWidth - target.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

  if (!current) return null;
  return (
    <div className={className}>
      <div role="tablist" aria-label="Content sections" ref={stripRef} className="scrollbar-thin flex gap-1 overflow-x-auto border-b border-[var(--line)]">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${current.id}`}
              onClick={() => setActive(item.id)}
              className={cn('min-h-11 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-bold transition', isActive ? 'border-physics-500 text-physics-700 dark:text-physics-200' : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]')}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`tabpanel-${current.id}`} aria-labelledby={`tab-${current.id}`} tabIndex={-1} className="pt-6 outline-none">{current.content}</div>
    </div>
  );
}
