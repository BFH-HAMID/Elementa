'use client';

import { cn } from '@/lib/utils';

export type SpatulaProps = { className?: string };

/** Stainless-steel spatula for transferring solids. */
export function Spatula({ className }: SpatulaProps) {
  return (
    <svg viewBox="0 0 40 110" className={cn('', className)} role="img" aria-hidden="true">
      <rect x="18" y="8" width="4" height="62" rx="2" fill="#9fb3c8" stroke="#7d94ab" strokeWidth="1.2" />
      <path d="M12 70 h16 l4 14 q0 6 -4 6 h-16 q-4 0 -4 -6 z" fill="#dcecf8" stroke="#7d94ab" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="17" y="8" width="2" height="62" fill="#ffffff" fillOpacity="0.45" />
    </svg>
  );
}
