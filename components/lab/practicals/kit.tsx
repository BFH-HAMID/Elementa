'use client';

import React from 'react';
import { C, Fumes, Glow, Txt, clampN, fmt, frac } from './primitives';

/* ------------------------------------------------------------------ */
/* Flames & burners                                                     */
/* ------------------------------------------------------------------ */

/** Bunsen flame: blue cones (air hole open) or a tall wavy luminous flame. */
export function Flame({ cx, yb, h, open, color, t, w = 16 }: { cx: number; yb: number; h: number; open: boolean; color?: string; t: number; w?: number }) {
  if (h <= 1) return null;
  const fl = 1 + Math.sin(t * 13.1) * 0.05 + Math.sin(t * 7.7) * 0.04;
  if (!open) {
    const hh = h * 1.45 * fl;
    const sway = Math.sin(t * 5.3) * 3;
    return (
      <g style={{ pointerEvents: 'none' }}>
        <ellipse cx={cx} cy={yb - hh * 0.45} rx={w * 1.1} ry={hh * 0.55} fill="#ffb347" opacity="0.25" filter="url(#cx-blur-lg)" />
        <path d={`M ${cx - w * 0.55} ${yb} C ${cx - w * 0.9} ${yb - hh * 0.4} ${cx - w * 0.2 + sway} ${yb - hh * 0.75} ${cx + sway * 1.4} ${yb - hh} C ${cx + w * 0.3 + sway} ${yb - hh * 0.7} ${cx + w * 0.9} ${yb - hh * 0.4} ${cx + w * 0.55} ${yb} Z`} fill="url(#cx-flame-lum)" />
        {color && <path d={`M ${cx - w * 0.45} ${yb - 2} C ${cx - w * 0.7} ${yb - hh * 0.4} ${cx + sway} ${yb - hh * 0.7} ${cx + sway} ${yb - hh * 0.85} C ${cx + w * 0.7} ${yb - hh * 0.4} ${cx + w * 0.45} ${yb - 2} ${cx + w * 0.45} ${yb - 2} Z`} fill={color} opacity="0.25" />}
      </g>
    );
  }
  const hh = h * fl;
  return (
    <g style={{ pointerEvents: 'none' }}>
      {color && <ellipse cx={cx} cy={yb - hh * 0.55} rx={w * 1.2} ry={hh * 0.65} fill={color} opacity="0.45" filter="url(#cx-blur-lg)" />}
      <path d={`M ${cx - w / 2} ${yb} C ${cx - w * 0.62} ${yb - hh * 0.45} ${cx - w * 0.15} ${yb - hh * 0.85} ${cx} ${yb - hh} C ${cx + w * 0.15} ${yb - hh * 0.85} ${cx + w * 0.62} ${yb - hh * 0.45} ${cx + w / 2} ${yb} Z`} fill={color ?? 'url(#cx-flame-out)'} opacity={color ? 0.85 : 1} />
      <path d={`M ${cx - w * 0.3} ${yb} C ${cx - w * 0.32} ${yb - hh * 0.2} ${cx - w * 0.05} ${yb - hh * 0.38} ${cx} ${yb - hh * 0.42} C ${cx + w * 0.05} ${yb - hh * 0.38} ${cx + w * 0.32} ${yb - hh * 0.2} ${cx + w * 0.3} ${yb} Z`} fill="url(#cx-flame-in)" opacity="0.9" />
    </g>
  );
}

