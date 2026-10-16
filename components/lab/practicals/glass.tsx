'use client';

import React, { useId } from 'react';
import type { TubeSolid, TubeView } from '@/engine/chemPracticals';
import { Bubbles, C, Fumes, Mark, Txt, clampN, fmt, frac, liquidAlpha, rnd } from './primitives';

/* ------------------------------------------------------------------ */
/* Shapes                                                               */
/* ------------------------------------------------------------------ */

/** Region of a round-bottomed tube filled from the bottom up to `top`. */
function uFill(x0: number, x1: number, yb: number, r: number, top: number): string {
  const cx = (x0 + x1) / 2;
  if (top >= yb - 0.5) return '';
  if (yb - top >= r) return `M ${x0} ${top} L ${x0} ${yb - r} A ${r} ${r} 0 0 0 ${x1} ${yb - r} L ${x1} ${top} Z`;
  const dy = yb - r - top; // negative: inside the round part
  const hw = Math.sqrt(Math.max(0, r * r - dy * dy));
  return `M ${cx - hw} ${top} A ${r} ${r} 0 0 0 ${cx + hw} ${top} Z`;
}

const tubeOutline = (x0: number, x1: number, y: number, yb: number, r: number) => `M ${x0} ${y} L ${x0} ${yb - r} A ${r} ${r} 0 0 0 ${x1} ${yb - r} L ${x1} ${y}`;

/** Glass body + highlight drawn over the contents. */
function GlassSkin({ d, x, y, h }: { d: string; x: number; y: number; h: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path d={d} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke="#ffffff" strokeOpacity="0.75" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Test tube                                                            */
/* ------------------------------------------------------------------ */

function SolidInTube({ solid, cx, yb, w, top, seed, surface }: { solid: TubeSolid; cx: number; yb: number; w: number; top: number; seed: number; surface: number }) {
  const amount = clampN(solid.amount ?? 1, 0, 1);
  const coat = clampN(solid.coatAmount ?? 0, 0, 1);
  switch (solid.kind) {
    case 'strip':
    case 'nail': {
      const sw = solid.kind === 'nail' ? 3.4 : 7;
      const y0 = top;
      const y1 = yb - 4;
      // the coating grows on the part below the liquid surface (the whole nail in air + water)
      const coatTop = solid.kind === 'nail' ? y0 : Math.max(y0, Math.min(y1 - 2, surface));
      return (
        <g>
          {solid.kind === 'nail' && <rect x={cx - 5} y={y0 - 2} width="10" height="3" rx="1" fill={solid.color} stroke="#5d646d" strokeWidth="0.5" />}
          <rect x={cx - sw / 2} y={y0} width={sw} height={Math.max(4, y1 - y0)} rx={solid.kind === 'nail' ? 1 : 1.5} fill={solid.color} stroke="#5d646d" strokeWidth="0.5" />
          {solid.kind === 'nail' && <path d={`M ${cx - sw / 2} ${y1} L ${cx} ${y1 + 4} L ${cx + sw / 2} ${y1} Z`} fill={solid.color} />}
          {coat > 0 && solid.coat && (
            <g opacity={coat}>
              <rect x={cx - sw / 2 - 0.6} y={coatTop} width={sw + 1.2} height={Math.max(2, y1 - coatTop)} rx="1.5" fill={solid.coat} />
              {Array.from({ length: 6 }, (_, i) => (
                <circle key={i} cx={cx - sw / 2 + rnd(seed + i) * sw} cy={coatTop + rnd(seed + i + 9) * Math.max(2, y1 - coatTop)} r={0.8 + rnd(seed + i + 4) * 1.2} fill={solid.coat} />
              ))}
            </g>
          )}
        </g>
      );
    }
    case 'ribbon': {
      const len = 22 * amount;
      if (len < 2) return null;
      const pts: string[] = [];
      for (let i = 0; i <= 8; i++) pts.push(`${cx - 6 + (i % 2) * 12},${yb - 4 - (i / 8) * len}`);
      return (
        <g>
          <polyline points={pts.join(' ')} fill="none" stroke="#7d8995" strokeWidth="3.6" strokeLinejoin="round" />
          <polyline points={pts.join(' ')} fill="none" stroke={solid.color} strokeWidth="2" strokeLinejoin="round" />
        </g>
      );
    }
    case 'granules':
    case 'chips':
    case 'crystals': {
      const n = Math.max(1, Math.round((solid.kind === 'crystals' ? 7 : 4) * (0.3 + 0.7 * amount)));
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const gx = cx + (rnd(seed + i * 3) - 0.5) * (w - 10);
            const gy = yb - 4 - rnd(seed + i * 5) * 6 - (i % 2) * 3;
            const s = (solid.kind === 'chips' ? 4.2 : solid.kind === 'crystals' ? 2.2 : 3.2) * (0.6 + 0.4 * amount);
            const d = solid.kind === 'crystals' ? `M ${gx} ${gy - s} L ${gx + s * 0.8} ${gy} L ${gx} ${gy + s} L ${gx - s * 0.8} ${gy} Z` : `M ${gx - s} ${gy} L ${gx - s * 0.4} ${gy - s * 0.9} L ${gx + s * 0.7} ${gy - s * 0.6} L ${gx + s} ${gy + s * 0.3} L ${gx + s * 0.1} ${gy + s * 0.8} Z`;
            return <path key={i} d={d} fill={solid.color} stroke="#4b5563" strokeOpacity="0.5" strokeWidth="0.5" />;
          })}
        </g>
      );
    }
    case 'powder':
    default: {
      const hh = 4 + 5 * amount;
      return <path d={`M ${cx - w / 2 + 3} ${yb - 3} Q ${cx} ${yb - 3 - hh * 2} ${cx + w / 2 - 3} ${yb - 3} Z`} fill={solid.color} stroke="#4b5563" strokeOpacity="0.35" strokeWidth="0.5" opacity={0.95} />;
    }
  }
}

