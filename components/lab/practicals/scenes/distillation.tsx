'use client';

import React from 'react';
import { BENCH, C, Digital, Fumes, Glow, MiniPlot, SceneFrame, Stopwatch, Tag, Thermometer, Txt, clampN, fmt, vBool, vNum, vObj, type SceneProps } from '../primitives';
import { BunsenBurner, Tripod } from '../kit';
import { ConicalFlask } from '../glass';

type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };

/** A simple Liebig-condenser setup for purifying salt water by distillation. */
export function DistillationScene({ view, t, bn }: SceneProps) {
  const temperature = clampN(vNum(view, 'temperature', 25), 0, 110);
  const brineFraction = clampN(vNum(view, 'brineFraction', 1), 0.15, 1);
  const evaporated = clampN(vNum(view, 'evaporated', 0), 0, 72);
  const distillate = clampN(vNum(view, 'distillate', 0), 0, 72);
  const vapour = clampN(vNum(view, 'vapour', 0), 0, 1);
  const cooling = vBool(view, 'cooling');
  const coolingFlow = clampN(vNum(view, 'coolingFlow', 0), 0, 1);
  const flame = clampN(vNum(view, 'flame', 0), 0, 1.5);
  const bubbles = clampN(vNum(view, 'bubbles', 0), 0, 1);
  const time = vNum(view, 'time', 0);
  const conductivity = vNum(view, 'conductivity', 0);
  const curve = vObj<CurveView>(view, 'curve');
  const liquidTop = 237 - brineFraction * 30;
  const receiverLevel = clampN((distillate / 72) * 0.62, 0, 0.62);

  return (
    <SceneFrame label={bn ? 'লবণ-পানির সরল পাতন' : 'Simple distillation of salt water'}>
      <Stopwatch cx={72} cy={61} r={30} seconds={time} unit="min" label={bn ? 'সময়' : 'time'} />
      <Thermometer x={151} y={43} h={111} value={temperature} min={0} max={110} label={false} />
      <Digital x={37} y={111} w={91} h={42} value={fmt(temperature, 1)} unit="°C" label={bn ? 'ফ্লাস্ক' : 'flask'} />
      <Digital x={37} y={165} w={91} h={42} value={fmt(distillate, 1)} unit="mL" label={bn ? 'পাতিত পানি' : 'distillate'} />
      <Digital x={37} y={219} w={91} h={42} value={fmt(conductivity, 3)} unit="mS" label={bn ? 'পরিবাহিতা' : 'conductivity'} />

      {/* Heating mantle hardware: tripod, gauze, burner and a round-bottom flask. */}
      <Glow cx={151} cy={236} r={54} amount={flame > 0 ? 0.2 : 0} color="url(#cx-heat)" />
      <BunsenBurner cx={151} yb={BENCH} flame={flame} open t={t} />
      <Tripod cx={151} y={239} w={104} />
      <path d="M 137 116 L 137 169 C 119 181 107 198 107 219 C 107 245 126 264 151 264 C 176 264 195 245 195 219 C 195 198 183 181 165 169 L 165 116 Z" fill="url(#cx-glass)" stroke={C.glassDark} strokeWidth="2" />
      <path d={`M 113 ${liquidTop} Q 151 ${liquidTop - 10} 189 ${liquidTop} L 184 240 Q 151 260 118 240 Z`} fill="#a7d6ec" opacity="0.72" />
      <path d="M 137 118 L 137 168 M 165 118 L 165 168" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2" />
      {bubbles > 0 && Array.from({ length: 7 }, (_, i) => {
        const rise = (t * 15 + i * 17) % 38;
        return <circle key={i} cx={129 + (i % 4) * 13} cy={240 - rise} r={1.6 + (i % 2) * 0.7} fill="#ffffff" stroke="#8dbcd5" strokeWidth="0.6" opacity={0.35 + bubbles * 0.6} />;
      })}
      {vapour > 0.02 && <Fumes cx={151} y={108} w={25} h={42} color="#ffffff" amount={vapour * 0.72} t={t} seed={9} />}
      <Txt x={151} y={BENCH + 18} size={8.5} color="#e1eaf2" weight={800}>{bn ? 'লবণ-পানি · পাতন ফ্লাস্ক' : 'salt water · distillation flask'}</Txt>

      {/* Vapour head and sloping, water-jacketed Liebig condenser. */}
      <path d="M 151 117 L 151 109 L 199 109 L 210 119" fill="none" stroke="#658198" strokeWidth="6" strokeLinejoin="round" />
      <path d="M 151 117 L 151 109 L 199 109 L 210 119" fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2" />
      <path d="M 205 111 L 430 151 L 424 183 L 199 143 Z" fill={cooling ? '#d7effb' : '#e8f0f5'} fillOpacity={cooling ? 0.78 : 0.42} stroke={C.glassDark} strokeWidth="1.8" />
      <path d="M 208 126 L 423 165" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <path d="M 210 128 L 421 166" fill="none" stroke="#a8d9ec" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 203 115 L 428 155" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.2" />
      <path d="M 199 142 L 424 182" fill="none" stroke="#7190a5" strokeWidth="1.2" />

      {/* Counter-current water hoses; blue arrows appear only when water is flowing. */}
      <path d="M 217 113 L 210 88 L 178 88" fill="none" stroke={cooling ? '#168bd2' : '#8795a1'} strokeWidth="3" strokeLinecap="round" />
      <path d="M 414 180 L 423 205 L 458 205" fill="none" stroke={cooling ? '#168bd2' : '#8795a1'} strokeWidth="3" strokeLinecap="round" />
      {cooling && (
        <g>
          <path d="M 432 198 L 426 204 L 432 210" fill="none" stroke="#1677d2" strokeWidth="2" markerEnd="url(#cx-arrow)" />
          <path d="M 204 91 L 212 87 L 208 96" fill="none" stroke="#1677d2" strokeWidth="2" markerEnd="url(#cx-arrow)" />
          <circle cx={313} cy={148} r="12" fill="#7dd3fc" opacity={0.1 + coolingFlow * 0.18} />
        </g>
      )}
      <Txt x={175} y={81} size={7.5} color={cooling ? '#075985' : C.muted} weight={800}>{bn ? 'গরম পানি বের হয়' : 'warm water out'}</Txt>
      <Txt x={458} y={222} anchor="end" size={7.5} color={cooling ? '#075985' : C.muted} weight={800}>{bn ? 'ঠান্ডা পানি ঢোকে' : 'cool water in'}</Txt>
      <Tag x={322} y={117} text={bn ? 'লিবিগ কনডেনসার' : 'Liebig condenser'} tone="light" size={8} />
      {vapour > 0.04 && <path d="M 202 108 L 409 145" fill="none" stroke="#ffffff" strokeWidth={1 + vapour * 2} strokeDasharray="5 5" opacity={0.45 + vapour * 0.4} markerEnd="url(#cx-arrow)" />}

      {/* Condensed drops run into a separate receiving flask. */}
      <path d="M 423 166 L 459 173 L 485 188 L 505 198 L 518 205" fill="none" stroke="#6f8799" strokeWidth="6" strokeLinejoin="round" />
      <path d="M 423 166 L 459 173 L 485 188 L 505 198 L 518 205" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
      {distillate > 0.1 && Array.from({ length: Math.min(5, Math.ceil(distillate / 12)) }, (_, i) => (
        <circle key={i} cx={481 + (i % 2) * 4} cy={188 + ((t * 9 + i * 9) % 12)} r="2" fill="#53a8dc" opacity={0.45 + coolingFlow * 0.45} />
      ))}
      <ConicalFlask cx={526} yb={BENCH - 3} w={76} h={92} liquid="#a7d6ec" level={receiverLevel} t={t} seed={12} />
      <Txt x={526} y={BENCH + 18} size={8.5} color="#e1eaf2" weight={800}>{bn ? 'গ্রাহক ফ্লাস্ক' : 'receiver flask'}</Txt>
      <Tag x={525} y={208} text={`${distillate.toFixed(1)} mL`} tone="chem" size={8} />

      {/* A small live volume curve mirrors the table below the apparatus. */}
      {curve && <MiniPlot x={435} y={17} w={190} h={79} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 0} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />}
      <Txt x={326} y={BENCH + 19} size={7.8} color="#d4e0ea" weight={700}>
        {bn ? `বাষ্পীভবন: ${evaporated.toFixed(1)} mL · লবণ ফ্লাস্কে থাকে` : `water evaporated: ${evaporated.toFixed(1)} mL · salt stays in the flask`}
      </Txt>
    </SceneFrame>
  );
}
