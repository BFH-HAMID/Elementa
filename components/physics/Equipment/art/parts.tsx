'use client';

import React from 'react';
import type { ComponentCircuitResult } from '@/engine/physicsTypes';
import { Contact, Sheen } from './materials';

/* ------------------------------------------------------------------ */
/* Shared contract                                                      */
/* ------------------------------------------------------------------ */

export interface ArtCtx {
  /** The tool's editable properties (from `data/equipment.json`). */
  p: Record<string, number | boolean | string>;
  /** Live solver reading for this tool, when it is wired into a circuit. */
  res?: ComponentCircuitResult;
  /** True when the tool has been destroyed by an overload on the bench. */
  burned?: boolean;
  /** Bangla UI. */
  bn: boolean;
  /** Animate (glow, flicker, needle settle). Off inside static thumbnails. */
  live: boolean;
  /** Room for engraved numbers and labels — off in tiny shelf previews. */
  detailed: boolean;
  /** Flip the toggle of a key / switch. */
  onToggle?: () => void;
  /** Write a property back to the store (sliders, dials, decade boxes). */
  setProp?: (key: string, value: number | boolean | string) => void;
}

export interface ArtEntry {
  /** Artwork coordinate box; the card scales it to fit. */
  vb: string;
  /** The artwork itself — a component so instruments can animate and hold state. */
  Comp: React.FC<ArtCtx>;
}

export const num = (v: number | boolean | string | undefined, d = 0): number => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : typeof v === 'boolean' ? (v ? 1 : 0) : NaN;
  return Number.isFinite(n) ? n : d;
};

export const on = (v: number | boolean | string | undefined): boolean => v === true || v === 1 || v === 'on' || v === 'closed' || v === 'true';

/** Values that must never leak `NaN` into the DOM when a property is missing. */
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Physics-lab standard sans; instruments use condensed technical lettering. */
export const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * Pointer dragging in *artwork coordinates*.
 *
 * Instrument knobs, sliders and caliper jaws are grabbed directly, so the
 * conversion from client pixels to the viewBox uses the live screen CTM — it
 * stays exact no matter how the card is scaled inside the bench zoom.
 */
export function useArtDrag(
  onMove: (pt: { x: number; y: number }, start: { x: number; y: number }) => void,
  options?: { onStart?: () => void; onDone?: () => void }
) {
  const start = React.useRef<{ x: number; y: number } | null>(null);
  const toArt = (el: Element, clientX: number, clientY: number) => {
    const svg = (el as SVGGraphicsElement).ownerSVGElement ?? (el as SVGSVGElement);
    const ctm = svg?.getScreenCTM?.();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };
  return {
    'data-no-drag': '',
    style: { cursor: 'grab', touchAction: 'none' } as React.CSSProperties,
    onPointerDown: (e: React.PointerEvent<SVGElement>) => {
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      const p = toArt(e.currentTarget, e.clientX, e.clientY);
      if (!p) return;
      start.current = p;
      options?.onStart?.();
      onMove(p, p);
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (!start.current) return;
      e.stopPropagation();
      const p = toArt(e.currentTarget, e.clientX, e.clientY);
      if (p) onMove(p, start.current);
    },
    onPointerUp: (e: React.PointerEvent<SVGElement>) => {
      if (!start.current) return;
      start.current = null;
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      options?.onDone?.();
    },
    onPointerCancel: () => {
      start.current = null;
      options?.onDone?.();
    }
  };
}

/** Engraved / printed label on metal or dial faces. */
export function Etch({
  x,
  y,
  size = 6,
  children,
  anchor = 'middle',
  color = '#2c3540',
  opacity = 0.92,
  mono = false,
  weight = 700,
  rotate
}: {
  x: number;
  y: number;
  size?: number;
  children: React.ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  color?: string;
  opacity?: number;
  mono?: boolean;
  weight?: number;
  rotate?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      fill={color}
      opacity={opacity}
      fontWeight={weight}
      fontFamily={mono ? MONO : FONT}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </text>
  );
}

/* ------------------------------------------------------------------ */
/* Hardware                                                            */
/* ------------------------------------------------------------------ */

/** Cylindrical metal rod / tube with a specular core. */
export function Rod({
  x1,
  y1,
  x2,
  y2,
  w = 6,
  variant = 'steel'
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w?: number;
  variant?: 'steel' | 'brass' | 'copper' | 'iron' | 'nichrome';
}) {
  const fill = {
    steel: 'url(#ix-steel-h)',
    brass: 'url(#ix-brass-h)',
    copper: 'url(#ix-copper-h)',
    iron: 'url(#ix-iron)',
    nichrome: 'url(#ix-nichrome)'
  }[variant];
  return (
    <g>
      <line x1={x1} y1={y1 + 1} x2={x2} y2={y2 + 1} stroke="#0b1220" strokeOpacity={0.35} strokeWidth={w} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={w} strokeLinecap="round" />
      <line x1={x1} y1={y1 - w * 0.22} x2={x2} y2={y2 - w * 0.22} stroke="#ffffff" strokeOpacity={0.5} strokeWidth={w * 0.22} strokeLinecap="round" />
    </g>
  );
}

