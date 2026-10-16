'use client';

import { cn } from '@/lib/utils';

export type DeliveryTubeProps = { className?: string };

/** Glass delivery tube for gas collection. */
export function DeliveryTube({ className }: DeliveryTubeProps) {
  return (
    <svg viewBox="0 0 80 40" className={cn('', className)} role="img" aria-hidden="true">
      <path d="M6 20 q0 -12 12 -12 h16 q8 0 8 12 q0 12 -8 12 h-16 q-12 0 -12 -12 z" fill="#eaf2f9" fillOpacity="0.5" stroke="#7d94ab" strokeWidth="1.6" />
      <path d="M42 20 h32" stroke="#7d94ab" strokeWidth="6" strokeLinecap="round" />
      <path d="M42 20 h32" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="74" cy="20" r="4" fill="#9fb3c8" stroke="#7d94ab" strokeWidth="1.2" />
    </svg>
  );
}
