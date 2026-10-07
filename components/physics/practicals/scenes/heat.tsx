'use client';

import React from 'react';
import { waterDensity } from '@/engine/practicals/heat';
import { C, Dial, Digital, SceneFrame, Thermometer, Txt, Wire, fmt, num, type SceneProps } from '../primitives';

const ROOM = 25;

function hotColor(temp: number) {
  const f = Math.min(1, Math.max(0, (temp - 25) / 75));
  const r = Math.round(148 + f * (239 - 148));
  const g = Math.round(163 - f * (163 - 68));
  const b = Math.round(184 - f * (184 - 68));
  return `rgb(${r},${g},${b})`;
}

function Calorimeter({ x, y, w = 130, h = 150, level = 0.6, temp = 25, children }: { x: number; y: number; w?: number; h?: number; level?: number; temp?: number; children?: React.ReactNode }) {
  return (
    <g>
      <rect x={x - 16} y={y - 14} width={w + 32} height={h + 26} rx={10} fill="url(#pr-wood)" opacity={0.9} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill="url(#pr-copper)" />
      <rect x={x + 5} y={y + h * (1 - level)} width={w - 10} height={h * level - 5} rx={4} fill={C.water} opacity={0.55 + Math.min(0.3, (temp - 25) / 150)} />
      {children}
    </g>
  );
}