/** Knurled brass/plastic knob (zero-error screws, decade dials, gas taps). */
export function Knob({ cx, cy, r, kind = 'brass', teeth = 14 }: { cx: number; cy: number; r: number; kind?: 'brass' | 'black' | 'red'; teeth?: number }) {
  const grad = kind === 'brass' ? 'url(#ix-brass)' : kind === 'red' ? 'url(#ix-red-plastic)' : 'url(#ix-charcoal)';
  return (
    <g>
      <Contact cx={cx} cy={cy + r * 0.9} rx={r * 1.1} opacity={0.3} />
      <circle cx={cx} cy={cy} r={r} fill={grad} stroke="#0b1220" strokeOpacity={0.5} strokeWidth={0.6} />
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r * 0.72}
            y1={cy + Math.sin(a) * r * 0.72}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="#0b1220"
            strokeOpacity={0.32}
            strokeWidth={0.7}
          />
        );
      })}
      <circle cx={cx - r * 0.28} cy={cy - r * 0.32} r={r * 0.3} fill="#ffffff" opacity={0.34} />
      <line x1={cx} y1={cy - r * 0.85} x2={cx} y2={cy} stroke={kind === 'black' ? '#e2e8f0' : '#3a2708'} strokeWidth={1} opacity={0.8} />
    </g>
  );
}

/** Brass binding post / terminal pillar where a lead is clamped. */
export function BindingPost({ cx, cy, polarity = 'none', r = 4 }: { cx: number; cy: number; polarity?: 'positive' | 'negative' | 'none' | 'ground'; r?: number }) {
  const cap = polarity === 'positive' ? 'url(#ix-red-plastic)' : polarity === 'negative' || polarity === 'ground' ? 'url(#ix-charcoal)' : 'url(#ix-brass)';
  return (
    <g>
      <ellipse cx={cx} cy={cy + r * 0.5} rx={r * 1.3} ry={r * 0.5} fill="#0b1220" opacity={0.3} />
      <rect x={cx - r * 0.45} y={cy - r * 1.6} width={r * 0.9} height={r * 1.6} fill="url(#ix-brass)" />
      <circle cx={cx} cy={cy} r={r * 0.95} fill={cap} stroke="#0b1220" strokeOpacity={0.45} strokeWidth={0.5} />
      <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.3} fill="#ffffff" opacity={0.5} />
    </g>
  );
}

/** Small slotted screw head. */
export function Screw({ cx, cy, r = 2.6, angle = 20 }: { cx: number; cy: number; r?: number; angle?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy + 0.4} r={r} fill="#0b1220" opacity={0.3} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ix-steel)" stroke="#4b5563" strokeWidth={0.4} />
      <line x1={cx - r * 0.7} y1={cy} x2={cx + r * 0.7} y2={cy} stroke="#111827" strokeWidth={r * 0.34} transform={`rotate(${angle} ${cx} ${cy})`} />
    </g>
  );
}

/** Teak instrument board (sonometer, metre bridge, optical bench saddles). */
export function WoodBoard({
  x,
  y,
  w,
  h,
  rx = 3,
  dark = false
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  dark?: boolean;
}) {
  return (
    <g>
      {/* cast shadow the board throws on the bench */}
      <rect x={x - 1} y={y + 2.2} width={w + 2} height={h + 1} rx={rx} fill="#0b1220" opacity={0.3} filter="url(#ix-blur)" />
      {/* timber, grain and the polish along the top edge */}
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={dark ? 'url(#ix-wood-dark)' : 'url(#ix-wood)'} stroke="#4a2f0f" strokeOpacity={0.75} strokeWidth={0.8} />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#ix-grain)" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#ix-varnish)" />
      {/* bevelled top edge catches the light, the bottom edge goes dark */}
      <rect x={x + 0.8} y={y + 0.8} width={w - 1.6} height={1.6} rx={0.8} fill="#ffe6bd" opacity={0.4} />
      <rect x={x + 0.6} y={y + h - 2.2} width={w - 1.2} height={1.6} rx={0.8} fill="#33200a" opacity={0.4} />
      {/* holding-down screws at the corners, as on the originals */}
      {w > 54 && h > 24 && (
        <>
          <Screw cx={x + 6} cy={y + 6} r={2.1} />
          <Screw cx={x + w - 6} cy={y + 6} r={2.1} />
          <Screw cx={x + 6} cy={y + h - 6} r={2.1} />
          <Screw cx={x + w - 6} cy={y + h - 6} r={2.1} />
        </>
      )}
    </g>
  );
}

/** Engraved ivorine label plate, the way instrument makers screw on their name. */
export function IvorinePlate({
  x,
  y,
  w,
  h,
  rx = 1.6
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}) {
  return (
    <g>
      <rect x={x} y={y + 0.8} width={w} height={h} rx={rx} fill="#0b1220" opacity={0.28} filter="url(#ix-blur)" />
      <rect x={x} y={y} width={w} height={h} rx={rx} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
      <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx={rx * 0.7} fill="none" stroke="#00000022" strokeWidth={0.4} />
      <rect x={x + 0.8} y={y + 0.8} width={w - 1.6} height={h * 0.32} rx={rx * 0.6} fill="#ffffff" opacity={0.5} />
    </g>
  );
}

