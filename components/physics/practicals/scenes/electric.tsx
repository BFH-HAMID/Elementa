'use client';

import React, { useRef } from 'react';
import { Battery, C, CurrentDots, Dial, Grip, PlugKey, Resistor, Rheostat, Ruler, SceneFrame, Txt, Wire, fmt, num, useSvgDrag, type SceneProps } from '../primitives';

/* ------------------------------------------------------------------ */
/* Circuit boards                                                       */
/* ------------------------------------------------------------------ */

export function CircuitScene(props: SceneProps) {
  const { model } = props;
  if (model.variant === 'kirchhoff') return <KirchhoffBoard {...props} />;
  if (model.variant === 'transformer') return <TransformerBoard {...props} />;
  if (model.variant === 'lcr') return <LcrBoard {...props} />;
  return <SeriesParallelBoard {...props} />;
}

function SeriesParallelBoard({ view, t, bn }: SceneProps) {
  const combo = num(view, 'combo');
  const I = num(view, 'current');
  const V = num(view, 'voltage');
  const r1 = num(view, 'r1');
  const r2 = num(view, 'r2');
  const speed = I * 12;
  const top = 80;
  const bottom = 290;
  return (
    <SceneFrame label="Series and parallel resistor circuit">
      {/* main loop */}
      <Wire d={`M 70 ${top} L 250 ${top}`} />
      <Wire d={`M 530 ${top} L 570 ${top} L 570 ${bottom} L 70 ${bottom} L 70 ${top}`} />
      {combo === 0 ? (
        <>
          <Resistor x1={250} y1={top} x2={385} y2={top} label={`R₁ = ${r1} Ω`} />
          <Resistor x1={395} y1={top} x2={530} y2={top} label={`R₂ = ${r2} Ω`} />
          <Wire d={`M 385 ${top} L 395 ${top}`} />
          <CurrentDots points={[[70, bottom], [70, top], [570, top], [570, bottom], [70, bottom]]} speed={speed} t={t} />
        </>
      ) : (
        <>
          <Wire d={`M 250 ${top} L 300 ${top} L 300 ${top - 40} M 300 ${top} L 300 ${top + 40}`} />
          <Wire d={`M 530 ${top} L 480 ${top} L 480 ${top - 40} M 480 ${top} L 480 ${top + 40}`} />
          <Resistor x1={300} y1={top - 40} x2={480} y2={top - 40} label={`R₁ = ${r1} Ω`} />
          <Resistor x1={300} y1={top + 40} x2={480} y2={top + 40} label={`R₂ = ${r2} Ω`} />
          <CurrentDots points={[[70, bottom], [70, top], [300, top]]} speed={speed} t={t} />
          <CurrentDots points={[[300, top - 40], [480, top - 40]]} speed={num(view, 'i1') * 12} t={t} />
          <CurrentDots points={[[300, top + 40], [480, top + 40]]} speed={num(view, 'i2') * 12} t={t} />
          <CurrentDots points={[[480, top], [570, top], [570, bottom], [70, bottom]]} speed={speed} t={t} />
        </>
      )}
      {/* voltmeter across combination */}
      <Wire d={`M 250 ${top} L 250 200 L 355 200`} dash="5 4" color={C.blue} />
      <Wire d={`M 530 ${top} L 530 200 L 425 200`} dash="5 4" color={C.blue} />
      <Dial x={390} y={205} value={V} min={0} max={12} label={bn ? 'ভোল্টমিটার' : 'Voltmeter'} unit="V" />
      {/* ammeter */}
      <Dial x={160} y={top + 6} value={I * 1000} min={0} max={500} label={bn ? 'অ্যামিটার' : 'Ammeter'} unit="mA" digits={1} />
      {/* battery & rheostat */}
      <rect x={180} y={bottom - 22} width={50} height={44} fill={C.surface} opacity={0} />
      <g transform={`translate(205 ${bottom})`}>
        <rect x={-14} y={-18} width={28} height={36} fill={C.surface} />
        <Battery x={0} y={0} label={bn ? 'ব্যাটারি' : 'Battery'} />
      </g>
      <Rheostat x={332} y={bottom} w={116} frac={num(view, 'emf') / 12} label={`${bn ? 'রিওস্ট্যাট' : 'Rheostat'} · ${fmt(num(view, 'emf'), 1)} V`} />
      <Txt x={390} y={top - 62} size={11} color={C.ink} weight={800}>
        {combo === 0 ? (bn ? 'সিরিজ সমবায়' : 'Series combination') : bn ? 'প্যারালাল সমবায়' : 'Parallel combination'}
      </Txt>
    </SceneFrame>
  );
}

