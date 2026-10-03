'use client';

import type { Apparatus } from '@/engine/types';
import { cn } from '@/lib/utils';
import { apparatusGlyphPaths, vesselShapes } from './vesselShapes';

export type ApparatusGlyphProps = {
  apparatus: Pick<Apparatus, 'id' | 'shape'>;
  size?: number;
  className?: string;
  stroke?: string;
};

const vesselShapesSet = new Set(['tube', 'beaker', 'flask', 'cylinder', 'burette', 'jar', 'dish']);

/** Tiny line drawing used for shelf chips, the drag overlay and the bench tool buttons. */
export function ApparatusGlyph({ apparatus, size = 30, className, stroke = 'currentColor' }: ApparatusGlyphProps) {
  const isVessel = vesselShapesSet.has(apparatus.shape);

  if (isVessel) {
    const geometry = vesselShapes[apparatus.shape as keyof typeof vesselShapes];
    return (
      <svg
        viewBox={`0 0 ${geometry.viewBox.width} ${geometry.viewBox.height}`}
        width={size}
        height={size * 1.5}
        className={cn('shrink-0', className)}
        aria-hidden="true"
      >
        <path d={geometry.glass} fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {geometry.rim && <ellipse cx={geometry.rim.cx} cy={geometry.rimY} rx={geometry.rim.rx} ry={3} fill="none" stroke={stroke} strokeWidth="4" />}
      </svg>
    );
  }

  const path = apparatusGlyphPaths[apparatus.shape] ?? apparatusGlyphPaths.dropper;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('shrink-0', className)} aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