/** Lab bench top strip that grounds a free-standing instrument. */
export function BenchTop({ y, from = -200, to = 400 }: { y: number; from?: number; to?: number }) {
  return (
    <g>
      <rect x={from} y={y} width={to - from} height={420} fill="url(#ix-matte)" opacity={0.5} />
      <rect x={from} y={y} width={to - from} height={2.4} fill="#0f1720" opacity={0.5} />
      <rect x={from} y={y + 2.4} width={to - from} height={1.4} fill="#ffffff" opacity={0.06} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Instruments                                                          */
/* ------------------------------------------------------------------ */

export type MeterKind = 'ammeter' | 'voltmeter' | 'galvanometer' | 'milliammeter' | 'microammeter' | 'wattmeter';

const METER_SPEC: Record<MeterKind, { unit: string; label: string; ticks: number[]; sub: string }> = {
  ammeter: { unit: 'A', label: 'AMMETER', sub: 'DC', ticks: [0, 0.5, 1, 1.5, 2, 2.5, 3] },
  milliammeter: { unit: 'mA', label: 'MILLIAMMETER', sub: 'DC', ticks: [0, 100, 200, 300, 400, 500] },
  microammeter: { unit: 'µA', label: 'MICROAMMETER', sub: 'DC', ticks: [0, 50, 100, 150, 200, 250] },
  voltmeter: { unit: 'V', label: 'VOLTMETER', sub: 'DC', ticks: [0, 1, 2, 3, 4, 5, 6] },
  galvanometer: { unit: 'div', label: 'GALVANOMETER', sub: 'CENTER ZERO', ticks: [-30, -20, -10, 0, 10, 20, 30] },
  wattmeter: { unit: 'W', label: 'WATTMETER', sub: 'DC', ticks: [0, 5, 10, 15, 20, 25] }
};

/**
 * A moving-coil panel meter: enamelled dial, printed arc scale, a shadowed
 * pointer with a hair-spring and a glass window with its own reflection. The
 * needle eases with a CSS transition so it settles like a damped movement.
 */
export function MeterFace({
  cx,
  cy,
  r,
  kind = 'ammeter',
  value,
  maxScale,
  swept = 90,
  polarityError,
  detailed = true,
  live = true
}: {
  cx: number;
  cy: number;
  r: number;
  kind?: MeterKind;
  value: number;
  maxScale?: number;
  swept?: number;
  polarityError?: boolean;
  detailed?: boolean;
  live?: boolean;
}) {
  const spec = METER_SPEC[kind];
  const lo = kind === 'galvanometer' ? -30 : 0;
  const hi = maxScale ?? (kind === 'galvanometer' ? 30 : spec.ticks[spec.ticks.length - 1]);
  const frac = clamp((value - lo) / (hi - lo || 1), -0.06, 1.06);
  const start = -swept / 2;
  const angle = start + frac * swept;
  const len = r * 0.92;
  const rad = (angle * Math.PI) / 180;
  const tipX = cx + Math.sin(rad) * len;
  const tipY = cy + r * 0.18 - Math.cos(rad) * len;
  const arcPt = (deg: number, rr: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + Math.sin(a) * rr, y: cy + r * 0.18 - Math.cos(a) * rr };
  };
  const a0 = arcPt(start, r * 0.78);
  const a1 = arcPt(start + swept, r * 0.78);

  return (
    <g>
      {/* Bakelite case */}
      <rect
        x={cx - r * 1.18}
        y={cy - r * 1.12}
        width={r * 2.36}
        height={r * 2.3}
        rx={r * 0.22}
        fill="url(#ix-bakelite)"
        stroke="#0b1220"
        strokeOpacity={0.6}
        strokeWidth={0.8}
        filter="url(#ix-drop)"
      />
      {/* the case lip shadows the dial through the window */}
      <circle cx={cx} cy={cy + r * 0.16} r={r * 0.86} fill="url(#ix-dial)" stroke="#b9ac93" strokeWidth={0.7} />
      <circle cx={cx} cy={cy + r * 0.16} r={r * 0.86} fill="none" stroke="#00000030" strokeWidth={r * 0.16} />
      <path
        d={`M ${cx - r * 0.86} ${cy + r * 0.16 - r * 0.5} A ${r * 0.86} ${r * 0.86} 0 0 1 ${cx + r * 0.6} ${cy + r * 0.16 - r * 0.7}`}
        fill="none"
        stroke="#0b1220"
        strokeOpacity={0.12}
        strokeWidth={r * 0.12}
        filter="url(#ix-blur)"
      />
      <circle cx={cx} cy={cy + r * 0.16} r={r * 0.8} fill="none" stroke="#e6dcc6" strokeWidth={0.5} />
      {/* Scale ticks */}
      {Array.from({ length: 21 }).map((_, i) => {
        const f = i / 20;
        const deg = start + f * swept;
        const major = i % (kind === 'galvanometer' ? 10 : 4) === 0;
        const inner = r * (major ? 0.62 : 0.68);
        const p1 = arcPt(deg, inner);
        const p2 = arcPt(deg, r * 0.78);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#1f2937" strokeWidth={major ? 1 : 0.5} opacity={0.85} />;
      })}
      {/* Printed numerals */}
      {detailed &&
        spec.ticks.map((t, i) => {
          // Panel meters print only every other figure; cramming all of them in
          // is what makes drawn meters look fake.
          if (i % 2 === 1 && t !== 0) return null;
          const f = (t - lo) / (hi - lo || 1);
          const deg = start + clamp(f, 0, 1) * swept;
          const pt = arcPt(deg, r * 0.62);
          return (
            <Etch key={i} x={pt.x} y={pt.y + 2} size={r * 0.19} color="#1f2937" weight={700}>
              {Math.abs(t) >= 1000 ? `${t / 1000}k` : t}
            </Etch>
          );
        })}
      {/* Pointer: tapered blade + counterweight, casting its own thin shadow */}
      <line
        x1={cx - Math.sin(rad) * r * 0.2 + r * 0.03}
        y1={cy + r * 0.18 + Math.cos(rad) * r * 0.2 + r * 0.03}
        x2={tipX + r * 0.03}
        y2={tipY + r * 0.03}
        stroke="#0b1220"
        strokeOpacity={0.28}
        strokeWidth={Math.max(1, r * 0.05)}
        strokeLinecap="round"
        style={{ transition: live ? 'all 900ms cubic-bezier(.16,.9,.24,1.06)' : undefined }}
      />
      <line
        x1={cx - Math.sin(rad) * r * 0.2}
        y1={cy + r * 0.18 + Math.cos(rad) * r * 0.2}
        x2={tipX}
        y2={tipY}
        stroke="#0f172a"
        strokeWidth={Math.max(1, r * 0.055)}
        strokeLinecap="round"
        style={{ transition: live ? 'all 900ms cubic-bezier(.16,.9,.24,1.06)' : undefined }}
      />
      <circle cx={cx} cy={cy + r * 0.18} r={r * 0.13} fill="url(#ix-brass)" stroke="#3a2708" strokeWidth={0.5} />
      {detailed && kind === 'galvanometer' && (
        <Etch x={cx} y={cy - r * 0.42} size={r * 0.16} color="#334155" weight={800}>
          0
        </Etch>
      )}
      {/* Red overload tell-tale */}
      {polarityError && <circle cx={cx + r * 0.78} cy={cy - r * 0.72} r={r * 0.1} fill="#ef4444" />}
      {/* Printed instrument identity */}
      {detailed && (
        <>
          <Etch x={cx} y={cy + r * 0.66} size={r * 0.19} color="#1f2937" weight={800}>
            {spec.label}
          </Etch>
          <Etch x={cx} y={cy + r * 0.84} size={r * 0.16} color="#475569">
            {`${spec.unit} · ${spec.sub}`}
          </Etch>
        </>
      )}
      {/* Glass window: one broad reflection band plus a hard glint */}
      <rect
        x={cx - r * 1.06}
        y={cy - r * 1.0}
        width={r * 2.12}
        height={r * 1.98}
        rx={r * 0.18}
        fill="url(#ix-glass-sheen)"
        opacity={0.5}
        style={{ pointerEvents: 'none' }}
      />
      <rect
        x={cx - r * 1.06}
        y={cy - r * 1.0}
        width={r * 2.12}
        height={r * 1.98}
        rx={r * 0.18}
        fill="url(#ix-reflect)"
        opacity={0.5}
        style={{ pointerEvents: 'none' }}
      />
      <Sheen x={cx - r * 0.95} y={cy - r * 0.9} w={r * 1.5} h={r * 0.22} rx={r * 0.11} opacity={0.34} rotate={-18} />
      {/* Face screws */}
      <Screw cx={cx - r * 1.02} cy={cy - r * 0.94} r={r * 0.09} />
      <Screw cx={cx + r * 1.02} cy={cy - r * 0.94} r={r * 0.09} />
    </g>
  );
}

/** Green/amber backlit LCD readout. */
export function Display({
  x,
  y,
  w,
  h,
  text,
  unit,
  on: lit = true,
  color = 'lcd',
  digits = 4,
  align = 'center'
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  unit?: string;
  on?: boolean;
  color?: 'lcd' | 'amber' | 'dark';
  digits?: number;
  align?: 'center' | 'start';
}) {
  const bg = color === 'amber' ? 'url(#ix-lcd-amber)' : color === 'dark' ? 'url(#ix-screen-off)' : 'url(#ix-lcd)';
  const ink = lit ? (color === 'dark' ? '#7dd3fc' : '#17351b') : '#57604f';
  const shown = text.length > digits + 3 ? text.slice(0, digits + 3) : text;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.6} fill="#0b1220" opacity={0.35} />
      <rect x={x} y={y - 0.6} width={w} height={h} rx={1.6} fill={bg} stroke="#5f6b57" strokeWidth={0.5} />
      <rect x={x + 0.8} y={y - 0.1} width={w - 1.6} height={h * 0.4} rx={1} fill="#ffffff" opacity={lit ? 0.28 : 0.1} />
      {lit && <rect x={x} y={y - 0.6} width={w} height={h} rx={1.6} fill={color === 'dark' ? '#0ea5e9' : '#84cc16'} opacity={0.12} />}
      {/* cover glass: real LCDs are read through a reflection */}
      <rect x={x} y={y - 0.6} width={w} height={h} rx={1.6} fill="url(#ix-reflect)" opacity={0.42} />
      <Etch
        x={align === 'center' ? x + w / 2 : x + 1.6}
        y={y + h * 0.74}
        size={h * 0.72}
        mono
        weight={700}
        color={ink}
        anchor={align === 'center' ? 'middle' : 'start'}
      >
        {shown}
        {unit ? <tspan fontSize={h * 0.44}> {unit}</tspan> : null}
      </Etch>
    </g>
  );
}