function MiniPlot({ x, y, w, h, series, yMin, yMax, label, xLabel }: { x: number; y: number; w: number; h: number; series: { pts: [number, number][]; color: string }[]; yMin: number; yMax: number; label: string; xLabel?: string }) {
  const allX = series.flatMap((s) => s.pts.map((p) => p[0]));
  const xMax = Math.max(1, ...allX);
  const px = (v: number) => x + 8 + (v / xMax) * (w - 16);
  const py = (v: number) => Math.min(y + h - 14, Math.max(y + 16, y + h - 14 - ((v - yMin) / (yMax - yMin || 1)) * (h - 30)));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={C.surface} stroke={C.line} />
      <line x1={x + 8} y1={y + h - 14} x2={x + w - 6} y2={y + h - 14} stroke={C.muted} />
      <line x1={x + 8} y1={y + h - 14} x2={x + 8} y2={y + 12} stroke={C.muted} />
      {series.map((s, i) => (
        <path key={i} d={s.pts.map((p, k) => `${k ? 'L' : 'M'} ${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2} />
      ))}
      <Txt x={x + w / 2} y={y + 12} size={9}>{label}</Txt>
      {xLabel && <Txt x={x + w - 8} y={y + h - 3} size={8.5} anchor="end">{xLabel}</Txt>}
    </g>
  );
}

export function CalorimeterScene(props: SceneProps) {
  const v = props.model.variant;
  if (v === 'joule') return <JouleCalorimeter {...props} />;
  if (v === 'ice') return <IceCalorimeter {...props} />;
  if (v === 'cooling') return <CoolingCalorimeters {...props} />;
  return <MixtureCalorimeter {...props} />;
}

function Stirrer({ x, y, t, h }: { x: number; y: number; t: number; h: number }) {
  const dy = Math.sin(t * 5) * 8;
  return (
    <g>
      <line x1={x} y1={y - 30 + dy} x2={x} y2={y + h + dy} stroke={C.steelDark} strokeWidth={2} />
      <line x1={x - 18} y1={y + h + dy} x2={x + 18} y2={y + h + dy} stroke={C.steelDark} strokeWidth={3} />
    </g>
  );
}

function MixtureCalorimeter({ view, t, bn }: SceneProps) {
  const tw = num(view, 'tWater');
  const ts = num(view, 'tSample');
  const tf = num(view, 'tf');
  const el = num(view, 'elapsed');
  const fallF = Math.min(1, el / 0.7);
  const sampleY = 30 + fallF * (238 - 30);
  const pts: [number, number][] = [];
  for (let k = 0; k <= 30; k++) {
    const tt = (Math.max(el, 6) * k) / 30;
    if (tt > el) break;
    pts.push([tt, tf + (ROOM - tf) * Math.exp(-tt / 1.4)]);
  }
  return (
    <SceneFrame label="Calorimeter — method of mixtures">
      <Calorimeter x={110} y={130} level={0.7} temp={tw} />
      <Stirrer x={150} y={140} t={t} h={110} />
      <Thermometer x={210} y={60} h={170} temp={tw} min={0} max={110} />
      <rect x={160} y={sampleY - 12} width={34} height={24} rx={5} fill={hotColor(ts)} stroke={C.steelDark} />
      {fallF < 1 && <Txt x={250} y={sampleY} size={10} color={C.red} anchor="start">{bn ? 'গরম নমুনা' : 'hot sample'} {fmt(ts, 0)}°C</Txt>}
      <Txt x={175} y={318} size={10}>{bn ? 'ক্যালরিমিটার + পানি' : 'Calorimeter + water'} · {fmt(num(view, 'mw'), 0)} g</Txt>
      <MiniPlot x={380} y={40} w={240} h={160} series={[{ pts, color: C.red }]} yMin={ROOM - 1} yMax={Math.max(tf + 2, ROOM + 5)} label={bn ? 'পানির তাপমাত্রা বনাম সময়' : 'Water temperature vs time'} xLabel="t (s)" />
      <Digital x={400} y={240} w={200} text={`${fmt(tw, 2)} °C`} label={bn ? 'থার্মোমিটার' : 'Thermometer'} good={num(view, 'settled') === 1} />
    </SceneFrame>
  );
}

function JouleCalorimeter({ view, t, bn }: SceneProps) {
  const tw = num(view, 'tWater');
  const secs = num(view, 't');
  const v = num(view, 'v');
  const i = num(view, 'i');
  const glow = 0.4 + 0.3 * Math.sin(t * 6);
  return (
    <SceneFrame label="Joule calorimeter with heater">
      <Calorimeter x={120} y={140} level={0.72} temp={tw}>
        <path d="M 160 270 c 10 -18 20 18 30 0 c 10 -18 20 18 30 0" fill="none" stroke={`rgba(239,68,68,${glow + 0.3})`} strokeWidth={4} />
      </Calorimeter>
      <Stirrer x={230} y={150} t={t} h={110} />
      <Thermometer x={265} y={70} h={170} temp={tw} min={0} max={60} />
      <Wire d="M 165 140 L 165 100 L 60 100 L 60 330 L 345 330 L 345 100 L 205 100 L 205 140" />
      <Wire d="M 165 100 L 165 62 M 205 100 L 205 62" dash="4 3" color={C.blue} />
      <Dial x={60} y={215} r={28} value={i} min={0} max={3} label={bn ? 'অ্যামিটার' : 'Ammeter'} unit="A" digits={2} />
      <Dial x={185} y={46} r={24} value={v} min={0} max={12} label={bn ? 'ভোল্টমিটার' : 'Voltmeter'} unit="V" digits={1} />
      <Digital x={400} y={40} w={200} text={`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`} label={bn ? 'ঘড়ি (৩০× দ্রুত)' : 'Clock (30× speed)'} />
      <MiniPlot x={380} y={100} w={240} h={150} series={[{ pts: [[0, ROOM], [Math.max(1, secs), tw]], color: C.red }]} yMin={ROOM - 1} yMax={Math.max(tw + 2, ROOM + 6)} label={bn ? 'তাপমাত্রা বনাম সময়' : 'Temperature vs time'} xLabel="t (s)" />
      <Digital x={400} y={270} w={200} text={`${fmt(tw, 2)} °C`} label={bn ? 'থার্মোমিটার' : 'Thermometer'} good />
    </SceneFrame>
  );
}

function IceCalorimeter({ view, t, bn }: SceneProps) {
  const tw = num(view, 'tWater');
  const melted = num(view, 'melted');
  const mi = num(view, 'mi');
  const cubes = Math.max(1, Math.round(mi / 0.005));
  const size = 18 * Math.max(0, 1 - melted);
  return (
    <SceneFrame label="Calorimeter with melting ice">
      <Calorimeter x={110} y={130} level={0.7} temp={tw}>
        {size > 1 &&
          Array.from({ length: cubes }).map((_, k) => (
            <rect key={k} x={130 + (k % 4) * 24 + Math.sin(t * 2 + k) * 2} y={178 + Math.floor(k / 4) * 22} width={size} height={size} rx={3} fill="#e0f2fe" stroke="#7dd3fc" opacity={0.95} />
          ))}
      </Calorimeter>
      <Stirrer x={225} y={140} t={t} h={110} />
      <Thermometer x={270} y={60} h={170} temp={tw} min={-5} max={50} />
      <Digital x={400} y={60} w={200} text={`${Math.round(melted * 100)} %`} label={bn ? 'বরফ গলেছে' : 'Ice melted'} good={melted >= 1} />
      <Digital x={400} y={130} w={200} text={`${fmt(tw, 2)} °C`} label={bn ? 'থার্মোমিটার' : 'Thermometer'} good={num(view, 'settled') === 1} />
      <Txt x={500} y={200} size={10}>{bn ? 'বরফ' : 'Ice'} {fmt(mi * 1000, 0)} g</Txt>
    </SceneFrame>
  );
}

function CoolingCalorimeters({ view, bn }: SceneProps) {
  const tw = num(view, 'tWater');
  const tl = num(view, 'tLiquid');
  const simT = num(view, 'simT');
  const tauW = num(view, 'tauW', 1);
  const tauL = num(view, 'tauL', 1);
  const T0 = num(view, 'T0');
  const start = num(view, 'start');
  const ptsW: [number, number][] = [];
  const ptsL: [number, number][] = [];
  for (let k = 0; k <= 40; k++) {
    const tt = (simT * k) / 40;
    ptsW.push([tt, ROOM + (T0 - ROOM) * Math.exp(-tt / tauW)]);
    ptsL.push([tt, ROOM + (T0 - ROOM) * Math.exp(-tt / tauL)]);
  }
  return (
    <SceneFrame label="Two calorimeters cooling">
      <Calorimeter x={50} y={150} w={100} h={130} level={0.7} temp={tw} />
      <Thermometer x={100} y={50} h={160} temp={tw} min={20} max={80} label={bn ? 'পানি' : 'Water'} />
      <Calorimeter x={210} y={150} w={100} h={130} level={0.7} temp={tl} />
      <Thermometer x={260} y={50} h={160} temp={tl} min={20} max={80} label={bn ? 'তরল' : 'Liquid'} />
      <MiniPlot
        x={360}
        y={40}
        w={260}
        h={220}
        series={[
          { pts: ptsW, color: C.blue },
          { pts: ptsL, color: C.amber }
        ]}
        yMin={start - 18}
        yMax={T0 + 1}
        label={bn ? 'শীতলীকরণ বক্ররেখা (নীল: পানি, কমলা: তরল)' : 'Cooling curves (blue water, amber liquid)'}
        xLabel="t (s)"
      />
      <Txt x={490} y={290} size={10}>{bn ? 'পরিসর' : 'Range'} {start} → {start - 10} °C · {Math.floor(simT / 60)} min</Txt>
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Conduction: Searle's bar & Lee's disc                                */
/* ------------------------------------------------------------------ */

export function ConductionScene(props: SceneProps) {
  return props.model.variant === 'lee' ? <LeeDisc {...props} /> : <SearleBar {...props} />;
}

function SearleBar({ view, t, bn }: SceneProps) {
  const t1 = num(view, 't1');
  const t2 = num(view, 't2');
  const tout = num(view, 'tout');
  const tin = num(view, 'tin');
  const flow = num(view, 'flow');
  return (
    <SceneFrame label="Searle's apparatus for thermal conductivity">
      <defs>
        <linearGradient id="searle-bar" x1="0" x2="1">
          <stop offset="0" stopColor={hotColor(100)} />
          <stop offset="0.35" stopColor={hotColor(t1)} />
          <stop offset="0.6" stopColor={hotColor(t2)} />
          <stop offset="1" stopColor={hotColor(tout)} />
        </linearGradient>
      </defs>
      <rect x={40} y={140} width={90} height={70} rx={8} fill={C.steelDark} />
      <Txt x={85} y={180} size={10} color="#fff">{bn ? 'বাষ্প' : 'Steam'} 100°C</Txt>
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={60 + k * 25} cy={135 - ((t * 20 + k * 12) % 40)} r={5} fill="#e2e8f0" opacity={0.6} />
      ))}
      <rect x={130} y={160} width={380} height={30} fill="url(#searle-bar)" stroke={C.steelDark} />
      <rect x={130} y={150} width={380} height={50} fill="none" stroke={C.woodDark} strokeDasharray="5 4" />
      <Thermometer x={230} y={40} h={110} temp={t1} min={20} max={110} label="θ₁" />
      <Thermometer x={330} y={40} h={110} temp={t2} min={20} max={110} label="θ₂" />
      {/* coil */}
      {Array.from({ length: 6 }).map((_, k) => (
        <ellipse key={k} cx={440 + k * 10} cy={175} rx={5} ry={24} fill="none" stroke={C.copper} strokeWidth={3} />
      ))}
      <Wire d="M 430 151 L 430 110 L 600 110" color={C.water} width={4} />
      <Wire d="M 500 199 L 500 260 L 560 260 L 560 290" color={C.water} width={4} />
      <circle cx={600 - ((t * 40 * (flow / 60)) % 170)} cy={110} r={3} fill="#1d4ed8" />
      <Txt x={590} y={100} size={9.5} anchor="end">{bn ? 'পানি ইন' : 'water in'} {fmt(tin, 0)}°C</Txt>
      <Thermometer x={590} y={150} h={90} temp={tout} min={20} max={80} label="θ₄" />
      <path d="M 530 290 L 535 340 L 585 340 L 590 290 Z" fill={C.glass} stroke={C.steelDark} />
      <Txt x={560} y={354} size={9}>{bn ? 'সংগৃহীত পানি' : 'collected water'}</Txt>
      <Digital x={40} y={260} w={160} text={`${flow} g/min`} label={bn ? 'প্রবাহ হার' : 'Flow rate'} />
      <Digital x={220} y={260} w={160} text={`Δθ = ${fmt(t1 - t2, 1)} °C`} label="θ₁ − θ₂" good={num(view, 'steady') === 1} />
    </SceneFrame>
  );
}

function LeeDisc({ view, t, bn }: SceneProps) {
  const t1 = num(view, 't1');
  const t2 = num(view, 't2');
  const d = num(view, 'd');
  return (
    <SceneFrame label="Lee's disc apparatus">
      <line x1={300} y1={20} x2={300} y2={70} stroke={C.muted} />
      <rect x={180} y={70} width={240} height={60} rx={6} fill={C.steelDark} />
      <Txt x={300} y={104} size={10} color="#fff">{bn ? 'বাষ্প প্রকোষ্ঠ' : 'Steam chamber'}</Txt>
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={420 + 20 + k * 14} cy={90 - ((t * 18 + k * 10) % 30)} r={4} fill="#e2e8f0" opacity={0.6} />
      ))}
      <rect x={180} y={130} width={240} height={d * 4} fill="#d6b98c" stroke={C.woodDark} />
      <Txt x={440} y={134 + d * 2} size={9.5} anchor="start">{bn ? 'নমুনা' : 'specimen'} {d} mm</Txt>
      <rect x={180} y={130 + d * 4} width={240} height={24} rx={3} fill="url(#pr-copper)" />
      <Txt x={300} y={146 + d * 4} size={10} color="#fff">{bn ? 'পিতলের চাকতি' : 'Brass disc'}</Txt>
      <Thermometer x={150} y={30} h={90} temp={t1} min={20} max={110} label="θ₁" />
      <Thermometer x={460} y={40 + d * 4} h={90} temp={t2} min={20} max={110} label="θ₂" />
      <Digital x={60} y={270} w={160} text={`θ₁ ${fmt(t1, 1)} °C`} label={bn ? 'উপরের তাপমাত্রা' : 'Upper'} />
      <Digital x={240} y={270} w={160} text={`θ₂ ${fmt(t2, 1)} °C`} label={bn ? 'নিচের তাপমাত্রা' : 'Lower'} good={num(view, 'steady') === 1} />
      <Digital x={420} y={270} w={170} text={`Δθ ${fmt(t1 - t2, 1)} °C`} label="θ₁ − θ₂" />
    </SceneFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Density bottle                                                       */
/* ------------------------------------------------------------------ */

export function DensityBottleScene({ view, bn }: SceneProps) {
  const T = num(view, 'T');
  const rho = num(view, 'rho');
  const mass = num(view, 'mass');
  const pts: string[] = [];
  for (let tt = 0; tt <= 70; tt += 1) {
    const r = waterDensity(tt);
    pts.push(`${tt ? 'L' : 'M'} ${380 + (tt / 70) * 230} ${290 - (r - 977) * 9}`);
  }
  return (
    <SceneFrame label="Density bottle in a water bath">
      <rect x={40} y={110} width={180} height={150} rx={10} fill={C.water} opacity={0.35} stroke={C.steelDark} />
      <Txt x={130} y={100} size={10}>{bn ? 'পানির পাত্র' : 'Water bath'}</Txt>
      <path d="M 110 150 Q 90 170 90 210 Q 90 245 130 245 Q 170 245 170 210 Q 170 170 150 150 L 145 125 L 115 125 Z" fill={C.glass} stroke={C.blue} strokeWidth={1.6} />
      <path d="M 92 200 Q 92 243 130 243 Q 168 243 168 200 Z" fill={C.water} opacity={0.6} />
      <Thermometer x={200} y={60} h={150} temp={T} min={0} max={80} />
      {/* balance */}
      <rect x={60} y={290} width={170} height={40} rx={8} fill={C.steelDark} />
      <rect x={90} y={278} width={110} height={12} rx={3} fill="url(#pr-metal)" />
      <Digital x={100} y={298} w={92} text={`${mass.toFixed(3)} g`} />
      <Txt x={145} y={346} size={9}>{bn ? 'বোতল খালি 25.000 g · আয়তন 50 cm³' : 'empty 25.000 g · volume 50 cm³'}</Txt>
      <rect x={370} y={40} width={250} height={270} rx={8} fill={C.surface} stroke={C.line} />
      <path d={pts.join(' ')} fill="none" stroke={C.blue} strokeWidth={2} />
      <circle cx={380 + (T / 70) * 230} cy={290 - (rho - 977) * 9} r={5} fill={C.red} />
      <line x1={380 + (4 / 70) * 230} y1={60} x2={380 + (4 / 70) * 230} y2={300} stroke={C.green} strokeDasharray="3 3" />
      <Txt x={380 + (4 / 70) * 230 + 4} y={70} size={9} anchor="start" color={C.green}>4 °C</Txt>
      <Txt x={495} y={56} size={9.5}>ρ (kg/m³) vs T (°C)</Txt>
      <Txt x={495} y={330} size={10} color={C.ink}>ρ = {fmt(rho, 2)} kg/m³</Txt>
    </SceneFrame>
  );
}
