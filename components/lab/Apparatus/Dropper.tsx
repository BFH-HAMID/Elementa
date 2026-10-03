'use client';

import { cn } from '@/lib/utils';

export type DropperProps = { color?: string; className?: string };

/** Pasteur dropper — used for indicators and for 1 mL transfers. */
export function Dropper({ color = '#dcefff', className }: DropperProps) {
  return (
    <svg viewBox="0 0 40 110" className={cn('', className)} role="img" aria-hidden="true">
      <path d="M12 6 h16 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 v-14 a4 4 0 0 1 4 -4 z" fill="#e8795b" fillOpacity="0.85" />
      <rect x="15" y="28" width="10" height="8" rx="2" fill="#9fb3c8" />
      <path d="M16 36 h8 v46 l-4 18 l-4 -18 z" fill="#eaf2f9" stroke="#7d94ab" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 60 h4 v22 l-2 10 l-2 -10 z" fill={color} fillOpacity="0.9" />
    </svg>
  );
}
