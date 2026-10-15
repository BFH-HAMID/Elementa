'use client';

import React from 'react';
import type { ChemParams, ChemPracticalModel, ChemView } from '@/engine/chemPracticals';

/**
 * Self-contained SVG building blocks for the chemistry practical scenes.
 * Every gradient/filter lives in `ChemDefs` (ids prefixed `cx-`), so the scenes do not
 * depend on any paint server defined elsewhere on the page. The scene is always drawn
 * as a lit laboratory (light wall, dark epoxy bench), whatever the site theme.
 */

export const W = 640;
export const H = 360;
export const BENCH = 300;

export const C = {
  ink: '#14283d',
  muted: '#59718e',
  faint: '#8aa0b6',
  line: '#c9d6e3',
  glass: '#7f9fb8',
  glassDark: '#5f7f99',
  chem: '#0e9f78',
  chemDark: '#087d60',
  red: '#e2483d',
  amber: '#f59e0b',
  blue: '#1677d2',
  steel: '#9aa8b8',
  steelDark: '#5f6f82',
  wood: '#c99a5b',
  woodDark: '#8f6230',
  white: '#ffffff'
};

export interface SceneProps {
  model: ChemPracticalModel;
  view: ChemView;
  params: ChemParams;
  setParam: (key: string, value: number) => void;
  /** Free-running animation clock in seconds. */
  t: number;
  bn: boolean;
}

/* ------------------------------------------------------------------ */
/* View accessors                                                       */
/* ------------------------------------------------------------------ */

export const safe = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
export const vNum = (view: ChemView, key: string, fallback = 0): number => {
  const v = view[key];
  if (typeof v === 'boolean') return v ? 1 : 0;
  return safe(v, fallback);
};
export const vStr = (view: ChemView, key: string, fallback = ''): string => (typeof view[key] === 'string' ? (view[key] as string) : fallback);
export const vBool = (view: ChemView, key: string): boolean => view[key] === true || view[key] === 1;
export function vObj<T>(view: ChemView, key: string): T | undefined {
  const v = view[key];
  return v && typeof v === 'object' ? (v as T) : undefined;
}
export const clampN = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
export const fmt = (v: number, digits = 1) => {
  if (!Number.isFinite(v)) return '—';
  const s = v.toFixed(digits);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
};