export function TestTube({ cx, y, w = 26, h = 140, spec, t, seed = 1 }: { cx: number; y: number; w?: number; h?: number; spec: TubeView; t: number; seed?: number }) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const r = w / 2;
  const yb = y + h;
  const inset = 1.6;
  const xi0 = x0 + inset;
  const xi1 = x1 - inset;
  const ri = r - inset;
  const ybi = yb - inset;
  const inner = h - 8;
  const level = spec.liquid ? clampN(spec.level ?? 0.45, 0, 0.95) : 0;
  const yl = ybi - level * inner;
  const pptTop = ybi - clampN(spec.ppt ?? 0, 0, 0.9) * inner;
  const oilH = clampN(spec.oil ?? 0, 0, 0.3) * inner;
  const fumes = clampN(spec.fumes ?? 0, 0, 1);
  const balloon = clampN(spec.balloon ?? 0, 0, 1);
  const outline = tubeOutline(x0, x1, y, yb, r);
  const liquidD = level > 0 ? uFill(xi0, xi1, ybi, ri, yl) : '';
  const solidTop = spec.solid ? (spec.solid.kind === 'nail' ? y + 34 : spec.solid.kind === 'strip' ? Math.min(yl - 12, y + 26) : yl) : yl;
  return (
    <g>
      {spec.active && <ellipse cx={cx} cy={y + h * 0.55} rx={w * 1.25} ry={h * 0.62} fill="url(#cx-halo)" />}
      {spec.warm && <ellipse cx={cx} cy={yb + 2} rx={w * 0.9} ry="9" fill="url(#cx-heat)" />}
      {/* contents */}
      {spec.drying && (
        <g>
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={cx + (rnd(seed + i) - 0.5) * (w - 8)} cy={ybi - 3 - rnd(seed + i * 2) * 9} r={2 + rnd(seed + i * 3) * 1.4} fill="#f4f6f8" stroke="#aeb8c2" strokeWidth="0.5" />
          ))}
          <rect x={xi0 + 1} y={ybi - 18} width={xi1 - xi0 - 2} height="5" rx="2.5" fill="#fbfbfb" stroke="#d3d9df" strokeWidth="0.5" />
        </g>
      )}
      {fumes > 0 && <rect x={xi0} y={y + 3} width={xi1 - xi0} height={Math.max(0, (level > 0 ? yl - oilH : ybi - 4) - y - 3)} fill={spec.fumeColor ?? '#ffffff'} opacity={fumes * 0.7} />}
      {spec.solid && <SolidInTube solid={spec.solid} cx={cx} yb={ybi} w={w} top={solidTop} seed={seed} surface={level > 0 ? yl : ybi} />}
      {liquidD && (
        <g>
          <path d={liquidD} fill={spec.liquid} opacity={clampN(liquidAlpha(spec.liquid, spec.opacity), 0.1, 1)} />
          {(spec.cloud ?? 0) > 0.01 && <path d={liquidD} fill={spec.cloudColor ?? '#ffffff'} opacity={clampN((spec.cloud ?? 0) * 1.1, 0, 1)} />}
          <path d={liquidD} fill="url(#cx-shade)" />
          <line x1={xi0 + 0.5} x2={xi1 - 0.5} y1={yl} y2={yl} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1" />
        </g>
      )}
      {(spec.ppt ?? 0) > 0.005 && <path d={uFill(xi0, xi1, ybi, ri, pptTop)} fill={spec.pptColor ?? '#ffffff'} stroke="#000000" strokeOpacity="0.08" strokeWidth="0.5" />}
      {oilH > 0 && level > 0 && <rect x={xi0} y={yl - oilH} width={xi1 - xi0} height={oilH} fill="#f0cf6e" opacity="0.85" />}
      {(spec.crystals ?? 0) > 0 && level > 0 && (
        <g>
          {Array.from({ length: Math.round(4 + (spec.crystals ?? 0) * 16) }, (_, i) => {
            const fall = frac(rnd(seed + i) + t * (0.05 + rnd(seed + i * 7) * 0.05));
            const gx = xi0 + 2 + rnd(seed + i * 3) * (xi1 - xi0 - 4);
            const gy = yl + 3 + fall * (ybi - yl - 6);
            const tw = 0.55 + 0.45 * Math.sin(t * 4 + i * 1.7);
            return <path key={i} d={`M ${gx} ${gy - 2.2} L ${gx + 1.6} ${gy} L ${gx} ${gy + 2.2} L ${gx - 1.6} ${gy} Z`} fill={spec.crystalColor ?? '#f6c81f'} opacity={tw} />;
          })}
        </g>
      )}
      {(spec.bubbles ?? 0) > 0 && level > 0 && <Bubbles x0={xi0} x1={xi1} yTop={yl + 1} yBottom={ybi - 2} rate={spec.bubbles ?? 0} t={t} seed={seed} max={12} />}
      {/* glass */}
      <GlassSkin d={outline} x={x0 + 4} y={y + 6} h={h - 18} />
      <ellipse cx={cx} cy={y} rx={r + 1.5} ry="2.2" fill="none" stroke={C.glass} strokeWidth="1.4" />
      {spec.plug === 'cork' && <path d={`M ${x0 - 1.5} ${y - 7} L ${x1 + 1.5} ${y - 7} L ${x1 - 1} ${y + 6} L ${x0 + 1} ${y + 6} Z`} fill="#b07a45" stroke="#7a5228" strokeWidth="0.8" />}
      {spec.plug === 'cotton' && <ellipse cx={cx} cy={y - 1} rx={r + 2} ry="6" fill="#fbfbfb" stroke="#d6dde3" strokeWidth="0.8" />}
      {fumes > 0.45 && !spec.plug && <Fumes cx={cx} y={y - 2} w={w} h={34} color={spec.fumeColor ?? '#ffffff'} amount={(fumes - 0.3) * 0.9} t={t} seed={seed} />}
      {spec.mouth && spec.mouth.amount > 0.02 && <Fumes cx={cx} y={y - 2} w={w * 0.9} h={38} color={spec.mouth.color} amount={spec.mouth.amount} t={t} seed={seed + 5} />}
      {balloon > 0.005 && (
        <g>
          <rect x={cx - r - 1} y={y - 6} width={w + 2} height="8" rx="2" fill="#d6453a" />
          <ellipse cx={cx} cy={y - 8 - (6 + 22 * balloon)} rx={6 + 15 * balloon} ry={6 + 22 * balloon} fill="#e2523f" opacity="0.92" stroke="#b33a2c" strokeWidth="0.8" />
          <ellipse cx={cx - (2 + 5 * balloon)} cy={y - 10 - (10 + 30 * balloon)} rx={1.5 + 3 * balloon} ry={2 + 5 * balloon} fill="#ffffff" opacity="0.35" />
        </g>
      )}
      {spec.mark && <Mark x={x1 + 4} y={y + 10} good={spec.mark === 'good'} />}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Beaker                                                               */
