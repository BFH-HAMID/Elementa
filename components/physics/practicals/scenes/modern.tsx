'use client';

import React, { useRef } from 'react';
import { photoCurrent, stoppingPotential, CATHODES } from '@/engine/practicals/modern';
import { C, Dial, Digital, Grip, SceneFrame, Txt, Wire, fmt, num, useSvgDrag, type SceneProps } from '../primitives';

/** Approximate visible colour for a wavelength (nm). */
export function wavelengthColor(nm: number) {
  if (nm < 400) return '#8b5cf6';
  if (nm < 440) return '#6366f1';
  if (nm < 490) return '#3b82f6';
  if (nm < 510) return '#06b6d4';
  if (nm < 560) return '#22c55e';
  if (nm < 590) return '#eab308';
  if (nm < 630) return '#f97316';
  return '#ef4444';
}

export function PhotoelectricScene({ view, params, t, bn }: SceneProps) {
  const lambda = num(view, 'lambda');
  const v = num(view, 'v');
  const I = num(view, 'I');
  const v0 = num(view, 'v0');
  const emits = num(view, 'emits') === 1;
  const color = wavelengthColor(lambda);
  const phi = (CATHODES[params.cathode] || CATHODES[0]).phi;
  // electrons: those with enough energy reach the anode
  const electrons: React.ReactNode[] = [];
  if (emits) {
    for (let k = 0; k < 10; k++) {
      const seed = (k * 0.137) % 1;
      const ph = (t * 0.9 + seed) % 1;
      const reach = I > 0 && seed < Math.min(1, I / 2.5 + 0.15);
      const maxX = reach ? 1 : Math.max(0.15, Math.min(0.9, (v0 - v) / Math.max(v0, 0.01) + 0.2));
      const fx = ph < maxX ? ph : maxX - (ph - maxX);
      if (fx < 0) continue;
      electrons.push(<circle key={k} cx={190 + fx * 170} cy={150 + (seed - 0.5) * 60} r={3} fill={C.blue} opacity={0.9} />);
    }
  }
  const pts: string[] = [];
  for (let x = 0; x <= 2.5; x += 0.05) {
    const i = photoCurrent(lambda, phi, x);
    pts.push(`${pts.length ? 'L' : 'M'} ${400 + (x / 2.5) * 210} ${310 - (i / 2.6) * 100}`);
  }
  return (
    <SceneFrame label="Photoelectric effect apparatus">
      {/* lamp + filter */}
      <circle cx={60} cy={80} r={22} fill="url(#pr-glow)" />
      <circle cx={60} cy={80} r={10} fill="#fef9c3" />
      <rect x={96} y={62} width={10} height={36} fill={color} opacity={0.8} />
      <Txt x={101} y={54} size={9.5}>{lambda} nm</Txt>
      <path d="M 106 72 L 180 125 L 180 175 L 106 88 Z" fill={color} opacity={0.25} />
      {/* tube */}
      <ellipse cx={275} cy={150} rx={130} ry={80} fill={C.glass} stroke={C.steelDark} strokeWidth={1.4} />
      <path d="M 180 105 Q 200 150 180 195" fill="none" stroke={C.steelDark} strokeWidth={8} />
      <Txt x={170} y={215} size={9.5}>{bn ? 'ক্যাথোড' : 'Cathode'}</Txt>
      <line x1={365} y1={110} x2={365} y2={190} stroke={C.steelDark} strokeWidth={4} />
      <Txt x={375} y={215} size={9.5}>{bn ? 'অ্যানোড' : 'Anode'}</Txt>
      {electrons}
      {/* circuit */}
      <Wire d="M 180 195 L 180 290 L 230 290 M 290 290 L 365 290 L 365 190" />
      <Dial x={260} y={280} r={28} value={I} min={0} max={2.5} label="µA" unit="" digits={3} good={emits && I === 0} />
      <Dial x={60} y={240} r={30} value={v} min={0} max={2.5} label={bn ? 'প্রতিরোধী V' : 'Retarding V'} unit="V" digits={2} />
      {/* I–V plot */}
      <rect x={390} y={190} width={230} height={140} rx={8} fill={C.surface} stroke={C.line} />
      <line x1={400} y1={310} x2={612} y2={310} stroke={C.muted} />
      <path d={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} />
      <circle cx={400 + (v / 2.5) * 210} cy={310 - (I / 2.6) * 100} r={4.5} fill={C.red} />
      {emits && <line x1={400 + (v0 / 2.5) * 210} x2={400 + (v0 / 2.5) * 210} y1={200} y2={312} stroke={C.green} strokeDasharray="3 3" />}
      <Txt x={505} y={204} size={9}>{bn ? 'ফটোকারেন্ট বনাম প্রতিরোধী বিভব' : 'Photocurrent vs retarding V'}</Txt>
      <Digital x={430} y={40} w={180} text={`Φ = ${phi.toFixed(2)} eV`} label={bn ? 'কার্যাপেক্ষক' : 'Work function'} />
      <Digital x={430} y={110} w={180} text={emits ? `${fmt(stoppingPotential(lambda, phi) > 0 ? I : 0, 3)} µA` : 'no emission'} label={bn ? 'ফটোকারেন্ট' : 'Photocurrent'} good={emits && I === 0} />
    </SceneFrame>
  );
}

