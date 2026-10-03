'use client';

import { motion } from 'framer-motion';
import type { ActiveEffect } from '@/engine/types';
import type { ShapeGeometry } from './Apparatus/vesselShapes';

/**
 * Canvas-free particle effects: bubbles, smoke, steam, settling precipitate and the
 * flash of a bang. Everything is SVG + framer-motion so it stays crisp on phones and
 * honours the system reduced-motion preference.
 */

export type EffectsLayerProps = {
  geometry: ShapeGeometry;
  effects: ActiveEffect[];
  liquidTop: number;
  clipId: string;
  reducedMotion?: boolean;
};

/** Stable pseudo-random so server and client render identical particles. */
function prng(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function EffectsLayer({ geometry, effects, liquidTop, clipId, reducedMotion = false }: EffectsLayerProps) {
  const { box, rimY, viewBox } = geometry;
  const bottom = box.y + box.height - 3;
  const byKind = (kind: ActiveEffect['kind']) => effects.filter((effect) => effect.kind === kind);

  const bubbles = byKind('bubbles');
  const smoke = [...byKind('smoke'), ...byKind('steam')];
  const settling = byKind('precipitate');
  const flashes = [...byKind('flash'), ...byKind('glow')];

  return (
    <g aria-hidden="true">
      <defs>
        <filter id={`${clipId}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <radialGradient id={`${clipId}-flash`}>
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ffd27a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffb03a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Bubbles stay inside the glass. */}
      <g clipPath={`url(#${clipId})`}>
        {bubbles.map((effect, effectIndex) => {
          const count = Math.round(5 + effect.intensity * 11);
          return Array.from({ length: count }).map((_, index) => {
            const seed = effectIndex * 31 + index;
            const cx = box.x + 2 + prng(seed * 1.7) * Math.max(2, box.width - 4);
            const radius = 0.9 + prng(seed * 3.1) * (1.4 + effect.intensity * 1.6);
            const travel = Math.max(6, bottom - liquidTop);
            const duration = (1.5 + prng(seed * 5.3) * 1.5) / (0.6 + effect.intensity);
            const delay = prng(seed * 7.9) * duration;
            if (reducedMotion) {
              return (
                <circle
                  key={`${effect.id}-${index}`}
                  cx={cx}
                  cy={bottom - travel * prng(seed * 2.2)}
                  r={radius}
                  fill={effect.color}
                  fillOpacity={0.5}
                  stroke="#ffffff"
                  strokeOpacity={0.5}
                  strokeWidth={0.3}
                />
              );
            }
            return (
              <motion.circle
                key={`${effect.id}-${index}`}
                cx={cx}
                cy={bottom}
                r={radius}
                fill={effect.color}
                fillOpacity={0.55}
                stroke="#ffffff"
                strokeOpacity={0.45}
                strokeWidth={0.3}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: [0, -travel], opacity: [0, 0.9, 0.7, 0], scale: [0.6, 1, 1.1] }}
                transition={{ duration, delay, repeat: Infinity, ease: 'easeIn' }}
              />
            );
          });
        })}

        {/* A fresh precipitate rains down and then settles. */}
        {settling.map((effect, effectIndex) => {
          const count = Math.round(6 + effect.intensity * 10);
          return Array.from({ length: count }).map((_, index) => {
            const seed = effectIndex * 17 + index;
            const cx = box.x + 1.5 + prng(seed * 2.9) * Math.max(1, box.width - 3);
            const size = 1 + prng(seed * 4.4) * 1.8;
            const distance = Math.max(4, bottom - Math.max(liquidTop, box.y + 6));
            const duration = 1 + prng(seed * 6.1) * 1.1;
            const delay = prng(seed * 8.2) * 1.4;
            return (
              <motion.rect
                key={`${effect.id}-${index}`}
                x={cx}
                y={Math.max(liquidTop, box.y + 4)}
                width={size}
                height={size}
                rx={size / 2}
                fill={effect.color}
                fillOpacity={0.9}
                initial={reducedMotion ? false : { y: 0, opacity: 0 }}
                animate={reducedMotion ? { opacity: 0.85 } : { y: [0, distance], opacity: [0, 0.95, 0.8] }}
                transition={reducedMotion ? { duration: 0 } : { duration, delay, ease: 'easeIn' }}
              />
            );
          });
        })}
      </g>

      {/* Smoke and steam escape above the mouth of the vessel. */}
      {smoke.map((effect, effectIndex) => {
        const count = Math.round(4 + effect.intensity * 6);
        return (
          <g key={effect.id} filter={`url(#${clipId}-blur)`}>
            {Array.from({ length: count }).map((_, index) => {
              const seed = effectIndex * 23 + index;
              const cx = viewBox.width / 2 + (prng(seed * 1.3) - 0.5) * Math.min(28, box.width + 12);
              const radius = 3 + prng(seed * 3.7) * 5;
              const duration = 2.6 + prng(seed * 5.9) * 2.2;
              const delay = prng(seed * 7.1) * 2.4;
              return (
                <motion.circle
                  key={`${effect.id}-${index}`}
                  cx={cx}
                  cy={rimY - 2}
                  r={radius}
                  fill={effect.color}
                  initial={reducedMotion ? { opacity: 0.3 } : { opacity: 0, y: 0, scale: 0.5 }}
                  animate={
                    reducedMotion
                      ? { opacity: 0.25 }
                      : { opacity: [0, effect.intensity * 0.55, 0], y: [0, -46], scale: [0.5, 1.9], x: [0, (prng(seed * 9.4) - 0.5) * 22] }
                  }
                  transition={reducedMotion ? { duration: 0 } : { duration, delay, repeat: Infinity, ease: 'easeOut' }}
                />
              );
            })}
          </g>
        );
      })}

      {/* Explosion / bright glow. */}
      {flashes.map((effect) => (
        <motion.circle
          key={effect.id}
          cx={viewBox.width / 2}
          cy={box.y + box.height * 0.45}
          r={Math.max(box.width, box.height) * 0.75}
          fill={`url(#${clipId}-flash)`}
          initial={reducedMotion ? { opacity: 0.25 } : { opacity: 0.95, scale: 0.4 }}
          animate={reducedMotion ? { opacity: 0.2 } : { opacity: 0, scale: 1.5 }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: 'easeOut' }}
        />
      ))}
    </g>
  );
}
