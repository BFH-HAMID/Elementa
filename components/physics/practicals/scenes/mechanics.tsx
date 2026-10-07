'use client';

import React, { useRef } from 'react';
import { katerPeriods } from '@/engine/practicals/mechanics';
import { C, Digital, Grip, Ruler, SceneFrame, Stand, Txt, Wire, fmt, num, useSvgDrag, type SceneProps } from '../primitives';

const DEG = Math.PI / 180;

function stopwatch(t: number) {
  const s = t % 100;
  return `${s.toFixed(1).padStart(4, '0')} s`;
}

/* ------------------------------------------------------------------ */
/* Pendulums                                                            */
/* ------------------------------------------------------------------ */

export function PendulumScene(props: SceneProps) {
  if (props.model.variant === 'compound') return <CompoundPendulum {...props} />;
  if (props.model.variant === 'kater') return <KaterPendulum {...props} />;
  return <SimplePendulum {...props} />;
}

function Clamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 120} y={y - 14} width={240} height={10} rx={3} fill="url(#pr-metal)" />
      <rect x={x - 14} y={y - 8} width={28} height={12} rx={2} fill={C.steelDark} />
    </g>
  );
}

function SimplePendulum({ view, t, bn }: SceneProps) {
  const L = num(view, 'L');
  const amp = num(view, 'amp');
  const T = num(view, 'T', 1);
  const scale = 190;
  const px = 320;
  const py = 34;
  const th = amp * DEG * Math.cos((2 * Math.PI * t) / T);
  const bx = px + Math.sin(th) * L * scale;
  const by = py + Math.cos(th) * L * scale;
  const osc = Math.floor(t / T) % 20;
  return (
    <SceneFrame label="Simple pendulum">
      <Clamp x={px} y={py} />
      <path d={`M ${px - Math.sin(amp * DEG) * 70} ${py + Math.cos(amp * DEG) * 70} A 70 70 0 0 0 ${px + Math.sin(amp * DEG) * 70} ${py + Math.cos(amp * DEG) * 70}`} fill="none" stroke={C.amber} strokeWidth={2} />
      <line x1={px} y1={py} x2={px} y2={py + L * scale + 20} stroke={C.muted} strokeDasharray="3 4" />
      <line x1={px} y1={py} x2={bx} y2={by} stroke={C.ink} strokeWidth={1.4} />
      <circle cx={bx} cy={by} r={12} fill="url(#pr-metal)" stroke={C.steelDark} />
      {/* length marker */}
      <line x1={px - 150} y1={py} x2={px - 150} y2={py + L * scale} stroke={C.blue} strokeWidth={1.5} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={px - 158} y={py + (L * scale) / 2} size={11} color={C.blue} anchor="end">L = {fmt(L, 2)} m</Txt>
      <Txt x={px + 80} y={py + 82} size={10} color={C.amber} anchor="start">θ = {amp}°</Txt>
      <Digital x={480} y={60} w={110} text={stopwatch(t % (20 * T))} label={bn ? 'স্টপওয়াচ' : 'Stopwatch'} />
      <Digital x={480} y={120} w={110} text={`${osc} / 20`} label={bn ? 'দোলন গণনা' : 'Oscillations'} />
      <Txt x={535} y={180} size={10}>T = {fmt(T, 3)} s</Txt>
    </SceneFrame>
  );
}

