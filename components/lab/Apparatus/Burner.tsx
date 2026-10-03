'use client';

import { cn } from '@/lib/utils';

export type BurnerProps = {
  lit: boolean;
  intensity?: number;
  /** Flame-test colours override the usual blue cone. */
  flameColor?: string | null;
  reducedMotion?: boolean;
  className?: string;
};

const DEFAULT_OUTER = '#ff9d3c';
const DEFAULT_INNER = '#3f7fe0';

/** A Bunsen burner. Dragging it under a vessel is how the lab starts heating. */
export function Burner({ lit, intensity = 0.8, flameColor = null, reducedMotion = false, className }: BurnerProps) {
  const scale = 0.55 + Math.min(1, Math.max(0.1, intensity)) * 0.7;
  const outer = flameColor ?? DEFAULT_OUTER;
  const inner = flameColor ? '#ffffff' : DEFAULT_INNER;

  return (
    <svg viewBox="0 0 100 84" className={cn('overflow-visible', className)} role="img" aria-hidden="true">
      <defs>
        <radialGradient id="burner-glow" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor={outer} stopOpacity="0.55" />
          <stop offset="100%" stopColor={outer} stopOpacity="0" />
        </radialGradient>
      </defs>

      {lit && !reducedMotion && <circle cx="50" cy="34" r="30" fill="url(#burner-glow)" className="animate-pulse-soft" />}

      {/* Flame */}
      {lit && (
        <g
          style={{
            transform: `scale(${scale})`,
            transformOrigin: '50px 46px',
            transformBox: 'fill-box',
            transition: reducedMotion ? undefined : 'transform 320ms ease-out'
          }}
        >
          <g
            style={{ transformOrigin: '50px 46px', transformBox: 'fill-box' }}
            className={reducedMotion ? undefined : 'animate-flicker'}
          >
            <path d="M50 2 C62 20 66 34 50 46 C34 34 38 20 50 2 Z" fill={outer} fillOpacity="0.92" />
            <path d="M50 18 C57 28 58 37 50 46 C42 37 43 28 50 18 Z" fill={inner} fillOpacity="0.85" />
            <path d="M50 32 C53 38 53 42 50 46 C47 42 47 38 50 32 Z" fill="#dff3ff" fillOpacity="0.8" />
          </g>
        </g>
      )}

      {/* Barrel, collar and base */}
      <rect x="44" y="44" width="12" height="24" rx="2" fill="#94a7bb" />
      <rect x="41" y="42" width="18" height="6" rx="2" fill="#7d94ab" />
      <rect x="46" y="66" width="8" height="6" fill="#6d8299" />
      <path d="M30 72 H70 L74 82 H26 Z" fill="#8195aa" />
      <ellipse cx="50" cy="82" rx="24" ry="3" fill="#0b1a2a" fillOpacity="0.14" />
      {!lit && (
        <g>
          <circle cx="50" cy="42" r="3" fill="#5c7186" />
          <text x="50" y="20" textAnchor="middle" fontSize="9" fill="var(--muted)" fontWeight="700">
            off
          </text>
        </g>
      )}
    </svg>
  );
}