/** Incandescent bulb glow + filament, driven by the solved power. */
export function BulbGlow({
  cx,
  cy,
  r,
  power,
  burned,
  live,
  filament = true
}: {
  cx: number;
  cy: number;
  r: number;
  power: number;
  burned?: boolean;
  live: boolean;
  filament?: boolean;
}) {
  const level = clamp(power / 60, 0, 1.15);
  const glow = burned ? 0 : level;
  return (
    <g>
      {glow > 0.01 && (
        <circle
          cx={cx}
          cy={cy}
          r={r * (2.1 + glow * 1.5)}
          fill="url(#ix-glow-white)"
          opacity={clamp(0.25 + glow * 0.7, 0, 0.95)}
          style={live ? { animation: `ix-lamp ${(1.1 - glow * 0.25).toFixed(2)}s ease-in-out infinite` } : undefined}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill={glow > 0.02 && !burned ? 'url(#ix-lens-bulb)' : 'url(#ix-lens-bulb-dark)'} stroke="#7d8894" strokeWidth={0.7} />
      {filament && (
        <path
          d={`M ${cx - r * 0.4} ${cy + r * 0.5} L ${cx - r * 0.4} ${cy - r * 0.15} l ${r * 0.2} -${r * 0.25} l ${r * 0.4} 0 l ${r * 0.2} ${r * 0.25} L ${cx + r * 0.4} ${cy + r * 0.5}`}
          fill="none"
          stroke={burned ? '#3f4650' : glow > 0.02 ? `rgba(255,${Math.round(230 - level * 40)},${Math.round(160 - level * 90)},1)` : '#8b939c'}
          strokeWidth={1.1}
          strokeLinejoin="round"
          filter={glow > 0.05 ? 'url(#ix-glow)' : undefined}
        />
      )}
      {glow > 0.05 && !burned && <circle cx={cx} cy={cy - r * 0.1} r={r * 0.22} fill="#fffbe8" opacity={0.85} filter="url(#ix-glow)" />}
    </g>
  );
}

/** 5 mm LED with a domed epoxy lens. */
export function Led({
  cx,
  cy,
  r = 4,
  color = 'red',
  lit = false,
  live = true
}: {
  cx: number;
  cy: number;
  r?: number;
  color?: 'red' | 'green' | 'amber' | 'blue';
  lit?: boolean;
  live?: boolean;
}) {
  const lens = `url(#ix-lens-led-${color})`;
  const glow = { red: '#ff4438', green: '#22e06a', amber: '#ffc233', blue: '#4cb8ff' }[color];
  return (
    <g>
      {lit && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r * 5}
            fill={`url(#ix-glow-${color})`}
            opacity={0.6}
            style={live ? { animation: 'ix-pulse 1.6s ease-in-out infinite' } : undefined}
          />
          <circle cx={cx} cy={cy} r={r * 2.6} fill={`url(#ix-glow-${color})`} opacity={0.8} />
        </>
      )}
      {/* epoxy dome: dark body, bright rim where the plastic bends the light */}
      <circle cx={cx} cy={cy} r={r} fill={lens} stroke="#0b1220" strokeOpacity={0.45} strokeWidth={0.45} />
      <circle cx={cx} cy={cy} r={r * 0.94} fill="none" stroke="#ffffff" strokeOpacity={lit ? 0.4 : 0.22} strokeWidth={r * 0.16} />
      {lit && <circle cx={cx} cy={cy + r * 0.06} r={r * 0.62} fill={glow} opacity={0.75} filter="url(#ix-glow)" />}
      {/* the little chip inside, visible through the clear epoxy */}
      <rect x={cx - r * 0.3} y={cy - r * 0.05} width={r * 0.6} height={r * 0.42} rx={r * 0.08} fill={lit ? '#ffe9c9' : '#c9c2b6'} opacity={lit ? 0.95 : 0.6} />
      {/* specular highlight off the dome */}
      <ellipse cx={cx - r * 0.32} cy={cy - r * 0.38} rx={r * 0.3} ry={r * 0.2} fill="#ffffff" opacity={lit ? 0.92 : 0.6} transform={`rotate(-28 ${cx - r * 0.32} ${cy - r * 0.38})`} />
      {!lit && <circle cx={cx} cy={cy} r={r * 0.9} fill="#0b1220" opacity={0.14} />}
    </g>
  );
}