function KirchhoffBoard({ view, t, bn }: SceneProps) {
  const i1 = num(view, 'i1');
  const i2 = num(view, 'i2');
  const i3 = num(view, 'i3');
  const check = num(view, 'check');
  const top = 70;
  const bot = 290;
  const xl = 110;
  const xm = 320;
  const xr = 530;
  return (
    <SceneFrame label="Kirchhoff two-loop circuit">
      {check === 1 && <rect x={xl} y={top} width={xm - xl} height={bot - top} fill={C.blue} opacity={0.08} />}
      {check === 2 && <rect x={xm} y={top} width={xr - xm} height={bot - top} fill={C.violet} opacity={0.08} />}
      <Wire d={`M ${xl} ${top} L ${xr} ${top} M ${xl} ${bot} L ${xr} ${bot}`} />
      <Wire d={`M ${xl} ${top} L ${xl} 130 M ${xl} 165 L ${xl} 190 M ${xl} 250 L ${xl} ${bot}`} />
      <Wire d={`M ${xr} ${top} L ${xr} 130 M ${xr} 165 L ${xr} 190 M ${xr} 250 L ${xr} ${bot}`} />
      <Wire d={`M ${xm} ${top} L ${xm} 140 M ${xm} 220 L ${xm} ${bot}`} />
      <g transform={`translate(${xl} 148) rotate(90)`}>
        <rect x={-18} y={-16} width={36} height={32} fill={C.surface} opacity={0.9} />
        <Battery x={0} y={0} />
      </g>
      <Txt x={xl - 28} y={152} size={11} color={C.ink} anchor="end">E₁ {fmt(num(view, 'e1'), 1)} V</Txt>
      <g transform={`translate(${xr} 148) rotate(90)`}>
        <rect x={-18} y={-16} width={36} height={32} fill={C.surface} opacity={0.9} />
        <Battery x={0} y={0} />
      </g>
      <Txt x={xr + 28} y={152} size={11} color={C.ink} anchor="start">E₂ {fmt(num(view, 'e2'), 1)} V</Txt>
      <Resistor x1={xl} y1={190} x2={xl} y2={250} label={`R₁ ${num(view, 'r1')} Ω`} />
      <Resistor x1={xr} y1={190} x2={xr} y2={250} label={`R₂ ${num(view, 'r2')} Ω`} />
      <Resistor x1={xm} y1={140} x2={xm} y2={220} label={`R₃ ${num(view, 'r3')} Ω`} />
      <CurrentDots points={[[xl, bot], [xl, top], [xm, top]]} speed={i1 * 40} t={t} />
      <CurrentDots points={[[xr, bot], [xr, top], [xm, top]]} speed={i2 * 40} t={t} />
      <CurrentDots points={[[xm, top], [xm, bot]]} speed={i3 * 40} t={t} />
      <CurrentDots points={[[xm, bot], [xl, bot]]} speed={i1 * 40} t={t} />
      <CurrentDots points={[[xm, bot], [xr, bot]]} speed={i2 * 40} t={t} />
      <circle cx={xm} cy={top} r={check === 0 ? 9 : 5} fill={check === 0 ? C.green : C.ink} opacity={check === 0 ? 0.9 : 1} />
      <Txt x={xm} y={top - 14} size={12} color={C.ink} weight={900}>A</Txt>
      <circle cx={xm} cy={bot} r={5} fill={C.ink} />
      <Txt x={xm} y={bot + 20} size={12} color={C.ink} weight={900}>B</Txt>
      <Txt x={(xl + xm) / 2} y={top - 10} size={10.5} color={C.blue}>I₁ = {fmt(i1 * 1000, 1)} mA →</Txt>
      <Txt x={(xm + xr) / 2} y={top - 10} size={10.5} color={C.violet}>← I₂ = {fmt(i2 * 1000, 1)} mA</Txt>
      <Txt x={xm + 14} y={250} size={10.5} color={C.green} anchor="start">I₃ = {fmt(i3 * 1000, 1)} mA ↓</Txt>
      <Txt x={320} y={342} size={10.5}>
        {check === 0
          ? bn ? 'KCL: সংযোগ A তে আগত প্রবাহ = নির্গত প্রবাহ' : 'KCL at A: current in = current out'
          : check === 1
            ? bn ? 'KVL লুপ ১: E₁ = I₁R₁ + I₃R₃' : 'KVL loop 1: E₁ = I₁R₁ + I₃R₃'
            : bn ? 'KVL লুপ ২: E₂ = I₂R₂ + I₃R₃' : 'KVL loop 2: E₂ = I₂R₂ + I₃R₃'}
      </Txt>
    </SceneFrame>
  );
}