function CompoundPendulum({ view, t, bn }: SceneProps) {
  const d = num(view, 'd');
  const T = num(view, 'T', 1.6);
  const s = 260;
  const px = 300;
  const top = -(0.5 - d) * s;
  // keep the whole 1 m bar in view: pivot moves down when it is near the centre
  const py = 40 - top;
  const th = 5 * DEG * Math.cos((2 * Math.PI * t) / T);
  return (
    <SceneFrame label="Compound bar pendulum">
      <Clamp x={px} y={py} />
      <g transform={`translate(${px} ${py}) rotate(${(th * 180) / Math.PI})`}>
        <rect x={-12} y={top} width={24} height={s} rx={4} fill="url(#pr-wood)" stroke={C.woodDark} />
        {Array.from({ length: 19 }).map((_, i) => {
          const pos = -0.45 + i * 0.05; // from centre (m), positive downward
          const y = (pos + d) * s;
          return <circle key={i} cx={0} cy={y} r={3} fill={Math.abs(pos + d) < 1e-6 ? C.ink : C.surface} stroke={C.woodDark} strokeWidth={0.8} />;
        })}
        <circle cx={0} cy={d * s} r={6} fill="none" stroke={C.red} strokeWidth={2} />
        <path d="M -6 0 L 6 0 L 0 -8 Z" fill={C.ink} />
      </g>
      <Txt x={px + 30} y={py + d * s + 4} size={10} color={C.red} anchor="start">CG</Txt>
      <line x1={px - 60} y1={py} x2={px - 60} y2={py + d * s} stroke={C.blue} strokeWidth={1.5} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={px - 66} y={py + (d * s) / 2 + 4} size={11} color={C.blue} anchor="end">d = {fmt(d, 2)} m</Txt>
      <Digital x={470} y={70} w={120} text={stopwatch(t % (20 * T))} label={bn ? 'স্টপওয়াচ' : 'Stopwatch'} />
      <Digital x={470} y={130} w={120} text={`${Math.floor(t / T) % 20} / 20`} label={bn ? 'দোলন গণনা' : 'Oscillations'} />
      <Txt x={530} y={190} size={10}>T = {fmt(T, 3)} s</Txt>
      <Txt x={530} y={210} size={10}>{bn ? 'দণ্ড: ১ মিটার' : 'Bar: 1 m'}</Txt>
    </SceneFrame>
  );
}

