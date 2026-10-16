'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BENCH, Digital, Fumes, MiniPlot, SceneFrame, Tag, Thermometer, Txt, clampN, fmt, safe, vBool, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { ClampStand, WhiteTile } from '../kit';
import { Beaker, Burette, ConicalFlask } from '../glass';

type BuretteView = { reading: number; max?: number; color: string; label?: string; dark?: boolean };
type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };

/** Remember when a value last changed (drives the dripping tap). */
function useRecentChange(value: number, t: number, window = 1.2) {
  const last = useRef<{ v: number; at: number }>({ v: value, at: -10 });
  const [, force] = useState(0);
  useEffect(() => {
    if (Math.abs(value - last.current.v) > 1e-9) {
      last.current = { v: value, at: t };
      force((n) => n + 1);
    }
    // t is intentionally not a dependency: only value changes restart the drip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return t - last.current.at < window && last.current.at >= 0;
}

export function TitrationScene({ view, t, bn }: SceneProps) {
  const burette = vObj<BuretteView>(view, 'burette') ?? { reading: 0, color: '#eef5ff' };
  const vessel = vStr(view, 'vessel', 'conical');
  const liquid = vStr(view, 'liquid', '#eef4fa');
  const level = vNum(view, 'level', 0.3);
  const cloud = vNum(view, 'cloud', 0);
  const flash = vStr(view, 'flash');
  const meter = view.meter;
  const thermo = view.thermo;
  const curve = vObj<CurveView>(view, 'curve');
  const endpoint = vBool(view, 'endpoint');
  const flaskLabel = vStr(view, 'flaskLabel');
  const meterLabel = vStr(view, 'meterLabel', bn ? 'pH মিটার' : 'pH meter');
  const meterUnit = vStr(view, 'meterUnit', '');
  const meterDigits = vNum(view, 'meterDigits', 2);
  const reading = clampN(safe(burette.reading), 0, burette.max ?? 50);
  const dripping = useRecentChange(reading, t);
  const cx = 236;
  const buretteTop = 22;
  const buretteH = 214;
  const flaskTop = vessel === 'beaker' ? 196 : 186;
  const surfaceY = vessel === 'beaker' ? BENCH - 7 - 3 - clampN(level, 0, 0.95) * 80 : BENCH - 4 - 2 - clampN(level, 0, 1) * 64;
  const swirl = Math.sin(t * 2.4) * 2.5;

  return (
    <SceneFrame label={bn ? 'টাইট্রেশন সেটআপ' : 'Titration set-up'}>
      <ClampStand x={150} h={276} clamps={[{ y: 60, toX: cx - 7 }, { y: 170, toX: cx - 7 }]} />
      {vessel !== 'beaker' && <WhiteTile cx={cx} w={130} />}
      {vessel === 'beaker' ? (
        <Beaker cx={cx} yb={BENCH - 4} w={112} h={92} liquid={liquid} level={level} cloud={cloud} t={t} />
      ) : (
        <ConicalFlask cx={cx} yb={BENCH - 4} w={112} h={112} liquid={liquid} level={level} cloud={cloud} cloudColor="#8a5a2b" t={t} />
      )}
      {flash && <ellipse cx={cx + swirl} cy={surfaceY + 3} rx={14 + 4 * Math.sin(t * 5)} ry="3.5" fill={flash} opacity={0.55 + 0.35 * Math.sin(t * 6)} />}
      <ellipse cx={cx + swirl} cy={surfaceY} rx="8" ry="1.2" fill="#ffffff" opacity="0.45" />
      <Burette cx={cx} y={buretteTop} h={buretteH} reading={reading} max={burette.max ?? 50} color={burette.color} label={burette.label} dark={burette.dark} t={t} dripping={dripping} />
      {thermo !== undefined && <Thermometer x={cx + 34} y={flaskTop - 66} h={150} value={vNum(view, 'thermo', 25)} min={20} max={40} />}
      {meter !== undefined && (
        <g>
          <path d={`M ${cx - 30} ${flaskTop - 50} C ${cx - 40} ${flaskTop - 90} 330 ${flaskTop - 110} 360 ${flaskTop - 92}`} fill="none" stroke="#2b333c" strokeWidth="2" />
          <rect x={cx - 33} y={flaskTop - 52} width="6" height={surfaceY - flaskTop + 72} rx="2.5" fill="#e9eef3" stroke="#7d8995" strokeWidth="0.8" />
          <Digital x={340} y={flaskTop - 112} w={104} h={48} value={fmt(vNum(view, 'meter', 7), meterDigits)} unit={meterUnit} label={meterLabel} />
        </g>
      )}
      {thermo !== undefined && <Digital x={340} y={flaskTop - 56} w={104} h={40} value={`${fmt(vNum(view, 'thermo', 25), 1)}`} unit="°C" label={bn ? 'থার্মোমিটার' : 'thermometer'} />}
      {curve && (
        <MiniPlot x={462} y={22} w={166} h={128} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 0} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />
      )}
      {vBool(view, 'starch') && <Tag x={cx + 92} y={BENCH - 70} text={bn ? '+ স্টার্চ' : '+ starch'} tone="dark" size={9} />}
      {endpoint && <Tag x={cx + 100} y={BENCH - 40} text={bn ? '✓ শেষ বিন্দু' : '✓ end point'} tone="chem" size={10} />}
      {cloud > 0.2 && <Fumes cx={cx} y={flaskTop - 4} w={10} h={20} color="#d6c7b0" amount={0.2} t={t} />}
      <Txt x={cx} y={BENCH + 22} size={9.5} color="#e7eef5" weight={800}>
        {flaskLabel}
      </Txt>
      <Txt x={150} y={BENCH + 22} size={8} color="#b9c7d6">
        {bn ? 'বুরেট স্ট্যান্ড' : 'retort stand'}
      </Txt>
      <Txt x={470} y={BENCH + 22} anchor="start" size={8} color="#b9c7d6">
        {bn ? '± বোতামে এক ফোঁটা করে দাও' : 'use ± for single drops'}
      </Txt>
    </SceneFrame>
  );
}
