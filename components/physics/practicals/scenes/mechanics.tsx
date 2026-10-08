'use client';

import React, { useRef } from 'react';
import { katerPeriods } from '@/engine/practicals/mechanics';
import { C, Digital, Grip, Ruler, SceneFrame, Stand, Txt, Wire, fmt, num, useSvgDrag, type SceneProps } from '../primitives';
import { LinearScale, Protractor, RetortStand, Rod, SlottedWeight, WeightHanger } from '../../Equipment/art/parts';

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
  const px = 250;
  const py = 96;
  const benchY = 336;
  const th = amp * DEG * Math.cos((2 * Math.PI * t) / T);
  const bx = px + Math.sin(th) * L * scale;
  const by = py + Math.cos(th) * L * scale;
  const osc = Math.floor(t / T) % 20;
  const ampR = amp * DEG;
  const left = { x: px - Math.sin(ampR) * L * scale, y: py + Math.cos(ampR) * L * scale };
  const right = { x: px + Math.sin(ampR) * L * scale, y: py + Math.cos(ampR) * L * scale };
  return (
    <SceneFrame label="Simple pendulum">
      {/* hardwood bench the stand is bolted to */}
      <rect x="0" y={benchY} width={640} height={24} fill="url(#pr-wood)" />
      <rect x="0" y={benchY} width={640} height="4" fill="#ffffff" opacity="0.35" />
      {/* cast retort stand with the clamp the thread hangs from */}
      <RetortStand x={px} baseY={benchY} top={20} clampY={py} length={0} direction={1} />
      {/* the ivory protractor is screwed to the clamp, behind the thread */}
      <Protractor cx={px} cy={py + 4} r={88} angle={(th * 180) / Math.PI} spanDeg={90} />
      {/* the arc the bob sweeps, at the true amplitude */}
      <path
        d={`M ${left.x} ${left.y} A ${L * scale} ${L * scale} 0 0 1 ${right.x} ${right.y}`}
        fill="none"
        stroke={C.amber}
        strokeWidth={1.2}
        strokeDasharray="4 4"
        opacity={0.6}
      />
      {/* mirror scale graduates the length */}
      <g>
        <rect x={px + 128} y={py - 4} width={26} height={L * scale + 34} rx={3} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.8} />
        <LinearScale x={px + 136} y={py} w={17} h={L * scale + 26} from={0} to={Math.max(10, Math.round(L * 100))} major={10} minor={1} vertical unit="cm" size={7} tick={12} />
        <line x1={px + 120} y1={by} x2={px + 150} y2={by} stroke="#0ea5e9" strokeWidth={0.9} strokeDasharray="4 4" opacity={0.8} />
      </g>
      {/* cotton thread and the split brass bob */}
      <line x1={px} y1={py} x2={bx} y2={by} stroke="#3f3f46" strokeWidth={1.1} />
      <g>
        <circle cx={bx} cy={by} r={13} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={1} />
        <circle cx={bx - 4.4} cy={by - 4.6} r={4} fill="#fffdf0" opacity="0.7" />
        <rect x={bx - 1.8} y={by - 13} width={3.6} height={9} fill="#7c560f" opacity="0.5" />
        <circle cx={bx} cy={by - 8} r={1.8} fill="url(#ix-chrome)" />
      </g>
      {/* length marker */}
      <line x1={px - 150} y1={py} x2={px - 150} y2={py + L * scale} stroke={C.blue} strokeWidth={1.5} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={px - 158} y={py + (L * scale) / 2} size={11} color={C.blue} anchor="end">L = {fmt(L, 2)} m</Txt>
      <Digital x={470} y={60} w={140} text={stopwatch(t % (20 * T))} label={bn ? 'স্টপওয়াচ' : 'Stopwatch'} />
      <Digital x={470} y={120} w={140} text={`${osc} / 20`} label={bn ? 'দোলন গণনা' : 'Oscillations'} />
      <Txt x={540} y={182} size={10}>T = {fmt(T, 3)} s</Txt>
      <Txt x={540} y={200} size={10}>θ = {fmt(amp, 0)}°</Txt>
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
      {/* the load: a hanger with a stack of slotted brass discs */}
      {Array.from({ length: discs }).map((_, i) => (
        <ellipse key={i} cx={220} cy={end + 30 - i * 5} rx={17 + i * 0.6} ry={4} fill="url(#ix-knurl)" stroke="#6d4a0a" strokeWidth={0.5} />
      ))}
      <WeightHanger x={220} y={end + 36} r={13} label={discs > 0 ? undefined : `${fmt(m * 1000, 0)}`} />
      <Txt x={244} y={end + 40} size={10} color={C.ink} anchor="start">{fmt(m * 1000, 0)} g</Txt>
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
  const oy = 296;
  const path: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const tt = (tf * i) / 40;
    const x = v0 * Math.cos(angle * DEG) * tt;
    const y = v0 * Math.sin(angle * DEG) * tt - 0.5 * g * tt * tt;
    path.push(`${i ? 'L' : 'M'} ${ox + x * sc} ${oy - y * sc}`);
  }
  const cyc = t % (tf + 1);
  const tt = Math.min(cyc, tf);
  const bx = ox + v0 * Math.cos(angle * DEG) * tt * sc;
  const by = oy - (v0 * Math.sin(angle * DEG) * tt - 0.5 * g * tt * tt) * sc;
  const flying = cyc <= tf && tt > 0.05;
  return (
    <SceneFrame label="Projectile launcher">
      {/* bench top and a printed metre scale */}
      <rect x="0" y={oy} width={640} height={20} fill="url(#pr-wood)" />
      <rect x="0" y={oy} width={640} height="3" fill="#ffffff" opacity="0.35" />
      <rect x={ox} y={oy + 4} width={560} height={14} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.6} />
      <LinearScale x={ox} y={oy + 6} w={556} h={11} from={0} to={24} major={4} minor={1} unit="m" size={8} />
      {/* the true parabola and the shot in flight */}
      <path d={path.join(' ')} fill="none" stroke="#0ea5e9" strokeWidth={1.4} strokeDasharray="6 5" opacity={0.85} />
      {flying && (
        <>
          <circle cx={bx} cy={by} r={5.4} fill="url(#ix-steel-h)" stroke="#334155" strokeWidth={0.8} />
          <line x1={bx} y1={by} x2={bx + v0 * Math.cos(angle * DEG) * 3} y2={by} stroke={C.red} strokeWidth={1.8} />
          <line x1={bx} y1={by} x2={bx} y2={by + (v0 * Math.sin(angle * DEG) - g * tt) * 3} stroke={C.blue} strokeWidth={1.8} />
        </>
      )}
      {/* brass launcher on a cast-iron carriage, elevated to θ */}
      <g transform={`translate(${ox} ${oy})`}>
        <ellipse cx={0} cy={14} rx={44} ry={6} fill="#0b1220" opacity="0.22" />
        <path d="M -44 10 h 78 l -13 -22 h -52 Z" fill="url(#ix-iron)" stroke="#1f2937" strokeWidth="0.9" />
        <circle cx={-27} cy={11} r={8.5} fill="url(#ix-rubber)" stroke="#111827" strokeWidth="0.8" />
        <circle cx={15} cy={11} r={8.5} fill="url(#ix-rubber)" stroke="#111827" strokeWidth="0.8" />
        <circle cx={-27} cy={11} r={2.8} fill="url(#ix-chrome)" />
        <circle cx={15} cy={11} r={2.8} fill="url(#ix-chrome)" />
        <Protractor cx={-4} cy={-2} r={44} angle={angle} spanDeg={90} />
        <g transform={`rotate(${-angle})`}>
          <rect x={0} y={-11} width={58} height={14} rx={4} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth="0.9" />
          <rect x={3} y={-11} width={52} height={4} rx={2} fill="#fff8dc" opacity="0.55" />
          <rect x={50} y={-11.6} width={6} height={15.2} rx={2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth="0.5" />
          <circle cx={1} cy={-4} r={8} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth="0.7" />
          <circle cx={1} cy={-4} r={3} fill="#334155" />
        </g>
      </g>
      <Txt x={ox + 46} y={oy - 52} size={10.5} color="#b45309" weight={800} anchor="start">θ = {angle}°</Txt>
      <Txt x={ox + 2} y={oy - 68} size={10.5} color={C.muted} anchor="start">v₀ = {fmt(v0, 1)} m/s</Txt>
      {/* range and apex markers */}
      <line x1={ox + R * sc} y1={oy} x2={ox + R * sc} y2={oy - 30} stroke={C.red} strokeWidth={2} />
      <path d={`M ${ox + R * sc} ${oy - 30} l 16 6 l -16 6 z`} fill={C.red} />
      <Txt x={ox + R * sc + 6} y={oy - 26} size={11} color={C.red} weight={800} anchor="start">R = {fmt(R, 2)} m</Txt>
      <line x1={ox + (R / 2) * sc} y1={oy} x2={ox + (R / 2) * sc} y2={oy - Hh * sc} stroke={C.muted} strokeDasharray="3 3" />
      <Txt x={ox + (R / 2) * sc} y={Math.max(20, oy - Hh * sc - 10)} size={10} anchor="middle">H = {fmt(Hh, 2)} m</Txt>
      <Digital x={470} y={30} w={150} text={`v₀ = ${fmt(v0, 1)} m/s`} label={bn ? 'উৎক্ষেপণ বেগ' : 'Launch speed'} />
      <Digital x={470} y={96} w={150} text={`T = ${fmt(tf, 2)} s`} label={bn ? 'উড্ডয়নকাল' : 'Time of flight'} />
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
      {/* the trolley: pressed-alloy chassis on four flanged wheels, with a platen */}
      <g transform={`translate(${tx} ${table})`}>
        <rect x={-12} y={-36} width={104} height={6} rx={2} fill="url(#ix-alu-ball)" stroke="#64748b" strokeWidth={0.6} />
        <rect x={-10} y={-31} width={100} height={22} rx={4} fill="url(#ix-enamel)" stroke="#0b1220" strokeWidth={0.7} />
        <rect x={-10} y={-31} width={100} height={7} rx={3} fill="#ffffff" opacity={0.16} />
        <rect x={36} y={-40} width={14} height={5} rx={1.5} fill="url(#ix-iron)" />
        <circle cx={70} cy={-27} r={2.6} fill="url(#ix-steel-ball)" />
        <path d={`M 90 ${-22} h 8`} stroke="url(#ix-steel-h)" strokeWidth={2} />
        {[-4, 62].map((wx) => (
          <g key={wx}>
            <circle cx={wx} cy={-9} r={7.5} fill="url(#ix-rubber)" stroke="#0f172a" strokeWidth={0.6} />
            <circle cx={wx} cy={-9} r={2.6} fill="url(#ix-chrome)" />
          </g>
        ))}
        <Txt x={40} y={-19} size={9.5} color="#e2e8f0">M = 0.55 kg</Txt>
      </g>
      {/* string over pulley */}
      <Wire d={`M ${tx + 98} ${table - 22} L ${pulleyX} ${table - 22}`} color="#e5e7eb" width={1.1} />
      {/* bench pulley on its own bracket, string running over the sheave */}
      <rect x={pulleyX - 16} y={table - 26} width={32} height={7} rx={2} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.5} />
      <Rod x1={pulleyX} y1={table - 26} x2={pulleyX} y2={table - 12} w={5} />
      <circle cx={pulleyX} cy={table - 6} r={13} fill="url(#ix-alu-ball)" stroke="#475569" strokeWidth={0.9} filter="url(#pr-ground)" />
      <circle cx={pulleyX} cy={table - 6} r={11.4} fill="none" stroke="#0b1220" strokeOpacity={0.28} strokeWidth={2.4} />
      <path d={`M ${pulleyX - 8} ${table - 14} a 13 13 0 0 1 11 -4`} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.4} />
      <circle cx={pulleyX} cy={table - 6} r={3} fill="url(#ix-brass-ball)" />
      <Wire d={`M ${pulleyX + 13} ${table - 6} L ${pulleyX + 13} ${table + 26 + dist * sc * 0.25}`} color="#e5e7eb" width={1.1} />
      <WeightHanger x={pulleyX + 13} y={table + 40 + dist * sc * 0.25} r={12 + m * 20} label={`${fmt(m * 1000, 0)} g`} />
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
  const r = 38;
  const y1 = Math.min(238, 118 + d);
  const y2 = Math.max(158, 312 - d);
  const spin = (d / r) * (180 / Math.PI);
  const benchY = 344;
  return (
    <SceneFrame label="Atwood machine">
      {/* bench + heavy wall bracket carrying the sheave */}
      <rect x="0" y={benchY} width={640} height={16} fill="url(#pr-wood)" />
      <rect x="0" y={benchY} width={640} height="3" fill="#ffffff" opacity="0.35" />
      <RetortStand x={cx} baseY={benchY} top={18} clampY={44} length={0} direction={1} />
      <rect x={cx - 24} y={30} width={48} height={16} rx={3} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
      <Rod x1={cx} y1={46} x2={cx} y2={56 - 6} w={10} />
      {/* turned steel pulley with a rope groove, spinning as the masses move */}
      <circle cx={cx} cy={56} r={r} fill="url(#ix-steel)" stroke="#475569" strokeWidth={1.1} />
      <circle cx={cx} cy={56} r={r * 0.86} fill="none" stroke="#0b1220" strokeOpacity={0.35} strokeWidth={2.6} />
      <g style={{ transform: `rotate(${spin}deg)`, transformOrigin: `${cx}px 56px` }}>
        {[0, 60, 120, 180, 240, 300].map((k) => (
          <line key={k} x1={cx} y1={56} x2={cx} y2={56 - r * 0.82} stroke="#cbd5e1" strokeOpacity={0.45} strokeWidth={2} transform={`rotate(${k} ${cx} 56)`} />
        ))}
      </g>
      <circle cx={cx} cy={56} r={10} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} />
      <circle cx={cx} cy={56} r={3.2} fill="#334155" />
      {/* the inextensible string, with a slotted mass clamped on each side */}
      <line x1={cx - r} y1={56} x2={cx - r} y2={y1 - 20} stroke="#6b7280" strokeWidth={1.5} />
      <line x1={cx + r} y1={56} x2={cx + r} y2={y2 - 20} stroke="#6b7280" strokeWidth={1.5} />
      <SlottedWeight cx={cx - r} cy={y1} r={22 + Math.min(10, m1 / 45)} label={`${m1}`} />
      <SlottedWeight cx={cx + r} cy={y2} r={22 + Math.min(10, m2 / 45)} label={`${m2}`} />
      {/* graduated height scale the fall is timed against */}
      <rect x={chk(cx + r + 66)} y={70} width={22} height={236} rx={3} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.8} />
      <LinearScale x={chk(cx + r + 74)} y={70} w={14} h={230} from={0} to={100} major={20} minor={5} vertical unit="cm" size={6} tick={11} />
      {[y1, y2].map((yy, i) => (
        <line key={i} x1={cx + (i ? r : -r) + (i ? 14 : -14)} y1={yy} x2={chk(cx + r + 66)} y2={yy} stroke="#0ea5e9" strokeWidth={0.9} strokeDasharray="4 4" opacity={0.7} />
      ))}
      <Txt x={cx - r - 34} y={y1 + 4} size={10.5} color={C.red} weight={800} anchor="end">m₁ {m1} g</Txt>
      <Txt x={cx + r + 6} y={y2 - 36} size={10.5} color={C.violet} weight={800} anchor="start">m₂ {m2} g</Txt>
      <Digital x={430} y={150} w={170} text={`${fmt(tau, 2)} s`} label={bn ? 'পতনের সময়' : 'Fall time'} good={T1 > 0 && cyc >= T1} />
      <Digital x={430} y={214} w={170} text={`a = ${fmt(a, 3)}`} label={bn ? 'ত্বরণ (m/s²)' : 'Acceleration (m/s²)'} />
      <Txt x={437} y={286} size={10.5} color={C.muted} anchor="start">a = (m₁−m₂)g/(m₁+m₂)</Txt>
    </SceneFrame>
  );
}

