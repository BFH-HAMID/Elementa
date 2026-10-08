'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import type { PracticalModel, PracticalParams } from '@/engine/practicals';

export const W = 640;
export const H = 360;

/** Theme-aware colours (CSS variables switch with the dark theme). */
export const C = {
  ink: 'var(--ink)',
  muted: 'var(--muted)',
  line: 'var(--line)',
  soft: 'var(--surface-soft)',
  surface: 'var(--surface)',
  blue: '#1677d2',
  blueDark: '#075db1',
  sky: '#8fc6f5',
  red: '#e2483d',
  green: '#16a34a',
  amber: '#f59e0b',
  copper: '#c27a3a',
  steel: '#94a3b8',
  steelDark: '#64748b',
  wood: '#c99a5b',
  woodDark: '#9a6b35',
  water: '#60a5fa',
  glass: 'rgba(147, 197, 253, 0.28)',
  violet: '#7c3aed'
};

export type View = Record<string, number | string | boolean | undefined>;

export interface SceneProps {
  model: PracticalModel;
  view: View;
  params: PracticalParams;
  setParam: (key: string, value: number) => void;
  /** Free-running animation clock in seconds. */
  t: number;
  bn: boolean;
}

export const num = (view: View, key: string, fallback = 0): number => {
  const v = view[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'boolean' ? (v ? 1 : 0) : fallback;
};

export const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const fmt = (v: number, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits) : '—');

/* ------------------------------------------------------------------ */
/* Pointer dragging inside an SVG                                       */
/* ------------------------------------------------------------------ */

type Pt = { x: number; y: number };
/** `start` is the pointer-down position, for relative drags. */
type DragMove = (pt: Pt, start: Pt) => void;

export function useSvgDrag(svgRef: React.RefObject<SVGSVGElement>) {
  const active = useRef<DragMove | null>(null);
  const start = useRef<Pt>({ x: 0, y: 0 });

  const toSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const p = pt.matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    },
    [svgRef]
  );

  return useCallback(
    (onMove: DragMove) => ({
      onPointerDown: (e: React.PointerEvent<SVGElement>) => {
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
        active.current = onMove;
        const p = toSvg(e.clientX, e.clientY);
        if (p) {
          start.current = p;
          onMove(p, p);
        }
      },
      onPointerMove: (e: React.PointerEvent<SVGElement>) => {
        if (!active.current) return;
        const p = toSvg(e.clientX, e.clientY);
        if (p) active.current(p, start.current);
      },
      onPointerUp: (e: React.PointerEvent<SVGElement>) => {
        active.current = null;
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      },
      onPointerCancel: () => {
        active.current = null;
      },
      'data-drag': '',
      style: { cursor: 'grab', touchAction: 'none' } as React.CSSProperties
    }),
    [toSvg]
  );
}

/* ------------------------------------------------------------------ */
/* Frame                                                                */
/* ------------------------------------------------------------------ */