/** Pale (nearly colourless) liquids are drawn more transparent so solids show through. */
export function liquidAlpha(color: string | undefined, requested?: number): number {
  if (requested !== undefined) return requested;
  if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return 0.82;
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.86 ? 0.5 : lum > 0.7 ? 0.68 : 0.84;
}
/** Deterministic pseudo-random in [0, 1). */
export const rnd = (seed: number) => {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const frac = (v: number) => v - Math.floor(v);
export const pick = (bn: boolean, en: string, bnText?: string) => (bn && bnText ? bnText : en);

/* ------------------------------------------------------------------ */
/* Paint servers                                                        */
/* ------------------------------------------------------------------ */

export function ChemDefs() {
  return (
    <defs>
      <linearGradient id="cx-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7fafd" />
        <stop offset="1" stopColor="#e2eaf2" />
      </linearGradient>
      <pattern id="cx-tiles" width="48" height="32" patternUnits="userSpaceOnUse">
        <path d="M48 0H0V32" fill="none" stroke="#d6e1eb" strokeWidth="1" />
      </pattern>
      <linearGradient id="cx-bench" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#536170" />
        <stop offset="0.25" stopColor="#3f4b58" />
        <stop offset="1" stopColor="#2a333d" />
      </linearGradient>
      <linearGradient id="cx-glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
        <stop offset="0.16" stopColor="#d6ecfa" stopOpacity="0.2" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.04" />
        <stop offset="0.84" stopColor="#d6ecfa" stopOpacity="0.22" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="cx-shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#0b1a2a" stopOpacity="0.2" />
        <stop offset="0.28" stopColor="#0b1a2a" stopOpacity="0" />
        <stop offset="0.62" stopColor="#ffffff" stopOpacity="0.1" />
        <stop offset="1" stopColor="#0b1a2a" stopOpacity="0.24" />
      </linearGradient>
      <linearGradient id="cx-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1f4f7" />
        <stop offset="0.5" stopColor="#a7b2bf" />
        <stop offset="1" stopColor="#6c7886" />
      </linearGradient>
      <linearGradient id="cx-metal-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#77838f" />
        <stop offset="0.4" stopColor="#e9eef3" />
        <stop offset="1" stopColor="#7d8995" />
      </linearGradient>
      <linearGradient id="cx-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dcae72" />
        <stop offset="1" stopColor="#a8743c" />
      </linearGradient>
      <linearGradient id="cx-porcelain" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#c9d1d8" />
        <stop offset="0.35" stopColor="#ffffff" />
        <stop offset="1" stopColor="#b6c0c9" />
      </linearGradient>
      <linearGradient id="cx-plastic" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#e6ebef" />
        <stop offset="0.4" stopColor="#ffffff" />
        <stop offset="1" stopColor="#d3dbe2" />
      </linearGradient>
      <linearGradient id="cx-case" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b4856" />
        <stop offset="1" stopColor="#1f2832" />
      </linearGradient>
      <linearGradient id="cx-lcd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d9f2d0" />
        <stop offset="1" stopColor="#b9dcae" />
      </linearGradient>
      <linearGradient id="cx-flame-out" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#5a7cff" stopOpacity="0.85" />
        <stop offset="0.55" stopColor="#8fa8ff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#c9d4ff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cx-flame-in" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#1f4dff" />
        <stop offset="1" stopColor="#7fd7ff" />
      </linearGradient>
      <linearGradient id="cx-flame-lum" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#4d6dff" stopOpacity="0.9" />
        <stop offset="0.18" stopColor="#ffd34d" />
        <stop offset="0.7" stopColor="#ff9a2e" stopOpacity="0.9" />
        <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="cx-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="0.4" stopColor="#fff6d8" stopOpacity="0.7" />
        <stop offset="1" stopColor="#fff6d8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cx-heat" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#ff7a3d" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ff7a3d" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cx-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#0e9f78" stopOpacity="0.2" />
        <stop offset="1" stopColor="#0e9f78" stopOpacity="0" />
      </radialGradient>
      <filter id="cx-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
      <filter id="cx-blur-lg" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="cx-shadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="1.5" dy="3" stdDeviation="2.6" floodColor="#0b1220" floodOpacity="0.35" />
      </filter>
      <marker id="cx-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor" />
      </marker>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* Frame                                                                */
/* ------------------------------------------------------------------ */

export function SceneFrame({ label, children, hood = false }: { label: string; children: React.ReactNode; hood?: boolean }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label={label} fontFamily="inherit">
      <ChemDefs />
      <rect x="0" y="0" width={W} height={BENCH} fill="url(#cx-wall)" />
      <rect x="0" y="0" width={W} height={BENCH} fill="url(#cx-tiles)" opacity="0.7" />
      {hood && (
        <g>
          <rect x="6" y="6" width={W - 12} height={BENCH - 6} rx="6" fill="#eaf4f0" opacity="0.5" stroke="#9bb8ad" strokeWidth="3" />
          <rect x="6" y="6" width={W - 12} height="16" fill="#9bb8ad" opacity="0.65" />
          <Txt x={W / 2} y={18} size={9.5} color="#24493d" weight={800}>
            FUME CUPBOARD · ধোঁয়া নিষ্কাশন কক্ষ
          </Txt>
        </g>
      )}
      <rect x="0" y={BENCH} width={W} height={H - BENCH} fill="url(#cx-bench)" />
      <rect x="0" y={BENCH} width={W} height="2.5" fill="#8d9cab" opacity="0.8" />
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Text & readouts                                                      */
/* ------------------------------------------------------------------ */

export function Txt({
  x,
  y,
  children,
  size = 11,
  anchor = 'middle',
  color = C.muted,
  weight = 700,
  mono = false,
  opacity
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  weight?: number;
  mono?: boolean;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      fill={color}
      fontWeight={weight}
      opacity={opacity}
      fontFamily={mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  );
}

/** A rounded label tag (on the wall or bench). */
export function Tag({ x, y, text, tone = 'light', size = 10, anchor = 'middle' }: { x: number; y: number; text: string; tone?: 'light' | 'dark' | 'chem' | 'warn'; size?: number; anchor?: 'start' | 'middle' | 'end' }) {
  const w = Math.max(18, text.length * size * 0.56 + 12);
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const fill = tone === 'dark' ? '#1f2a36' : tone === 'chem' ? C.chemDark : tone === 'warn' ? '#b45309' : '#ffffff';
  const color = tone === 'light' ? C.ink : '#ffffff';
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={x0} y={y - size - 3} width={w} height={size + 8} rx={(size + 8) / 2} fill={fill} opacity={tone === 'light' ? 0.92 : 0.95} stroke={tone === 'light' ? C.line : 'none'} />
      <Txt x={x0 + w / 2} y={y + 1} size={size} color={color} weight={800}>
        {text}
      </Txt>
    </g>
  );
}

/** LCD-style digital instrument (pH meter, balance, ammeter…). */
export function Digital({
  x,
  y,
  w = 96,
  h = 44,
  value,
  unit,
  label,
  tone = 'lcd'
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  value: string;
  unit?: string;
  label?: string;
  tone?: 'lcd' | 'red' | 'blue';
}) {
  const screen = tone === 'lcd' ? 'url(#cx-lcd)' : '#0d1a12';
  const text = tone === 'lcd' ? '#163b1c' : tone === 'red' ? '#ff6b5b' : '#7cc8ff';
  return (
    <g filter="url(#cx-shadow)">
      <rect x={x} y={y} width={w} height={h} rx="7" fill="url(#cx-case)" />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - (label ? 17 : 10)} rx="3.5" fill={screen} />
      <Txt x={x + w - 9} y={y + 5 + (h - (label ? 17 : 10)) / 2 + 5.5} anchor="end" size={Math.min(16, (h - (label ? 17 : 10)) * 0.62)} color={text} weight={800} mono>
        {value}
        {unit ? <tspan fontSize={9} dx={3}>{unit}</tspan> : null}
      </Txt>
      {label && (
        <Txt x={x + w / 2} y={y + h - 4} size={8} color="#c9d6e3" weight={700}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Glass thermometer with a red column; scale every 10 (or 20) degrees. */
export function Thermometer({ x, y, h, value, min = 0, max = 110, label = true }: { x: number; y: number; h: number; value: number; min?: number; max?: number; label?: boolean }) {
  const bulbR = 6;
  const stemTop = y;
  const stemBottom = y + h - bulbR * 1.4;
  const f = clampN((value - min) / (max - min || 1), 0, 1);
  const colTop = stemBottom - f * (stemBottom - stemTop - 6);
  const step = max - min > 60 ? 20 : 10;
  const ticks: React.ReactNode[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
    const yy = stemBottom - ((v - min) / (max - min)) * (stemBottom - stemTop - 6);
    ticks.push(
      <g key={v}>
        <line x1={x + 4} x2={x + 8} y1={yy} y2={yy} stroke={C.muted} strokeWidth="0.9" />
        {label && (
          <Txt x={x + 10} y={yy + 3} anchor="start" size={7} color={C.muted}>
            {v}
          </Txt>
        )}
      </g>
    );
  }
  return (
    <g>
      <rect x={x - 4} y={stemTop} width="8" height={stemBottom - stemTop + 2} rx="4" fill="#ffffff" fillOpacity="0.75" stroke={C.glass} strokeWidth="1" />
      <rect x={x - 1.4} y={colTop} width="2.8" height={Math.max(0, stemBottom - colTop + 2)} fill="#e2483d" />
      <circle cx={x} cy={y + h - bulbR} r={bulbR} fill="#e2483d" stroke="#b9362d" strokeWidth="1" />
      <circle cx={x - 2} cy={y + h - bulbR - 2} r="1.6" fill="#ffffff" opacity="0.6" />
      {ticks}
    </g>
  );
}

/** Round stopwatch with a sweeping hand and a digital readout. */
export function Stopwatch({ cx, cy, r = 26, seconds, unit = 's', label }: { cx: number; cy: number; r?: number; seconds: number; unit?: 's' | 'min' | 'day'; label?: string }) {
  const s = safe(seconds);
  const turn = unit === 's' ? (s % 60) / 60 : unit === 'min' ? (s % 60) / 60 : (s % 7) / 7;
  const a = turn * 2 * Math.PI;
  const text = unit === 's' ? (s >= 100 ? s.toFixed(0) : s.toFixed(1)) : unit === 'min' ? s.toFixed(1) : s.toFixed(1);
  return (
    <g filter="url(#cx-shadow)">
      <rect x={cx - 4} y={cy - r - 8} width="8" height="7" rx="2" fill="#566474" />
      <circle cx={cx} cy={cy} r={r} fill="#2b3644" />
      <circle cx={cx} cy={cy} r={r - 4} fill="#f8fafc" />
      {Array.from({ length: 12 }, (_, i) => {
        const aa = (i / 12) * 2 * Math.PI;
        return <line key={i} x1={cx + Math.sin(aa) * (r - 6)} y1={cy - Math.cos(aa) * (r - 6)} x2={cx + Math.sin(aa) * (r - 9)} y2={cy - Math.cos(aa) * (r - 9)} stroke={C.muted} strokeWidth="1" />;
      })}
      <line x1={cx} y1={cy} x2={cx + Math.sin(a) * (r - 8)} y2={cy - Math.cos(a) * (r - 8)} stroke={C.red} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2" fill={C.ink} />
      <rect x={cx - 17} y={cy + 4} width="34" height="11" rx="2" fill="#1f2832" />
      <Txt x={cx} y={cy + 12.5} size={8} color="#7cf0b4" mono weight={800}>
        {text}
        {unit === 's' ? ' s' : unit === 'min' ? ' min' : ' d'}
      </Txt>
      {label && (
        <Txt x={cx} y={cy + r + 12} size={8.5} color={C.muted}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Tiny live graph drawn inside a scene. */
export function MiniPlot({
  x,
  y,
  w,
  h,
  pts,
  cur,
  xMax,
  yMin = 0,
  yMax,
  xLabel,
  yLabel,
  color = C.chem
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  pts: { x: number; y: number }[];
  cur?: { x: number; y: number };
  xMax: number;
  yMin?: number;
  yMax: number;
  xLabel?: string;
  yLabel?: string;
  color?: string;
}) {
  const px = (v: number) => x + 24 + clampN(v / (xMax || 1), 0, 1) * (w - 32);
  const py = (v: number) => y + h - 16 - clampN((v - yMin) / (yMax - yMin || 1), 0, 1) * (h - 26);
  const sorted = [...pts].filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).sort((a, b) => a.x - b.x);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="#ffffff" opacity="0.94" stroke={C.line} />
      <line x1={x + 24} y1={y + h - 16} x2={x + w - 8} y2={y + h - 16} stroke={C.muted} strokeWidth="1" />
      <line x1={x + 24} y1={y + 8} x2={x + 24} y2={y + h - 16} stroke={C.muted} strokeWidth="1" />
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={x + 24} x2={x + w - 8} y1={y + h - 16 - f * (h - 26)} y2={y + h - 16 - f * (h - 26)} stroke={C.line} strokeWidth="0.6" />
      ))}
      <Txt x={x + 21} y={y + 12} anchor="end" size={7} color={C.muted}>
        {fmt(yMax, yMax >= 10 ? 0 : 1)}
      </Txt>
      <Txt x={x + 21} y={y + h - 16} anchor="end" size={7} color={C.muted}>
        {fmt(yMin, yMin >= 10 || yMin === 0 ? 0 : 1)}
      </Txt>
      <Txt x={x + w - 8} y={y + h - 5} anchor="end" size={7} color={C.muted}>
        {xLabel ?? ''}
      </Txt>
      <Txt x={x + 28} y={y + 15} anchor="start" size={7} color={C.muted}>
        {yLabel ?? ''}
      </Txt>
      {sorted.length > 1 && <polyline points={sorted.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')} fill="none" stroke={color} strokeWidth="1.4" opacity="0.8" />}
      {sorted.map((p, i) => (
        <circle key={i} cx={px(p.x)} cy={py(p.y)} r="2.4" fill={color} />
      ))}
      {cur && Number.isFinite(cur.x) && Number.isFinite(cur.y) && <circle cx={px(cur.x)} cy={py(cur.y)} r="3.6" fill="none" stroke={C.red} strokeWidth="1.6" />}
    </g>
  );
}

/** ✓ / ✗ badge. */
export function Mark({ x, y, good }: { x: number; y: number; good: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7" fill={good ? '#16a34a' : '#dc2626'} stroke="#ffffff" strokeWidth="1.5" />
      <Txt x={x} y={y + 3.5} size={9} color="#ffffff" weight={900}>
        {good ? '✓' : '✗'}
      </Txt>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Effects                                                              */
/* ------------------------------------------------------------------ */

/** Bubbles rising from the bottom to the surface of a liquid region. */
export function Bubbles({ x0, x1, yTop, yBottom, rate, t, seed = 1, max = 14, size = 1 }: { x0: number; x1: number; yTop: number; yBottom: number; rate: number; t: number; seed?: number; max?: number; size?: number }) {
  const n = Math.round(clampN(rate, 0, 1) * max);
  if (n <= 0 || yBottom - yTop < 4 || x1 - x0 < 2) return null;
  const hgt = yBottom - yTop;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const s = seed * 13.37 + i * 7.13;
    const speed = 0.35 + rnd(s) * 0.55;
    const phase = frac(rnd(s + 1) + (t * speed * 40) / Math.max(hgt, 20));
    const yy = yBottom - 2 - phase * (hgt - 3);
    const xx = x0 + 2 + rnd(s + 2) * Math.max(0, x1 - x0 - 4) + Math.sin(t * 3 + i) * 1.2;
    const r = (0.9 + rnd(s + 3) * 1.6) * size * (0.7 + phase * 0.5);
    out.push(<circle key={i} cx={xx} cy={yy} r={r} fill="#ffffff" fillOpacity="0.55" stroke="#8fb3cf" strokeOpacity="0.9" strokeWidth="0.7" />);
  }
  return <g style={{ pointerEvents: 'none' }}>{out}</g>;
}

/** Soft, rising, fading puffs (steam, fumes, smoke). */
export function Fumes({ cx, y, w = 18, h = 50, color = '#ffffff', amount, t, seed = 1 }: { cx: number; y: number; w?: number; h?: number; color?: string; amount: number; t: number; seed?: number }) {
  const a = clampN(amount, 0, 1);
  if (a <= 0.01) return null;
  const out: React.ReactNode[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const phase = frac(t * 0.28 + i / n + rnd(seed + i) * 0.1);
    const yy = y - phase * h;
    const xx = cx + Math.sin(t * 1.3 + i * 1.7 + seed) * w * 0.35 * phase;
    const r = (w * 0.3 + phase * w * 0.55) * (0.8 + rnd(seed * 3 + i) * 0.4);
    out.push(<ellipse key={i} cx={xx} cy={yy} rx={r} ry={r * 0.8} fill={color} opacity={a * 0.55 * (1 - phase)} />);
  }
  return (
    <g filter="url(#cx-blur)" style={{ pointerEvents: 'none' }}>
      {out}
    </g>
  );
}

/** A drop falling from (x, y0) to y1, looping. */
export function FallingDrop({ x, y0, y1, color, t, speed = 1.4 }: { x: number; y0: number; y1: number; color: string; t: number; speed?: number }) {
  const p = frac(t * speed);
  const yy = y0 + p * p * (y1 - y0);
  return <path d={`M ${x} ${yy - 3.2} q 2.4 3.2 0 5.4 q -2.4 -2.2 0 -5.4 z`} fill={color} stroke="#7f9fb8" strokeWidth="0.5" opacity={0.95} />;
}

/** Pulsing radial glow. */
export function Glow({ cx, cy, r, amount, color = 'url(#cx-glow)' }: { cx: number; cy: number; r: number; amount: number; color?: string }) {
  if (amount <= 0.01) return null;
  return <circle cx={cx} cy={cy} r={r} fill={color} opacity={clampN(amount, 0, 1)} style={{ pointerEvents: 'none' }} />;
}