/* ------------------------------------------------------------------ */

export function Beaker({
  cx,
  yb,
  w,
  h,
  liquid,
  level,
  opacity,
  cloud = 0,
  cloudColor = '#ffffff',
  bubbles = 0,
  t = 0,
  seed = 3,
  marks = true,
  children
}: {
  cx: number;
  yb: number;
  w: number;
  h: number;
  liquid?: string;
  level: number;
  opacity?: number;
  cloud?: number;
  cloudColor?: string;
  bubbles?: number;
  t?: number;
  seed?: number;
  marks?: boolean;
  children?: React.ReactNode;
}) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y = yb - h;
  const lv = clampN(level, 0, 0.95);
  const yl = yb - 3 - lv * (h - 10);
  const d = `M ${x0 - 4} ${y} Q ${x0} ${y} ${x0} ${y + 6} L ${x0} ${yb - 5} Q ${x0} ${yb} ${x0 + 5} ${yb} L ${x1 - 5} ${yb} Q ${x1} ${yb} ${x1} ${yb - 5} L ${x1} ${y + 2} L ${x1 + 1} ${y}`;
  const liquidD = `M ${x0 + 1.5} ${yl} L ${x0 + 1.5} ${yb - 5} Q ${x0 + 1.5} ${yb - 1.5} ${x0 + 5} ${yb - 1.5} L ${x1 - 5} ${yb - 1.5} Q ${x1 - 1.5} ${yb - 1.5} ${x1 - 1.5} ${yb - 5} L ${x1 - 1.5} ${yl} Z`;
  return (
    <g>
      {children}
      {liquid && lv > 0 && (
        <g>
          <path d={liquidD} fill={liquid} opacity={liquidAlpha(liquid, opacity)} />
          {cloud > 0.01 && <path d={liquidD} fill={cloudColor} opacity={clampN(cloud, 0, 1) * 0.85} />}
          <path d={liquidD} fill="url(#cx-shade)" />
          <ellipse cx={cx} cy={yl} rx={w / 2 - 1.5} ry="2" fill="#ffffff" opacity="0.35" />
          {bubbles > 0 && <Bubbles x0={x0 + 3} x1={x1 - 3} yTop={yl + 2} yBottom={yb - 3} rate={bubbles} t={t} seed={seed} max={18} />}
        </g>
      )}
      <GlassSkin d={d} x={x0 + 5} y={y + 8} h={h - 16} />
      {marks &&
        [0.25, 0.5, 0.75].map((f) => <line key={f} x1={x1 - 10} x2={x1 - 3} y1={yb - 3 - f * (h - 10)} y2={yb - 3 - f * (h - 10)} stroke={C.glassDark} strokeOpacity="0.6" strokeWidth="0.9" />)}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Conical flask                                                        */
/* ------------------------------------------------------------------ */

export function ConicalFlask({
  cx,
  yb,
  w,
  h,
  liquid,
  level,
  opacity,
  cloud = 0,
  cloudColor = '#ffffff',
  bubbles = 0,
  t = 0,
  seed = 5,
  neck = 0.3,
  solid
}: {
  cx: number;
  yb: number;
  w: number;
  h: number;
  liquid?: string;
  level: number;
  opacity?: number;
  cloud?: number;
  cloudColor?: string;
  bubbles?: number;
  t?: number;
  seed?: number;
  neck?: number;
  solid?: React.ReactNode;
}) {
  const nw = w * neck;
  const nh = h * 0.32;
  const y = yb - h;
  const yShoulder = y + nh;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const hw = (yy: number) => nw / 2 + ((w / 2 - nw / 2) * (yy - yShoulder)) / (yb - yShoulder);
  const lv = clampN(level, 0, 1);
  const yl = yb - 2 - lv * (yb - yShoulder - 4);
  const d = `M ${cx - nw / 2 - 2} ${y} L ${cx - nw / 2} ${y + 2} L ${cx - nw / 2} ${yShoulder} L ${x0} ${yb - 5} Q ${x0 - 0.5} ${yb} ${x0 + 5} ${yb} L ${x1 - 5} ${yb} Q ${x1 + 0.5} ${yb} ${x1} ${yb - 5} L ${cx + nw / 2} ${yShoulder} L ${cx + nw / 2} ${y + 2} L ${cx + nw / 2 + 2} ${y}`;
  const liquidD = `M ${cx - hw(yl) + 1.5} ${yl} L ${x0 + 2.5} ${yb - 4} Q ${x0 + 2.5} ${yb - 1.5} ${x0 + 6} ${yb - 1.5} L ${x1 - 6} ${yb - 1.5} Q ${x1 - 2.5} ${yb - 1.5} ${x1 - 2.5} ${yb - 4} L ${cx + hw(yl) - 1.5} ${yl} Z`;
  return (
    <g>
      {solid}
      {liquid && lv > 0 && (
        <g>
          <path d={liquidD} fill={liquid} opacity={liquidAlpha(liquid, opacity)} />
          {cloud > 0.01 && <path d={liquidD} fill={cloudColor} opacity={clampN(cloud, 0, 1) * 0.85} />}
          <path d={liquidD} fill="url(#cx-shade)" />
          <ellipse cx={cx} cy={yl} rx={Math.max(2, hw(yl) - 2)} ry="1.8" fill="#ffffff" opacity="0.35" />
          {bubbles > 0 && <Bubbles x0={cx - hw(yl) * 0.8} x1={cx + hw(yl) * 0.8} yTop={yl + 2} yBottom={yb - 3} rate={bubbles} t={t} seed={seed} max={16} />}
        </g>
      )}
      <GlassSkin d={d} x={cx - nw / 2 + 2.5} y={y + 4} h={nh} />
      <line x1={cx - hw(yShoulder + 10) + 4} y1={yShoulder + 12} x2={x0 + 7} y2={yb - 10} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Burette                                                              */
/* ------------------------------------------------------------------ */

export function Burette({ cx, y, h, reading, max = 50, color, label, dark = false, t, dripping = false, dropColor }: { cx: number; y: number; h: number; reading: number; max?: number; color: string; label?: string; dark?: boolean; t: number; dripping?: boolean; dropColor?: string }) {
  const w = 12;
  const scaleTop = y + 12;
  const scaleBottom = y + h - 44;
  const yOf = (v: number) => scaleTop + (clampN(v, 0, max) / max) * (scaleBottom - scaleTop);
  const ym = yOf(reading);
  const tapY = y + h - 30;
  const ticks: React.ReactNode[] = [];
  for (let v = 0; v <= max; v += 1) {
    const yy = yOf(v);
    const major = v % 5 === 0;
    ticks.push(<line key={v} x1={cx - w / 2} x2={cx - w / 2 + (major ? 5 : 3)} y1={yy} y2={yy} stroke={C.ink} strokeOpacity="0.6" strokeWidth={major ? 0.9 : 0.6} />);
    if (v % 10 === 0)
      ticks.push(
        <Txt key={`l${v}`} x={cx - w / 2 - 3} y={yy + 3} anchor="end" size={7} color={C.muted}>
          {v}
        </Txt>
      );
  }
  // magnified window around the meniscus
  const mx = cx + 30;
  const my = clampN(ym, y + 26, scaleBottom - 4);
  const zoomTicks: React.ReactNode[] = [];
  const base = Math.floor(reading * 10) / 10;
  for (let k = -6; k <= 6; k++) {
    const v = base + k * 0.1;
    if (v < 0 || v > max + 1e-9) continue;
    const yy = my + (v - reading) * 60;
    const major = Math.abs(v * 10 - Math.round(v) * 10) < 1e-6;
    zoomTicks.push(<line key={k} x1={mx - 16} x2={mx - 16 + (major ? 12 : 7)} y1={yy} y2={yy} stroke={C.ink} strokeWidth={major ? 1 : 0.6} />);
    if (major)
      zoomTicks.push(
        <Txt key={`z${k}`} x={mx + 2} y={yy + 3} anchor="start" size={7.5} color={C.ink} weight={800}>
          {fmt(v, 0)}
        </Txt>
      );
  }
  const clipId = `cx-bz-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <g>
      {/* liquid column */}
      <rect x={cx - w / 2 + 1.5} y={ym} width={w - 3} height={Math.max(0, tapY - ym)} fill={color} opacity={dark ? 0.92 : 0.6} />
      <path d={`M ${cx - w / 2 + 1.5} ${ym} Q ${cx} ${ym + 3.5} ${cx + w / 2 - 1.5} ${ym}`} fill="none" stroke={dark ? '#3b1458' : '#5f7f99'} strokeWidth="1.1" />
      <rect x={cx - w / 2} y={y} width={w} height={tapY - y} rx="2" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.2" />
      <line x1={cx - w / 2 + 2.5} x2={cx - w / 2 + 2.5} y1={y + 4} y2={tapY - 4} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.2" />
      {ticks}
      {/* stopcock & jet */}
      <rect x={cx - 3} y={tapY} width="6" height="12" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1" />
      <rect x={cx - 11} y={tapY + 3} width="22" height="6" rx="3" fill="#2e3a46" />
      <rect x={cx - 3} y={tapY + 1} width="6" height="10" rx="2" fill="#4a5866" />
      <path d={`M ${cx - 2.5} ${tapY + 12} L ${cx - 1} ${y + h} L ${cx + 1} ${y + h} L ${cx + 2.5} ${tapY + 12} Z`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="0.9" />
      {dripping && <FallingDropInline x={cx} y0={y + h + 2} y1={y + h + 40} color={dropColor ?? color} t={t} />}
      {/* zoom */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={mx} cy={my} r="19" />
        </clipPath>
      </defs>
      <line x1={cx + w / 2} y1={ym} x2={mx - 19} y2={my} stroke={C.muted} strokeWidth="0.8" strokeDasharray="2 2" />
      <circle cx={mx} cy={my} r="20" fill="#ffffff" stroke={C.glassDark} strokeWidth="1.4" filter="url(#cx-shadow)" />
      <g clipPath={`url(#${clipId})`}>
        <rect x={mx - 19} y={my} width="38" height="20" fill={color} opacity={dark ? 0.85 : 0.45} />
        <path d={`M ${mx - 19} ${my - 1} Q ${mx - 2} ${my + 7} ${mx + 19} ${my - 1}`} fill="none" stroke={dark ? '#3b1458' : '#33536d'} strokeWidth="1.6" />
        {zoomTicks}
      </g>
      <Txt x={mx} y={my + 31} size={8} color={C.ink} weight={800} mono>
        {fmt(reading, 2)} mL
      </Txt>
      {label && (
        <Txt x={cx} y={y - 5} size={8.5} color={C.ink} weight={800}>
          {label}
        </Txt>
      )}
    </g>
  );
}

function FallingDropInline({ x, y0, y1, color, t }: { x: number; y0: number; y1: number; color: string; t: number }) {
  const p = frac(t * 1.6);
  const yy = y0 + p * p * (y1 - y0);
  return <path d={`M ${x} ${yy - 3} q 2.3 3 0 5.2 q -2.3 -2.2 0 -5.2 z`} fill={color} stroke={C.glass} strokeWidth="0.5" />;
}

/* ------------------------------------------------------------------ */
/* Gas collection                                                       */
/* ------------------------------------------------------------------ */

/** Horizontal gas syringe; the plunger is pushed out by the gas volume. */
export function GasSyringe({ x, y, len = 190, volume, max = 100, gasColor }: { x: number; y: number; len?: number; volume: number; max?: number; gasColor?: string }) {
  const hgt = 18;
  const f = clampN(volume / max, 0, 1);
  const px = x + 8 + f * (len - 16);
  const ticks: React.ReactNode[] = [];
  for (let v = 0; v <= max; v += 5) {
    const xx = x + 8 + (v / max) * (len - 16);
    const major = v % 10 === 0;
    ticks.push(<line key={v} x1={xx} x2={xx} y1={y - hgt / 2} y2={y - hgt / 2 + (major ? 5 : 3)} stroke={C.ink} strokeOpacity="0.65" strokeWidth={major ? 0.9 : 0.6} />);
    if (v % 20 === 0)
      ticks.push(
        <Txt key={`l${v}`} x={xx} y={y - hgt / 2 - 3} size={7} color={C.muted}>
          {v}
        </Txt>
      );
  }
  return (
    <g>
      {gasColor && f > 0 && <rect x={x + 6} y={y - hgt / 2 + 2} width={px - x - 6} height={hgt - 4} fill={gasColor} opacity="0.55" />}
      <rect x={x} y={y - hgt / 2} width={len} height={hgt} rx="3" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      <line x1={x + 4} x2={x + len - 4} y1={y - hgt / 2 + 3} y2={y - hgt / 2 + 3} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.2" />
      {ticks}
      {/* plunger: seal inside the barrel, rod and handle sticking out of the open end */}
      <rect x={px - 2} y={y - hgt / 2 + 1.5} width="5" height={hgt - 3} rx="1" fill="#3b4856" />
      <rect x={px + 3} y={y - 2.5} width={len - 2} height="5" fill="url(#cx-metal)" stroke="#6b7785" strokeWidth="0.5" />
      <rect x={px + len + 1} y={y - 9} width="5" height="18" rx="1.5" fill="#3b4856" />
      <Txt x={x + len / 2} y={y + hgt / 2 + 11} size={8.5} color={C.ink} weight={800} mono>
        {fmt(volume, 1)} mL
      </Txt>
    </g>
  );
}

/** Measuring cylinder standing upside down in a trough: gas collects at the top. */
export function InvertedCylinder({ cx, y, h, w = 30, volume, max = 100, gasColor }: { cx: number; y: number; h: number; w?: number; volume: number; max?: number; gasColor?: string }) {
  const x0 = cx - w / 2;
  const top = y + 4;
  const scaleH = h - 18;
  const f = clampN(volume / max, 0, 1);
  const gasBottom = top + f * scaleH;
  const ticks: React.ReactNode[] = [];
  const step = max > 150 ? 25 : 10;
  for (let v = 0; v <= max; v += step) {
    const yy = top + (v / max) * scaleH;
    ticks.push(<line key={v} x1={x0 + w - 9} x2={x0 + w - 2} y1={yy} y2={yy} stroke={C.ink} strokeOpacity="0.6" strokeWidth="0.8" />);
    if (v % (step * 2) === 0)
      ticks.push(
        <Txt key={`l${v}`} x={x0 + w - 11} y={yy + 3} anchor="end" size={6.5} color={C.muted}>
          {v}
        </Txt>
      );
  }
  return (
    <g>
      <rect x={x0 + 1.5} y={top} width={w - 3} height={h - 4} fill="#bfe1f7" opacity="0.65" />
      {f > 0 && <rect x={x0 + 1.5} y={top} width={w - 3} height={gasBottom - top} fill={gasColor ?? '#f4fbff'} opacity="0.95" />}
      {f > 0 && <path d={`M ${x0 + 1.5} ${gasBottom} Q ${cx} ${gasBottom - 4} ${x0 + w - 1.5} ${gasBottom}`} fill="none" stroke="#6d93b0" strokeWidth="1" />}
      <path d={`M ${x0} ${y + h} L ${x0} ${y + 4} Q ${x0} ${y} ${x0 + 4} ${y} L ${x0 + w - 4} ${y} Q ${x0 + w} ${y} ${x0 + w} ${y + 4} L ${x0 + w} ${y + h}`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      <line x1={x0 + 4} x2={x0 + 4} y1={y + 6} y2={y + h - 6} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.4" />
      {ticks}
    </g>
  );
}

/** Glass trough of water. */
export function Trough({ x0, x1, y, h }: { x0: number; x1: number; y: number; h: number }) {
  return (
    <g>
      <rect x={x0 + 2} y={y + 10} width={x1 - x0 - 4} height={h - 12} fill="#9fd0f0" opacity="0.5" />
      <rect x={x0 + 2} y={y + 10} width={x1 - x0 - 4} height="3" fill="#ffffff" opacity="0.5" />
      <path d={`M ${x0} ${y} L ${x0} ${y + h - 4} Q ${x0} ${y + h} ${x0 + 4} ${y + h} L ${x1 - 4} ${y + h} Q ${x1} ${y + h} ${x1} ${y + h - 4} L ${x1} ${y}`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.5" />
    </g>
  );
}

/** Gas jar with a ground-glass cover slip. */
export function GasJar({ cx, yb, w = 56, h = 110, gas, fill = 1, cover = true, label }: { cx: number; yb: number; w?: number; h?: number; gas?: string; fill?: number; cover?: boolean; label?: string }) {
  const x0 = cx - w / 2;
  const y = yb - h;
  const f = clampN(fill, 0, 1);
  return (
    <g>
      {gas && f > 0 && <rect x={x0 + 2} y={yb - 2 - f * (h - 6)} width={w - 4} height={f * (h - 6)} fill={gas} opacity="0.6" />}
      <path d={`M ${x0} ${y + 2} L ${x0} ${yb - 4} Q ${x0} ${yb} ${x0 + 4} ${yb} L ${x0 + w - 4} ${yb} Q ${x0 + w} ${yb} ${x0 + w} ${yb - 4} L ${x0 + w} ${y + 2}`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.5" />
      <line x1={x0 + 5} x2={x0 + 5} y1={y + 8} y2={yb - 8} stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.6" />
      <rect x={x0 - 3} y={y - 1} width={w + 6} height="4" rx="1.5" fill="#dfeaf2" stroke={C.glass} strokeWidth="0.8" />
      {cover && <rect x={x0 - 6} y={y - 5} width={w + 12} height="4" rx="1" fill="#e9f3fa" stroke={C.glassDark} strokeWidth="0.8" opacity="0.95" />}
      {label && (
        <Txt x={cx} y={yb + 14} size={10} color={C.ink} weight={800}>
          {label}
        </Txt>
      )}
    </g>
  );
}

/** Glass delivery tube along a path. */
export function DeliveryTube({ d }: { d: string }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path d={d} fill="none" stroke="#9cbdd5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#eef7fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

/** Rubber bung. */
export function Bung({ cx, y, w = 22 }: { cx: number; y: number; w?: number }) {
  return <path d={`M ${cx - w / 2} ${y} L ${cx + w / 2} ${y} L ${cx + w / 2 - 3} ${y + 12} L ${cx - w / 2 + 3} ${y + 12} Z`} fill="#3d3a3a" stroke="#1f1d1d" strokeWidth="0.8" />;
}

/** Thistle funnel (long stem down into the flask). */
export function ThistleFunnel({ cx, y, len }: { cx: number; y: number; len: number }) {
  return (
    <g>
      <path d={`M ${cx - 13} ${y} Q ${cx - 14} ${y + 16} ${cx - 2} ${y + 22} L ${cx - 2} ${y + len} L ${cx + 2} ${y + len} L ${cx + 2} ${y + 22} Q ${cx + 14} ${y + 16} ${cx + 13} ${y}`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      <ellipse cx={cx} cy={y} rx="13" ry="3" fill="none" stroke={C.glass} strokeWidth="1.2" />
    </g>
  );
}

/** Dropping (tap) funnel with liquid. */
export function DroppingFunnel({ cx, y, level, color, label }: { cx: number; y: number; level: number; color: string; label?: string }) {
  const lv = clampN(level, 0, 1);
  const yl = y + 40 - lv * 30;
  return (
    <g>
      {lv > 0.02 && <path d={`M ${cx - 14 + (yl - y - 10) * 0.25} ${yl} L ${cx - 4} ${y + 44} L ${cx + 4} ${y + 44} L ${cx + 14 - (yl - y - 10) * 0.25} ${yl} Z`} fill={color} opacity="0.75" />}
      <path d={`M ${cx - 7} ${y} L ${cx - 16} ${y + 12} Q ${cx - 18} ${y + 22} ${cx - 4} ${y + 44} L ${cx - 2} ${y + 58} L ${cx + 2} ${y + 58} L ${cx + 4} ${y + 44} Q ${cx + 18} ${y + 22} ${cx + 16} ${y + 12} L ${cx + 7} ${y}`} fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      <rect x={cx - 9} y={y + 47} width="18" height="5" rx="2.5" fill="#2e3a46" />
      <rect x={cx - 5} y={y - 6} width="10" height="7" rx="1.5" fill="#3d3a3a" />
      {label && (
        <Txt x={cx + 22} y={y + 24} anchor="start" size={8} color={C.ink} weight={800}>
          {label}
        </Txt>
      )}
    </g>
  );
}
