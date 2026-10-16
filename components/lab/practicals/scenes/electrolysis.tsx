'use client';

import React from 'react';
import { BENCH, Bubbles, C, Digital, MiniPlot, SceneFrame, Stopwatch, Txt, clampN, fmt, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { PaperStrip, PowerPack, Splint, Wire } from '../kit';
import { Beaker } from '../glass';
import { PopBurst, testPaperColour } from './shared';
import { blendColors } from '@/engine/colorMixer';

type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };

/** One graduated limb of the voltameter; gas collects from the top tap downwards. */
function Limb({ cx, top, bottom, vol, max, gas, liquid, pink, label, bubbles, t, seed }: { cx: number; top: number; bottom: number; vol: number; max: number; gas: string; liquid: string; pink: number; label: string; bubbles: number; t: number; seed: number }) {
  const w = 26;
  const scaleTop = top + 14;
  const scaleH = bottom - scaleTop - 40;
  const f = clampN(vol / max, 0, 1);
  const gasBottom = scaleTop + f * scaleH;
  return (
    <g>
      <rect x={cx - w / 2 + 1.5} y={top + 10} width={w - 3} height={bottom - top - 10} fill={liquid} opacity="0.8" />
      {pink > 0 && <rect x={cx - w / 2 + 1.5} y={bottom - 70} width={w - 3} height="70" fill="#f06fb0" opacity={0.45 * pink} />}
      {f > 0 && <rect x={cx - w / 2 + 1.5} y={top + 10} width={w - 3} height={gasBottom - top - 10} fill={gas} opacity="0.96" />}
      {f > 0 && <path d={`M ${cx - w / 2 + 1.5} ${gasBottom} Q ${cx} ${gasBottom + 4} ${cx + w / 2 - 1.5} ${gasBottom}`} fill="none" stroke="#6d93b0" strokeWidth="1" />}
      <Bubbles x0={cx - 8} x1={cx + 8} yTop={gasBottom + 2} yBottom={bottom - 26} rate={bubbles} t={t} seed={seed} max={10} />
      <rect x={cx - w / 2} y={top + 10} width={w} height={bottom - top - 10} rx="3" fill="url(#cx-glass)" stroke={C.glass} strokeWidth="1.3" />
      {Array.from({ length: Math.floor(max / 5) + 1 }, (_, i) => {
        const yy = scaleTop + ((i * 5) / max) * scaleH;
        return <line key={i} x1={cx + w / 2 - (i % 2 === 0 ? 8 : 5)} x2={cx + w / 2 - 1} y1={yy} y2={yy} stroke={C.ink} strokeOpacity="0.55" strokeWidth="0.7" />;
      })}
      {Array.from({ length: Math.floor(max / 10) + 1 }, (_, i) => (
        <Txt key={`l${i}`} x={cx + w / 2 + 3} y={scaleTop + ((i * 10) / max) * scaleH + 3} anchor="start" size={6.5} color={C.muted}>
          {i * 10}
        </Txt>
      ))}
      {/* tap */}
      <rect x={cx - 3} y={top} width="6" height="12" fill="url(#cx-glass)" stroke={C.glass} />
      <rect x={cx - 9} y={top + 3} width="18" height="5" rx="2.5" fill="#2e3a46" />
      {/* electrode */}
      <rect x={cx - 5} y={bottom - 26} width="10" height="16" fill="#d7dde4" stroke="#7d8995" strokeWidth="0.8" />
      <Txt x={cx} y={top - 6} size={8.5} color={C.ink} weight={800}>
        {label}
      </Txt>
    </g>
  );
}

