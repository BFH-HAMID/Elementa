'use client';

import React, { useRef } from 'react';
import { C, Digital, Grip, SceneFrame, Txt, fmt, num, useSvgDrag, type SceneProps } from '../primitives';

/* ------------------------------------------------------------------ */
/* Resonance tube                                                       */
/* ------------------------------------------------------------------ */

function Fork({ x, y, t, active }: { x: number; y: number; t: number; active: boolean }) {
  const w = active ? Math.sin(t * 60) * 1.6 : 0;
  return (
    <g>
      <path d={`M ${x - 8 - w} ${y - 40} L ${x - 8} ${y} Q ${x} ${y + 8} ${x + 8} ${y} L ${x + 8 + w} ${y - 40}`} fill="none" stroke={C.steelDark} strokeWidth={4} strokeLinecap="round" />
      <line x1={x} y1={y + 6} x2={x} y2={y + 22} stroke={C.steelDark} strokeWidth={4} />
    </g>
  );
}

export function ResonanceTubeScene({ view, t, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const f = num(view, 'f');
  const lambda = num(view, 'lambda');
  const tubes = [
    { key: 'L1', L: num(view, 'L1'), a: num(view, 'a1'), ok: num(view, 'b1') === 1, x: 170, label: bn ? 'প্রথম অনুনাদ l₁' : 'First resonance l₁' },
    { key: 'L2', L: num(view, 'L2'), a: num(view, 'a2'), ok: num(view, 'b2') === 1, x: 400, label: bn ? 'দ্বিতীয় অনুনাদ l₂' : 'Second resonance l₂' }
  ];
  const top = 66;
  const sc = 2.4;
  return (
    <SceneFrame ref={ref} label="Resonance tube">
      {tubes.map((tb) => {
        const wy = top + tb.L * sc;
        const wave: string[] = [];
        const amp = 14 * tb.a * Math.cos(t * 30);
        for (let k = 0; k <= 30; k++) {
          const y = top + (tb.L * sc * k) / 30;
          const depth = (tb.L * k) / 30; // cm from top
          const s = Math.cos((2 * Math.PI * depth) / lambda);
          wave.push(`${k ? 'L' : 'M'} ${tb.x + amp * s} ${y}`);
        }
        return (
          <g key={tb.key}>
            <rect x={tb.x - 22} y={top} width={44} height={110 * sc} fill={C.glass} stroke={C.steelDark} strokeWidth={1.4} />
            <rect x={tb.x - 21} y={wy} width={42} height={top + 110 * sc - wy} fill={C.water} opacity={0.65} />
            <path d={wave.join(' ')} fill="none" stroke={tb.ok ? C.green : C.blue} strokeWidth={1.6} opacity={0.9} />
            {/* scale */}
            {Array.from({ length: 12 }).map((_, k) => (
              <g key={k}>
                <line x1={tb.x + 22} x2={tb.x + 30} y1={top + k * 10 * sc} y2={top + k * 10 * sc} stroke={C.ink} strokeWidth={0.8} />
                <Txt x={tb.x + 42} y={top + k * 10 * sc + 3} size={8}>{k * 10}</Txt>
              </g>
            ))}
            <Fork x={tb.x} y={top - 24} t={t} active />
            {[1, 2, 3].map((k) => (
              <path key={k} d={`M ${tb.x - 14 - k * 8} ${top - 50 - k * 6} q ${14 + k * 8} -10 ${28 + k * 16} 0`} fill="none" stroke={tb.ok ? C.green : C.muted} strokeWidth={1.4} opacity={tb.a * (0.9 - k * 0.2)} />
            ))}
            <line x1={tb.x - 40} y1={wy} x2={tb.x + 22} y2={wy} stroke={tb.ok ? C.green : C.blueDark} strokeWidth={2} />
            <Txt x={tb.x - 44} y={wy + 4} size={10} color={tb.ok ? C.green : C.blueDark} anchor="end" weight={800}>{fmt(tb.L, 1)} cm</Txt>
            <rect x={tb.x - 40} y={wy - 18} width={80} height={36} fill="transparent" {...drag((pt) => setParam(tb.key, Math.round(((pt.y - top) / sc) * 10) / 10))} />
            <Grip x={tb.x} y={wy} color={tb.ok ? C.green : C.blue} />
            <Txt x={tb.x} y={top + 110 * sc + 16} size={10}>{tb.label}</Txt>
            {/* loudness bar */}
            <rect x={tb.x + 60} y={top + 40} width={12} height={120} rx={4} fill={C.soft} stroke={C.line} />
            <rect x={tb.x + 60} y={top + 40 + 120 * (1 - tb.a)} width={12} height={120 * tb.a} rx={4} fill={tb.ok ? C.green : C.amber} />
            <Txt x={tb.x + 66} y={top + 176} size={8.5}>{bn ? 'শব্দ' : 'sound'}</Txt>
          </g>
        );
      })}
      <Digital x={520} y={60} w={100} text={`${f} Hz`} label={bn ? 'সুরশলাকা' : 'Fork'} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Sonometer & Melde                                                    */
/* ------------------------------------------------------------------ */

export function StringScene(props: SceneProps) {
  return props.model.variant === 'melde' ? <MeldeScene {...props} /> : <SonometerScene {...props} />;
}

function SonometerScene({ view, t, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const L = num(view, 'L');
  const amp = num(view, 'amp');
  const resonant = num(view, 'resonant') === 1;
  const x0 = 80;
  const sc = 520;
  const bx = x0 + L * sc;
  const wy = 150;
  const A = amp * 14 * Math.sin(t * 50);
  const pts: string[] = [];
  for (let k = 0; k <= 40; k++) {
    const x = x0 + ((bx - x0) * k) / 40;
    pts.push(`${k ? 'L' : 'M'} ${x} ${wy + A * Math.sin((Math.PI * k) / 40)}`);
  }
  const riderX = (x0 + bx) / 2;
  const fly = resonant ? Math.min(60, ((t * 80) % 120)) : 0;
  return (
    <SceneFrame ref={ref} label="Sonometer">
      <rect x={40} y={170} width={580} height={70} rx={8} fill="url(#pr-wood)" />
      <circle cx={140} cy={205} r={12} fill={C.woodDark} />
      <circle cx={500} cy={205} r={12} fill={C.woodDark} />
      <line x1={40} y1={wy} x2={x0} y2={wy} stroke={C.steelDark} strokeWidth={1.4} />
      <path d={`M ${x0 - 8} 170 L ${x0} ${wy} L ${x0 + 8} 170 Z`} fill={C.ink} />
      <path d={pts.join(' ')} fill="none" stroke={C.steelDark} strokeWidth={1.6} />
      <line x1={bx} y1={wy} x2={606} y2={wy} stroke={C.steelDark} strokeWidth={1.4} />
      <path d={`M ${bx - 8} 170 L ${bx} ${wy} L ${bx + 8} 170 Z`} fill={resonant ? C.green : C.blue} />
      <rect x={bx - 20} y={wy - 20} width={40} height={60} fill="transparent" {...drag((pt) => setParam('L', Math.round(((pt.x - x0) / sc) * 1000) / 1000))} />
      <Grip x={bx} y={175} color={resonant ? C.green : C.blue} />
      {/* rider */}
      <path d={`M ${riderX - 6} ${wy - 2 - fly} l 6 -8 l 6 8`} fill="none" stroke={C.red} strokeWidth={2} transform={resonant ? `rotate(${fly * 3} ${riderX} ${wy - fly})` : undefined} />
      {/* pulley + weight */}
      <circle cx={612} cy={wy + 8} r={8} fill="url(#pr-metal)" />
      <line x1={620} y1={wy + 8} x2={620} y2={300} stroke={C.muted} />
      <rect x={606} y={300} width={28} height={36} rx={3} fill={C.steelDark} />
      <Txt x={590} y={350} size={9.5}>5 kg</Txt>
      <Txt x={(x0 + bx) / 2} y={wy - 30} size={10.5} color={resonant ? C.green : C.ink} weight={800}>L = {fmt(L * 100, 1)} cm</Txt>
      <g transform="translate(330 300)">
        <path d={`M -8 -30 L -8 0 Q 0 8 8 0 L 8 -30`} fill="none" stroke={C.steelDark} strokeWidth={4} />
      </g>
      <Txt x={330} y={330} size={9.5}>{bn ? 'সুরশলাকা' : 'Fork'} {num(view, 'f')} Hz · {bn ? 'তার' : 'string'} {fmt(num(view, 'fs'), 1)} Hz</Txt>
    </SceneFrame>
  );
}

function MeldeScene({ view, t, bn }: SceneProps) {
  const L = num(view, 'L');
  const loops = num(view, 'loops', 1);
  const amp = num(view, 'amp');
  const resonant = num(view, 'resonant') === 1;
  const m = num(view, 'm');
  const x0 = 80;
  const sc = 330;
  const x1 = x0 + L * sc;
  const wy = 150;
  const A = (resonant ? 30 : 8) * amp * Math.cos(t * 40);
  const jitter = resonant ? 0 : 4;
  const up: string[] = [];
  const down: string[] = [];
  for (let k = 0; k <= 120; k++) {
    const x = x0 + ((x1 - x0) * k) / 120;
    const s = Math.sin((loops * Math.PI * k) / 120);
    up.push(`${k ? 'L' : 'M'} ${x} ${wy + A * s + (jitter ? Math.sin(t * 23 + k) * jitter * amp : 0)}`);
    down.push(`${k ? 'L' : 'M'} ${x} ${wy - A * s}`);
  }
  return (
    <SceneFrame label="Melde's experiment">
      <rect x={30} y={110} width={50} height={80} rx={6} fill={C.steelDark} />
      <Txt x={55} y={205} size={9}>256 Hz</Txt>
      <path d={up.join(' ')} fill="none" stroke={C.red} strokeWidth={1.8} />
      {resonant && <path d={down.join(' ')} fill="none" stroke={C.red} strokeWidth={1.2} opacity={0.4} />}
      <circle cx={x1 + 8} cy={wy + 8} r={8} fill="url(#pr-metal)" />
      <line x1={x1 + 16} y1={wy + 8} x2={x1 + 16} y2={250} stroke={C.muted} />
      <rect x={x1 - 4} y={250} width={40} height={6} fill={C.steelDark} />
      <rect x={x1 + 2} y={226} width={28} height={24} rx={3} fill="#d97706" />
      <Txt x={x1 + 16} y={272} size={10}>{fmt(m * 1000, 0)} g</Txt>
      <line x1={x0} y1={310} x2={x1} y2={310} stroke={C.blue} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.blue} />
      <Txt x={(x0 + x1) / 2} y={328} size={10.5} color={C.blue}>L = {fmt(L, 2)} m</Txt>
      <Digital x={470} y={30} w={140} text={resonant ? `${loops} ${bn ? 'লুপ' : 'loops'}` : '—'} label={bn ? 'স্থির লুপ' : 'Steady loops'} good={resonant} />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Capillary rise / depression                                          */
/* ------------------------------------------------------------------ */

export function CapillaryScene({ view, bn }: SceneProps) {
  const r = num(view, 'r');
  const h = num(view, 'h');
  const mercury = view.liquid === 'mercury';
  const surface = mercury ? 190 : 230;
  const sc = mercury ? 9000 : 2400;
  const hp = h * sc;
  const tubeW = Math.max(6, r * (mercury ? 12 : 26));
  const color = mercury ? '#9ca3af' : C.water;
  const cx = 250;
  const level = mercury ? surface + hp : surface - hp;
  return (
    <SceneFrame label="Capillary tube">
      <rect x={80} y={surface} width={340} height={100} rx={6} fill={color} opacity={mercury ? 0.9 : 0.5} />
      <rect x={80} y={150} width={340} height={180} rx={6} fill="none" stroke={C.steelDark} strokeWidth={2} />
      {/* tube */}
      <rect x={cx - tubeW / 2 - 2} y={40} width={tubeW + 4} height={270} fill={C.glass} stroke={C.steelDark} />
      <rect x={cx - tubeW / 2} y={Math.min(level, 330)} width={tubeW} height={330 - Math.min(level, 330)} fill={color} opacity={mercury ? 0.95 : 0.7} />
      <path d={mercury ? `M ${cx - tubeW / 2} ${level + 3} Q ${cx} ${level - 5} ${cx + tubeW / 2} ${level + 3}` : `M ${cx - tubeW / 2} ${level - 3} Q ${cx} ${level + 5} ${cx + tubeW / 2} ${level - 3}`} fill="none" stroke={mercury ? '#4b5563' : C.blueDark} strokeWidth={1.6} />
      {/* height marker */}
      <line x1={cx + 40} y1={surface} x2={cx + 40} y2={level} stroke={C.red} strokeWidth={1.5} markerStart="url(#pr-arrow)" markerEnd="url(#pr-arrow)" color={C.red} />
      <line x1={cx - 50} y1={surface} x2={cx + 60} y2={surface} stroke={C.red} strokeDasharray="3 3" opacity={0.6} />
      <line x1={cx - 10} y1={level} x2={cx + 60} y2={level} stroke={C.red} strokeDasharray="3 3" opacity={0.6} />
      <Txt x={cx + 48} y={(surface + level) / 2 + 4} size={11} color={C.red} anchor="start" weight={800}>
        h = {mercury ? `${fmt(h * 1000, 2)} mm` : `${fmt(h * 100, 2)} cm`}
      </Txt>
      {/* microscope */}
      <g transform="translate(460 60)">
        <rect x={0} y={0} width={70} height={22} rx={6} fill={C.steelDark} />
        <rect x={-20} y={4} width={22} height={14} rx={3} fill={C.ink} />
        <rect x={30} y={22} width={10} height={180} fill="url(#pr-metal)" />
        <rect x={0} y={202} width={70} height={10} rx={3} fill={C.steelDark} />
      </g>
      <Txt x={500} y={300} size={10}>{bn ? 'চলমান অণুবীক্ষণ' : 'Travelling microscope'}</Txt>
      <Digital x={450} y={310} w={160} text={`r = ${r.toFixed(2)} mm`} label="" />
      <Txt x={250} y={30} size={10.5} color={C.ink}>
        {mercury ? (bn ? 'পারদ: স্পর্শ কোণ > 90° → অবনমন' : 'Mercury: contact angle > 90° → depression') : bn ? 'পানি: স্পর্শ কোণ ≈ 0° → উত্থান' : 'Water: contact angle ≈ 0° → rise'}
      </Txt>
    </SceneFrame>
  );
}
