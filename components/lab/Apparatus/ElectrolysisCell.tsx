'use client';

import { cn } from '@/lib/utils';

export type ElectrolysisCellProps = { className?: string };

/** Small electrolysis cell with two electrodes. */
export function ElectrolysisCell({ className }: ElectrolysisCellProps) {
  return (
    <svg viewBox="0 0 80 90" className={cn('', className)} role="img" aria-hidden="true">
      <rect x="12" y="20" width="56" height="52" rx="6" fill="#eaf2f9" fillOpacity="0.5" stroke="#7d94ab" strokeWidth="1.6" />
      <rect x="12" y="20" width="56" height="10" rx="6" fill="#9fb3c8" fillOpacity="0.6" />
      <rect x="22" y="8" width="6" height="24" rx="2" fill="#c9a227" stroke="#7d94ab" strokeWidth="1" />
      <rect x="52" y="8" width="6" height="24" rx="2" fill="#5a5a5a" stroke="#7d94ab" strokeWidth="1" />
      <path d="M25 32 v30 M55 32 v30" stroke="#7d94ab" strokeWidth="1.2" />
      <circle cx="25" cy="62" r="3" fill="#fbbf24" />
      <circle cx="55" cy="62" r="3" fill="#94a3b8" />
    </svg>
  );
}