function coilPath(x: number, y1: number, y2: number, turns: number, w: number) {
  let d = `M ${x} ${y1}`;
  const h = (y2 - y1) / turns;
  for (let i = 0; i < turns; i++) d += ` c ${w} 0 ${w} ${h} 0 ${h}`;
  return d;
}

function TransformerBoard({ view, t, bn }: SceneProps) {
  const vp = num(view, 'vp');
  const vs = num(view, 'vs');
  const ratio = num(view, 'ratio');
  const ns = Math.round(10 * ratio);
  const phase = Math.sin(t * 6);
  return (
    <SceneFrame label="Transformer with primary and secondary coils">
      {/* core */}
      <path d="M 250 90 h 140 v 180 h -140 z M 275 115 h 90 v 130 h -90 z" fill="#64748b" fillRule="evenodd" opacity={0.85} />
      <path d={coilPath(250, 110, 250, 10, -28)} fill="none" stroke={C.copper} strokeWidth={3} />
      <path d={coilPath(390, 110 + (10 - Math.min(ns, 20)) * 3, 250, Math.max(2, Math.min(ns, 20)), 28)} fill="none" stroke={C.copper} strokeWidth={ns > 12 ? 2 : 3} />
      <Txt x={232} y={80} size={10.5} color={C.ink}>Np = 500</Txt>
      <Txt x={410} y={80} size={10.5} color={C.ink}>Ns = {Math.round(500 * ratio)}</Txt>
      {/* primary circuit */}
      <Wire d="M 250 110 L 150 110 L 150 160 M 150 220 L 150 250 L 250 250" />
      <circle cx={150} cy={190} r={26} fill={C.surface} stroke={C.ink} strokeWidth={2} />
      <path d={`M 134 190 q 8 ${-14 * (0.6 + 0.4 * phase)} 16 0 t 16 0`} fill="none" stroke={C.blue} strokeWidth={2} />
      <Txt x={150} y={232} size={9.5}>AC</Txt>
      <Dial x={70} y={150} value={vp} min={0} max={24} label="Vp" unit="V" digits={1} />
      <Wire d="M 104 150 L 150 150 M 104 175 L 120 175 L 120 250 L 150 250" dash="4 3" color={C.blue} />
      {/* secondary */}
      <Wire d="M 390 110 L 500 110 L 500 140 M 500 230 L 500 250 L 390 250" />
      <Dial x={540} y={180} r={38} value={vs} min={0} max={Math.max(10, 24 * ratio)} label="Vs" unit="V" digits={2} />
      <Txt x={320} y={300} size={12} color={C.ink} weight={800}>
        {ratio > 1 ? (bn ? 'স্টেপ-আপ ট্রান্সফরমার' : 'Step-up transformer') : bn ? 'স্টেপ-ডাউন ট্রান্সফরমার' : 'Step-down transformer'}
      </Txt>
      <Txt x={320} y={320} size={10.5}>Vs / Vp = Ns / Np = {ratio}</Txt>
      {/* flux arrows */}
      {[0, 1, 2, 3].map((k) => {
        const p = ((t * 0.8 + k / 4) % 1) * 4;
        const pts: [number, number][] = [
          [262, 102],
          [378, 102],
          [378, 258],
          [262, 258]
        ];
        const seg = Math.floor(p);
        const f = p - seg;
        const a = pts[seg % 4];
        const b = pts[(seg + 1) % 4];
        return <circle key={k} cx={a[0] + (b[0] - a[0]) * f} cy={a[1] + (b[1] - a[1]) * f} r={3} fill="#fde68a" opacity={0.6 + 0.4 * Math.abs(phase)} />;
      })}
    </SceneFrame>
  );
}

