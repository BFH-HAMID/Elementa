'use client';

import React from 'react';
import { BENCH, C, Txt, clampN, frac } from '../primitives';
import { BunsenBurner } from '../kit';

/** Bunsen burner standing on the bench at `cx`. */
export function Bunsen({ cx, t, flame = 1, open = true, color }: { cx: number; t: number; flame?: number; open?: boolean; color?: string }) {
  return <BunsenBurner cx={cx} yb={BENCH} flame={flame} open={open} color={color} t={t} />;
}

/** Wooden test-tube holder gripping a tube at height `y`. */
export function TubeHolder({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 16} y={y - 3} width="32" height="6" rx="2" fill="#7d8995" />
      <path d={`M ${x - 16} ${y} L ${x - 92} ${y + 34}`} stroke="url(#cx-wood)" strokeWidth="7" strokeLinecap="round" />
      <path d={`M ${x - 16} ${y} L ${x - 92} ${y + 34}`} stroke="#8f6230" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </g>
  );
}

/** "POP!" burst for the hydrogen test. */
export function PopBurst({ x, y, t, text = 'POP!' }: { x: number; y: number; t: number; text?: string }) {
  const p = frac(t * 0.8);
  const s = 0.8 + 0.4 * Math.sin(p * Math.PI);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ pointerEvents: 'none' }}>
      <path d="M 0 -18 L 6 -7 L 18 -9 L 10 1 L 17 12 L 4 8 L 0 19 L -4 8 L -17 12 L -10 1 L -18 -9 L -6 -7 Z" fill="#fde047" stroke="#f59e0b" strokeWidth="1.5" />
      <Txt x={0} y={4} size={8.5} color="#9a3412" weight={900}>
        {text}
      </Txt>
    </g>
  );
}

/** Litmus / indicator paper colour for a gas test: fresh → changed → bleached. */
export function testPaperColour(kind: 'bleach' | 'starch' | 'blue' | 'red', amount: number): string {
  const a = clampN(amount, 0, 1);
  if (kind === 'starch') return a > 0.15 ? '#1f2a5c' : '#f4f1e6';
  if (kind === 'blue') return a > 0.15 ? '#2f6fd0' : '#d9403c';
  if (kind === 'red') return a > 0.15 ? '#d9403c' : '#2f6fd0';
  // bleach: blue litmus → red → white
  if (a < 0.15) return '#2f6fd0';
  if (a < 0.5) return '#d9403c';
  return '#f6f3ea';
}

/** Small caption panel pinned to the wall. */
export function WallNote({ x, y, w, lines }: { x: number; y: number; w: number; lines: string[] }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={14 + lines.length * 12} rx="6" fill="#ffffff" opacity="0.92" stroke={C.line} filter="url(#cx-shadow)" />
      {lines.map((l, i) => (
        <Txt key={i} x={x + 9} y={y + 17 + i * 12} anchor="start" size={8.5} color={i === 0 ? C.ink : C.muted} weight={i === 0 ? 800 : 700}>
          {l}
        </Txt>
      ))}
    </g>
  );
}
