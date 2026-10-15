'use client';

import React from 'react';
import type { TubeSolid } from '@/engine/chemPracticals';
import { BENCH, C, Fumes, Glow, MiniPlot, SceneFrame, Stopwatch, Tag, Txt, clampN, pick, rnd, vBool, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { Balance, PaperStrip, Splint } from '../kit';
import { Bung, ConicalFlask, DeliveryTube, DroppingFunnel, GasJar, GasSyringe, InvertedCylinder, TestTube, ThistleFunnel, Trough } from '../glass';
import { PopBurst, testPaperColour } from './shared';

type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };
type GasSolid = Omit<TubeSolid, 'kind'> & { kind: TubeSolid['kind'] | 'foil'; size?: number };

/** Solid reactant sitting in the generator flask. */
function FlaskSolid({ solid, cx, yb, w }: { solid: GasSolid; cx: number; yb: number; w: number }) {
  const amount = clampN(solid.amount ?? 1, 0, 1);
  if (solid.kind === 'foil') {
    const s = 6 + 10 * amount;
    return <path d={`M ${cx - s} ${yb - 5} L ${cx - s * 0.2} ${yb - 5 - s * 0.7} L ${cx + s} ${yb - 6} L ${cx + s * 0.3} ${yb - 3} Z`} fill={solid.color} stroke="#5f6b78" strokeWidth="1.1" />;
  }
  if (solid.kind === 'ribbon') {
    const len = 26 * amount;
    if (len < 2) return null;
    const pts = Array.from({ length: 7 }, (_, i) => `${cx - len / 2 + (i * len) / 6},${yb - 5 - (i % 2) * 5}`).join(' ');
    return (
      <g>
        <polyline points={pts} fill="none" stroke="#7d8995" strokeWidth="3.8" strokeLinejoin="round" />
        <polyline points={pts} fill="none" stroke={solid.color} strokeWidth="2.2" strokeLinejoin="round" />
      </g>
    );
  }
  if (solid.kind === 'powder') {
    const hh = 3 + 5 * amount;
    return <path d={`M ${cx - w * 0.32} ${yb - 3} Q ${cx} ${yb - 3 - hh * 2} ${cx + w * 0.32} ${yb - 3} Z`} fill={solid.color} opacity="0.95" />;
  }
  const n = Math.max(1, Math.round((solid.kind === 'crystals' ? 12 : 8) * (0.3 + 0.7 * amount)));
  const size = solid.kind === 'chips' ? 5 - (solid.size ?? 1) * 1.2 : solid.kind === 'crystals' ? 2.6 : 3.6;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const gx = cx + (rnd(i * 3 + 1) - 0.5) * w * 0.66;
        const gy = yb - 4 - rnd(i * 5 + 2) * 7;
        const s = size * (0.7 + 0.5 * rnd(i + 9));
        const d =
          solid.kind === 'crystals'
            ? `M ${gx} ${gy - s} L ${gx + s * 0.8} ${gy} L ${gx} ${gy + s} L ${gx - s * 0.8} ${gy} Z`
            : `M ${gx - s} ${gy} L ${gx - s * 0.4} ${gy - s * 0.9} L ${gx + s * 0.7} ${gy - s * 0.6} L ${gx + s} ${gy + s * 0.3} L ${gx + s * 0.1} ${gy + s * 0.8} Z`;
        return <path key={i} d={d} fill={solid.color} stroke="#4b5563" strokeOpacity="0.45" strokeWidth="0.5" />;
      })}
    </g>
  );
}