function HofmannScene({ view, t, bn }: SceneProps) {
  const current = vNum(view, 'current', 0.5);
  const cv = vNum(view, 'cathodeVol', 0);
  const av = vNum(view, 'anodeVol', 0);
  const max = vNum(view, 'maxVol', 60);
  const anodeGas = vStr(view, 'anodeGas', 'O₂');
  // the electrolyte is tinted a little so the colourless gas columns stand out against it
  const liquid = blendColors(vStr(view, 'liquid', '#dcefff'), '#8cc2ea', 0.45);
  const pink = vNum(view, 'pink', 0);
  const bubbles = vNum(view, 'bubbles', 0.5);
  const test = vStr(view, 'test', 'none');
  const kind = vStr(view, 'kind', 'hofmann');
  const lx = 300;
  const rx = 400;
  const top = 34;
  const bottom = 262;
  const cl2 = anodeGas === 'Cl₂';
  return (
    <SceneFrame label={bn ? 'তড়িৎবিশ্লেষণ' : 'Electrolysis'}>
      {/* stand */}
      <rect x={346} y={28} width="8" height="272" fill="url(#cx-metal-h)" />
      <rect x={300} y={286} width="100" height="14" rx="3" fill="#2f3943" />
      {/* reservoir */}
      <path d={`M 350 ${bottom - 6} L 350 74`} stroke="#9cbdd5" strokeWidth="10" />
      <path d={`M 350 ${bottom - 6} L 350 74`} stroke={liquid} strokeWidth="6" opacity="0.8" />
      <ellipse cx="350" cy="58" rx="20" ry="22" fill={liquid} opacity="0.7" stroke={C.glass} strokeWidth="1.3" />
      <path d={`M ${lx} ${bottom} Q ${lx} ${bottom + 18} 350 ${bottom + 18} Q ${rx} ${bottom + 18} ${rx} ${bottom}`} fill="none" stroke="#9cbdd5" strokeWidth="14" />
      <path d={`M ${lx} ${bottom} Q ${lx} ${bottom + 18} 350 ${bottom + 18} Q ${rx} ${bottom + 18} ${rx} ${bottom}`} fill="none" stroke={liquid} strokeWidth="9" opacity="0.85" />
      <Limb cx={lx} top={top} bottom={bottom} vol={cv} max={max} gas="#f2f9ff" liquid={liquid} pink={pink} label={bn ? 'ক্যাথোড (−) H₂' : 'cathode (−) H₂'} bubbles={bubbles} t={t} seed={1} />
      <Limb cx={rx} top={top} bottom={bottom} vol={av} max={max} gas={cl2 ? '#dbe88f' : '#f2f9ff'} liquid={liquid} pink={0} label={bn ? `অ্যানোড (+) ${anodeGas}` : `anode (+) ${anodeGas}`} bubbles={bubbles * (cl2 ? 0.9 : 0.6)} t={t} seed={2} />
      <PowerPack x={70} y={150} current={current} label="DC" />
      {/* + terminal (red) to the anode, − terminal (black) to the cathode */}
      <Wire x1={88} y1={189} x2={rx + 6} y2={bottom - 14} color="#d64545" sag={90} />
      <Wire x1={104} y1={189} x2={lx - 6} y2={bottom - 14} color="#1f2832" sag={70} />
      <Digital x={70} y={90} w={96} h={44} value={fmt(current, current < 0.01 ? 3 : 2)} unit="A" label={bn ? 'অ্যামিটার' : 'ammeter'} />
      <Stopwatch cx={530} cy={70} r={30} seconds={vNum(view, 'clock', 0)} unit="s" label={bn ? 'স্টপওয়াচ' : 'stopwatch'} />
      <g>
        <rect x={470} y={128} width="138" height="62" rx="8" fill="#ffffff" opacity="0.94" stroke={C.line} />
        <Txt x={480} y={146} anchor="start" size={9} color={C.ink} weight={800}>
          {`H₂: ${fmt(cv, 1)} mL`}
        </Txt>
        <Txt x={480} y={162} anchor="start" size={9} color={C.ink} weight={800}>
          {`${anodeGas}: ${fmt(av, 1)} mL`}
        </Txt>
        <Txt x={480} y={178} anchor="start" size={8.5} color={C.chemDark} weight={800}>
          {av > 0.3 ? `${bn ? 'অনুপাত' : 'ratio'} ${fmt(cv / av, 2)} : 1` : ''}
        </Txt>
      </g>
      {test === 'pop' && (
        <g>
          <Splint x={lx - 14} y={top - 4} angle={-150} state="burning" t={t} />
          {cv > 1 && <PopBurst x={lx - 26} y={top - 14} t={t} text={bn ? 'পপ!' : 'POP!'} />}
        </g>
      )}
      {test === 'relight' && <Splint x={rx + 14} y={top - 4} angle={-30} state={av > 1 ? 'bright' : 'glowing'} t={t} />}
      {test === 'bleach' && (
        <g>
          <PaperStrip cx={rx + 34} y={top - 30} h={50} color={testPaperColour('bleach', clampN(av / 6, 0, 1))} wet={0.5} />
        </g>
      )}
      <Txt x={350} y={BENCH + 22} size={9.5} color="#e7eef5" weight={800}>
        {kind === 'brine' ? (bn ? 'সোডিয়াম ক্লোরাইড দ্রবণ' : 'sodium chloride solution') : bn ? 'হফম্যান ভোল্টামিটার' : 'Hofmann voltameter'}
      </Txt>
    </SceneFrame>
  );
}