function LcrBoard({ view, t, bn }: SceneProps) {
  const f = num(view, 'f');
  const I = num(view, 'i');
  const L = 0.1;
  const Cc = 0.25e-6;
  const R = 100;
  const curve: string[] = [];
  const px = (fr: number) => 360 + ((fr - 300) / 1700) * 250;
  const py = (i: number) => 300 - (i / 0.05) * 170;
  for (let fr = 300; fr <= 2000; fr += 10) {
    const w = 2 * Math.PI * fr;
    const z = Math.sqrt(R * R + Math.pow(w * L - 1 / (w * Cc), 2));
    curve.push(`${fr === 300 ? 'M' : 'L'} ${px(fr).toFixed(1)} ${py(5 / z).toFixed(1)}`);
  }
  return (
    <SceneFrame label="Series LCR circuit with resonance curve">
      <Wire d="M 40 90 L 320 90 L 320 280 L 40 280 Z" />
      <rect x={80} y={78} width={60} height={24} fill={C.surface} />
      <Resistor x1={70} y1={90} x2={150} y2={90} label="R 100 Ω" />
      <rect x={175} y={78} width={70} height={24} fill={C.surface} />
      <path d="M 175 90 c 0 -16 12 -16 12 0 c 0 -16 12 -16 12 0 c 0 -16 12 -16 12 0 c 0 -16 12 -16 12 0 c 0 -16 12 -16 12 0" fill="none" stroke={C.copper} strokeWidth={2.4} />
      <Txt x={207} y={70} size={10} color={C.ink}>L 0.1 H</Txt>
      <rect x={262} y={75} width={30} height={30} fill={C.surface} />
      <line x1={272} y1={76} x2={272} y2={104} stroke={C.ink} strokeWidth={3} />
      <line x1={282} y1={76} x2={282} y2={104} stroke={C.ink} strokeWidth={3} />
      <Txt x={277} y={70} size={10} color={C.ink}>C 0.25 µF</Txt>
      <circle cx={40} cy={185} r={26} fill={C.surface} stroke={C.ink} strokeWidth={2} />
      <path d={`M 24 185 q 8 -14 16 0 t 16 0`} fill="none" stroke={C.blue} strokeWidth={2} />
      <Txt x={40} y={228} size={9.5}>{fmt(f, 0)} Hz</Txt>
      <Dial x={200} y={250} value={I * 1000} min={0} max={50} label={bn ? 'অ্যামিটার' : 'Ammeter'} unit="mA" digits={1} good={Math.abs(f - 1006.6) < 25} />
      <CurrentDots points={[[40, 280], [40, 90], [320, 90], [320, 280], [40, 280]]} speed={Math.sin(t * 8) * I * 60} t={t} />
      {/* resonance curve */}
      <rect x={350} y={110} width={270} height={210} rx={10} fill={C.surface} stroke={C.line} />
      <line x1={360} y1={300} x2={612} y2={300} stroke={C.muted} />
      <line x1={360} y1={300} x2={360} y2={120} stroke={C.muted} />
      <path d={curve.join(' ')} fill="none" stroke={C.blue} strokeWidth={2} opacity={0.75} />
      <line x1={px(f)} x2={px(f)} y1={120} y2={300} stroke={C.red} strokeDasharray="4 3" />
      <circle cx={px(f)} cy={py(I)} r={5} fill={C.red} />
      <Txt x={486} y={130} size={10} color={C.ink}>{bn ? 'প্রবাহ বনাম কম্পাঙ্ক' : 'Current vs frequency'}</Txt>
      <Txt x={606} y={314} size={9} anchor="end">f (Hz)</Txt>
      <Txt x={366} y={124} size={9} anchor="start">I</Txt>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Meter bridge & potentiometer                                         */
/* ------------------------------------------------------------------ */

export function WireBoardScene(props: SceneProps) {
  if (props.model.variant === 'meterBridge') return <MeterBridgeBoard {...props} />;
  return <PotentiometerBoard {...props} />;
}

function Jockey({ x, y, good }: { x: number; y: number; good: boolean }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path d={`M ${x} ${y} l -7 -20 h 14 z`} fill={good ? C.green : C.ink} />
      <rect x={x - 9} y={y - 34} width={18} height={15} rx={4} fill={good ? C.green : C.blueDark} />
    </g>
  );
}

function MeterBridgeBoard({ view, setParam, bn, params }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const x0 = 70;
  const x1 = 570;
  const wy = 228;
  const l = num(view, 'l');
  const jx = x0 + ((x1 - x0) * l) / 100;
  const defl = num(view, 'deflection');
  const balanced = num(view, 'balanced') === 1;
  const toL = (x: number) => ((x - x0) / (x1 - x0)) * 100;
  return (
    <SceneFrame ref={ref} label="Meter bridge">
      <rect x={40} y={90} width={560} height={210} rx={10} fill="url(#pr-wood)" opacity={0.92} />
      {/* copper strips */}
      <path d={`M ${x0} ${wy} V 120 H 190 M 260 120 H 380 M 450 120 H ${x1} V ${wy}`} fill="none" stroke="url(#pr-copper)" strokeWidth={8} strokeLinecap="square" />
      {/* resistance box (left gap) */}
      <rect x={190} y={104} width={70} height={32} rx={5} fill="#1f2937" />
      <Txt x={225} y={124} size={10.5} color="#fde68a" mono>R={params.R}Ω</Txt>
      {/* unknown X (right gap) */}
      <rect x={380} y={110} width={70} height={20} fill={C.surface} opacity={0.9} rx={4} />
      <Resistor x1={380} y1={120} x2={450} y2={120} label="" />
      <Txt x={415} y={146} size={10.5} color={C.ink}>X = ?</Txt>
      {/* galvanometer */}
      <Dial x={320} y={60} r={32} value={defl} min={-30} max={30} label={bn ? 'গ্যালভানোমিটার' : 'Galvanometer'} unit="div" digits={1} centerZero good={balanced} />
      <Wire d={`M 320 120 L 320 ${60 + 34}`} />
      <Wire d={`M 320 120 L 320 128 Q ${(320 + jx) / 2} 175 ${jx} ${wy - 34}`} color={C.blueDark} width={1.6} />
      {/* wire + scale */}
      <line x1={x0} y1={wy} x2={x1} y2={wy} stroke="#cbd5e1" strokeWidth={2.5} />
      <Ruler x1={x0} x2={x1} y={wy + 12} from={0} to={100} major={10} minor={1} unit="cm" />
      {/* battery and key */}
      <Wire d={`M ${x0} ${wy} L ${x0} 330 L 280 330 M 360 330 L ${x1} 330 L ${x1} ${wy}`} color={C.ink} />
      <g transform="translate(292 330)">
        <rect x={-34} y={-16} width={58} height={32} fill={C.surface} />
        <Battery x={0} y={0} />
      </g>
      <PlugKey x={352} y={330} closed />
      <Txt x={x0} y={wy - 8} size={11} color={C.ink} weight={900}>A</Txt>
      <Txt x={x1} y={wy - 8} size={11} color={C.ink} weight={900}>C</Txt>
      {/* jockey + drag zone */}
      <Jockey x={jx} y={wy} good={balanced} />
      <Txt x={jx} y={wy - 40} size={10} color={balanced ? C.green : C.ink} weight={800}>l = {fmt(l, 1)} cm</Txt>
      <rect
        x={x0 - 10}
        y={wy - 50}
        width={x1 - x0 + 20}
        height={70}
        fill="transparent"
        {...drag((pt) => setParam('l', Math.round(toL(pt.x) * 10) / 10))}
      />
      <Grip x={jx} y={wy} color={balanced ? C.green : C.blue} />
    </SceneFrame>
  );
}

function PotentiometerBoard({ model, view, setParam, bn, params }: SceneProps) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag(ref);
  const x0 = 60;
  const x1 = 580;
  const wy = 200;
  const px = (cm: number) => x0 + ((x1 - x0) * cm) / 1000;
  const toCm = (x: number) => ((x - x0) / (x1 - x0)) * 1000;
  const l1 = num(view, 'l1');
  const l2 = num(view, 'l2');
  const b1 = num(view, 'b1') === 1;
  const b2 = num(view, 'b2') === 1;
  const isEmf = model.variant === 'potEmf';
  const label1 = isEmf ? 'E₁ (1.45 V)' : bn ? 'কোষ E (চাবি খোলা)' : 'Cell E (key open)';
  const label2 = isEmf ? 'E₂ (1.00 V)' : bn ? `কোষ + শান্ট R=${params.R}Ω` : `Cell + shunt R=${params.R}Ω`;
  return (
    <SceneFrame ref={ref} label="Potentiometer">
      <rect x={30} y={150} width={580} height={110} rx={10} fill="url(#pr-wood)" opacity={0.92} />
      {/* driver circuit */}
      <Wire d={`M ${x0} ${wy} L ${x0} 40 L 250 40 M 330 40 L 420 40 M 520 40 L ${x1} 40 L ${x1} ${wy}`} />
      <g transform="translate(290 40)">
        <rect x={-22} y={-15} width={44} height={30} fill={C.surface} />
        <Battery x={0} y={0} label={bn ? 'ড্রাইভার 2 V' : 'Driver 2 V'} />
      </g>
      <PlugKey x={375} y={40} closed label={bn ? 'চাবি' : 'Key'} />
      <Rheostat x={422} y={40} w={96} frac={0.45} label={isEmf ? `Rh = ${params.rh} Ω` : 'Rh = 0.5 Ω'} />
      {/* wire */}
      <line x1={x0} y1={wy} x2={x1} y2={wy} stroke="#cbd5e1" strokeWidth={2.5} />
      <Ruler x1={x0} x2={x1} y={wy + 12} from={0} to={1000} major={100} minor={20} unit="cm" />
      {/* test circuits */}
      <Dial x={170} y={108} r={30} value={num(view, 'd1')} min={-30} max={30} label="G₁" unit="" digits={1} centerZero good={b1} />
      <Dial x={450} y={108} r={30} value={num(view, 'd2')} min={-30} max={30} label="G₂" unit="" digits={1} centerZero good={b2} />
      <Wire d={`M ${x0} ${wy} L ${x0} 150 L 110 150 L 110 120 L 138 120`} color={C.blueDark} width={1.6} />
      <Wire d={`M ${x0} 150 L 390 150 L 390 120 L 418 120`} color={C.violet} width={1.6} dash="0" />
      <g transform="translate(110 142)">
        <rect x={-16} y={-12} width={32} height={24} fill="url(#pr-wood)" />
        <Battery x={0} y={0} />
      </g>
      <g transform="translate(390 142)">
        <rect x={-16} y={-12} width={32} height={24} fill="url(#pr-wood)" />
        <Battery x={0} y={0} />
      </g>
      <Txt x={110} y={92} size={10} color={C.ink} anchor="middle">{label1}</Txt>
      <Txt x={390} y={92} size={10} color={C.ink} anchor="middle">{label2}</Txt>
      <Wire d={`M 202 120 Q ${(202 + px(l1)) / 2} 140 ${px(l1)} ${wy - 34}`} color={C.blueDark} width={1.6} />
      <Wire d={`M 482 120 Q ${(482 + px(l2)) / 2} 140 ${px(l2)} ${wy - 34}`} color={C.violet} width={1.6} />
      <Jockey x={px(l1)} y={wy} good={b1} />
      <Jockey x={px(l2)} y={wy} good={b2} />
      <Txt x={px(l1)} y={wy + 52} size={10} color={b1 ? C.green : C.blueDark} weight={800}>l₁ {fmt(l1, 1)}</Txt>
      <Txt x={px(l2)} y={wy + 52} size={10} color={b2 ? C.green : C.violet} weight={800}>l₂ {fmt(l2, 1)}</Txt>
      {/* drag handles: grab the jockey heads */}
      <rect x={px(l1) - 16} y={wy - 42} width={32} height={50} fill="transparent" {...drag((pt) => setParam('l1', Math.round(toCm(pt.x) * 2) / 2))} />
      <rect x={px(l2) - 16} y={wy - 42} width={32} height={50} fill="transparent" {...drag((pt) => setParam('l2', Math.round(toCm(pt.x) * 2) / 2))} />
      <Grip x={px(l1)} y={wy - 26} color={b1 ? C.green : C.blueDark} />
      <Grip x={px(l2)} y={wy - 26} color={b2 ? C.green : C.violet} />
      <Txt x={320} y={300} size={10}>{bn ? 'জকির মাথা ধরে তারের উপর টানো' : 'Drag a jockey head along the wire'}</Txt>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Faraday induction                                                    */
/* ------------------------------------------------------------------ */

export function InductionScene({ view, t, bn }: SceneProps) {
  const sign = num(view, 'sign');
  const speed = num(view, 'speed');
  const inward = num(view, 'inward') === 1;
  const pole = String(view.pole ?? 'N');
  // motion cycle: move for 1 unit, rest 0.6
  const cycle = 1.6;
  const ph = (t * Math.max(0.4, speed / 2)) % cycle;
  const moving = sign !== 0 && ph < 1;
  const f = Math.min(1, ph);
  const far = 60;
  const near = 230;
  const pos = sign === 0 ? 150 : inward ? far + (near - far) * f : near - (near - far) * f;
  const defl = moving ? num(view, 'deflection') : 0;
  return (
    <SceneFrame label="Magnet and coil induction">
      {/* coil */}
      <rect x={300} y={130} width={170} height={70} rx={10} fill={C.glass} stroke={C.steelDark} />
      {Array.from({ length: 16 }).map((_, i) => (
        <ellipse key={i} cx={308 + i * 10} cy={165} rx={6} ry={38} fill="none" stroke={C.copper} strokeWidth={2.2} />
      ))}
      <Txt x={385} y={225} size={10.5}>{bn ? 'কয়েল (N = 500)' : 'Coil (N = 500)'}</Txt>
      {/* magnet */}
      <g transform={`translate(${pos} 150)`}>
        <rect x={0} y={0} width={45} height={30} fill={pole === 'N' ? C.steel : C.red} />
        <rect x={45} y={0} width={45} height={30} fill={pole === 'N' ? C.red : C.steel} />
        <Txt x={22} y={20} size={13} color="#fff" weight={900}>{pole === 'N' ? 'S' : 'N'}</Txt>
        <Txt x={67} y={20} size={13} color="#fff" weight={900}>{pole}</Txt>
      </g>
      {moving && (
        <path
          d={inward ? `M ${pos + 20} 125 l 50 0` : `M ${pos + 70} 125 l -50 0`}
          stroke={C.blue}
          strokeWidth={3}
          markerEnd="url(#pr-arrow)"
          color={C.blue}
        />
      )}
      {/* galvanometer */}
      <Wire d="M 470 140 L 520 140 L 520 110 M 470 190 L 560 190 L 560 110" />
      <Dial x={540} y={80} r={36} value={defl} min={-30} max={30} label={bn ? 'গ্যালভানোমিটার' : 'Galvanometer'} unit="div" digits={1} centerZero good={moving} />
      {/* field lines */}
      {[0, 1, 2].map((k) => (
        <ellipse key={k} cx={pos + 45} cy={165} rx={70 + k * 22} ry={28 + k * 14} fill="none" stroke={C.blue} strokeDasharray="3 5" opacity={0.25} />
      ))}
      <Txt x={320} y={300} size={11} color={C.ink}>
        {sign === 0
          ? bn ? 'চুম্বক স্থির — ফ্লাক্স পরিবর্তন নেই, বিক্ষেপ নেই' : 'Magnet at rest — no change of flux, no deflection'
          : bn ? 'ফ্লাক্সের পরিবর্তনের হার ∝ দ্রুতি → আবিষ্ট EMF' : 'Rate of change of flux ∝ speed → induced EMF'}
      </Txt>
    </SceneFrame>
  );
}