export const SceneFrame = React.forwardRef<SVGSVGElement, { children: React.ReactNode; label: string }>(function SceneFrame(
  { children, label },
  ref
) {
  const local = useRef<SVGSVGElement | null>(null);
  const setRef = useCallback(
    (node: SVGSVGElement | null) => {
      local.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<SVGSVGElement | null>).current = node;
    },
    [ref]
  );
  // Touches that start on a drag handle must not scroll the page (otherwise the
  // browser cancels the pointer stream mid-drag). Elsewhere the page scrolls normally.
  useEffect(() => {
    const svg = local.current;
    if (!svg) return;
    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as Element | null)?.closest?.('[data-drag]')) e.preventDefault();
    };
    svg.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => svg.removeEventListener('touchstart', onTouchStart);
  }, []);
  return (
    <svg ref={setRef} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label={label}>
      <defs>
        <pattern id="pr-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={C.line} strokeWidth="0.6" opacity="0.55" />
        </pattern>
        {/* bench surface: warm laminate with a soft top light and a vignette */}
        <linearGradient id="pr-bench" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#f3f6f9" />
          <stop offset="34%" stopColor="#e8edf3" />
          <stop offset="72%" stopColor="#d8e0e8" />
          <stop offset="100%" stopColor="#c2ccd6" />
        </linearGradient>
        <radialGradient id="pr-light" cx="0.42" cy="0.18" r="0.85">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0b1220" stopOpacity="0.10" />
        </radialGradient>
        <linearGradient id="pr-metal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="pr-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ddb27a" />
          <stop offset="1" stopColor="#a8743c" />
        </linearGradient>
        <linearGradient id="pr-copper" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9a5b25" />
          <stop offset="0.5" stopColor="#e0a060" />
          <stop offset="1" stopColor="#9a5b25" />
        </linearGradient>
        <radialGradient id="pr-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pr-glow-red" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff4d5e" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#ff4d5e" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ff4d5e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pr-glow-green" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#4ade80" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        {/* optical glass: denser at the edges, clear in the middle */}
        <linearGradient id="pr-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8eefc" stopOpacity="0.72" />
          <stop offset="45%" stopColor="#b6dcf6" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#8fc3e8" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id="pr-glass-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="30%" stopColor="#cfe8fa" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7fb4dc" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="pr-paper" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#fdfcf7" />
          <stop offset="60%" stopColor="#f6f3e9" />
          <stop offset="100%" stopColor="#e9e4d4" />
        </linearGradient>
        <linearGradient id="pr-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfa268" />
          <stop offset="46%" stopColor="#bd8b4e" />
          <stop offset="100%" stopColor="#9c6c36" />
        </linearGradient>
        <linearGradient id="pr-sheen" x1="0.05" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="pr-lamp" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fff8e1" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#fde68a" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <marker id="pr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        {/* soft light: fringes and glowing filaments read as photographs, not bars */}
        <filter id="pr-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <filter id="pr-drop" x="-25%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0b1220" floodOpacity="0.3" />
        </filter>
        {/* things resting on the bench cast a short, soft, slightly warm shadow */}
        <filter id="pr-ground" x="-30%" y="-30%" width="170%" height="190%">
          <feDropShadow dx="1.5" dy="3.5" stdDeviation="3.2" floodColor="#3b2f1d" floodOpacity="0.4" />
        </filter>
        <filter id="pr-ground-lg" x="-40%" y="-40%" width="190%" height="210%">
          <feDropShadow dx="3" dy="7" stdDeviation="7" floodColor="#2b2418" floodOpacity="0.42" />
        </filter>
        <filter id="pr-glow-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
      </defs>
      {/* the bench itself: surface, overhead light, faint vignette */}
      <rect x="0" y="0" width={W} height={H} fill="url(#pr-bench)" />
      <rect x="0" y="0" width={W} height={H} fill="url(#pr-grid)" opacity="0.35" />
      <rect x="0" y="0" width={W} height={H} fill="url(#pr-light)" />
      {children}
    </svg>
  );
});

/* ------------------------------------------------------------------ */
/* Instruments                                                          */
/* ------------------------------------------------------------------ */