/** Keep a label inside the 640 px scene. */
function chk(x: number) {
  return Math.min(618, Math.max(2, x));
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
  const drumX = cx + 118;
  return (
    <SceneFrame label="Flywheel with falling mass">
      {/* cast-iron upright, bolted to the bench, carrying the axle in a bush */}
      <rect x={52} y={316} width={44} height={12} rx={3} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} filter="url(#pr-ground)" />
      <rect x={58} y={20} width={32} height={298} rx={4} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
      <rect x={60} y={22} width={9} height={294} rx={4} fill="#ffffff" opacity={0.14} />
      <rect x={58} y={20} width={32} height={16} rx={4} fill="url(#ix-charcoal)" />
      {/* oil-hole boss and the brass bush the shaft turns in */}
      <circle cx={74} cy={cy - 26} r={4.6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
      <circle cx={74} cy={cy} r={15} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.7} />
      <circle cx={74} cy={cy} r={15} fill="url(#ix-knurl)" opacity={0.3} />
      <circle cx={74} cy={cy} r={9} fill="#334155" />
      {/* polished shaft, carried through the wheel out to the winding drum */}
      <rect x={74} y={cy - 4} width={drumX - 74 + 18} height={8} rx={4} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.5} filter="url(#pr-ground)" />
      <rect x={74} y={cy - 4} width={drumX - 74 + 18} height={2.4} rx={1.2} fill="#ffffff" opacity={0.55} />
      {/* the winding drum outboard of the wheel, with the cord coiled on it */}
      <rect x={drumX - 9} y={cy - 11} width={18} height={22} rx={3} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.6} />
      <rect x={drumX - 9} y={cy - 11} width={18} height={7} rx={3} fill="#ffffff" opacity={0.22} />
      <rect x={drumX - 9} y={cy - 11} width={18} height={22} rx={3} fill="url(#ix-knurl)" opacity={0.35} />
      <g opacity={0.95}>
        {[0, 1, 2, 3].map((i) => (
          <ellipse key={i} cx={drumX} cy={cy - 12 + i * 6} rx={11} ry={3.4} fill="none" stroke="#c8b48a" strokeWidth={1.5} />
        ))}
      </g>
      {/* the flywheel: machined rim, tapered cast spokes, keyed hub */}
      <g transform={`rotate(${phi} ${cx} ${cy})`}>
        <circle cx={cx} cy={cy} r={92} fill="url(#ix-iron)" stroke="#111827" strokeWidth={1} filter="url(#pr-ground-lg)" />
        <circle cx={cx} cy={cy} r={92} fill="url(#ix-charcoal)" opacity={0.35} />
        <circle cx={cx} cy={cy} r={83} fill="#2b3238" />
        <circle cx={cx} cy={cy} r={83} fill="none" stroke="#0b1220" strokeOpacity={0.6} strokeWidth={1.4} />
        <circle cx={cx} cy={cy} r={77} fill="#20262c" />
        {Array.from({ length: 6 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 60} ${cx} ${cy})`}>
            <path d={`M ${cx - 5} ${cy - 12} L ${cx + 5} ${cy - 12} L ${cx + 8.5} ${cy - 72} L ${cx - 8.5} ${cy - 72} Z`} fill="url(#ix-iron)" stroke="#0b1220" strokeWidth={0.6} />
            <path d={`M ${cx - 4} ${cy - 14} L ${cx - 1.6} ${cy - 14} L ${cx - 2.6} ${cy - 70} L ${cx - 6.4} ${cy - 70} Z`} fill="#ffffff" opacity={0.16} />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={20} fill="url(#ix-iron)" stroke="#0b1220" strokeWidth={0.8} />
        <circle cx={cx} cy={cy} r={13} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.6} />
        <circle cx={cx} cy={cy} r={13} fill="url(#ix-knurl)" opacity={0.3} />
        <circle cx={cx} cy={cy} r={6} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={cx + 16} y={cy - 3} width={7} height={6} rx={1} fill="#0b1220" opacity={0.7} />
        {/* the painted mark the revolutions are timed against */}
        <circle cx={cx} cy={cy - 92} r={7} fill="#e2483d" stroke="#7f1d1d" strokeWidth={0.7} />
        <circle cx={cx - 1.6} cy={cy - 93.4} r={2} fill="#ffffff" opacity={0.55} />
        {/* machined face catching the light */}
        <path d={`M ${cx - 88} ${cy - 40} A 92 92 0 0 1 ${cx + 34} ${cy - 86}`} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={2.6} />
        <path d={`M ${cx + 74} ${cy + 44} A 92 92 0 0 0 ${cx + 88} ${cy + 22}`} fill="none" stroke="#ffffff" strokeOpacity={0.18} strokeWidth={2} />
      </g>
      {/* the falling load on its cord */}
      <line x1={drumX} y1={cy + 8} x2={drumX} y2={cy + 110 + fall * sc} stroke="#c8b48a" strokeWidth={1.3} />
      <WeightHanger x={drumX} y={cy + 124 + fall * sc} r={12 + m * 20} label={`${fmt(m * 1000, 0)} g`} hook={false} />
      {/* the height the load falls, marked against the frame */}
      <line x1={cx - 118} y1={cy + 110} x2={cx - 118} y2={cy + 110 + h * sc} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={cx - 124} y={cy + 110 + (h * sc) / 2} size={10.5} color={C.blue} anchor="end">h = {fmt(h, 1)} m</Txt>
      <line x1={cx - 100} y1={cy + 122 + h * sc} x2={cx + 150} y2={cy + 122 + h * sc} stroke={C.muted} strokeWidth={2} />
      {/* the room light falling on the bench */}
      <circle cx={cx + 40} cy={cy + 60} r={150} fill="url(#pr-lamp)" opacity={0.5} />
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