function CopperCellScene({ view, t, bn }: SceneProps) {
  const current = vNum(view, 'current', 0.5);
  const deposit = clampN(vNum(view, 'deposit', 0), 0, 1);
  const loss = clampN(vNum(view, 'anodeLoss', 0), 0, 1);
  const graphite = vStr(view, 'anode', 'copper') === 'graphite';
  const liquid = vStr(view, 'liquid', '#4a90dc');
  const bubbles = vNum(view, 'bubbles', 0);
  const curve = vObj<CurveView>(view, 'curve');
  const cx = 300;
  const yb = BENCH - 2;
  const top = yb - 120;
  const catX = cx - 34;
  const anX = cx + 34;
  return (
    <SceneFrame label={bn ? 'কপার সালফেটের তড়িৎবিশ্লেষণ' : 'Electrolysis of copper(II) sulphate'}>
      <Beaker cx={cx} yb={yb} w={150} h={120} liquid={liquid} level={0.74} opacity={0.7} />
      {/* cathode: copper plate growing a pink-brown deposit */}
      <rect x={catX - 6 - deposit * 2} y={top - 30} width={12 + deposit * 4} height="128" rx="1.5" fill="#c8763c" stroke="#7a4a22" strokeWidth="0.8" />
      {deposit > 0.01 && <rect x={catX - 6 - deposit * 2} y={top + 6} width={12 + deposit * 4} height="92" fill="#b5562a" opacity={0.4 + 0.5 * deposit} />}
      {/* anode */}
      {graphite ? <rect x={anX - 5} y={top - 30} width="10" height="128" rx="2" fill="#2b2b30" stroke="#111" strokeWidth="0.8" /> : <rect x={anX - 6 + loss * 2} y={top - 30} width={Math.max(5, 12 - loss * 4)} height="128" rx="1.5" fill="#c8763c" stroke="#7a4a22" strokeWidth="0.8" />}
      {graphite && <Bubbles x0={anX - 8} x1={anX + 8} yTop={top + 10} yBottom={yb - 30} rate={bubbles} t={t} seed={3} max={12} />}
      <PowerPack x={64} y={150} current={current} />
      <Wire x1={82} y1={189} x2={anX} y2={top - 30} color="#d64545" sag={-120} />
      <Wire x1={98} y1={189} x2={catX} y2={top - 30} color="#1f2832" sag={-80} />
      <Txt x={catX} y={top - 38} size={8.5} color={C.ink} weight={800}>
        {bn ? 'ক্যাথোড (−)' : 'cathode (−)'}
      </Txt>
      <Txt x={anX + 6} y={top - 38} size={8.5} color={C.ink} weight={800}>
        {graphite ? (bn ? 'গ্রাফাইট (+)' : 'graphite (+)') : bn ? 'কপার অ্যানোড (+)' : 'copper anode (+)'}
      </Txt>
      <Stopwatch cx={110} cy={70} r={30} seconds={vNum(view, 'clock', 0)} unit="s" />
      {curve && <MiniPlot x={440} y={22} w={188} h={128} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 0} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />}
      <Txt x={cx} y={BENCH + 22} size={9.5} color="#e7eef5" weight={800}>
        {bn ? 'কপার(II) সালফেট দ্রবণ' : 'copper(II) sulphate solution'}
      </Txt>
    </SceneFrame>
  );
}

export function ElectrolysisScene(props: SceneProps) {
  return vStr(props.view, 'kind', 'hofmann') === 'copper' ? <CopperCellScene {...props} /> : <HofmannScene {...props} />;
}
