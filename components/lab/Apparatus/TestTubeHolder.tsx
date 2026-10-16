'use client';

import { cn } from '@/lib/utils';

export type TestTubeHolderProps = { className?: string };

/** Wooden test-tube holder (clamp). */
export function TestTubeHolder({ className }: TestTubeHolderProps) {
  return (
    <svg viewBox="0 0 60 90" className={cn('', className)} role="img" aria-hidden="true">
      <rect x="24" y="8" width="12" height="74" rx="3" fill="#8b5a3c" stroke="#5a3825" strokeWidth="1.4" />
      <path d="M10 16 h40" stroke="#5a3825" strokeWidth="4" strokeLinecap="round" />
      <path d="M10 16 h40" stroke="#c99a6b" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="26" y="10" width="4" height="70" fill="#c99a6b" fillOpacity="0.5" />
      <circle cx="30" cy="82" r="6" fill="#5a3825" />
    </svg>
  );
}