/** Bunsen burner standing on the bench; the flame sits on top of the barrel. */
export function BunsenBurner({ cx, yb, flame, open = true, color, t, hose = 'left' }: { cx: number; yb: number; flame: number; open?: boolean; color?: string; t: number; hose?: 'left' | 'right' }) {
  const top = yb - 66;
  const hx = hose === 'left' ? -1 : 1;
  return (
    <g>
      <path d={`M ${cx + hx * 14} ${yb - 6} q ${hx * 26} 2 ${hx * 40} 12`} fill="none" stroke="#d9772f" strokeWidth="5" strokeLinecap="round" />
      <path d={`M ${cx - 22} ${yb} L ${cx - 18} ${yb - 7} L ${cx + 18} ${yb - 7} L ${cx + 22} ${yb} Z`} fill="url(#cx-metal)" stroke="#5f6b78" strokeWidth="0.8" />
      <rect x={cx + hx * 10 - 4} y={yb - 9} width="8" height="5" rx="1.5" fill="#7d8995" />
      <rect x={cx - 5.5} y={top} width="11" height={yb - 7 - top} fill="url(#cx-metal-h)" stroke="#5f6b78" strokeWidth="0.7" />
      {/* collar with air hole */}
      <rect x={cx - 7} y={yb - 26} width="14" height="10" rx="1.5" fill="url(#cx-metal-h)" stroke="#5f6b78" strokeWidth="0.7" />
      <ellipse cx={cx} cy={yb - 21} rx="3" ry="2.6" fill={open ? '#1f2832' : '#9aa6b2'} />
      <Flame cx={cx} yb={top} h={44 * clampN(flame, 0, 2)} open={open} color={color} t={t} w={flame > 1.4 ? 22 : 16} />
    </g>
  );
}

/** Spirit lamp with a small yellow flame. */
export function SpiritLamp({ cx, yb, lit, t }: { cx: number; yb: number; lit: boolean; t: number }) {
  return (
    <g>
      <path d={`M ${cx - 20} ${yb} Q ${cx - 24} ${yb - 22} ${cx - 8} ${yb - 30} L ${cx + 8} ${yb - 30} Q ${cx + 24} ${yb - 22} ${cx + 20} ${yb} Z`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      <path d={`M ${cx - 18} ${yb - 2} Q ${cx - 21} ${yb - 14} ${cx - 15} ${yb - 17} L ${cx + 15} ${yb - 17} Q ${cx + 21} ${yb - 14} ${cx + 18} ${yb - 2} Z`} fill="#bfe0f5" opacity="0.6" />
      <rect x={cx - 6} y={yb - 38} width="12" height="9" rx="2" fill="url(#cx-metal-h)" />
      <rect x={cx - 1.2} y={yb - 44} width="2.4" height="7" fill="#e8e1cf" />
      {lit && <Flame cx={cx} yb={yb - 44} h={16} open={false} t={t} w={9} />}
    </g>
  );
}

/** Tripod with a wire gauze on top. */
export function Tripod({ cx, y, w = 92, gauze = true, ring = false }: { cx: number; y: number; w?: number; gauze?: boolean; ring?: boolean }) {
  return (
    <g>
      <path d={`M ${cx - w / 2 + 6} ${y + 3} L ${cx - w / 2 - 4} 300`} stroke="#4a5562" strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M ${cx + w / 2 - 6} ${y + 3} L ${cx + w / 2 + 4} 300`} stroke="#4a5562" strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M ${cx} ${y + 3} L ${cx + 3} 298`} stroke="#3b4550" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <rect x={cx - w / 2} y={y} width={w} height="5" rx="2.5" fill="#56626f" />
      {gauze && !ring && (
        <g>
          <rect x={cx - w / 2 - 6} y={y - 3} width={w + 12} height="4" fill="#a5adb6" />
          <rect x={cx - w / 4} y={y - 3} width={w / 2} height="4" fill="#e7e2d8" opacity="0.9" />
          {Array.from({ length: Math.floor((w + 12) / 5) }, (_, i) => (
            <line key={i} x1={cx - w / 2 - 6 + i * 5} x2={cx - w / 2 - 6 + i * 5} y1={y - 3} y2={y + 1} stroke="#6f7883" strokeWidth="0.5" />
          ))}
        </g>
      )}
    </g>
  );
}