/** Bunsen / spirit-lamp flame with a hot inner cone. */
export function Flame({
  x,
  y,
  scale = 1,
  live = true,
  kind = 'bunsen',
  intensity = 1
}: {
  x: number;
  y: number;
  scale?: number;
  live?: boolean;
  kind?: 'bunsen' | 'candle';
  intensity?: number;
}) {
  const h = 46 * scale * clamp(intensity, 0.25, 1.6);
  const w = 15 * scale;
  return (
    <g style={live ? { animation: 'ix-flame 220ms ease-in-out infinite', transformOrigin: `${x}px ${y}px` } : undefined}>
      <ellipse cx={x} cy={y - h * 0.35} rx={w * 2.4} ry={h * 0.62} fill="url(#ix-glow-amber)" opacity={0.55} />
      <path
        d={`M ${x} ${y - h} C ${x + w * 1.15} ${y - h * 0.55} ${x + w} ${y - h * 0.12} ${x} ${y} C ${x - w} ${y - h * 0.12} ${x - w * 1.15} ${y - h * 0.55} ${x} ${y - h} Z`}
        fill={kind === 'candle' ? 'url(#ix-flame-candle)' : 'url(#ix-flame-outer)'}
        opacity={0.92}
      />
      <path
        d={`M ${x} ${y - h * 0.62} C ${x + w * 0.55} ${y - h * 0.34} ${x + w * 0.45} ${y - h * 0.08} ${x} ${y} C ${x - w * 0.45} ${y - h * 0.08} ${x - w * 0.55} ${y - h * 0.34} ${x} ${y - h * 0.62} Z`}
        fill="url(#ix-flame-inner)"
        opacity={0.95}
      />
      <ellipse cx={x} cy={y - h * 0.14} rx={w * 0.3} ry={h * 0.1} fill="#fffbeb" opacity={0.75} />
    </g>
  );
}

