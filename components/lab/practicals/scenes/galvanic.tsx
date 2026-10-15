'use client';

import React from 'react';
import { BENCH, C, Digital, SceneFrame, Txt, clampN, fmt, vBool, vNum, vObj, type SceneProps } from '../primitives';
import { FlowDots, Wire } from '../kit';
import { Beaker } from '../glass';

type Half = { sym: string; sol: string; strip: string; salt: string };

/** Galvanic (Daniell-type) cell: two half-cells, a salt bridge and a voltmeter. */
export function GalvanicScene({ view, t, bn }: SceneProps) {
  const left = vObj<Half>(view, 'left') ?? { sym: 'Zn', sol: '#eef4f9', strip: '#b9c2cc', salt: 'ZnSO₄' };
  const right = vObj<Half>(view, 'right') ?? { sym: 'Cu', sol: '#3f88d8', strip: '#c8763c', salt: 'CuSO₄' };
  const volts = vNum(view, 'volts', 0);
  const bridge = vBool(view, 'bridge');
  const conc = vNum(view, 'conc', 1);
  const series = (Array.isArray(view.series) ? view.series : []) as { sym: string; e: number }[];
  const lx = 168;
  const rx = 392;
  const yb = BENCH - 2;
  const top = yb - 110;
  const stripTop = top - 46;
  const ex = (x: number) => x - 4;
  return (
    <SceneFrame label={bn ? 'তড়িৎরাসায়নিক কোষ' : 'Electrochemical cell'}>
      <Beaker cx={lx} yb={yb} w={124} h={110} liquid={left.sol} level={0.72} />
      <Beaker cx={rx} yb={yb} w={124} h={110} liquid={right.sol} level={0.72} />
      {/* electrodes */}
      <rect x={ex(lx) - 6} y={stripTop} width="16" height="128" rx="2" fill={left.strip} stroke="#4b5563" strokeWidth="0.8" />
      <rect x={ex(rx) - 6} y={stripTop} width="16" height="128" rx="2" fill={right.strip} stroke="#4b5563" strokeWidth="0.8" />
      {/* salt bridge */}
      {bridge ? (
        <g>
          <path d={`M ${lx + 30} ${yb - 40} L ${lx + 30} ${top - 26} Q ${lx + 30} ${top - 40} ${lx + 44} ${top - 40} L ${rx - 44} ${top - 40} Q ${rx - 30} ${top - 40} ${rx - 30} ${top - 26} L ${rx - 30} ${yb - 40}`} fill="none" stroke="#9cbdd5" strokeWidth="16" strokeLinejoin="round" />
          <path d={`M ${lx + 30} ${yb - 40} L ${lx + 30} ${top - 26} Q ${lx + 30} ${top - 40} ${lx + 44} ${top - 40} L ${rx - 44} ${top - 40} Q ${rx - 30} ${top - 40} ${rx - 30} ${top - 26} L ${rx - 30} ${yb - 40}`} fill="none" stroke="#f3f7fa" strokeWidth="11" strokeLinejoin="round" />
          <rect x={lx + 24} y={yb - 46} width="12" height="9" rx="4" fill="#fbfbfb" stroke="#d6dde3" />
          <rect x={rx - 36} y={yb - 46} width="12" height="9" rx="4" fill="#fbfbfb" stroke="#d6dde3" />
          <Txt x={(lx + rx) / 2} y={top - 50} size={8.5} color={C.ink} weight={800}>
            {bn ? 'লবণ সেতু (KNO₃)' : 'salt bridge (KNO₃)'}
          </Txt>
        </g>
      ) : (
        <Txt x={(lx + rx) / 2} y={top - 30} size={9} color="#b45309" weight={800}>
          {bn ? 'লবণ সেতু নেই — বর্তনী অসম্পূর্ণ' : 'no salt bridge — circuit open'}
        </Txt>
      )}
      {/* voltmeter & wires */}
      <Wire x1={ex(lx) + 2} y1={stripTop} x2={244} y2={64} color="#1f2832" sag={-30} />
      <Wire x1={ex(rx) + 2} y1={stripTop} x2={316} y2={64} color="#d64545" sag={-30} />
      <Digital x={226} y={26} w={108} h={48} value={fmt(volts, 3)} unit="V" label={bn ? 'ভোল্টমিটার' : 'voltmeter'} />
      {bridge && volts > 0 && (
        <g>
          <FlowDots x1={ex(lx) + 2} y1={stripTop - 4} x2={230} y2={56} t={t} speed={0.5} n={4} />
          <FlowDots x1={330} y1={56} x2={ex(rx) + 2} y2={stripTop - 4} t={t} speed={0.5} n={4} />
          <Txt x={280} y={92} size={8} color={C.muted} weight={700}>
            e⁻ →
          </Txt>
        </g>
      )}
      <Txt x={lx} y={stripTop - 8} size={9} color={C.ink} weight={800}>
        {`${left.sym} (−) ${bn ? 'অ্যানোড' : 'anode'}`}
      </Txt>
      <Txt x={rx} y={stripTop - 8} size={9} color={C.ink} weight={800}>
        {`${right.sym} (+) ${bn ? 'ক্যাথোড' : 'cathode'}`}
      </Txt>
      <Txt x={lx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {`${left.salt} 1.0 M`}
      </Txt>
      <Txt x={rx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {`${right.salt} ${conc} M`}
      </Txt>
      {/* electrochemical series built from readings */}
      <g>
        <rect x={500} y={26} width={124} height={250} rx="8" fill="#ffffff" opacity="0.94" stroke={C.line} />
        <Txt x={562} y={42} size={8.5} color={C.ink} weight={800}>
          {bn ? 'তড়িৎদ্বার বিভব E°' : 'electrode potential E°'}
        </Txt>
        <line x1={530} y1={56} x2={530} y2={262} stroke={C.muted} strokeWidth="1" />
        {[0.8, 0.34, 0, -0.5, -1, -1.5, -2, -2.5].map((e) => {
          const yy = 56 + ((0.9 - e) / 3.5) * 206;
          return (
            <g key={e}>
              <line x1={527} x2={533} y1={yy} y2={yy} stroke={C.muted} />
              <Txt x={524} y={yy + 3} anchor="end" size={6.5} color={C.muted}>
                {e.toFixed(e === 0.34 ? 2 : 1)}
              </Txt>
            </g>
          );
        })}
        <circle cx={530} cy={56 + ((0.9 - 0.34) / 3.5) * 206} r="3.5" fill="#c8763c" />
        <Txt x={538} y={56 + ((0.9 - 0.34) / 3.5) * 206 + 3} anchor="start" size={8} color={C.ink} weight={800}>
          Cu
        </Txt>
        {series.map((s, i) => {
          const yy = 56 + ((0.9 - clampN(s.e, -2.6, 0.9)) / 3.5) * 206;
          return (
            <g key={i}>
              <circle cx={530} cy={yy} r="3.5" fill={C.chem} />
              <Txt x={538 + (i % 2) * 34} y={yy + 3} anchor="start" size={8} color={C.ink} weight={800}>
                {`${s.sym} ${s.e.toFixed(2)}`}
              </Txt>
            </g>
          );
        })}
      </g>
    </SceneFrame>
  );
}