export function GmCounterScene({ view, t, setParam, bn }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const r = num(view, 'r');
  const rate = num(view, 'rate');
  const gx = 90;
  const sc = 15;
  const sx = gx + r * sc;
  const win = 6; // 1 simulated minute every 6 s
  const ph = (t % win) / win;
  const counts = Math.floor(rate * ph);
  // flash if a pseudo-random click falls in this frame
  const clickRate = rate / 60 / (win / 60);
  const flash = Math.sin(t * clickRate * 6.283 + Math.sin(t * 13) * 3) > 0.92;
  return (
    <SceneFrame ref={ref} label="GM counter and radioactive source">
      <rect x={40} y={140} width={50} height={40} rx={6} fill={C.steelDark} />
      <rect x={gx - 2} y={148} width={14} height={24} rx={4} fill={flash ? '#facc15' : C.steel} />
      <Txt x={65} y={200} size={9.5}>{bn ? 'GM টিউব' : 'GM tube'}</Txt>
      <rect x={gx} y={196} width={30 * sc} height={8} rx={3} fill="url(#pr-metal)" />
      {Array.from({ length: 31 }).map((_, k) => (
        <g key={k}>
          <line x1={gx + k * sc} x2={gx + k * sc} y1={204} y2={k % 5 === 0 ? 214 : 209} stroke={C.ink} strokeWidth={0.8} />
          {k % 5 === 0 && <Txt x={gx + k * sc} y={226} size={8.5}>{k}</Txt>}
        </g>
      ))}
      <Txt x={gx + 30 * sc + 14} y={226} size={8.5}>cm</Txt>
      {/* source */}
      <rect x={sx - 10} y={150} width={20} height={44} rx={4} fill={C.amber} />
      <path d={`M ${sx - 6} 160 l 6 -8 l 6 8 z`} fill={C.ink} />
      <Txt x={sx} y={140} size={9.5} color={C.ink}>☢</Txt>
      {Array.from({ length: 6 }).map((_, k) => {
        const p = (t * 1.4 + k / 6) % 1;
        return <circle key={k} cx={sx - 12 - p * (sx - gx - 24)} cy={170 + Math.sin(k * 7) * 10 * p} r={2} fill={C.violet} opacity={1 - p} />;
      })}
      <rect x={sx - 24} y={130} width={48} height={70} fill="transparent" {...drag((pt) => setParam('r', Math.round((pt.x - gx) / sc)))} />
      <Grip x={sx} y={186} color={C.amber} />
      <Txt x={sx} y={250} size={10.5} color={C.ink} weight={800}>r = {r} cm</Txt>
      {/* counter */}
      <rect x={60} y={40} width={250} height={70} rx={10} fill={C.steelDark} />
      <Digital x={75} y={62} w={120} text={`${counts}`} label="" />
      <Txt x={135} y={56} size={9} color="#e2e8f0">{bn ? 'গণনা (১ মিনিট)' : 'Counts (1 min)'}</Txt>
      <rect x={210} y={62} width={86} height={30} rx={6} fill="#0f172a" />
      <rect x={214} y={66} width={78 * ph} height={22} rx={4} fill={C.green} opacity={0.7} />
      <Txt x={253} y={56} size={9} color="#e2e8f0">{bn ? 'সময়' : 'timer'}</Txt>
      <Digital x={430} y={50} w={180} text={`${Math.round(rate)} cpm`} label={bn ? 'গণনার হার (পটভূমিসহ)' : 'Count rate (incl. background)'} />
      <Txt x={320} y={300} size={10.5}>{bn ? 'উৎস টেনে দূরত্ব বদলাও — দূরত্ব দ্বিগুণ হলে গণনা ¼ হয়' : 'Drag the source — doubling r cuts the count to ¼'}</Txt>
    </SceneFrame>
  );
}
