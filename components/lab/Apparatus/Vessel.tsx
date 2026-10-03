'use client';

import type { ReactNode } from 'react';
import type { ActiveEffect, VesselShape } from '@/engine/types';
import { EffectsLayer } from '../EffectsLayer';
import { LiquidView } from '../LiquidView';
import { vesselShapes } from './vesselShapes';

export type VesselProps = {
  shape: VesselShape;
  /** 0 … 1 of the vessel's capacity. */
  fill: number;
  color: string;
  opacity?: number;
  sedimentFill?: number;
  sedimentColor?: string | null;
  turbidity?: number;
  effects?: ActiveEffect[];
  /** Unique per instance — it names the clip path and the effect filters. */
  clipId: string;
  reducedMotion?: boolean;
  className?: string;
  /** Y of the liquid surface, needed to start bubbles in the right place. */
  children?: ReactNode;
};

/**
 * The generic glassware renderer. Each concrete piece of apparatus (TestTube, Beaker,
 * ConicalFlask, …) is a thin preset of this component with its own shape geometry.
 */
export function Vessel({
  shape,
  fill,
  color,
  opacity = 0.75,
  sedimentFill = 0,
  sedimentColor = null,
  turbidity = 0,
  effects = [],
  clipId,
  reducedMotion = false,
  className,
  children
}: VesselProps) {
  const geometry = vesselShapes[shape];
  const { viewBox, glass, cavity, box, rim, base, graduations, highlight } = geometry;
  const liquidTop = box.y + box.height * (1 - Math.min(1, Math.max(0, fill)));
  const ticks = graduations
    ? Array.from({ length: graduations.count }).map((_, index) => {
        const step = (box.height - 12) / graduations!.count;
        return { y: box.y + 6 + step * (index + 1), long: index % 5 === 4 };
      })
    : [];

  return (
    <svg
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      className={className}
      role="img"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={cavity} />
        </clipPath>
        <linearGradient id={`${clipId}-glass`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
          <stop offset="35%" stopColor="#dcecf8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.26" />
        </linearGradient>
      </defs>

      {base && <path d={base} fill="#9fb3c8" fillOpacity="0.35" stroke="#7d94ab" strokeWidth="1.4" strokeLinejoin="round" />}

      {/* Glass body */}
      <path d={cavity} fill={`url(#${clipId}-glass)`} />

      <g clipPath={`url(#${clipId})`}>
        <LiquidView
          geometry={geometry}
          fill={fill}
          color={color}
          opacity={opacity}
          sedimentFill={sedimentFill}
          sedimentColor={sedimentColor}
          turbidity={turbidity}
          reducedMotion={reducedMotion}
        />
        <EffectsLayer geometry={geometry} effects={effects} liquidTop={liquidTop} clipId={clipId} reducedMotion={reducedMotion} />
      </g>

      <path
        d={glass}
        fill="none"
        stroke="var(--lab-glass, #7d94ab)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={highlight} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      {rim && (
        <>
          <ellipse cx={rim.cx} cy={geometry.rimY} rx={rim.rx} ry={3} fill="none" stroke="var(--lab-glass, #7d94ab)" strokeWidth="2.2" />
          <ellipse cx={rim.cx} cy={geometry.rimY} rx={rim.rx - 3} ry={2} fill="#ffffff" fillOpacity="0.18" />
        </>
      )}
      {ticks.map((tick) => (
        <line
          key={tick.y}
          x1={graduations!.x}
          y1={tick.y}
          x2={graduations!.x + (tick.long ? graduations!.width : graduations!.width * 0.55)}
          stroke="#7d94ab"
          strokeOpacity="0.75"
          strokeWidth={tick.long ? 1.3 : 0.9}
        />
      ))}
      {children}
    </svg>
  );
}
