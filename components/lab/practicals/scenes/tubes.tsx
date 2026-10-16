'use client';

import React from 'react';
import { indicatorColor } from '@/engine/phCalc';
import type { TubesView, TubeView } from '@/engine/chemPracticals';
import { BENCH, C, Digital, SceneFrame, Stopwatch, Thermometer, Txt, clampN, fmt, pick, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { Bunsen, TubeHolder } from './shared';
import { Bulb, Dropper, PaperStrip, RackBack, RackFront, Wire } from '../kit';
import { DeliveryTube, TestTube } from '../glass';

const TUBE_TOP = 118;
const TUBE_H = 150;
const RACK_Y = 150;
const H_CAPTION = 352;

/** Universal-indicator colour chart, pH 1–14. */
function ColourChart({ x, y, bn }: { x: number; y: number; bn: boolean }) {
  const cell = 9.5;
  return (
    <g>
      <rect x={x - 6} y={y - 16} width={cell * 14 + 12} height="44" rx="6" fill="#ffffff" stroke={C.line} filter="url(#cx-shadow)" />
      <Txt x={x + (cell * 14) / 2} y={y - 5} size={7.5} color={C.ink} weight={800}>
        {bn ? 'ইউনিভার্সাল ইন্ডিকেটর চার্ট' : 'Universal indicator chart'}
      </Txt>
      {Array.from({ length: 14 }, (_, i) => (
        <g key={i}>
          <rect x={x + i * cell} y={y} width={cell - 1} height="12" rx="1.5" fill={indicatorColor('universal', i + 1)} />
          <Txt x={x + i * cell + cell / 2 - 0.5} y={y + 21} size={6} color={C.muted}>
            {i + 1}
          </Txt>
        </g>
      ))}
    </g>
  );
}

function TubeLabel({ x, spec, bn }: { x: number; spec: TubeView; bn: boolean }) {
  const label = pick(bn, spec.label, spec.labelBn);
  const sub = spec.sub ? pick(bn, spec.sub, spec.subBn) : '';
  const w = Math.max(22, label.length * 5.6 + 10);
  return (
    <g>
      {spec.active && <rect x={x - w / 2} y={BENCH + 8} width={w} height="15" rx="7.5" fill={C.chem} />}
      <Txt x={x} y={BENCH + 19} size={9} color={spec.active ? '#ffffff' : '#e7eef5'} weight={800}>
        {label}
      </Txt>
      {sub && (
        <Txt x={x} y={BENCH + 34} size={7.5} color="#b9c7d6" weight={700}>
          {sub}
        </Txt>
      )}
    </g>
  );
}

export function TubesScene({ view, t, bn }: SceneProps) {
  const v = view as unknown as TubesView;
  const all = Array.isArray(v.tubes) ? v.tubes : [];
  const heatedIdx = typeof v.burner === 'number' && all[v.burner] ? v.burner : -1;
  const rackTubes = all.map((spec, i) => ({ spec, i })).filter(({ i }) => i !== heatedIdx);
  const side = !!(v.meter || v.chart || v.bulb);
  const left = heatedIdx >= 0 ? 260 : v.clock ? 110 : 54;
  const right = side ? 452 : 596;
  const n = Math.max(1, rackTubes.length);
  const slot = Math.min(84, (right - left) / n);
  const w = n >= 7 ? 22 : 26;
  const x0 = (left + right) / 2 - (slot * (n - 1)) / 2;
  const xs = new Map<number, number>();
  rackTubes.forEach(({ i }, k) => xs.set(i, x0 + k * slot));
  const heatedX = 150;
  if (heatedIdx >= 0) xs.set(heatedIdx, heatedX);
  const tubeX = (i: number) => xs.get(i) ?? x0;
  const liquidTop = (spec: TubeView | undefined, top = TUBE_TOP) => {
    if (!spec || !spec.liquid) return top + TUBE_H - 30;
    return top + TUBE_H - 1.6 - clampN(spec.level ?? 0.45, 0, 0.95) * (TUBE_H - 8);
  };
  const bath = vObj<{ temp: number; tube?: number }>(view, 'bath');
  const meterLabel = vStr(view, 'meterLabel', bn ? 'pH মিটার' : 'pH meter');
  const meterUnit = vStr(view, 'meterUnit', '');
  const meterDigits = vNum(view, 'meterDigits', 2);
  const rackX0 = rackTubes.length ? tubeX(rackTubes[0].i) - w : left;
  const rackX1 = rackTubes.length ? tubeX(rackTubes[rackTubes.length - 1].i) + w : right;
  const heatedTop = TUBE_TOP - 62;
  const caption = v.caption ? pick(bn, v.caption, v.captionBn) : '';

  return (
    <SceneFrame label={bn ? 'টেস্টটিউব র‍্যাকে পরীক্ষা' : 'Test-tube rack experiment'}>
      {/* whole-rack water bath (behind) */}
      {bath && bath.tube === undefined && (
        <g>
          <rect x={rackX0 - 22} y={196} width={rackX1 - rackX0 + 44} height={102} rx="6" fill={bath.temp > 40 ? '#ffe7d4' : '#d9eefb'} opacity="0.85" />
          <rect x={rackX0 - 22} y={196} width={rackX1 - rackX0 + 44} height={102} rx="6" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.5" />
          <Thermometer x={rackX1 + 10} y={150} h={140} value={bath.temp} min={0} max={100} label={false} />
          <Txt x={rackX1 + 10} y={144} size={8} color={C.ink} weight={800}>
            {bath.temp} °C
          </Txt>
        </g>
      )}
      {rackTubes.length > 0 && <RackBack x0={rackX0} x1={rackX1} yTop={RACK_Y} />}
      {rackTubes.map(({ spec, i }) => (
        <TestTube key={i} cx={tubeX(i)} y={TUBE_TOP} w={w} h={TUBE_H} spec={spec} t={t} seed={i + 1} />
      ))}
      {rackTubes.length > 0 && <RackFront x0={rackX0} x1={rackX1} yTop={RACK_Y} />}
      {/* single-tube bath (hot / ice) drawn as a small beaker in front */}
      {bath && bath.tube !== undefined && all[bath.tube] && (
        <g>
          <rect x={tubeX(bath.tube) - 24} y={206} width="48" height="86" rx="5" fill={bath.temp > 40 ? '#ffd9bd' : '#d2ecfb'} opacity="0.55" />
          {bath.temp < 10 &&
            [0, 1, 2].map((k) => <rect key={k} x={tubeX(bath.tube!) - 20 + k * 13} y={212 + (k % 2) * 7} width="10" height="9" rx="2" fill="#ffffff" opacity="0.85" stroke="#b9dcf2" />)}
          <rect x={tubeX(bath.tube) - 24} y={206} width="48" height="86" rx="5" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
          <Txt x={tubeX(bath.tube)} y={202} size={8} color={C.ink} weight={800}>
            {bath.temp} °C
          </Txt>
        </g>
      )}
      {/* heated tube in a holder over a burner */}
      {heatedIdx >= 0 && (
        <g>
          <TestTube cx={heatedX} y={heatedTop} w={w} h={TUBE_H} spec={all[heatedIdx]} t={t} seed={heatedIdx + 1} />
          <TubeHolder x={heatedX} y={heatedTop + 28} />
          <Bunsen cx={heatedX} t={t} />
        </g>
      )}
      {/* gas delivery tube into another tube */}
      {v.delivery && all[v.delivery.from] && all[v.delivery.to] && (
        <g>
          <rect x={tubeX(v.delivery.from) - w / 2 - 1} y={(v.delivery.from === heatedIdx ? heatedTop : TUBE_TOP) - 8} width={w + 2} height="12" rx="2" fill="#3d3a3a" />
          <DeliveryTube
            d={`M ${tubeX(v.delivery.from)} ${(v.delivery.from === heatedIdx ? heatedTop : TUBE_TOP) - 4} L ${tubeX(v.delivery.from)} ${TUBE_TOP - 70} L ${tubeX(v.delivery.to)} ${TUBE_TOP - 70} L ${tubeX(v.delivery.to)} ${liquidTop(all[v.delivery.to]) + 30}`}
          />
        </g>
      )}
      {/* dropper */}
      {v.dropper && all[v.dropper.tube] && !(v.paper && v.paper.tube === v.dropper.tube) && !(v.delivery && v.delivery.from === v.dropper.tube) && (
        <Dropper cx={tubeX(v.dropper.tube)} y={TUBE_TOP - 64} color={v.dropper.color} label={v.dropper.label} t={t} dropTo={liquidTop(all[v.dropper.tube], v.dropper.tube === heatedIdx ? heatedTop : TUBE_TOP)} />
      )}
      {/* indicator paper */}
      {v.paper && all[v.paper.tube] && (
        <g>
          <PaperStrip cx={tubeX(v.paper.tube)} y={TUBE_TOP - 40} h={liquidTop(all[v.paper.tube]) - TUBE_TOP + 70} color={v.paper.color} wet={0.42} />
          <Txt x={tubeX(v.paper.tube) + 12} y={TUBE_TOP - 46} anchor="start" size={8.5} color={C.ink} weight={800}>
            {pick(bn, v.paper.label ?? '', v.paper.labelBn)}
          </Txt>
        </g>
      )}
      {/* pH meter */}
      {v.meter && all[v.meter.tube] && (
        <g>
          <path d={`M ${tubeX(v.meter.tube) + 8} ${TUBE_TOP - 24} C ${tubeX(v.meter.tube) + 24} ${TUBE_TOP - 70} 470 ${TUBE_TOP - 60} 500 ${TUBE_TOP - 20}`} fill="none" stroke="#2b333c" strokeWidth="2" />
          <rect x={tubeX(v.meter.tube) + 4} y={TUBE_TOP - 26} width="5" height={liquidTop(all[v.meter.tube]) - TUBE_TOP + 56} rx="2" fill="#e9eef3" stroke="#7d8995" strokeWidth="0.8" />
          <Digital x={472} y={TUBE_TOP - 26} w={112} h={50} value={fmt(v.meter.value, meterDigits)} unit={meterUnit} label={meterLabel} />
        </g>
      )}
      {/* conductivity tester */}
      {v.bulb && all[v.bulb.tube] && (
        <g>
          <Bulb cx={528} cy={TUBE_TOP + 70} brightness={v.bulb.brightness} />
          <rect x={496} y={TUBE_TOP + 100} width="64" height="26" rx="4" fill="#3b4856" />
          <Txt x={528} y={TUBE_TOP + 117} size={8} color="#e7eef5" weight={800}>
            {bn ? 'ব্যাটারি' : 'battery'}
          </Txt>
          <Wire x1={tubeX(v.bulb.tube) - 6} y1={liquidTop(all[v.bulb.tube]) + 20} x2={518} y2={TUBE_TOP + 88} color="#d64545" sag={-60} />
          <Wire x1={tubeX(v.bulb.tube) + 8} y1={liquidTop(all[v.bulb.tube]) + 20} x2={540} y2={TUBE_TOP + 112} color="#1f2832" sag={-40} />
          <Txt x={528} y={TUBE_TOP + 40} size={8} color={C.ink} weight={800}>
            {bn ? 'পরিবাহিতা' : 'conductivity'}
          </Txt>
        </g>
      )}
      {v.chart && <ColourChart x={v.meter ? 466 : 480} y={v.meter ? 214 : 40} bn={bn} />}
      {v.clock && <Stopwatch cx={52} cy={58} r={28} seconds={v.clock.value} unit={v.clock.unit} label={v.clock.unit === 'day' ? (bn ? 'দিন' : 'days') : bn ? 'স্টপওয়াচ' : 'stopwatch'} />}
      {/* labels on the bench */}
      {all.map((spec, i) => (
        <TubeLabel key={i} x={tubeX(i)} spec={spec} bn={bn} />
      ))}
      {caption && (
        <Txt x={(left + right) / 2} y={H_CAPTION} size={8.5} color="#c9d6e3" weight={700}>
          {caption}
        </Txt>
      )}
    </SceneFrame>
  );
}
