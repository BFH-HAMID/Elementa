'use client';

import type { Apparatus } from '@/engine/types';
import { cn } from '@/lib/utils';
import { apparatusGlyphPaths, vesselShapes } from './vesselShapes';
import {
  Beaker,
  Burette,
  Burner,
  ConicalFlask,
  Crucible,
  DeliveryTube,
  Dropper,
  ElectrolysisCell,
  EvaporatingDish,
  GasJar,
  MeasuringCylinder,
  ReagentBottle,
  Spatula,
  TestTube,
  TestTubeHolder,
  Thermometer,
  TripodStand
} from './index';

const vesselShapesSet = new Set(['tube', 'beaker', 'flask', 'cylinder', 'burette', 'jar', 'dish', 'watch-glass', 'crucible', 'reagent-bottle']);

export type ApparatusGlyphProps = {
  apparatus: Pick<Apparatus, 'id' | 'shape'>;
  size?: number;
  className?: string;
  stroke?: string;
};

/** Tiny realistic drawing used for shelf chips, the drag overlay and the bench tool buttons. */
export function ApparatusGlyph({ apparatus, size = 30, className }: ApparatusGlyphProps) {
  const isVessel = vesselShapesSet.has(apparatus.shape);

  if (isVessel) {
    const clipId = `glyph-${apparatus.id}`;
    const vesselProps = { clipId, fill: 0.3, color: '#e9f3ff', opacity: 0.4, className: 'h-full w-full' };
    switch (apparatus.shape) {
      case 'tube':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><TestTube {...vesselProps} /></span>;
      case 'beaker':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><Beaker {...vesselProps} /></span>;
      case 'flask':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><ConicalFlask {...vesselProps} /></span>;
      case 'cylinder':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><MeasuringCylinder {...vesselProps} /></span>;
      case 'burette':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><Burette {...vesselProps} /></span>;
      case 'jar':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><GasJar {...vesselProps} /></span>;
      case 'dish':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><EvaporatingDish {...vesselProps} /></span>;
      case 'watch-glass':
        return (
          <span className={cn('inline-flex shrink-0', className)} style={{ width: size * 1.5, height: size * 0.7 }}>
            <svg viewBox="0 0 100 40" className="h-full w-full" aria-hidden="true">
              <path d="M8 8 Q50 38 92 8 M8 8 Q50 18 92 8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M20 12 Q50 30 80 12" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2" />
            </svg>
          </span>
        );
      case 'crucible':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><Crucible {...vesselProps} /></span>;
      case 'reagent-bottle':
        return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><ReagentBottle {...vesselProps} /></span>;
      default:
        break;
    }
  }

  switch (apparatus.shape) {
    case 'burner':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size }}><Burner lit={false} intensity={0.5} reducedMotion className="h-full w-full" /></span>;
    case 'tripod':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size }}><TripodStand className="h-full w-full" /></span>;
    case 'thermometer':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><Thermometer temperatureC={25} className="h-full w-full" /></span>;
    case 'dropper':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 2 }}><Dropper className="h-full w-full" /></span>;
    case 'spatula':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 2 }}><Spatula className="h-full w-full" /></span>;
    case 'delivery':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size * 2, height: size }}><DeliveryTube className="h-full w-full" /></span>;
    case 'holder':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.5 }}><TestTubeHolder className="h-full w-full" /></span>;
    case 'cell':
      return <span className={cn('inline-flex shrink-0', className)} style={{ width: size, height: size * 1.2 }}><ElectrolysisCell className="h-full w-full" /></span>;
    default:
      break;
  }

  const geometry = vesselShapes[apparatus.shape as keyof typeof vesselShapes];
  if (geometry) {
    return (
      <svg viewBox={`0 0 ${geometry.viewBox.width} ${geometry.viewBox.height}`} width={size} height={size * 1.5} className={cn('shrink-0', className)} aria-hidden="true">
        <path d={geometry.glass} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {geometry.rim && <ellipse cx={geometry.rim.cx} cy={geometry.rimY} rx={geometry.rim.rx} ry={3} fill="none" stroke="currentColor" strokeWidth="4" />}
      </svg>
    );
  }

  const path = apparatusGlyphPaths[apparatus.shape] ?? apparatusGlyphPaths.dropper;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('shrink-0', className)} aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