export function Txt({
  x,
  y,
  children,
  size = 11,
  anchor = 'middle',
  color = C.muted,
  weight = 700,
  mono = false
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  weight?: number;
  mono?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      fill={color}
      fontWeight={weight}
      fontFamily={mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  );
}

/** Analog dial meter. `value` maps linearly from min..max to a 100° sweep. */
export function Dial({
  x,
  y,
  r = 34,
  value,
  min = 0,
  max = 1,
  label,
  unit,
  digits = 2,
  centerZero = false,
  good = false
}: {
  x: number;
  y: number;
  r?: number;
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  digits?: number;
  centerZero?: boolean;
  good?: boolean;
}) {
  const frac = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const angle = (-50 + frac * 100) * (Math.PI) / 180;
  const px = x;
  const py = y + 2;
  const nx = px + Math.sin(angle) * (r - 6);
  const ny = py - Math.cos(angle) * (r - 6);
  const faceH = r * 1.55;
  const top = y - r + 2;
  // the printed scale: 51 graduations over ±50°, every tenth one long and numbered
  const ticks = [];
  for (let i = 0; i <= 50; i++) {
    const a = (-50 + i * 2) * (Math.PI / 180);
    const major = i % 10 === 0;
    const mid = i % 5 === 0;
    const outer = r - 5;
    const inner = major ? r - 13 : mid ? r - 10 : r - 8;
    ticks.push(
      <line
        key={i}
        x1={px + Math.sin(a) * inner}
        y1={py - Math.cos(a) * inner}
        x2={px + Math.sin(a) * outer}
        y2={py - Math.cos(a) * outer}
        stroke="#1f2937"
        strokeWidth={major ? 1.1 : mid ? 0.6 : 0.35}
        opacity={major ? 0.9 : 0.65}
      />
    );
    if (major && i % 20 === 0) {
      const v = min + ((max - min) * i) / 50;
      ticks.push(
        <Txt key={`n${i}`} x={px + Math.sin(a) * (r - 19)} y={py - Math.cos(a) * (r - 19) + 3} size={3.6} color="#1f2937" weight={700} mono>
          {Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) < 10 ? 1 : 0)}
        </Txt>
      );
    }
  }
  return (
    <g>
      {/* pressed-metal case, then the ivory face set into it */}
      <rect x={x - r} y={top} width={r * 2} height={faceH} rx={7} fill="url(#ix-enamel)" stroke="#334155" strokeWidth={0.8} filter="url(#pr-ground)" />
      <rect x={x - r} y={top} width={r * 2} height={faceH * 0.42} rx={7} fill="#ffffff" opacity={0.16} />
      <rect x={x - r - 1.4} y={top + faceH} width={r * 2 + 2.8} height={3.4} rx={1.6} fill="url(#ix-charcoal)" opacity={0.75} />
      <rect x={x - r + 4} y={top + 4} width={r * 2 - 8} height={faceH - 8} rx={5} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
      {/* anti-parallax mirror arc behind the pointer, as on a real moving-coil meter */}
      <path
        d={`M ${px + Math.sin(-50 * (Math.PI / 180)) * (r - 15)} ${py - Math.cos(-50 * (Math.PI / 180)) * (r - 15)} A ${r - 15} ${r - 15} 0 0 1 ${px + Math.sin(50 * (Math.PI / 180)) * (r - 15)} ${py - Math.cos(50 * (Math.PI / 180)) * (r - 15)}`}
        fill="none"
        stroke="#b9c4cf"
        strokeWidth={2.4}
        opacity={0.75}
      />
      <path
        d={`M ${px + Math.sin(-50 * (Math.PI / 180)) * (r - 15)} ${py - Math.cos(-50 * (Math.PI / 180)) * (r - 15)} A ${r - 15} ${r - 15} 0 0 1 ${px + Math.sin(50 * (Math.PI / 180)) * (r - 15)} ${py - Math.cos(50 * (Math.PI / 180)) * (r - 15)}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={0.9}
        opacity={0.6}
      />
      {ticks}
      {centerZero && <line x1={px} y1={py - (r - 13)} x2={px} y2={py - (r - 5)} stroke="#16a34a" strokeWidth={1.6} />}
      {/* knife-edge pointer with its counterweight */}
      <g style={{ transition: good ? undefined : 'transform 220ms ease-out' }}>
        <polygon
          points={`${px - 0.5},${py} ${px + 0.5},${py} ${px + Math.sin(angle) * (r - 6)},${py - Math.cos(angle) * (r - 6)}`}
          fill="none"
        />
        <line x1={px} y1={py} x2={nx} y2={ny} stroke="#111827" strokeWidth={1.3} strokeLinecap="round" />
        <line x1={px} y1={py} x2={nx - Math.sin(angle) * 5} y2={ny + Math.cos(angle) * 5} stroke="#b91c1c" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={px} y1={py} x2={px - Math.sin(angle) * 7} y2={py + Math.cos(angle) * 7} stroke="#111827" strokeWidth={1.1} />
      </g>
      <circle cx={px} cy={py} r={2.6} fill="#334155" />
      <circle cx={px} cy={py} r={1.2} fill="#94a3b8" />
      {/* glass read through its own reflection + zero-adjust screw */}
      <rect x={x - r + 4} y={top + 4} width={r * 2 - 8} height={faceH - 8} rx={5} fill="url(#ix-reflect)" opacity={0.34} />
      <ellipse cx={x - r * 0.42} cy={top + 12} rx={r * 0.5} ry={r * 0.16} fill="#ffffff" opacity={0.22} />
      <circle cx={x} cy={top + faceH - 4.6} r={2.2} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.4} />
      <line x1={x - 1.2} y1={top + faceH - 4.6} x2={x + 1.2} y2={top + faceH - 4.6} stroke="#475569" strokeWidth={0.6} />
      <Txt x={x} y={py + r * 0.38} size={8} color="#1f2937" mono weight={800}>
        {fmt(value, digits)}
        {unit ? ` ${unit}` : ''}
      </Txt>
      <Txt x={x} y={y - r - 4} size={9.5}>
        {label}
      </Txt>
      {good && (
        <rect x={x - r - 1.6} y={top - 1.6} width={r * 2 + 3.2} height={faceH + 3.2} rx={8} fill="none" stroke="#16a34a" strokeWidth={1.6} />
      )}
    </g>
  );
}

/**
 * A glazed porcelain rheostat: resistance wire wound on the tube, brass end
 * caps, binding posts and a sliding contact at `frac` of the travel.
 */
export function Rheostat({
  x,
  y,
  w = 116,
  frac = 0.5,
  label
}: {
  x: number;
  y: number;
  w?: number;
  frac?: number;
  label?: string;
}) {
  const turns = Math.max(12, Math.round(w / 2.6));
  const step = (w - 24) / turns;
  const carriage = x + 12 + clampNum(frac, 0, 1) * (w - 24);
  return (
    <g>
      <rect x={x} y={y - 9.5} width={w} height={19} rx={5} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.7} filter="url(#pr-ground)" />
      <rect x={x} y={y - 9.5} width={w} height={7} rx={4} fill="#ffffff" opacity={0.42} />
      {Array.from({ length: turns }).map((_, i) => (
        <line key={i} x1={x + 12 + i * step} x2={x + 12 + i * step} y1={y - 8} y2={y + 9} stroke={i % 2 ? '#9a7b52' : '#c9a978'} strokeWidth={1.1} />
      ))}
      <rect x={x} y={y - 9.5} width={w} height={19} rx={5} fill="none" stroke="#8a8272" strokeWidth={0.5} />
      {[x, x + w - 12].map((bx) => (
        <rect key={bx} x={bx} y={y - 11} width={12} height={22} rx={4} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.6} />
      ))}
      <circle cx={x + 6} cy={y + 12} r={2.6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.4} />
      <circle cx={x + w - 6} cy={y + 12} r={2.6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.4} />
      {/* the sliding contact, with the index it is read against */}
      <g transform={`translate(${carriage} 0)`}>
        <rect x={-6} y={y - 17} width={12} height={10} rx={2} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={-6} y={y - 17} width={12} height={3.6} rx={1.6} fill="#ffffff" opacity={0.4} />
        <rect x={-2.4} y={y - 25} width={4.8} height={9} rx={1.4} fill="url(#ix-steel-h)" />
        <path d={`M -4 ${y - 25} L 4 ${y - 25} L 0 ${y - 30} Z`} fill="#e2483d" />
        <line x1={0} y1={y - 10} x2={0} y2={y - 3} stroke="#334155" strokeWidth={2.6} />
      </g>
      {label && (
        <Txt x={x + w / 2} y={y + 28} size={10}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** The one-way plug key used on every practical board: wood, brass blocks, ebonite handle. */
export function PlugKey({ x, y, closed = true, label }: { x: number; y: number; closed?: boolean; label?: string }) {
  const lift = closed ? 0 : -26;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-24} y={-9} width={48} height={18} rx={2.6} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.7} filter="url(#pr-ground)" />
      <rect x={-24} y={-9} width={48} height={5} rx={2} fill="url(#ix-grain)" opacity={0.65} />
      <rect x={-21} y={-7.5} width={14} height={15} rx={2} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.6} />
      <rect x={7} y={-7.5} width={14} height={15} rx={2} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.6} />
      <rect x={-21} y={-7.5} width={14} height={5} rx={2} fill="#ffffff" opacity={0.35} />
      <rect x={7} y={-7.5} width={14} height={5} rx={2} fill="#ffffff" opacity={0.35} />
      {/* the lever, hinged on the left block and resting on the right when closed */}
      <g transform={`rotate(${lift} -14 0)`} style={{ transition: 'transform 220ms ease-out' }}>
        <rect x={-14} y={-7} width={35} height={5.4} rx={2.4} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={-14} y={-7} width={35} height={1.8} rx={0.9} fill="#ffffff" opacity={0.45} />
        <rect x={-2} y={-15} width={11} height={9} rx={2.4} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
        <rect x={-2} y={-15} width={11} height={3} rx={1.4} fill="#ffffff" opacity={0.2} />
        <circle cx={-14} cy={-4.4} r={3} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.5} />
      </g>
      {label && (
        <Txt x={0} y={24} size={9.5}>
          {label}
        </Txt>
      )}
    </g>
  );
}

export function Thermometer({ x, y, h = 150, temp, min = 0, max = 110, label }: { x: number; y: number; h?: number; temp: number; min?: number; max?: number; label?: string }) {
  const frac = Math.min(1, Math.max(0, (temp - min) / (max - min)));
  const fill = h * frac;
  const colTop = y + h - fill;
  const span = max - min;
  const step = span > 120 ? 20 : span > 60 ? 10 : 5; // long ticks keep it readable
  const marks: React.ReactNode[] = [];
  for (let v = min; v <= max + 1e-6; v += step / 2) {
    const t = (v - min) / span;
    const my = y + h - t * h;
    const long = Math.abs(v % step) < 1e-6;
    marks.push(<line key={v} x1={x + 5} x2={x + (long ? 11 : 8)} y1={my} y2={my} stroke="#4b5563" strokeWidth={long ? 0.8 : 0.45} opacity={0.85} />);
    if (long) {
      marks.push(
        <Txt key={`t${v}`} x={x + 13} y={my + 2.6} size={5.4} color="#374151" anchor="start" mono>
          {v}
        </Txt>
      );
    }
  }
  return (
    <g>
      {/* the glass stem, with the white backing strip a real thermometer has */}
      <rect x={x - 5.5} y={y - 3} width={11} height={h + 3} rx={5.5} fill="#f7fbff" opacity={0.6} stroke="#9dc0da" strokeWidth={0.5} filter="url(#pr-ground)" />
      <rect x={x - 3} y={y - 1} width={6} height={h} fill="#ffffff" opacity={0.95} />
      {marks}
      <rect x={x - 3} y={y - 1} width={6} height={h} fill="none" stroke="#dbe6f0" strokeWidth={0.4} />
      {/* the spirit column and the bulb it grows out of */}
      <rect x={x - 1.9} y={colTop} width={3.8} height={fill + 4} rx={1.9} fill="#d92c33" />
      <rect x={x - 1.9} y={colTop} width={1.3} height={fill + 4} rx={0.7} fill="#ffffff" opacity={0.35} />
      <ellipse cx={x} cy={colTop + 0.5} rx={2.1} ry={1.2} fill="#ef4444" opacity={0.9} />
      <circle cx={x} cy={y + h + 7} r={7.6} fill="#f7fbff" opacity={0.7} stroke="#9dc0da" strokeWidth={0.5} />
      <circle cx={x} cy={y + h + 7} r={5.4} fill="#d92c33" />
      <circle cx={x - 1.8} cy={y + h + 5.4} r={1.8} fill="#ffffff" opacity={0.45} />
      {/* the reading, on a plate that rides with the column */}
      <rect x={x + 23} y={y + h - fill - 9} width={44} height={16} rx={4} fill="url(#ix-screen-off)" stroke="#334155" strokeWidth={0.5} />
      <rect x={x + 23} y={y + h - fill - 9} width={44} height={5} rx={2.5} fill="#ffffff" opacity={0.12} />
      <Txt x={x + 45} y={y + h - fill + 2.6} size={8.5} color="#7dd3fc" mono weight={700}>
        {fmt(temp, 1)}°C
      </Txt>
      <line x1={x + 5.5} y1={y + h - fill} x2={x + 23} y2={y + h - fill - 1} stroke="#94a3b8" strokeWidth={0.6} opacity={0.8} />
      {label && (
        <Txt x={x} y={y - 8} size={9.5}>
          {label}
        </Txt>
      )}
    </g>
  );
}

export function Digital({ x, y, w = 92, text, label, good }: { x: number; y: number; w?: number; text: string; label?: string; good?: boolean }) {
  const h = 30;
  return (
    <g>
      {/* moulded case with a screen bezel and a status lamp */}
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={6} fill="#0b1220" opacity="0.3" filter="url(#pr-glow-soft)" />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeOpacity="0.6" strokeWidth="0.8" />
      <rect x={x} y={y} width={w} height={h * 0.34} rx={6} fill="#ffffff" opacity="0.12" />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={3.5} fill={good ? '#0d2a17' : 'url(#ix-screen-off)'} stroke="#00000055" strokeWidth="0.6" />
      <Txt x={x + w / 2} y={y + 20} size={13} color={good ? '#86efac' : '#7dd3fc'} mono={!/[\u0980-\u09FF]/.test(text)} weight={800}>
        {text}
      </Txt>
      {/* cover-glass reflection across the screen */}
      <rect x={x + 5} y={y + 5} width={w - 10} height={(h - 10) * 0.5} rx={3} fill="url(#ix-reflect)" opacity="0.35" />
      <circle cx={x + w - 9} cy={y + 9} r={2} fill={good ? '#4ade80' : '#38bdf8'} opacity="0.9" />
      {label && (
        <Txt x={x + w / 2} y={y - 5} size={9.5}>
          {label}
        </Txt>
      )}
    </g>
  );
}

export function Ruler({
  x1,
  x2,
  y,
  from,
  to,
  major,
  minor,
  labelEvery,
  unit,
  height = 16
}: {
  x1: number;
  x2: number;
  y: number;
  from: number;
  to: number;
  major: number;
  minor?: number;
  labelEvery?: number;
  unit?: string;
  height?: number;
}) {
  const ticks: React.ReactNode[] = [];
  const span = to - from;
  const step = minor ?? major;
  const n = Math.round(span / step);
  for (let i = 0; i <= n; i++) {
    const v = from + i * step;
    const x = x1 + ((v - from) / span) * (x2 - x1);
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    ticks.push(<line key={`t${i}`} x1={x} x2={x} y1={y} y2={y + (isMajor ? height * 0.62 : height * 0.34)} stroke={C.ink} strokeWidth={isMajor ? 0.9 : 0.5} opacity={0.8} />);
    const le = labelEvery ?? major;
    if (Math.abs(v / le - Math.round(v / le)) < 1e-6) {
      ticks.push(
        <Txt key={`l${i}`} x={x} y={y + height + 8} size={8.5} weight={700} mono>
          {Math.round(v * 100) / 100}
        </Txt>
      );
    }
  }
  return (
    <g>
      {/* the rule: seasoned wood, an ivory face and a brass ferrule each end */}
      <rect x={x1 - 7} y={y + 1.4} width={x2 - x1 + 14} height={height + 12} rx={2} fill="#0b1220" opacity={0.26} filter="url(#pr-soft)" />
      <rect x={x1 - 6} y={y - 2} width={x2 - x1 + 12} height={height + 12} rx={2} fill="url(#ix-wood)" stroke="#4a2f0f" strokeWidth={0.7} />
      <rect x={x1 - 6} y={y - 2} width={x2 - x1 + 12} height={height + 12} rx={2} fill="url(#ix-grain)" opacity={0.6} />
      <rect x={x1 - 4.6} y={y - 0.6} width={x2 - x1 + 9.2} height={height + 8} rx={1.4} fill="url(#ix-ivorine)" opacity={0.96} />
      <rect x={x1 - 4.6} y={y - 0.6} width={x2 - x1 + 9.2} height={3.4} rx={1.4} fill="#ffffff" opacity={0.45} />
      <rect x={x1 - 6} y={y - 2} width={4} height={height + 12} rx={1.4} fill="url(#ix-brass)" opacity={0.9} />
      <rect x={x2 + 2} y={y - 2} width={4} height={height + 12} rx={1.4} fill="url(#ix-brass)" opacity={0.9} />
      {ticks}
      {unit && (
        <Txt x={x2 + 6} y={y + height + 8} size={8} anchor="start">
          {unit}
        </Txt>
      )}
    </g>
  );
}

/** Drag grip marker. */
export function Grip({ x, y, color = C.blue }: { x: number; y: number; color?: string }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={x} cy={y + 1} r={10} fill="#0b1220" opacity={0.22} />
      <circle cx={x} cy={y} r={9} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={4.2} fill={color} opacity={0.9} />
      <circle cx={x - 1.4} cy={y - 1.4} r={1.5} fill="#ffffff" opacity={0.75} />
    </g>
  );
}

export function Stand({ x, base, top, clampY, clampArm = 0 }: { x: number; base: number; top: number; clampY?: number; clampArm?: number }) {
  return (
    <g>
      {/* the cast base, with the light catching its top face */}
      <ellipse cx={x + 2} cy={base + 2} rx={42} ry={7} fill="#0b1220" opacity={0.26} filter="url(#pr-soft)" />
      <path d={`M ${x - 42} ${base} L ${x + 42} ${base} L ${x + 29} ${base - 15} L ${x - 29} ${base - 15} Z`} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.8} />
      <ellipse cx={x} cy={base} rx={42} ry={7} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
      <ellipse cx={x} cy={base - 15} rx={29} ry={5.4} fill="#6b7684" opacity={0.65} />
      <ellipse cx={x} cy={base - 15} rx={29} ry={5.4} fill="none" stroke="#0b1220" strokeWidth={0.5} opacity={0.45} />
      {/* upright rod with a bright edge and a dark one */}
      <rect x={x - 3.6} y={top} width={7.2} height={base - 14 - top} rx={3} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.5} />
      <rect x={x - 2.4} y={top + 1} width={1.8} height={base - 16 - top} rx={0.9} fill="#ffffff" opacity={0.55} />
      <rect x={x + 1.2} y={top + 1} width={1.4} height={base - 16 - top} rx={0.7} fill="#2b3238" opacity={0.35} />
      <ellipse cx={x} cy={top} rx={3.6} ry={1.6} fill="#cbd5e1" />
      {clampY !== undefined && (
        <g>
          <rect x={x - 9} y={clampY - 8} width={18} height={16} rx={2.4} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
          <rect x={x - 9} y={clampY - 8} width={18} height={4} rx={2} fill="#ffffff" opacity={0.16} />
          <circle cx={x + 13} cy={clampY} r={5} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
          <circle cx={x + 13} cy={clampY} r={5} fill="url(#ix-knurl)" opacity={0.5} />
          {clampArm !== 0 && (
            <>
              <rect x={clampArm > 0 ? x : x + clampArm} y={clampY - 2.6} width={Math.abs(clampArm)} height={5.2} rx={2.6} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.5} />
              <circle cx={x + clampArm} cy={clampY} r={5} fill="none" stroke="#334155" strokeWidth={2.2} />
            </>
          )}
        </g>
      )}
    </g>
  );
}

export function Battery({ x, y, label }: { x: number; y: number; label?: string }) {
  return (
    <g>
      <line x1={x - 6} y1={y - 14} x2={x - 6} y2={y + 14} stroke={C.ink} strokeWidth={2.4} />
      <line x1={x + 6} y1={y - 8} x2={x + 6} y2={y + 8} stroke={C.ink} strokeWidth={4} />
      {label && (
        <Txt x={x} y={y - 20} size={10} color={C.ink}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Zig-zag resistor between two points (horizontal or vertical). */
export function Resistor({ x1, y1, x2, y2, label, color = C.ink }: { x1: number; y1: number; x2: number; y2: number; label?: string; color?: string }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const zig = Math.min(46, len * 0.6);
  const lead = (len - zig) / 2;
  let d = `M 0 0 L ${lead} 0`;
  const n = 6;
  for (let i = 0; i < n; i++) d += ` L ${lead + (zig * (i + 0.5)) / n} ${i % 2 === 0 ? -6 : 6}`;
  d += ` L ${lead + zig} 0 L ${len} 0`;
  const vertical = Math.abs(Math.abs(ang) - 90) < 1;
  return (
    <g>
      <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      </g>
      {label && (
        <Txt x={(x1 + x2) / 2 + (vertical ? 14 : 0)} y={(y1 + y2) / 2 + (vertical ? 4 : -11)} size={10} color={C.ink} anchor={vertical ? 'start' : 'middle'}>
          {label}
        </Txt>
      )}
    </g>
  );
}

export function Wire({ d, color = C.ink, width = 2, dash }: { d: string; color?: string; width?: number; dash?: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} />;
}

/** Animated dots moving along a polyline to visualise current. */
export function CurrentDots({ points, speed, t, color = C.amber }: { points: [number, number][]; speed: number; t: number; color?: string }) {
  if (Math.abs(speed) < 1e-3 || points.length < 2) return null;
  const segs: { x1: number; y1: number; x2: number; y2: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ x1, y1, x2, y2, len });
    total += len;
  }
  const spacing = 34;
  const count = Math.floor(total / spacing);
  const offset = (((t * speed * 60) % spacing) + spacing) % spacing;
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < count; k++) {
    let d = k * spacing + offset;
    for (const s of segs) {
      if (d <= s.len) {
        const f = d / s.len;
        dots.push(<circle key={k} cx={s.x1 + (s.x2 - s.x1) * f} cy={s.y1 + (s.y2 - s.y1) * f} r={2.6} fill={color} />);
        break;
      }
      d -= s.len;
    }
  }
  return <g style={{ pointerEvents: 'none' }}>{dots}</g>;
}