export function GasScene({ view, t, bn }: SceneProps) {
  const funnel = vStr(view, 'funnel', 'bung');
  const collect = vStr(view, 'collect', 'syringe');
  const liquid = vStr(view, 'liquid', '#eaf3fb');
  const level = vNum(view, 'level', 0.4);
  const solid = vObj<GasSolid>(view, 'solid');
  const bubbles = vNum(view, 'bubbles', 0);
  const fumes = vNum(view, 'fumes', 0);
  const fumeColor = vStr(view, 'fumeColor', '#ffffff');
  const volume = vNum(view, 'volume', 0);
  const max = vNum(view, 'max', 100);
  const gasColor = vStr(view, 'gasColor') || undefined;
  const test = vStr(view, 'test', 'none');
  const testAmount = vNum(view, 'testAmount', 1);
  const curve = vObj<CurveView>(view, 'curve');
  const hood = vBool(view, 'hood');
  const warm = vBool(view, 'warm');
  const label = pick(bn, vStr(view, 'label'), vStr(view, 'labelBn') || undefined);
  const onBalance = collect === 'balance';
  const fx = onBalance ? 168 : 140;
  const fyb = onBalance ? 262 : BENCH - 2;
  const fw = 108;
  const fh = 118;
  const neckTop = fyb - fh;
  const hasClock = view.clock !== undefined;
  const plot = curve ? { x: 440, y: hood ? 28 : 18, w: 188, h: 116 } : null;

  // delivery-tube routes for each collector
  const outX = fx + 6;
  const outY = neckTop - 2;
  let route = '';
  if (collect === 'overWater') route = `M ${outX} ${outY} L ${outX} ${outY - 26} L 262 ${outY - 26} L 262 286 L 368 286 L 368 274`;
  else if (collect === 'syringe') route = `M ${outX} ${outY} L ${outX} 160 L 292 160`;
  else if (collect === 'upward') route = `M ${outX} ${outY} L ${outX} ${outY - 34} L 382 ${outY - 34} L 382 280`;
  else if (collect === 'downward') route = `M ${outX} ${outY} L ${outX} ${outY - 34} L 382 ${outY - 34} L 382 120`;

  const solidNode = solid ? <FlaskSolid solid={solid} cx={fx} yb={fyb - 2} w={fw} /> : undefined;
  const generator = (
    <g>
      {warm && <ellipse cx={fx} cy={fyb - 20} rx="56" ry="34" fill="url(#cx-heat)" />}
      <ConicalFlask cx={fx} yb={fyb} w={fw} h={fh} liquid={liquid} level={level} bubbles={bubbles} t={t} solid={solidNode} />
      {fumes > 0 && <rect x={fx - 14} y={neckTop + 4} width="28" height={fh * 0.45} fill={fumeColor} opacity={fumes * 0.35} />}
      {funnel === 'plug' ? (
        <g>
          <ellipse cx={fx} cy={neckTop + 3} rx="17" ry="7" fill="#fbfbfb" stroke="#d6dde3" />
          {bubbles > 0 && <Fumes cx={fx} y={neckTop - 4} w={14} h={36} color="#e6edf3" amount={0.35} t={t} />}
        </g>
      ) : (
        <Bung cx={fx} y={neckTop - 6} w={34} />
      )}
      {funnel === 'thistle' && <ThistleFunnel cx={fx - 10} y={neckTop - 64} len={fh + 54} />}
      {funnel === 'dropping' && <DroppingFunnel cx={fx - 8} y={neckTop - 66} level={vNum(view, 'funnelLevel', 1)} color="#f6f2dc" label={bn ? 'গাঢ় HCl' : 'conc. HCl'} />}
      <Txt x={fx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {label}
      </Txt>
    </g>
  );

  return (
    <SceneFrame label={bn ? 'গ্যাস প্রস্তুতি ও সংগ্রহ' : 'Gas preparation and collection'} hood={hood}>
      {onBalance ? (
        <Balance cx={fx} w={150} reading={vNum(view, 'balance', 150)} digits={2}>
          {generator}
        </Balance>
      ) : (
        generator
      )}
      {route && <DeliveryTube d={route} />}
      {collect === 'overWater' && (
        <g>
          <Trough x0={248} x1={470} y={196} h={102} />
          <InvertedCylinder cx={368} y={60} h={224} w={34} volume={volume} max={max} gasColor={gasColor} />
          {bubbles > 0.05 && volume < max && (
            <g>
              {Array.from({ length: 4 }, (_, i) => {
                const p = (t * 0.9 + i / 4) % 1;
                return <circle key={i} cx={368 + Math.sin(t * 4 + i) * 3} cy={272 - p * Math.max(10, 272 - (64 + (volume / max) * 206))} r="2" fill="#ffffff" stroke="#9fc7e2" strokeWidth="0.6" />;
              })}
            </g>
          )}
          <Txt x={404} y={70} anchor="start" size={9} color={C.ink} weight={800}>
            {`${volume.toFixed(1)} mL`}
          </Txt>
        </g>
      )}
      {collect === 'syringe' && <GasSyringe x={292} y={160} len={150} volume={volume} max={max} gasColor={gasColor} />}
      {(collect === 'upward' || collect === 'downward') && (
        <g>
          {collect === 'upward' ? (
            <GasJar cx={382} yb={BENCH - 2} w={64} h={136} gas={gasColor} fill={clampN(volume / max, 0, 1)} cover={false} />
          ) : (
            <g transform={`rotate(180 382 ${(BENCH - 2 + BENCH - 138) / 2})`}>
              <GasJar cx={382} yb={BENCH - 2} w={64} h={136} gas={gasColor} fill={clampN(volume / max, 0, 1)} cover={false} />
            </g>
          )}
          {collect === 'downward' && gasColor && volume > 1 && <Fumes cx={382} y={BENCH - 4} w={40} h={20} color={gasColor} amount={0.6} t={t} />}
          <Txt x={430} y={BENCH - 120} anchor="start" size={9} color={C.ink} weight={800}>
            {`${volume.toFixed(0)} mL`}
          </Txt>
        </g>
      )}
      {/* tests */}
      {test === 'pop' && collect === 'overWater' && (
        <g>
          <Splint x={398} y={44} angle={-160} state="burning" t={t} />
          <PopBurst x={392} y={36} t={t} text={bn ? 'পপ!' : 'POP!'} />
        </g>
      )}
      {test === 'relight' && (
        <g>
          <Splint x={300} y={128} angle={-150} state={volume > 3 ? 'bright' : 'glowing'} t={t} />
          {volume > 3 && <Tag x={264} y={112} text={bn ? 'জ্বলে উঠল!' : 'relights!'} tone="chem" size={8.5} />}
        </g>
      )}
      {test === 'milky' && (
        <g>
          <TestTube cx={onBalance ? 330 : 470} y={128} w={24} h={130} spec={{ label: '', liquid: '#e9f1f6', level: 0.45, cloud: clampN(testAmount, 0, 1) * 0.9, cloudColor: '#fbfcfd', bubbles: bubbles > 0 ? 0.4 : 0 }} t={t} seed={9} />
          <Txt x={onBalance ? 330 : 470} y={BENCH + 20} size={9} color="#e7eef5" weight={800}>
            {bn ? 'চুনের পানি' : 'limewater'}
          </Txt>
          {onBalance && <DeliveryTube d={`M 318 ${100} L 330 ${100} L 330 ${240}`} />}
          {onBalance && (
            <Txt x={330} y={92} size={8} color={C.muted}>
              {bn ? 'আলাদা নমুনা গ্যাস' : 'sample of the gas'}
            </Txt>
          )}
        </g>
      )}
      {(test === 'bleach' || test === 'starch') && (
        <g>
          <PaperStrip cx={440} y={BENCH - 168} h={70} color={testPaperColour(test === 'starch' ? 'starch' : 'bleach', testAmount)} wet={0.6} />
          <Txt x={452} y={BENCH - 172} anchor="start" size={8.5} color={C.ink} weight={800}>
            {test === 'starch' ? (bn ? 'স্টার্চ-আয়োডাইড কাগজ' : 'starch–iodide paper') : bn ? 'ভেজা নীল লিটমাস' : 'damp blue litmus'}
          </Txt>
        </g>
      )}
      {hasClock && <Stopwatch cx={hood ? 54 : 50} cy={hood ? 70 : 56} r={28} seconds={vNum(view, 'clock', 0)} unit="s" />}
      {plot && curve && <MiniPlot x={plot.x} y={plot.y} w={plot.w} h={plot.h} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 0} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />}
      {warm && <Glow cx={fx} cy={fyb - 30} r={40} amount={0.25} color="url(#cx-heat)" />}
    </SceneFrame>
  );
}