/** Hollow glass tube (thermometers, resonance tube, discharge tubes). */
export function GlassTube({
  x,
  y,
  w,
  h,
  rx = 4,
  fillTop
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  fillTop?: string;
}) {
  return (
    <g>
      {/* the wall itself, with the light it bends at the edges */}
      <rect x={x - 0.7} y={y} width={w + 1.4} height={h} rx={rx} fill="url(#ix-glass-edge)" stroke="#7ea9c9" strokeOpacity={0.7} strokeWidth={0.55} />
      <rect x={x + 1.1} y={y + 1.2} width={w - 2.2} height={h - 2.4} rx={rx * 0.8} fill="#f7fbff" opacity={0.5} />
      {fillTop && (
        <g>
          <rect x={x + 1.1} y={y + h * 0.35} width={w - 2.2} height={h * 0.62} rx={rx * 0.8} fill={fillTop} opacity={0.85} />
          <rect x={x + 1.1} y={y + h * 0.35} width={w - 2.2} height={1.4} rx={0.7} fill="#ffffff" opacity={0.45} />
        </g>
      )}
      {/* a long specular streak, a short one, and the dark rim opposite */}
      <line x1={x + w * 0.26} y1={y + 3} x2={x + w * 0.26} y2={y + h - 4} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={Math.max(0.8, w * 0.14)} strokeLinecap="round" />
      <line x1={x + w * 0.44} y1={y + 4} x2={x + w * 0.44} y2={y + h - 5} stroke="#ffffff" strokeOpacity={0.28} strokeWidth={Math.max(0.4, w * 0.06)} strokeLinecap="round" />
      <line x1={x + w * 0.8} y1={y + 3} x2={x + w * 0.8} y2={y + h - 4} stroke="#4b6b86" strokeOpacity={0.22} strokeWidth={Math.max(0.6, w * 0.1)} strokeLinecap="round" />
    </g>
  );
}

/** Etched linear scale (steel rules, metre scales, tube manometers). */
export function LinearScale({
  x,
  y,
  w,
  h,
  from = 0,
  to = 100,
  major = 10,
  minor = 1,
  unit,
  vertical = false,
  size = 5.4,
  tick,
  bg = 'url(#ix-ivory)'
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  from?: number;
  to?: number;
  major?: number;
  minor?: number;
  unit?: string;
  vertical?: boolean;
  size?: number;
  /** Tick length basis in px. Defaults to the plate depth, so the graduation stays on the plate. */
  tick?: number;
  bg?: string;
}) {
  const span = to - from || 1;
  const tickBase = tick ?? (vertical ? Math.max(5, w) : Math.max(5, h));
  const steps = Math.max(1, Math.round(Math.abs(span) / minor));
  const ticks: React.ReactNode[] = [];
  const stride = Math.max(1, Math.ceil(steps / 340));
  for (let i = 0; i <= steps; i += stride) {
    const v = from + (span > 0 ? i : -i) * minor;
    const f = Math.abs((v - from) / span);
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const len = isMajor ? tickBase * 0.55 : tickBase * 0.28;
    const px = vertical ? x + w * 0.08 : x + f * w;
    const py = vertical ? y + h - f * h : y + h - len;
    ticks.push(
      vertical ? (
        <line key={i} x1={px} y1={py} x2={x + w * 0.08 + len} y2={py} stroke="#1f2937" strokeWidth={isMajor ? 0.8 : 0.4} opacity={0.85} />
      ) : (
        <line key={i} x1={px} y1={py} x2={px} y2={y + h} stroke="#1f2937" strokeWidth={isMajor ? 0.8 : 0.4} opacity={0.85} />
      )
    );
    const labelEvery = major * (Math.abs(span) > 40 ? 5 : 2);
    if (isMajor && Math.abs(v / labelEvery - Math.round(v / labelEvery)) < 1e-6) {
      ticks.push(
        <Etch key={`l${i}`} x={vertical ? x + w * 0.68 : px} y={vertical ? py + 2 : y + h * 0.44} size={size} color="#334155" weight={700}>
          {Math.round(v)}
        </Etch>
      );
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1} fill={bg} stroke="#8a8272" strokeWidth={0.5} />
      <rect x={x} y={y} width={w} height={h * 0.3} rx={1} fill="#ffffff" opacity={0.35} />
      {ticks}
      {unit && (
        <Etch x={vertical ? x + w * 0.5 : x + w - 1} y={vertical ? y + h - 3 : y + h * 0.44} size={size} anchor={vertical ? 'middle' : 'end'} color="#475569">
          {unit}
        </Etch>
      )}
    </g>
  );
}