/** Retort stand: base, rod and clamps reaching to `toX`. */
export function ClampStand({ x, h = 250, clamps }: { x: number; h?: number; clamps: { y: number; toX: number; jaw?: number }[] }) {
  return (
    <g>
      <rect x={x - 34} y={293} width="74" height="9" rx="2" fill="#2f3943" />
      <rect x={x - 3} y={300 - h} width="6" height={h} rx="2" fill="url(#cx-metal-h)" stroke="#5f6b78" strokeWidth="0.5" />
      {clamps.map((c, i) => {
        const dir = c.toX >= x ? 1 : -1;
        const jaw = c.jaw ?? 9;
        return (
          <g key={i}>
            <rect x={x - 6} y={c.y - 6} width="12" height="12" rx="2" fill="#3b4856" />
            <rect x={Math.min(x, c.toX)} y={c.y - 2} width={Math.abs(c.toX - x)} height="4" fill="url(#cx-metal)" />
            <path d={`M ${c.toX - dir * 2} ${c.y - jaw} q ${dir * 10} 0 ${dir * 10} ${jaw} q 0 ${jaw} ${-dir * 10} ${jaw}`} fill="none" stroke="#3b4856" strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
}

/** White porcelain tile under a titration flask. */
export function WhiteTile({ cx, w = 120 }: { cx: number; w?: number }) {
  return <rect x={cx - w / 2} y={296} width={w} height="6" rx="1" fill="#fdfdfd" stroke="#cfd7de" strokeWidth="0.8" />;
}

/* ------------------------------------------------------------------ */
/* Crucibles, dishes, funnels                                           */
/* ------------------------------------------------------------------ */

/** Porcelain crucible on a pipe-clay triangle; lid on / ajar / off. */
export function Crucible({ cx, y, w = 46, h = 36, contents, lid = 'off', glow = 0, coil = 0, t }: { cx: number; y: number; w?: number; h?: number; contents: string; lid?: 'on' | 'ajar' | 'off'; glow?: number; coil?: number; t: number }) {
  const bw = w * 0.62;
  const flick = 0.85 + 0.15 * Math.sin(t * 9);
  return (
    <g>
      <Glow cx={cx} cy={y + h * 0.5} r={w * 1.2} amount={glow * 0.9 * flick} />
      {/* pipe-clay triangle */}
      <path d={`M ${cx - w / 2 - 14} ${y + h - 6} L ${cx + w / 2 + 14} ${y + h - 6}`} stroke="#f2ede4" strokeWidth="4" strokeLinecap="round" />
      <path d={`M ${cx - w / 2 - 14} ${y + h - 6} L ${cx + w / 2 + 14} ${y + h - 6}`} stroke="#9aa3ad" strokeWidth="1" strokeDasharray="1 5" />
      <path d={`M ${cx - w / 2} ${y} L ${cx - bw / 2} ${y + h} L ${cx + bw / 2} ${y + h} L ${cx + w / 2} ${y} Z`} fill="url(#cx-porcelain)" stroke="#8d98a3" strokeWidth="1" />
      {glow > 0.05 && <path d={`M ${cx - w / 2} ${y} L ${cx - bw / 2} ${y + h} L ${cx + bw / 2} ${y + h} L ${cx + w / 2} ${y} Z`} fill="#ff6a2b" opacity={glow * 0.35 * flick} />}
      <ellipse cx={cx} cy={y} rx={w / 2} ry="5" fill="#e9edf0" stroke="#8d98a3" strokeWidth="1" />
      <ellipse cx={cx} cy={y + 1.5} rx={w / 2 - 5} ry="3.2" fill={contents} />
      <path d={`M ${cx - w / 2 + 7} ${y + 1.5} Q ${cx - 6} ${y - 7} ${cx} ${y - 6} Q ${cx + 8} ${y - 6.5} ${cx + w / 2 - 7} ${y + 1.5} Z`} fill={contents} stroke="#000000" strokeOpacity="0.12" strokeWidth="0.6" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M ${cx - 12 + i * 6} ${y - 1 - (i % 2) * 2} l 2 -2 l 2 2 l -2 2 z`} fill="#ffffff" opacity="0.35" />
      ))}
      {coil > 0.02 &&
        Array.from({ length: 4 }, (_, i) => <ellipse key={i} cx={cx - 9 + i * 6} cy={y + 0.5} rx="4" ry="2.2" fill="none" stroke="#e3e8ee" strokeWidth="1.4" opacity={clampN(coil, 0, 1)} />)}
      {lid === 'on' && (
        <g>
          <ellipse cx={cx} cy={y - 3} rx={w / 2 + 3} ry="5" fill="url(#cx-porcelain)" stroke="#8d98a3" strokeWidth="1" />
          <rect x={cx - 4} y={y - 11} width="8" height="6" rx="2" fill="#e9edf0" stroke="#8d98a3" strokeWidth="0.8" />
        </g>
      )}
      {lid === 'ajar' && (
        <g transform={`rotate(-14 ${cx + w / 2} ${y})`}>
          <ellipse cx={cx + 4} cy={y - 5} rx={w / 2 + 3} ry="5" fill="url(#cx-porcelain)" stroke="#8d98a3" strokeWidth="1" />
          <rect x={cx} y={y - 13} width="8" height="6" rx="2" fill="#e9edf0" stroke="#8d98a3" strokeWidth="0.8" />
        </g>
      )}
    </g>
  );
}

/** Shallow evaporating basin / china dish. */
export function ChinaDish({ cx, y, w = 92, contents, level = 0.6, crystals = 0 }: { cx: number; y: number; w?: number; contents?: string; level?: number; crystals?: number }) {
  const h = w * 0.3;
  const lv = clampN(level, 0, 1);
  return (
    <g>
      <path d={`M ${cx - w / 2} ${y} Q ${cx - w / 2 + 4} ${y + h} ${cx} ${y + h} Q ${cx + w / 2 - 4} ${y + h} ${cx + w / 2} ${y} Z`} fill="url(#cx-porcelain)" stroke="#8d98a3" strokeWidth="1" />
      {contents && lv > 0.02 && <ellipse cx={cx} cy={y + 2 + (1 - lv) * h * 0.55} rx={(w / 2 - 6) * (0.45 + 0.55 * lv)} ry={3 + 2 * lv} fill={contents} opacity="0.85" />}
      {crystals > 0 &&
        Array.from({ length: Math.round(6 + crystals * 18) }, (_, i) => {
          const a = (i / (6 + crystals * 18)) * Math.PI * 2;
          const rr = (w / 2 - 10) * (0.55 + 0.45 * frac(i * 0.618));
          return <rect key={i} x={cx + Math.cos(a) * rr - 1.5} y={y + 2 + Math.abs(Math.sin(a)) * 4 - 1.5 + (1 - crystals) * 2} width="3" height="3" fill="#ffffff" stroke="#c9d3dc" strokeWidth="0.5" transform={`rotate(${(i * 37) % 90} ${cx + Math.cos(a) * rr} ${y + 3})`} />;
        })}
      <ellipse cx={cx} cy={y} rx={w / 2} ry="4" fill="none" stroke="#8d98a3" strokeWidth="1" />
    </g>
  );
}

/** Glass filter funnel (optionally inverted, with a cotton plug in the stem). */
export function Funnel({ cx, y, w = 70, h = 64, inverted = false, plug = false, crust = 0 }: { cx: number; y: number; w?: number; h?: number; inverted?: boolean; plug?: boolean; crust?: number }) {
  const cone = h * 0.55;
  if (inverted) {
    // stem at the top, wide mouth at the bottom (y + h)
    const yb = y + h;
    const d = `M ${cx - w / 2} ${yb} L ${cx - 4} ${yb - cone} L ${cx - 4} ${y} M ${cx + 4} ${y} L ${cx + 4} ${yb - cone} L ${cx + w / 2} ${yb}`;
    return (
      <g>
        {crust > 0.02 && <path d={`M ${cx - w / 2 + 4} ${yb - 2} L ${cx - 4} ${yb - cone + 2} L ${cx + 4} ${yb - cone + 2} L ${cx + w / 2 - 4} ${yb - 2} L ${cx + w / 2 - 10} ${yb - 2} L ${cx + 2} ${yb - cone + 10} L ${cx - 2} ${yb - cone + 10} L ${cx - w / 2 + 10} ${yb - 2} Z`} fill="#fbfbf8" opacity={clampN(crust, 0, 1)} stroke="#d9dde2" strokeWidth="0.5" />}
        <path d={`M ${cx - w / 2} ${yb} L ${cx - 4} ${yb - cone} L ${cx - 4} ${y} L ${cx + 4} ${y} L ${cx + 4} ${yb - cone} L ${cx + w / 2} ${yb} Z`} fill="url(#cx-glass)" />
        <path d={d} fill="none" stroke={C.glass} strokeWidth="1.4" />
        {plug && <rect x={cx - 5} y={y - 6} width="10" height="12" rx="4" fill="#fbfbfb" stroke="#d6dde3" strokeWidth="0.8" />}
      </g>
    );
  }
  const d = `M ${cx - w / 2} ${y} L ${cx - 4} ${y + cone} L ${cx - 4} ${y + h} M ${cx + 4} ${y + h} L ${cx + 4} ${y + cone} L ${cx + w / 2} ${y}`;
  return (
    <g>
      <path d={`M ${cx - w / 2} ${y} L ${cx - 4} ${y + cone} L ${cx - 4} ${y + h} L ${cx + 4} ${y + h} L ${cx + 4} ${y + cone} L ${cx + w / 2} ${y} Z`} fill="url(#cx-glass)" />
      <path d={d} fill="none" stroke={C.glass} strokeWidth="1.4" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Instruments                                                          */
/* ------------------------------------------------------------------ */

/** Top-pan balance; children are drawn standing on the pan. */
export function Balance({ cx, w = 130, reading, digits = 2, children }: { cx: number; w?: number; reading: number; digits?: number; children?: React.ReactNode }) {
  const y = 262;
  return (
    <g>
      <path d={`M ${cx - w / 2} 300 L ${cx - w / 2 + 6} ${y + 8} L ${cx + w / 2 - 6} ${y + 8} L ${cx + w / 2} 300 Z`} fill="url(#cx-plastic)" stroke="#9aa6b2" strokeWidth="1" filter="url(#cx-shadow)" />
      <rect x={cx - w * 0.28} y={y + 16} width={w * 0.56} height="16" rx="2.5" fill="url(#cx-lcd)" stroke="#5a7a5e" strokeWidth="0.8" />
      <Txt x={cx + w * 0.25} y={y + 28} anchor="end" size={11} color="#163b1c" weight={800} mono>
        {fmt(reading, digits)} g
      </Txt>
      <rect x={cx - w * 0.38} y={y + 2} width={w * 0.76} height="6" rx="3" fill="url(#cx-metal)" />
      {children}
    </g>
  );
}

/** DC power supply with an on/off light. */
export function PowerPack({ x, y, on = true, label = 'DC', current }: { x: number; y: number; on?: boolean; label?: string; current?: number }) {
  return (
    <g filter="url(#cx-shadow)">
      <rect x={x} y={y} width="96" height="52" rx="6" fill="url(#cx-case)" />
      <rect x={x + 8} y={y + 8} width="44" height="18" rx="3" fill="#0d1a12" />
      <Txt x={x + 48} y={y + 21} anchor="end" size={10} color="#7cf0b4" weight={800} mono>
        {current !== undefined ? `${fmt(current, 2)}A` : label}
      </Txt>
      <circle cx={x + 70} cy={y + 17} r="8" fill="#56626f" stroke="#2b333c" />
      <line x1={x + 70} y1={y + 17} x2={x + 74} y2={y + 12} stroke="#e8edf2" strokeWidth="1.6" />
      <circle cx={x + 18} cy={y + 39} r="4.5" fill="#e2483d" />
      <circle cx={x + 34} cy={y + 39} r="4.5" fill="#1f2832" stroke="#7d8995" />
      <circle cx={x + 84} cy={y + 39} r="3" fill={on ? '#4ade80' : '#3b4856'} />
      <Txt x={x + 18} y={y + 50} size={6} color="#c9d6e3">
        +
      </Txt>
      <Txt x={x + 34} y={y + 50} size={6} color="#c9d6e3">
        −
      </Txt>
    </g>
  );
}

/** Electric bulb for the conductivity tester. */
export function Bulb({ cx, cy, brightness }: { cx: number; cy: number; brightness: number }) {
  const b = clampN(brightness, 0, 1);
  return (
    <g>
      <Glow cx={cx} cy={cy} r={18 + 26 * b} amount={b} />
      <circle cx={cx} cy={cy} r="11" fill={b > 0.05 ? '#fff6c8' : '#f2f5f8'} fillOpacity={0.5 + 0.5 * b} stroke={C.glass} strokeWidth="1.2" />
      <path d={`M ${cx - 4} ${cy + 4} L ${cx - 2} ${cy - 3} L ${cx} ${cy + 1} L ${cx + 2} ${cy - 3} L ${cx + 4} ${cy + 4}`} fill="none" stroke={b > 0.05 ? '#ff9f1c' : '#7d8995'} strokeWidth="1" />
      <rect x={cx - 6} y={cy + 10} width="12" height="8" rx="1.5" fill="url(#cx-metal-h)" />
    </g>
  );
}

/** Wooden splint: burning, glowing or just put out. */
export function Splint({ x, y, angle = -20, state, t }: { x: number; y: number; angle?: number; state: 'burning' | 'glowing' | 'out' | 'bright' | 'pop'; t: number }) {
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <rect x={x} y={y - 2} width="78" height="4" rx="1.5" fill="#d9b27a" stroke="#a27a45" strokeWidth="0.5" />
      <rect x={x - 3} y={y - 2.2} width="5" height="4.4" rx="1.5" fill={state === 'out' ? '#2b2b2b' : '#5a2e12'} />
      {(state === 'burning' || state === 'bright' || state === 'pop') && (
        <g transform={`rotate(${-angle} ${x - 2} ${y})`}>
          <Flame cx={x - 2} yb={y + 2} h={state === 'bright' ? 30 : 18} open={false} t={t} w={state === 'bright' ? 12 : 8} />
        </g>
      )}
      {state === 'glowing' && <circle cx={x - 1} cy={y} r={3.2 + Math.sin(t * 8) * 0.6} fill="#ff5a1f" opacity="0.95" />}
      {state === 'out' && (
        <g transform={`rotate(${-angle} ${x - 2} ${y})`}>
          <Fumes cx={x - 2} y={y - 2} w={8} h={28} color="#9aa3ad" amount={0.7} t={t} seed={4} />
        </g>
      )}
    </g>
  );
}

/** Dropper (teat pipette) above a vessel, releasing drops. */
export function Dropper({ cx, y, color, label, t, dropping = true, dropTo }: { cx: number; y: number; color: string; label?: string; t: number; dropping?: boolean; dropTo?: number }) {
  return (
    <g>
      <path d={`M ${cx - 6} ${y} Q ${cx - 7} ${y - 16} ${cx} ${y - 18} Q ${cx + 7} ${y - 16} ${cx + 6} ${y} Z`} fill="#c2413a" stroke="#8f2c26" strokeWidth="0.8" />
      <path d={`M ${cx - 4} ${y} L ${cx - 1.4} ${y + 34} L ${cx + 1.4} ${y + 34} L ${cx + 4} ${y} Z`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1" />
      <path d={`M ${cx - 3} ${y + 14} L ${cx - 1.4} ${y + 33} L ${cx + 1.4} ${y + 33} L ${cx + 3} ${y + 14} Z`} fill={color} opacity="0.85" />
      {dropping && <DropLoop x={cx} y0={y + 36} y1={dropTo ?? y + 60} color={color} t={t} />}
      {label && (
        <Txt x={cx + 9} y={y - 6} anchor="start" size={8.5} color={C.ink} weight={800}>
          {label}
        </Txt>
      )}
    </g>
  );
}

function DropLoop({ x, y0, y1, color, t }: { x: number; y0: number; y1: number; color: string; t: number }) {
  const p = frac(t * 0.9);
  if (p > 0.75) return null;
  const q = p / 0.75;
  const yy = y0 + q * q * (y1 - y0);
  return <path d={`M ${x} ${yy - 3} q 2.3 3 0 5.2 q -2.3 -2.2 0 -5.2 z`} fill={color} stroke={C.glass} strokeWidth="0.5" />;
}

/** A strip of indicator paper dipped into a vessel, held by tongs. */
export function PaperStrip({ cx, y, h = 70, color, wet = 0.45 }: { cx: number; y: number; h?: number; color: string; wet?: number }) {
  const wetY = y + h * (1 - wet);
  return (
    <g>
      <rect x={cx - 3.5} y={y} width="7" height={h} rx="1" fill="#f3efe4" stroke="#c9c2b0" strokeWidth="0.6" />
      <rect x={cx - 3.5} y={wetY} width="7" height={y + h - wetY} rx="1" fill={color} />
      <path d={`M ${cx - 6} ${y - 18} L ${cx - 2} ${y + 4} M ${cx + 6} ${y - 18} L ${cx + 2} ${y + 4}`} stroke="#7d8995" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

/** Rack parts as separate layers (back legs and front board). */
export function RackBack({ x0, x1, yTop }: { x0: number; x1: number; yTop: number }) {
  return (
    <g>
      <rect x={x0 - 8} y={288} width={x1 - x0 + 16} height="12" rx="2" fill="url(#cx-wood)" stroke={C.woodDark} strokeWidth="0.8" />
      <rect x={x0 - 8} y={yTop} width="7" height={300 - yTop} fill="url(#cx-wood)" stroke={C.woodDark} strokeWidth="0.6" />
      <rect x={x1 + 1} y={yTop} width="7" height={300 - yTop} fill="url(#cx-wood)" stroke={C.woodDark} strokeWidth="0.6" />
    </g>
  );
}

export function RackFront({ x0, x1, yTop }: { x0: number; x1: number; yTop: number }) {
  return <rect x={x0 - 8} y={yTop} width={x1 - x0 + 16} height="11" rx="2" fill="url(#cx-wood)" stroke={C.woodDark} strokeWidth="0.8" />;
}

/** Electric wire (with a slight sag) between two points. */
export function Wire({ x1, y1, x2, y2, color = '#d64545', sag = 18 }: { x1: number; y1: number; x2: number; y2: number; color?: string; sag?: number }) {
  const mx = (x1 + x2) / 2;
  const my = Math.max(y1, y2) + sag;
  return <path d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />;
}

/** Flowing electrons/current dots along a straight segment. */
export function FlowDots({ x1, y1, x2, y2, t, speed = 0.6, n = 5, color = '#facc15' }: { x1: number; y1: number; x2: number; y2: number; t: number; speed?: number; n?: number; color?: string }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const p = frac(t * speed + i / n);
        return <circle key={i} cx={x1 + (x2 - x1) * p} cy={y1 + (y2 - y1) * p} r="2" fill={color} stroke="#a16207" strokeWidth="0.4" />;
      })}
    </g>
  );
}