function KaterPendulum({ view, t, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const pos = num(view, 'pos') / 100;
  const edge = num(view, 'edge');
  const TA = num(view, 'TA', 2);
  const TB = num(view, 'TB', 2);
  const T = edge === 0 ? TA : TB;
  const s = 228;
  const px = 280;
  const py = 46;
  const yOf = (yr: number) => (edge === 0 ? (yr - 0.1) * s : (1.094 - yr) * s);
  const th = 3 * DEG * Math.cos((2 * Math.PI * t) / T);
  const close = Math.abs(TA - TB) < 0.0015;
  const { cg } = katerPeriods(pos);
  return (
    <SceneFrame ref={ref} label="Kater's reversible pendulum">
      <Clamp x={px} y={py} />
      <g transform={`translate(${px} ${py}) rotate(${(th * 180) / Math.PI})`}>
        <rect x={-6} y={Math.min(yOf(0), yOf(1.2))} width={12} height={1.2 * s} rx={3} fill="url(#pr-metal)" stroke={C.steelDark} />
        {/* knife edges */}
        <path d={`M -16 ${yOf(0.1)} L 16 ${yOf(0.1)} L 0 ${yOf(0.1) + (edge === 0 ? -9 : 9)} Z`} fill={C.ink} />
        <path d={`M -16 ${yOf(1.094)} L 16 ${yOf(1.094)} L 0 ${yOf(1.094) + (edge === 0 ? -9 : 9)} Z`} fill={C.ink} />
        {/* fixed heavy bob */}
        <rect x={-24} y={yOf(1.17) - 12} width={48} height={24} rx={6} fill={C.steelDark} />
        {/* movable mass */}
        <rect x={-18} y={yOf(pos) - 9} width={36} height={18} rx={5} fill={close ? C.green : C.blue} />
        <circle cx={0} cy={yOf(cg)} r={4} fill="none" stroke={C.red} strokeWidth={1.5} />
      </g>
      <Txt x={px + 22} y={py + yOf(0.1) + 4} size={11} color={C.ink} weight={900} anchor="start">A</Txt>
      <Txt x={px + 22} y={py + yOf(1.094) + 4} size={11} color={C.ink} weight={900} anchor="start">B</Txt>
      <rect x={px - 30} y={py + yOf(pos) - 16} width={60} height={32} fill="transparent" {...drag((pt, st) => {
        const dyr = (pt.y - st.y) / s;
        const yr = edge === 0 ? pos + dyr : pos - dyr;
        setParam('pos', Math.round(yr * 1000) / 10);
      })} />
      <Grip x={px} y={py + yOf(pos)} color={close ? C.green : C.blue} />
      <Txt x={px - 40} y={py + yOf(pos) + 4} size={10} color={C.blue} anchor="end">{fmt(pos * 100, 1)} cm</Txt>
      <line x1={px + 70} y1={py + yOf(0.1)} x2={px + 70} y2={py + yOf(1.094)} stroke={C.muted} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.muted} />
      <Txt x={px + 78} y={py + (yOf(0.1) + yOf(1.094)) / 2} size={10} anchor="start">l = 0.994 m</Txt>
      <Digital x={450} y={70} w={140} text={`TA ${fmt(TA, 4)} s`} label={bn ? 'ধার A' : 'Edge A'} good={close} />
      <Digital x={450} y={130} w={140} text={`TB ${fmt(TB, 4)} s`} label={bn ? 'ধার B' : 'Edge B'} good={close} />
      {/* TA vs TB mini plot */}
      <rect x={440} y={180} width={160} height={120} rx={8} fill={C.surface} stroke={C.line} />
      {(() => {
        const pa: string[] = [];
        const pb: string[] = [];
        for (let p = 0.6; p <= 1.06; p += 0.01) {
          const r = katerPeriods(p);
          const x = 450 + ((p - 0.6) / 0.46) * 140;
          pa.push(`${pa.length ? 'L' : 'M'} ${x} ${290 - (r.TA - 1.88) * 600}`);
          pb.push(`${pb.length ? 'L' : 'M'} ${x} ${290 - (r.TB - 1.88) * 600}`);
        }
        const mx = 450 + ((pos - 0.6) / 0.46) * 140;
        return (
          <g>
            <path d={pa.join(' ')} fill="none" stroke={C.blue} strokeWidth={1.6} />
            <path d={pb.join(' ')} fill="none" stroke={C.violet} strokeWidth={1.6} />
            <line x1={mx} x2={mx} y1={186} y2={296} stroke={C.red} strokeDasharray="3 3" />
            <Txt x={520} y={196} size={9}>TA (blue) / TB (violet)</Txt>
          </g>
        );
      })()}
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Spring                                                               */
/* ------------------------------------------------------------------ */

export function SpringScene({ view, bn }: SceneProps) {
  const m = num(view, 'm');
  const x = num(view, 'x');
  const el = num(view, 'elapsed');
  const pxPerCm = 6.5;
  const wobble = 0.012 * Math.exp(-el * 2.2) * Math.cos(el * 16);
  const ext = (x + wobble) * 100 * pxPerCm;
  const top = 46;
  const natural = 90;
  const end = top + natural + ext;
  const coils = 14;
  let d = `M 220 ${top}`;
  const seg = (end - top - 20) / coils;
  d += ` L 220 ${top + 10}`;
  for (let i = 0; i < coils; i++) d += ` L ${i % 2 === 0 ? 236 : 204} ${top + 10 + seg * (i + 0.5)}`;
  d += ` L 220 ${end - 10} L 220 ${end}`;
  const discs = Math.round(m / 0.05);
  return (
    <SceneFrame label="Spring with hanging masses">
      <Stand x={120} base={330} top={30} />
      <rect x={110} y={34} width={130} height={10} rx={3} fill="url(#pr-metal)" />
      <path d={d} fill="none" stroke={C.steelDark} strokeWidth={2.4} strokeLinejoin="round" />
      {/* pointer */}
      <line x1={220} y1={end} x2={300} y2={end} stroke={C.red} strokeWidth={1.6} />
      {/* hanger + discs */}
      <line x1={220} y1={end} x2={220} y2={end + 12} stroke={C.ink} strokeWidth={2} />
      {Array.from({ length: discs }).map((_, i) => (
        <rect key={i} x={196} y={end + 12 + i * 7} width={48} height={6} rx={2} fill={i % 2 ? '#b45309' : '#d97706'} />
      ))}
      <Txt x={268} y={end + 22 + discs * 3} size={10} color={C.ink} anchor="start">{fmt(m * 1000, 0)} g</Txt>
      {/* vertical scale */}
      <g>
        <rect x={300} y={top + natural - 6} width={34} height={22 * pxPerCm + 12} rx={3} fill="#fef3c7" stroke={C.woodDark} strokeWidth={0.8} />
        {Array.from({ length: 23 }).map((_, i) => (
          <g key={i}>
            <line x1={300} x2={300 + (i % 5 === 0 ? 14 : 8)} y1={top + natural + i * pxPerCm} y2={top + natural + i * pxPerCm} stroke={C.ink} strokeWidth={i % 5 === 0 ? 1 : 0.6} />
            {i % 5 === 0 && <Txt x={326} y={top + natural + i * pxPerCm + 3} size={8.5}>{i}</Txt>}
          </g>
        ))}
        <Txt x={317} y={top + natural - 12} size={9}>cm</Txt>
      </g>
      <Digital x={430} y={90} w={150} text={`x = ${fmt(x * 100, 2)} cm`} label={bn ? 'প্রসারণ' : 'Extension'} good={el > 1.6} />
      <Digital x={430} y={160} w={150} text={`F = ${fmt(m * 9.80665, 3)} N`} label={bn ? 'বল (mg)' : 'Load (mg)'} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Inclined plane                                                       */
/* ------------------------------------------------------------------ */

export function InclineScene({ view, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const angle = num(view, 'angle');
  const sliding = num(view, 'sliding') === 1;
  const accel = num(view, 'accel');
  const el = num(view, 'elapsed');
  const ox = 90;
  const oy = 310;
  const len = 440;
  const a = angle * DEG;
  const ex = ox + Math.cos(a) * len;
  const ey = oy - Math.sin(a) * len;
  const s0 = 330;
  const s = sliding ? Math.max(40, s0 - 0.5 * accel * el * el * 120) : s0;
  const bx = ox + Math.cos(a) * s;
  const by = oy - Math.sin(a) * s;
  return (
    <SceneFrame ref={ref} label="Inclined plane and block">
      <line x1={40} y1={oy + 8} x2={620} y2={oy + 8} stroke={C.muted} strokeWidth={2} />
      <path d={`M ${ox} ${oy} L ${ex} ${ey} L ${ex} ${oy} Z`} fill={C.soft} opacity={0.6} />
      <line x1={ox} y1={oy} x2={ex} y2={ey} stroke="url(#pr-wood)" strokeWidth={12} strokeLinecap="round" />
      <line x1={ex} y1={ey + 6} x2={ex} y2={oy + 8} stroke={C.steelDark} strokeWidth={4} />
      {/* protractor */}
      <path d={`M ${ox + 80} ${oy} A 80 80 0 0 0 ${ox + Math.cos(a) * 80} ${oy - Math.sin(a) * 80}`} fill="none" stroke={C.amber} strokeWidth={2} />
      <Txt x={ox + 96} y={oy - 10} size={12} color={C.amber} anchor="start" weight={800}>θ = {fmt(angle, 1)}°</Txt>
      {/* block */}
      <g transform={`translate(${bx} ${by}) rotate(${-angle})`}>
        <rect x={-28} y={-34} width={56} height={28} rx={4} fill={sliding ? C.red : C.blue} />
        {sliding && <path d="M -36 -20 l -18 0" stroke={C.red} strokeWidth={3} markerEnd="url(#pr-arrow)" color={C.red} />}
      </g>
      {/* drag handle at top end */}
      <circle cx={ex} cy={ey} r={18} fill="transparent" {...drag((pt) => {
        const ang = Math.atan2(oy - pt.y, pt.x - ox) / DEG;
        setParam('angle', Math.round(ang * 5) / 5);
      })} />
      <Grip x={ex} y={ey} />
      <Txt x={ex} y={ey - 18} size={9.5}>{bn ? 'টেনে কোণ বদলাও' : 'drag to tilt'}</Txt>
      <Digital x={450} y={40} w={150} text={`tan θ = ${Math.tan(a).toFixed(3)}`} label={bn ? 'স্পর্শক' : 'Tangent'} good={sliding} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Projectile                                                           */
/* ------------------------------------------------------------------ */

export function ProjectileScene({ view, t, bn }: SceneProps) {
  const v0 = num(view, 'v0');
  const angle = num(view, 'angle');
  const R = num(view, 'R');
  const Hh = num(view, 'H');
  const tf = num(view, 'tf', 1);
  const g = 9.80665;
  const sc = 23;
  const ox = 50;
  const oy = 300;
  const path: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const tt = (tf * i) / 40;
    const x = v0 * Math.cos(angle * DEG) * tt;
    const y = v0 * Math.sin(angle * DEG) * tt - 0.5 * g * tt * tt;
    path.push(`${i ? 'L' : 'M'} ${ox + x * sc} ${oy - y * sc}`);
  }
  const cyc = (t % (tf + 1)) ;
  const tt = Math.min(cyc, tf);
  const bx = ox + v0 * Math.cos(angle * DEG) * tt * sc;
  const by = oy - (v0 * Math.sin(angle * DEG) * tt - 0.5 * g * tt * tt) * sc;
  return (
    <SceneFrame label="Projectile launcher">
      <rect x={0} y={oy} width={640} height={60} fill="#86efac" opacity={0.25} />
      <line x1={0} y1={oy} x2={640} y2={oy} stroke={C.green} strokeWidth={2} />
      <Ruler x1={ox} x2={ox + 24 * sc} y={oy + 8} from={0} to={24} major={4} minor={1} unit="m" height={12} />
      <path d={path.join(' ')} fill="none" stroke={C.blue} strokeWidth={2} strokeDasharray="5 5" />
      <g transform={`translate(${ox} ${oy}) rotate(${-angle})`}>
        <rect x={-6} y={-8} width={44} height={16} rx={4} fill={C.steelDark} />
      </g>
      <circle cx={ox} cy={oy} r={10} fill={C.ink} />
      <circle cx={bx} cy={by} r={7} fill={C.red} />
      <line x1={ox + R * sc} y1={oy} x2={ox + R * sc} y2={oy - 30} stroke={C.red} strokeWidth={2} />
      <path d={`M ${ox + R * sc} ${oy - 30} l 16 6 l -16 6 z`} fill={C.red} />
      <Txt x={ox + R * sc} y={oy - 36} size={11} color={C.red} weight={800}>R = {fmt(R, 2)} m</Txt>
      <line x1={ox + (R / 2) * sc} y1={oy} x2={ox + (R / 2) * sc} y2={oy - Hh * sc} stroke={C.muted} strokeDasharray="3 3" />
      <Txt x={ox + (R / 2) * sc + 6} y={oy - Hh * sc - 6} size={10} anchor="start">H = {fmt(Hh, 2)} m</Txt>
      <Txt x={ox + 52} y={oy - 14} size={10.5} color={C.amber} anchor="start">θ = {angle}°</Txt>
      <Digital x={470} y={30} w={140} text={`v₀ = ${fmt(v0, 1)} m/s`} label={bn ? 'উৎক্ষেপণ বেগ' : 'Launch speed'} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Trolley (Newton II)                                                  */
/* ------------------------------------------------------------------ */

export function TrolleyScene({ view, t, bn }: SceneProps) {
  const a = num(view, 'a');
  const T1 = num(view, 't', 1);
  const m = num(view, 'm');
  const cyc = t % (T1 + 1.2);
  const tau = Math.min(cyc, T1);
  const dist = 0.5 * a * tau * tau; // m
  const sc = 380;
  const x0 = 90;
  const tx = x0 + dist * sc;
  const table = 200;
  const pulleyX = 560;
  return (
    <SceneFrame label="Trolley on a track pulled by a hanging mass">
      <rect x={30} y={table} width={540} height={14} fill="url(#pr-wood)" />
      <rect x={50} y={table + 14} width={14} height={120} fill={C.woodDark} />
      <rect x={536} y={table + 14} width={14} height={120} fill={C.woodDark} />
      <Ruler x1={x0} x2={x0 + sc} y={table + 20} from={0} to={1} major={0.2} minor={0.05} unit="m" height={12} />
      {/* light gates */}
      {[x0 + 40, x0 + sc + 40].map((gx, i) => (
        <g key={i}>
          <rect x={gx - 4} y={table - 60} width={8} height={60} fill={C.steelDark} />
          <circle cx={gx} cy={table - 30} r={3} fill={C.red} />
        </g>
      ))}
      {/* trolley */}
      <g transform={`translate(${tx} ${table})`}>
        <rect x={-10} y={-34} width={100} height={26} rx={5} fill={C.blue} />
        <circle cx={10} cy={-6} r={7} fill={C.ink} />
        <circle cx={70} cy={-6} r={7} fill={C.ink} />
        <Txt x={40} y={-17} size={9.5} color="#fff">M = 0.55 kg</Txt>
      </g>
      {/* string over pulley */}
      <Wire d={`M ${tx + 90} ${table - 22} L ${pulleyX} ${table - 22}`} color={C.muted} width={1.2} />
      <circle cx={pulleyX} cy={table - 8} r={14} fill="url(#pr-metal)" stroke={C.steelDark} />
      <Wire d={`M ${pulleyX + 14} ${table - 8} L ${pulleyX + 14} ${table + 30 + dist * sc * 0.25}`} color={C.muted} width={1.2} />
      <rect x={pulleyX} y={table + 30 + dist * sc * 0.25} width={28} height={10 + m * 200} rx={3} fill={C.amber} />
      <Txt x={pulleyX + 14} y={table + 56 + m * 200 + dist * sc * 0.25} size={10} color={C.ink}>{fmt(m * 1000, 0)} g</Txt>
      <Digital x={60} y={40} w={150} text={`${fmt(tau, 2)} s`} label={bn ? 'টাইমার (১ মি.)' : 'Timer (1 m run)'} good={cyc >= T1} />
      <Digital x={230} y={40} w={150} text={`a = ${fmt(a, 3)}`} label={bn ? 'ত্বরণ (m/s²)' : 'Acceleration (m/s²)'} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Atwood machine                                                       */
/* ------------------------------------------------------------------ */

export function AtwoodScene({ view, t, bn }: SceneProps) {
  const a = num(view, 'a');
  const T1 = num(view, 't', 0);
  const m1 = num(view, 'm1');
  const m2 = num(view, 'm2');
  const cyc = T1 > 0 ? t % (T1 + 1.2) : 0;
  const tau = Math.min(cyc, T1);
  const d = 0.5 * a * tau * tau * 200;
  const cx = 300;
  const r = 34;
  const y1 = 110 + d;
  const y2 = 310 - d;
  return (
    <SceneFrame label="Atwood machine">
      <rect x={cx - 6} y={10} width={12} height={40} fill="url(#pr-metal)" />
      <circle cx={cx} cy={56} r={r} fill="url(#pr-metal)" stroke={C.steelDark} />
      <circle cx={cx} cy={56} r={5} fill={C.ink} />
      <line x1={cx - r} y1={56} x2={cx - r} y2={y1} stroke={C.muted} strokeWidth={1.4} />
      <line x1={cx + r} y1={56} x2={cx + r} y2={y2} stroke={C.muted} strokeWidth={1.4} />
      <rect x={cx - r - 22} y={y1} width={44} height={20 + m1 / 12} rx={4} fill={C.blue} />
      <Txt x={cx - r} y={y1 + 14 + m1 / 24} size={10} color="#fff">m₁ {m1} g</Txt>
      <rect x={cx + r - 22} y={y2} width={44} height={20 + m2 / 12} rx={4} fill={C.violet} />
      <Txt x={cx + r} y={y2 + 14 + m2 / 24} size={10} color="#fff">m₂ {m2} g</Txt>
      <g transform="rotate(90 200 110)">
        <Ruler x1={200} x2={400} y={110} from={0} to={1} major={0.2} minor={0.05} height={12} />
      </g>
      <Txt x={150} y={215} size={10} anchor="end">h = 1 m</Txt>
      <Digital x={430} y={60} w={150} text={`${fmt(tau, 2)} s`} label={bn ? 'পতনের সময়' : 'Fall time'} good={T1 > 0 && cyc >= T1} />
      <Digital x={430} y={130} w={150} text={`a = ${fmt(a, 3)}`} label={bn ? 'ত্বরণ (m/s²)' : 'Acceleration (m/s²)'} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Flywheel                                                             */
/* ------------------------------------------------------------------ */

export function FlywheelScene({ view, t, bn }: SceneProps) {
  const a = num(view, 'a');
  const T1 = num(view, 't', 1);
  const r = num(view, 'r');
  const h = num(view, 'h');
  const m = num(view, 'm');
  const cyc = t % (T1 + 1.2);
  const tau = Math.min(cyc, T1);
  const fall = 0.5 * a * tau * tau;
  const phi = (fall / r) * (180 / Math.PI);
  const cx = 220;
  const cy = 120;
  const sc = 200;
  const axle = r * 600;
  return (
    <SceneFrame label="Flywheel with falling mass">
      <rect x={60} y={20} width={14} height={300} fill="url(#pr-metal)" />
      <line x1={74} y1={cy} x2={cx} y2={cy} stroke={C.steelDark} strokeWidth={6} />
      <g transform={`rotate(${phi} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={92} fill="none" stroke={C.steelDark} strokeWidth={16} />
        {[0, 60, 120, 180, 240, 300].map((k) => (
          <line key={k} x1={cx} y1={cy} x2={cx + Math.cos(k * DEG) * 86} y2={cy + Math.sin(k * DEG) * 86} stroke={C.steel} strokeWidth={5} />
        ))}
        <circle cx={cx} cy={cy} r={axle} fill={C.ink} />
        <circle cx={cx + 92} cy={cy} r={5} fill={C.red} />
      </g>
      <line x1={cx + axle} y1={cy} x2={cx + axle} y2={cy + 110 + fall * sc} stroke={C.muted} strokeWidth={1.2} />
      <rect x={cx + axle - 14} y={cy + 110 + fall * sc} width={28} height={14 + m * 60} rx={3} fill={C.amber} />
      <line x1={cx + 70} y1={cy + 110} x2={cx + 70} y2={cy + 110 + h * sc} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={cx + 78} y={cy + 110 + (h * sc) / 2} size={10.5} color={C.blue} anchor="start">h = {fmt(h, 1)} m</Txt>
      <line x1={cx - 40} y1={cy + 110 + h * sc + 14 + m * 60} x2={cx + 120} y2={cy + 110 + h * sc + 14 + m * 60} stroke={C.muted} strokeWidth={2} />
      <Digital x={440} y={60} w={150} text={`${fmt(tau, 2)} s`} label={bn ? 'পতনের সময়' : 'Fall time'} good={cyc >= T1} />
      <Digital x={440} y={130} w={150} text={`a = ${a.toFixed(4)}`} label={bn ? 'ত্বরণ (m/s²)' : 'Acceleration (m/s²)'} />
      <Txt x={515} y={190} size={10}>r = {fmt(r * 100, 1)} cm · m = {fmt(m * 1000, 0)} g</Txt>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Torsion (static & dynamic)                                           */
/* ------------------------------------------------------------------ */

export function TorsionScene(props: SceneProps) {
  return props.model.variant === 'dynamic' ? <TorsionPendulum {...props} /> : <StaticTorsion {...props} />;
}

function StaticTorsion({ view, bn }: SceneProps) {
  const phi = num(view, 'phi');
  const m = num(view, 'm');
  const deg = phi / DEG;
  const cx = 470;
  const cy = 150;
  return (
    <SceneFrame label="Static torsion apparatus">
      <rect x={40} y={110} width={30} height={80} fill={C.steelDark} />
      <rect x={70} y={144} width={360} height={12} fill="url(#pr-metal)" />
      <Txt x={250} y={136} size={10}>{bn ? 'দণ্ড L = 0.5 m, r = 2.5 mm' : 'Rod L = 0.5 m, r = 2.5 mm'}</Txt>
      {/* circular scale */}
      <circle cx={cx} cy={cy} r={70} fill={C.surface} stroke={C.line} strokeWidth={2} />
      {Array.from({ length: 36 }).map((_, i) => (
        <line key={i} x1={cx + Math.cos(i * 10 * DEG) * 62} y1={cy + Math.sin(i * 10 * DEG) * 62} x2={cx + Math.cos(i * 10 * DEG) * 70} y2={cy + Math.sin(i * 10 * DEG) * 70} stroke={C.ink} strokeWidth={i % 3 === 0 ? 1.4 : 0.7} />
      ))}
      <circle cx={cx} cy={cy} r={22} fill="url(#pr-metal)" stroke={C.steelDark} />
      <line x1={cx} y1={cy} x2={cx + Math.sin(deg * DEG) * 60} y2={cy - Math.cos(deg * DEG) * 60} stroke={C.red} strokeWidth={2.4} />
      <line x1={cx} y1={cy - 60} x2={cx} y2={cy - 74} stroke={C.green} strokeWidth={2} />
      {/* pans */}
      <line x1={cx - 22} y1={cy} x2={cx - 22} y2={270} stroke={C.muted} />
      <line x1={cx + 22} y1={cy} x2={cx + 22} y2={240} stroke={C.muted} />
      <rect x={cx - 42} y={270} width={40} height={6} fill={C.steelDark} />
      <rect x={cx + 2} y={240} width={40} height={6} fill={C.steelDark} />
      {Array.from({ length: Math.round(m * 10) }).map((_, i) => (
        <rect key={i} x={cx + 6} y={233 - i * 6} width={32} height={5} rx={1.5} fill="#d97706" />
      ))}
      <Digital x={60} y={240} w={170} text={`φ = ${fmt(deg, 2)}°`} label={bn ? 'মোচড় কোণ' : 'Angle of twist'} />
      <Digital x={250} y={240} w={150} text={`τ = ${fmt(m * 9.80665 * 0.1, 3)} N·m`} label={bn ? 'টর্ক' : 'Torque'} />
    </SceneFrame>
  );
}

function TorsionPendulum({ view, t, bn }: SceneProps) {
  const L = num(view, 'L');
  const T = num(view, 'T', 2);
  const ang = 40 * Math.cos((2 * Math.PI * t) / T);
  const cx = 280;
  const top = 30;
  const len = 60 + L * 180;
  const dy = top + len;
  return (
    <SceneFrame label="Torsion pendulum">
      <rect x={cx - 70} y={top - 14} width={140} height={14} fill="url(#pr-metal)" />
      <line x1={cx} y1={top} x2={cx} y2={dy} stroke={C.steelDark} strokeWidth={1.4} />
      <ellipse cx={cx} cy={dy + 14} rx={86} ry={22} fill="url(#pr-metal)" stroke={C.steelDark} />
      <ellipse cx={cx} cy={dy + 6} rx={86} ry={22} fill="#cbd5e1" stroke={C.steelDark} />
      <circle cx={cx + Math.sin(ang * DEG) * 70} cy={dy + 6 + Math.cos(ang * DEG) * 16} r={5} fill={C.red} />
      <line x1={cx} y1={dy + 6} x2={cx + Math.sin(ang * DEG) * 70} y2={dy + 6 + Math.cos(ang * DEG) * 16} stroke={C.red} strokeWidth={1.5} />
      <line x1={cx - 110} y1={top} x2={cx - 110} y2={dy} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={cx - 116} y={(top + dy) / 2} size={11} color={C.blue} anchor="end">L = {fmt(L, 1)} m</Txt>
      <Digital x={450} y={60} w={140} text={stopwatch(t % (20 * T))} label={bn ? 'স্টপওয়াচ' : 'Stopwatch'} />
      <Digital x={450} y={120} w={140} text={`${Math.floor(t / T) % 20} / 20`} label={bn ? 'দোলন গণনা' : 'Oscillations'} />
      <Txt x={520} y={180} size={10}>T = {fmt(T, 3)} s · r = {num(view, 'r')} mm</Txt>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Searle's apparatus                                                   */
/* ------------------------------------------------------------------ */

export function SearleScene({ view, bn }: SceneProps) {
  const m = num(view, 'm');
  const e = num(view, 'e'); // m
  const shift = e * 1000 * 12; // exaggerated
  return (
    <SceneFrame label="Searle's apparatus">
      <rect x={140} y={20} width={300} height={14} fill="url(#pr-metal)" />
      <line x1={230} y1={34} x2={230} y2={200} stroke={C.steelDark} strokeWidth={1.5} />
      <line x1={350} y1={34} x2={350} y2={200 + shift} stroke={C.copper} strokeWidth={1.5} />
      <Txt x={230} y={52} size={9.5} anchor="end">{bn ? 'রেফারেন্স ' : 'Reference '}</Txt>
      <Txt x={356} y={52} size={9.5} anchor="start">{bn ? 'পরীক্ষণীয় তার' : 'Experimental wire'}</Txt>
      {/* frames */}
      <rect x={205} y={200} width={50} height={40} rx={4} fill={C.soft} stroke={C.steelDark} />
      <rect x={325} y={200 + shift} width={50} height={40} rx={4} fill={C.soft} stroke={C.steelDark} />
      {/* spirit level (always re-levelled) */}
      <rect x={240} y={206 + shift / 2} width={100} height={12} rx={6} fill="#bbf7d0" stroke={C.green} />
      <ellipse cx={290} cy={212 + shift / 2} rx={8} ry={4} fill="#fff" />
      {/* micrometer */}
      <rect x={366} y={170 + shift} width={18} height={34} fill="url(#pr-metal)" />
      <rect x={360} y={150 + shift} width={30} height={22} rx={3} fill={C.steelDark} />
      {/* hangers */}
      <line x1={230} y1={240} x2={230} y2={270} stroke={C.muted} />
      <rect x={215} y={270} width={30} height={14} rx={2} fill={C.steel} />
      <line x1={350} y1={240 + shift} x2={350} y2={262 + shift} stroke={C.muted} />
      {Array.from({ length: Math.round(m * 2) }).map((_, i) => (
        <rect key={i} x={328} y={262 + shift + i * 7} width={44} height={6} rx={2} fill={i % 2 ? '#b45309' : '#d97706'} />
      ))}
      <Txt x={400} y={280 + shift} size={10} color={C.ink} anchor="start">{fmt(m, 1)} kg</Txt>
      <Digital x={450} y={70} w={150} text={`${(e * 1000).toFixed(3)} mm`} label={bn ? 'মাইক্রোমিটার (প্রসারণ)' : 'Micrometer (extension)'} />
      <Digital x={450} y={140} w={150} text={`F = ${fmt(m * 9.80665, 2)} N`} label={bn ? 'বল' : 'Load'} />
      <Txt x={525} y={200} size={9.5}>L = 1 m · r = 0.5 mm</Txt>
    </SceneFrame>
  );
}