/** Tube of closely-wound copper wire (solenoids, chokes, rheostats). */
export function Coil({
  x,
  y,
  w,
  h,
  turns = 14,
  angle = 0,
  core = '#6b7280'
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  turns?: number;
  angle?: number;
  core?: string;
}) {
  const step = h / turns;
  return (
    <g transform={`rotate(${angle} ${x + w / 2} ${y + h / 2})`}>
      {/* former / core the wire is wound on */}
      <rect x={x} y={y} width={w} height={h} rx={2} fill={core} opacity={0.9} />
      <rect x={x} y={y} width={w} height={h} rx={2} fill="url(#ix-brushed)" opacity={0.5} />
      {/* each turn: copper barrel with a dark gap between windings */}
      {Array.from({ length: turns }).map((_, i) => {
        const cy = y + step * (i + 0.5);
        return (
          <g key={i}>
            <ellipse cx={x + w / 2} cy={cy + step * 0.3} rx={w * 0.53} ry={step * 0.5} fill="#3a1a06" opacity={0.55} />
            <ellipse cx={x + w / 2} cy={cy} rx={w * 0.52} ry={step * 0.62} fill="none" stroke="url(#ix-copper-h)" strokeWidth={Math.max(1.1, step * 0.78)} />
            <ellipse cx={x + w / 2} cy={cy - step * 0.12} rx={w * 0.5} ry={step * 0.24} fill="none" stroke="#ffdcb4" strokeOpacity={0.35} strokeWidth={Math.max(0.4, step * 0.16)} />
          </g>
        );
      })}
      {/* varnish sheen down the barrel + the shadowed underside */}
      <rect x={x + w * 0.12} y={y} width={w * 0.22} height={h} fill="#ffffff" opacity={0.18} />
      <rect x={x + w * 0.62} y={y} width={w * 0.1} height={h} fill="#ffffff" opacity={0.08} />
      <rect x={x} y={y + h * 0.82} width={w} height={h * 0.18} fill="#2a1103" opacity={0.22} />
    </g>
  );
}

/** Retort stand: cast base, vertical column, boss head and clamp. */
export function RetortStand({
  x,
  baseY,
  top,
  clampY,
  length = 60,
  direction = 1
}: {
  x: number;
  baseY: number;
  top: number;
  clampY?: number;
  length?: number;
  direction?: 1 | -1;
}) {
  return (
    <g>
      <Contact cx={x} cy={baseY + 2} rx={26} opacity={0.32} />
      <path d={`M ${x - 26} ${baseY} h 52 v 6 q 0 3 -3 3 h -46 q -3 0 -3 -3 Z`} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} />
      <rect x={x - 26} y={baseY} width={52} height={2} fill="#ffffff" opacity={0.14} />
      <Rod x1={x} y1={baseY} x2={x} y2={top} w={7} />
      <circle cx={x} cy={baseY - 2} r={4} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
      {clampY !== undefined && (
        <g>
          <rect x={x - 7} y={clampY - 6} width={14} height={12} rx={2} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
          <Knob cx={x + direction * 12} cy={clampY} r={4} kind="black" teeth={10} />
          <Rod x1={x} y1={clampY} x2={x + direction * length} y2={clampY} w={5} />
        </g>
      )}
    </g>
  );
}

/** Filament lamp in a holder, used by optics light sources. */
export function LampHousing({ x, y, w = 46, h = 34, lit = false, live = true }: { x: number; y: number; w?: number; h?: number; lit?: boolean; live?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill="url(#ix-charcoal)" stroke="#111827" strokeWidth={0.7} filter="url(#ix-drop)" />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h * 0.24} rx={2} fill="#ffffff" opacity={0.12} />
      <circle cx={x + w * 0.5} cy={y + h * 0.55} r={h * 0.34} fill="url(#ix-glass)" stroke="#cbd5e1" strokeWidth={0.5} />
      {lit && <circle cx={x + w * 0.5} cy={y + h * 0.55} r={h * 0.7} fill="url(#ix-glow-amber)" opacity={0.9} style={live ? { animation: 'ix-pulse 2.4s ease-in-out infinite' } : undefined} />}
      {Array.from({ length: 4 }).map((_, i) => (
        <line key={i} x1={x + 5} y1={y - 3 + i * 2.4} x2={x + w - 5} y2={y - 3 + i * 2.4} stroke="#94a3b8" strokeWidth={0.6} opacity={0.5} />
      ))}
    </g>
  );
}

/** Horizontal linear scale, glued onto the top edge of an instrument (eV/div). */
export function HScale({ x, y, w, from = 0, to = 10, major = 2, size = 5 }: { x: number; y: number; w: number; from?: number; to?: number; major?: number; size?: number }) {
  return <LinearScale x={x} y={y} w={w} h={10} from={from} to={to} major={major} minor={major / 5} size={size} />;
}

