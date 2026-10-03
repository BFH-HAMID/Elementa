'use client';

import { motion } from 'framer-motion';
import { lighten, withAlpha } from '@/engine/colorMixer';
import type { ShapeGeometry } from './Apparatus/vesselShapes';

export type LiquidViewProps = {
  geometry: ShapeGeometry;
  /** 0 (empty) … 1 (brim full). */
  fill: number;
  color: string;
  opacity: number;
  sedimentFill?: number;
  sedimentColor?: string | null;
  turbidity?: number;
  reducedMotion?: boolean;
};

/**
 * The liquid inside a piece of glassware: a rectangle clipped by the vessel's cavity
 * path, so the same code fills a test tube, a conical flask or a burette correctly.
 */
export function LiquidView({
  geometry,
  fill,
  color,
  opacity,
  sedimentFill = 0,
  sedimentColor = null,
  turbidity = 0,
  reducedMotion = false
}: LiquidViewProps) {
  const { x, y, width, height } = geometry.box;
  const level = Math.min(1, Math.max(0, fill));
  const liquidHeight = height * level;
  const liquidTop = y + height - liquidHeight;
  const sedimentHeight = Math.min(height * 0.6, height * sedimentFill);
  const transition = reducedMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 110, damping: 22, mass: 0.7 };

  if (level <= 0 && sedimentHeight <= 0) return null;

  return (
    <g>
      {level > 0 && (
        <motion.rect
          x={x}
          width={width}
          fill={color}
          fillOpacity={opacity}
          initial={false}
          animate={{ y: liquidTop, height: Math.max(0.5, liquidHeight) }}
          transition={transition}
        />
      )}
      {/* Turbid cloud while a fresh precipitate is still suspended. */}
      {turbidity > 0.02 && level > 0 && sedimentColor && (
        <motion.rect
          x={x}
          width={width}
          fill={sedimentColor}
          initial={false}
          animate={{ y: liquidTop, height: Math.max(0.5, liquidHeight), opacity: turbidity * 0.55 }}
          transition={transition}
        />
      )}
      {/* Meniscus: a lighter band along the surface. */}
      {level > 0.01 && (
        <motion.rect
          x={x}
          width={width}
          height={Math.min(3, Math.max(1.2, liquidHeight * 0.12))}
          fill={lighten(color, 0.55)}
          fillOpacity={0.85}
          initial={false}
          animate={{ y: liquidTop }}
          transition={transition}
        />
      )}
      {/* Settled solid. */}
      {sedimentHeight > 0.4 && sedimentColor && (
        <motion.g initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <rect x={x} y={y + height - sedimentHeight} width={width} height={sedimentHeight} fill={sedimentColor} />
          <rect
            x={x}
            y={y + height - sedimentHeight}
            width={width}
            height={Math.min(2.5, sedimentHeight)}
            fill={lighten(sedimentColor, 0.35)}
            fillOpacity={0.7}
          />
          <rect
            x={x}
            y={y + height - sedimentHeight}
            width={width}
            height={sedimentHeight}
            fill={withAlpha('#0b1a2a', 0.08)}
          />
        </motion.g>
      )}
    </g>
  );
}
