import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'physics' | 'chemistry' | 'warm'; className?: string }) {
  const toneClass = {
    neutral: 'bg-[var(--surface-soft)] text-[var(--muted)]',
    physics: 'bg-physics-100 text-physics-700 dark:bg-physics-900 dark:text-physics-100',
    chemistry: 'bg-chemistry-100 text-chemistry-700 dark:bg-chemistry-900 dark:text-chemistry-100',
    warm: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
  }[tone];
  return <span className={cn('pill', toneClass, className)}>{children}</span>;
}