/** Brass slotted weight (a "slotted mass") with its mass stamped on the face. */
export function SlottedWeight({ cx, cy, r = 13, label }: { cx: number; cy: number; r?: number; label?: string }) {
  return (
    <g>
      {/* shadow on the bench, then the turned disc itself */}
      <ellipse cx={cx + 2} cy={cy + r * 0.92} rx={r * 1.08} ry={r * 0.26} fill="#0b1220" opacity={0.26} filter="url(#ix-blur)" />
      <ellipse cx={cx} cy={cy + r * 0.86} rx={r * 0.92} ry={r * 0.2} fill="#0b1220" opacity={0.18} />
      {/* knurled rim picks up its own highlight */}
      <circle cx={cx} cy={cy} r={r} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
      <circle cx={cx} cy={cy} r={r} fill="url(#ix-knurl)" opacity={0.55} />
      <circle cx={cx} cy={cy} r={r * 0.94} fill="none" stroke="#fff3c4" strokeOpacity={0.35} strokeWidth={r * 0.08} />
      {/* the machined face, lit from the upper left */}
      <circle cx={cx} cy={cy - r * 0.03} r={r * 0.86} fill="url(#ix-brass-ball)" stroke="#8a6512" strokeWidth={0.5} />
      <circle cx={cx} cy={cy - r * 0.03} r={r * 0.86} fill="url(#ix-brass-h)" opacity={0.25} />
      {/* concentric turning marks from the lathe */}
      <circle cx={cx} cy={cy - r * 0.03} r={r * 0.62} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={0.4} />
      <circle cx={cx} cy={cy - r * 0.03} r={r * 0.44} fill="none" stroke="#5b3f08" strokeOpacity={0.16} strokeWidth={0.4} />
      {/* the slot the hanger passes through, with its machined lip */}
      <path d={`M ${cx - r * 0.34} ${cy - r * 0.86} a ${r * 0.34} ${r * 0.34} 0 0 1 ${r * 0.68} 0 l 0 ${r * 0.34} a ${r * 0.34} ${r * 0.34} 0 0 1 ${-r * 0.68} 0 Z`} fill="#3f2a0e" opacity={0.7} />
      <path d={`M ${cx - r * 0.34} ${cy - r * 0.52} a ${r * 0.34} ${r * 0.34} 0 0 1 ${r * 0.68} 0`} fill="none" stroke="#ffe9a8" strokeOpacity={0.35} strokeWidth={0.5} />
      {/* specular glint + stamped mass */}
      <ellipse cx={cx - r * 0.34} cy={cy - r * 0.4} rx={r * 0.26} ry={r * 0.16} fill="#ffffff" opacity={0.5} transform={`rotate(-30 ${cx - r * 0.34} ${cy - r * 0.4})`} />
      {label && (
        <Etch x={cx} y={cy + r * 0.46} size={r * 0.46} color="#4a3208" weight={800} mono>
          {label}
        </Etch>
      )}
    </g>
  );
}

/** Weight hanger: a hook that rides the string with a slotted mass clipped under it. */
export function WeightHanger({ x, y, r = 14, label, hook = true }: { x: number; y: number; r?: number; label?: string; hook?: boolean }) {
  return (
    <g>
      {hook && (
        <>
          <path d={`M ${x} ${y - r - 20} L ${x} ${y - r - 4}`} stroke="#8a97a5" strokeWidth={1.5} />
          <path d={`M ${x - 3.4} ${y - r - 6} a 3.4 3.4 0 1 0 6.8 0`} fill="none" stroke="#cbd5e1" strokeWidth={1.6} />
          <rect x={x - 7} y={y - r - 3.5} width={14} height={5} rx={1.6} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.5} />
        </>
      )}
      <SlottedWeight cx={x} cy={y} r={r} label={label} />
    </g>
  );
}

/**
 * Ivory bench protractor. `angle` is the reading in degrees, measured from the
 * vertical; `spanDeg` is the total arc covered (90 for a quadrant).
 */
export function Protractor({ cx, cy, r = 74, angle = 0, spanDeg = 90 }: { cx: number; cy: number; r?: number; angle?: number; spanDeg?: number }) {
  const half = spanDeg / 2;
  const marks: React.ReactNode[] = [];
  for (let d = -half; d <= half; d += 5) {
    const a = ((d - 90) * Math.PI) / 180;
    const major = Math.abs(d) % 10 === 0;
    const labelled = Math.abs(d) % 20 === 0;
    const r0 = major ? (labelled ? r * 0.86 : r * 0.9) : r * 0.94;
    marks.push(
      <line
        key={`t${d}`}
        x1={cx + Math.cos(a) * r0}
        y1={cy + Math.sin(a) * r0}
        x2={cx + Math.cos(a) * (r - 5)}
        y2={cy + Math.sin(a) * (r - 5)}
        stroke="#1f2937"
        strokeWidth={major ? 1 : 0.45}
        opacity={0.9}
      />
    );
    if (labelled) {
      marks.push(
        <Etch key={`l${d}`} x={cx + Math.cos(a) * (r * 0.74)} y={cy + Math.sin(a) * (r * 0.74) + 3.4} size={Math.max(6, r * 0.13)} color="#1f2937" weight={800} mono>
          {`${Math.abs(d)}`}
        </Etch>
      );
    }
  }
  return (
    <g>
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} L ${cx} ${cy} Z`} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.9} />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} />
      {marks}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.sin((angle * Math.PI) / 180) * (r - 6)}
        y2={cy - Math.cos((angle * Math.PI) / 180) * (r - 6)}
        stroke="#b91c1c"
        strokeWidth={1.8}
      />
      <circle cx={cx} cy={cy} r={3.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
    </g>
  );
}
