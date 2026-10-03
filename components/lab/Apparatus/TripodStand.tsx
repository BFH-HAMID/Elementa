'use client';

import { cn } from '@/lib/utils';

export type TripodStandProps = { className?: string };

/** Tripod with wire gauze: the vessel sits on it while the burner heats from below. */
export function TripodStand({ className }: TripodStandProps) {
  return (
    <svg viewBox="0 0 120 60" className={cn('', className)} role="img" aria-hidden="true">
      <rect x="14" y="10" width="92" height="7" rx="2" fill="#8195aa" />
      <g stroke="#9fb3c8" strokeWidth="1" opacity="0.85">
        {Array.from({ length: 13 }).map((_, index) => (
          <line key={`v-${index}`} x1={18 + index * 7} y1="10" x2={18 + index * 7} y2="17" />
        ))}
      </g>
      <path d="M26 17 L12 56" stroke="#7d94ab" strokeWidth="4" strokeLinecap="round" />
      <path d="M94 17 L108 56" stroke="#7d94ab" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 17 L60 56" stroke="#7d94ab" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="60" cy="57" rx="52" ry="3" fill="#0b1a2a" fillOpacity="0.12" />
    </svg>
  );
}
