'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { electricityArt } from './electric';
import { mechanicsArt } from './mechanics';
import { opticsArt } from './optics';
import { heatArt } from './heat';
import { wavesArt } from './waves';
import { measuringArt } from './measuring';
import { modernArt } from './modern';
import { Etch, type ArtCtx, type ArtEntry } from './parts';

/**
 * Elementa Physics Lab — instrument artwork registry.
 *
 * Every tool in `data/equipment.json` has a hand-drawn, shaded illustration
 * that reacts to the tool's real state: solver readings, switch positions,
 * slider values and the animation clock. The workbench and the equipment
 * shelf render the same artwork, so a tool looks identical wherever it is
 * shown — like picking up the real instrument.
 */
export const EQUIPMENT_ART: Record<string, ArtEntry> = {
  ...electricityArt,
  ...opticsArt,
  ...mechanicsArt,
  ...heatArt,
  ...wavesArt,
  ...measuringArt,
  ...modernArt
};

/** Unknown / future tools still get a believable grey lab instrument. */
const fallbackArt: ArtEntry = {
  vb: '0 0 120 62',
  Comp: ({ bn, live }) => (
    <g>
      <ellipse cx={60} cy={56} rx={38} ry={5} fill="#0b1220" opacity={0.28} filter="url(#ix-blur)" />
      <rect x={14} y={12} width={92} height={40} rx={5} fill="url(#ix-charcoal)" stroke="#0b1220" strokeOpacity={0.6} strokeWidth={0.8} />
      <rect x={14} y={12} width={92} height={8} rx={4} fill="#ffffff" opacity={0.12} />
      <circle cx={60} cy={33} r={9} fill="url(#ix-dial)" stroke="#8a8272" strokeWidth={0.6} />
      <line x1={60} y1={33} x2={60} y2={26} stroke="#b91c1c" strokeWidth={1.2} />
      {live && <circle cx={92} cy={20} r={3} fill="#22e06a" opacity={0.9} />}
      <Etch x={60} y={60} size={5.6} color="#475569" weight={700}>
        {bn ? 'ল্যাব যন্ত্র' : 'LAB INSTRUMENT'}
      </Etch>
    </g>
  )
};

export function hasEquipmentArt(equipmentId: string): boolean {
  return !!EQUIPMENT_ART[equipmentId];
}

export interface EquipmentArtProps extends ArtCtx {
  equipmentId: string;
  className?: string;
}

/**
 * Renders one instrument. The artwork is pure vector SVG in its own viewBox,
 * so it stays crisp from a 40 px shelf thumbnail up to a full-screen bench.
 */
export function EquipmentArt({ equipmentId, className, ...ctx }: EquipmentArtProps) {
  const entry = EQUIPMENT_ART[equipmentId] ?? fallbackArt;
  const Art = entry.Comp;
  return (
    <svg
      viewBox={entry.vb}
      preserveAspectRatio="xMidYMid meet"
      className={cn('block h-full w-full overflow-visible', className)}
      role="img"
      aria-label={equipmentId}
      data-equipment-art={equipmentId}
    >
      <Art {...ctx} />
    </svg>
  );
}
