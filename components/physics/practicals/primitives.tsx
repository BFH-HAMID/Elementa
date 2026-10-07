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
        <marker id="pr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#pr-grid)" />
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
  const angle = (-50 + frac * 100) * (Math.PI / 180);
  const nx = x + Math.sin(angle) * (r - 8);
  const ny = y + 6 - Math.cos(angle) * (r - 8);
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = (-50 + i * 10) * (Math.PI / 180);
    const inner = i % 5 === 0 ? r - 14 : r - 11;
    ticks.push(
      <line
        key={i}
        x1={x + Math.sin(a) * inner}
        y1={y + 6 - Math.cos(a) * inner}
        x2={x + Math.sin(a) * (r - 7)}
        y2={y + 6 - Math.cos(a) * (r - 7)}
        stroke={C.ink}
        strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
        opacity={0.7}
      />
    );
  }
  return (
    <g>
      <rect x={x - r} y={y - r + 2} width={r * 2} height={r * 1.55} rx={9} fill={C.surface} stroke={good ? C.green : C.line} strokeWidth={good ? 2.2 : 1.4} />
      <path d={`M ${x - r + 6} ${y + 6} A ${r - 6} ${r - 6} 0 0 1 ${x + r - 6} ${y + 6}`} fill="none" stroke={C.line} strokeWidth={1} />
      {ticks}
      {centerZero && <line x1={x} y1={y + 6 - (r - 16)} x2={x} y2={y + 6 - (r - 6)} stroke={C.green} strokeWidth={2} />}
      <line x1={x} y1={y + 6} x2={nx} y2={ny} stroke={C.red} strokeWidth={2} strokeLinecap="round" />
      <circle cx={x} cy={y + 6} r={3} fill={C.ink} />
      <Txt x={x} y={y + r * 0.55 + 4} size={9.5} color={C.ink} mono>
        {fmt(value, digits)}
        {unit ? ` ${unit}` : ''}
      </Txt>
      <Txt x={x} y={y - r - 3} size={9.5}>
        {label}
      </Txt>
    </g>
  );
}

export function Thermometer({ x, y, h = 150, temp, min = 0, max = 110, label }: { x: number; y: number; h?: number; temp: number; min?: number; max?: number; label?: string }) {
  const frac = Math.min(1, Math.max(0, (temp - min) / (max - min)));
  const fill = h * frac;
  return (
    <g>
      <rect x={x - 5} y={y} width={10} height={h} rx={5} fill={C.surface} stroke={C.steelDark} strokeWidth={1.2} />
      <rect x={x - 2.2} y={y + h - fill} width={4.4} height={fill + 4} fill={C.red} />
      <circle cx={x} cy={y + h + 8} r={8} fill={C.red} stroke={C.steelDark} strokeWidth={1.2} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={x + 5} x2={x + 9} y1={y + h - h * f} y2={y + h - h * f} stroke={C.muted} strokeWidth={1} />
      ))}
      <rect x={x + 10} y={y + h - fill - 9} width={46} height={17} rx={5} fill={C.ink} opacity={0.9} />
      <Txt x={x + 33} y={y + h - fill + 3} size={10} color={C.surface} mono>
        {fmt(temp, 1)}°C
      </Txt>
      {label && (
        <Txt x={x} y={y - 6} size={9.5}>
          {label}
        </Txt>
      )}
    </g>
  );
}

export function Digital({ x, y, w = 92, text, label, good }: { x: number; y: number; w?: number; text: string; label?: string; good?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={7} fill="#0f172a" stroke={good ? C.green : C.steelDark} strokeWidth={good ? 2 : 1.2} />
      <Txt x={x + w / 2} y={y + 20} size={13} color={good ? '#86efac' : '#7dd3fc'} mono={!/[\u0980-\u09FF]/.test(text)} weight={800}>
        {text}
      </Txt>
      {label && (
        <Txt x={x + w / 2} y={y - 5} size={9.5}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Horizontal scale with ticks from `from` to `to` (in scale units) drawn between x1..x2. */
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
    ticks.push(<line key={`t${i}`} x1={x} x2={x} y1={y} y2={y + (isMajor ? height * 0.6 : height * 0.32)} stroke={C.ink} strokeWidth={isMajor ? 1 : 0.6} opacity={0.75} />);
    const le = labelEvery ?? major;
    if (Math.abs(v / le - Math.round(v / le)) < 1e-6) {
      ticks.push(
        <Txt key={`l${i}`} x={x} y={y + height + 7} size={8.5}>
          {Math.round(v * 100) / 100}
        </Txt>
      );
    }
  }
  return (
    <g>
      <rect x={x1 - 6} y={y - 2} width={x2 - x1 + 12} height={height + 12} rx={3} fill="#fef3c7" opacity={0.85} stroke={C.woodDark} strokeWidth={0.8} />
      {ticks}
      {unit && (
        <Txt x={x2 + 4} y={y + height + 7} size={8} anchor="start">
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
      <circle cx={x} cy={y} r={9} fill={color} opacity={0.16} />
      <circle cx={x} cy={y} r={4} fill={color} />
    </g>
  );
}

export function Stand({ x, base, top }: { x: number; base: number; top: number }) {
  return (
    <g>
      <rect x={x - 40} y={base} width={80} height={10} rx={3} fill="url(#pr-metal)" />
      <rect x={x - 3} y={top} width={6} height={base - top} fill="url(#pr-metal)" />
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
