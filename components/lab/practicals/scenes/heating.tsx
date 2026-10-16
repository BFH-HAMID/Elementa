'use client';

import React from 'react';
import { BENCH, Bubbles, C, Digital, Fumes, MiniPlot, SceneFrame, Stopwatch, Tag, Thermometer, Txt, clampN, fmt, rnd, vBool, vNum, vObj, vStr, type SceneProps } from '../primitives';
import { BunsenBurner, ChinaDish, Crucible, Dropper, Funnel, SpiritLamp, Tripod } from '../kit';
import { Beaker, ConicalFlask, TestTube } from '../glass';

type CurveView = { pts: { x: number; y: number }[]; cur?: { x: number; y: number }; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string };

const GAUZE_Y = 200;

function Plot({ view, x = 430, y = 18, w = 198, h = 128 }: { view: SceneProps['view']; x?: number; y?: number; w?: number; h?: number }) {
  const curve = vObj<CurveView>(view, 'curve');
  if (!curve) return null;
  return <MiniPlot x={x} y={y} w={w} h={h} pts={curve.pts ?? []} cur={curve.cur} xMax={curve.xMax} yMin={curve.yMin ?? 0} yMax={curve.yMax} xLabel={curve.xLabel} yLabel={curve.yLabel} />;
}

function Clock({ view, bn, cx = 52, cy = 58 }: { view: SceneProps['view']; bn: boolean; cx?: number; cy?: number }) {
  if (view.clock === undefined) return null;
  const unit = vStr(view, 'clockUnit', 's') === 'min' ? 'min' : 's';
  return <Stopwatch cx={cx} cy={cy} r={28} seconds={vNum(view, 'clock', 0)} unit={unit} label={bn ? 'সময়' : 'time'} />;
}

/** Burner under a tripod; flame 0 = off. */
function HeatSource({ cx, flame, t, lamp = false }: { cx: number; flame: number; t: number; lamp?: boolean }) {
  if (lamp) return <SpiritLamp cx={cx} yb={BENCH} lit={flame > 0} t={t} />;
  return <BunsenBurner cx={cx} yb={BENCH} flame={flame > 0 ? 0.5 + 0.25 * flame : 0} open t={t} />;
}

function BoilScene({ view, t, bn }: SceneProps) {
  const cx = 250;
  const temp = vNum(view, 'temp', 25);
  const level = vNum(view, 'level', 0.55);
  const bubbles = vNum(view, 'bubbles', 0);
  const steam = vNum(view, 'steam', 0);
  const yb = GAUZE_Y - 3;
  const h = 94;
  return (
    <SceneFrame label={bn ? 'তরল উত্তপ্ত করা ও স্ফুটন' : 'Heating and boiling'}>
      <HeatSource cx={cx} flame={vNum(view, 'flame', 0)} t={t} />
      <Tripod cx={cx} y={GAUZE_Y} w={96} />
      <Beaker cx={cx} yb={yb} w={98} h={h} liquid={vStr(view, 'liquid', '#dcefff')} level={level} bubbles={bubbles} t={t} />
      <Fumes cx={cx} y={yb - h} w={36} h={70} color="#ffffff" amount={steam * 0.9} t={t} />
      <Thermometer x={cx + 22} y={58} h={132} value={temp} min={0} max={110} />
      <Digital x={318} y={120} w={98} h={42} value={fmt(temp, 1)} unit="°C" label={bn ? 'থার্মোমিটার' : 'thermometer'} />
      {bubbles >= 0.99 && <Tag x={cx} y={yb - h - 12} text={bn ? 'ফুটছে' : 'boiling'} tone="chem" size={9} />}
      <Plot view={view} />
      <Clock view={view} bn={bn} />
    </SceneFrame>
  );
}

function SublimeScene({ view, t, bn }: SceneProps) {
  const cx = 250;
  const funnel = vBool(view, 'funnel');
  const fumes = vNum(view, 'fumes', 0);
  const crust = vNum(view, 'crust', 0);
  const mix = vNum(view, 'mixture', 1);
  const dishY = GAUZE_Y - 8;
  return (
    <SceneFrame label={bn ? 'অ্যামোনিয়াম ক্লোরাইডের ঊর্ধ্বপাতন' : 'Sublimation of ammonium chloride'}>
      <HeatSource cx={cx} flame={vNum(view, 'flame', 0)} t={t} />
      <Tripod cx={cx} y={GAUZE_Y} w={100} />
      <ChinaDish cx={cx} y={dishY} w={104} contents="#f4f4ef" level={0.35 + 0.65 * mix} />
      {fumes > 0 && <Fumes cx={cx} y={dishY - 2} w={funnel ? 30 : 44} h={funnel ? 70 : 110} color="#ffffff" amount={fumes} t={t} />}
      {funnel && <Funnel cx={cx} y={dishY - 96} w={110} h={98} inverted plug crust={crust} />}
      <Digital x={360} y={210} w={112} h={44} value={fmt(vNum(view, 'balance', 35), 2)} unit="g" label={bn ? 'বাটি + বস্তু' : 'dish + contents'} />
      {crust > 0.05 && funnel && <Tag x={cx + 84} y={dishY - 70} text={bn ? 'NH₄Cl-এর সাদা আস্তরণ' : 'white NH₄Cl crust'} tone="light" size={8} />}
      <Txt x={cx} y={BENCH + 22} size={9.5} color="#e7eef5" weight={800}>
        {bn ? 'NH₄Cl + NaCl মিশ্রণ (5.00 g)' : 'NH₄Cl + NaCl mixture (5.00 g)'}
      </Txt>
      <Plot view={view} />
      <Clock view={view} bn={bn} />
    </SceneFrame>
  );
}

function CrucibleScene({ view, t, bn }: SceneProps) {
  const cx = 230;
  const stage = vNum(view, 'stage', 0);
  const lid = vStr(view, 'lid', 'off') as 'on' | 'ajar' | 'off';
  const flame = vNum(view, 'flame', 0);
  const smoke = vNum(view, 'smoke', 0);
  const steam = vNum(view, 'steam', 0);
  const contents = vStr(view, 'contents', '#f1f1ec');
  const crucY = GAUZE_Y - 30;
  const limeMade = vBool(view, 'limeMade');
  return (
    <SceneFrame label={bn ? 'মুচিতে উত্তাপ' : 'Heating in a crucible'}>
      <HeatSource cx={cx} flame={flame} t={t} lamp={vBool(view, 'lamp')} />
      <Tripod cx={cx} y={GAUZE_Y} w={90} gauze={false} ring />
      <Crucible cx={cx} y={crucY} contents={contents} lid={lid} glow={vNum(view, 'glow', 0)} coil={vNum(view, 'coil', 0)} t={t} />
      {smoke > 0 && <Fumes cx={cx} y={crucY - 8} w={40} h={90} color="#f8f8f4" amount={smoke} t={t} />}
      {steam > 0 && <Fumes cx={cx} y={crucY - 6} w={26} h={60} color="#ffffff" amount={steam} t={t} />}
      {vBool(view, 'dropper') && <Dropper cx={cx + 6} y={crucY - 70} color="#dcefff" label={bn ? 'পানি' : 'water'} t={t} dropTo={crucY - 2} />}
      {/* the balance used for weighing */}
      <g>
        <path d="M 360 300 L 366 262 L 494 262 L 500 300 Z" fill="url(#cx-plastic)" stroke="#9aa6b2" filter="url(#cx-shadow)" />
        <rect x={378} y={274} width="104" height="18" rx="3" fill="url(#cx-lcd)" stroke="#5a7a5e" strokeWidth="0.8" />
        <Txt x={476} y={288} anchor="end" size={11.5} color="#163b1c" weight={800} mono>
          {`${fmt(vNum(view, 'balance', 0), vNum(view, 'balance', 0) < 30 ? 3 : 2)} g`}
        </Txt>
        <rect x={392} y={256} width="76" height="6" rx="3" fill="url(#cx-metal)" />
        <Txt x={430} y={BENCH + 20} size={8.5} color="#e7eef5" weight={800}>
          {bn ? 'ঠান্ডা করে ওজন' : 'weighed when cool'}
        </Txt>
      </g>
      {stage > 0 && (
        <g>
          <rect x={516} y={60} width="112" height="186" rx="10" fill="#ffffff" opacity="0.95" stroke={C.line} filter="url(#cx-shadow)" />
          {stage === 1 && (
            <g>
              <ChinaDish cx={572} y={170} w={80} contents={limeMade ? '#f7f6f1' : '#f1f1ec'} level={0.5} />
              <Dropper cx={572} y={92} color="#dcefff" t={t} dropTo={166} />
              {limeMade && <Fumes cx={572} y={164} w={26} h={50} color="#ffffff" amount={0.8} t={t} />}
              <Txt x={572} y={232} size={8.5} color={C.ink} weight={800}>
                {limeMade ? (bn ? 'হিস! বাষ্প, তাপ' : 'hiss! steam, heat') : bn ? 'প্রায় কিছুই না' : 'hardly anything'}
              </Txt>
            </g>
          )}
          {stage === 2 && (
            <g>
              <TestTube cx={572} y={80} w={24} h={130} spec={{ label: '', liquid: limeMade ? '#5b2f9f' : '#9fd36a', level: 0.5 }} t={t} />
              <Txt x={572} y={232} size={8.5} color={C.ink} weight={800}>
                {limeMade ? (bn ? 'বেগুনি: pH ≈ ১২' : 'violet: pH ≈ 12') : bn ? 'প্রায় সবুজ' : 'nearly green'}
              </Txt>
            </g>
          )}
          {stage === 3 && (
            <g>
              <TestTube cx={572} y={80} w={24} h={130} spec={{ label: '', liquid: '#e9f1f6', level: 0.5, cloud: limeMade ? 0.85 : 0.08, cloudColor: '#fbfcfd', bubbles: 0.5 }} t={t} />
              <path d="M 590 60 L 576 196" stroke="#f4d58d" strokeWidth="4" strokeLinecap="round" />
              <Txt x={572} y={232} size={8.5} color={C.ink} weight={800}>
                {limeMade ? (bn ? 'ঘোলা: CaCO₃' : 'milky: CaCO₃') : bn ? 'স্বচ্ছ' : 'clear'}
              </Txt>
            </g>
          )}
        </g>
      )}
      <Clock view={view} bn={bn} />
    </SceneFrame>
  );
}

function EvaporateScene({ view, t, bn }: SceneProps) {
  const step = vNum(view, 'step', 0);
  const cx = 230;
  const crystals = vNum(view, 'crystals', 0);
  const level = vNum(view, 'level', 1);
  return (
    <SceneFrame label={bn ? 'খনিজ লবণ বিশোধন' : 'Purifying rock salt'}>
      {step === 0 && (
        <g>
          <Beaker cx={cx} yb={BENCH - 2} w={120} h={120} liquid="#d9cbb0" level={0.55} opacity={0.75} cloud={0.35} cloudColor="#c9b48b" t={t} />
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} cx={cx - 46 + rnd(i) * 92} cy={BENCH - 8 - rnd(i * 3) * 8} r={1.5 + rnd(i * 7) * 1.5} fill="#b8925b" />
          ))}
          <path d={`M ${cx + 20 + Math.sin(t * 3) * 10} ${BENCH - 160} L ${cx + Math.sin(t * 3) * 18} ${BENCH - 14}`} stroke="#e8eef3" strokeWidth="4" strokeLinecap="round" />
          {vBool(view, 'undissolved') && <Tag x={cx} y={BENCH - 132} text={bn ? 'কিছু লবণ অদ্রবীভূত!' : 'some salt undissolved!'} tone="warn" size={9} />}
          <Txt x={cx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
            {bn ? 'খনিজ লবণ + পানি, নাড়া হচ্ছে' : 'rock salt + water, stirring'}
          </Txt>
        </g>
      )}
      {step === 1 && (
        <g>
          <ConicalFlask cx={cx} yb={BENCH - 2} w={110} h={120} liquid="#eef4f9" level={0.45} t={t} />
          <Funnel cx={cx} y={110} w={84} h={80} />
          <path d={`M ${cx - 36} 112 L ${cx} 150 L ${cx + 36} 112 Z`} fill="#fbfbf8" opacity="0.9" stroke="#d9d3bd" />
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={cx - 14 + rnd(i) * 28} cy={130 + rnd(i * 5) * 10} r={1.6} fill="#b8925b" />
          ))}
          <Txt x={cx + 64} y={128} anchor="start" size={8.5} color={C.ink} weight={800}>
            {bn ? 'অবশেষ: বালি' : 'residue: sand'}
          </Txt>
          <Txt x={cx + 64} y={240} anchor="start" size={8.5} color={C.ink} weight={800}>
            {bn ? 'পরিস্রুত: লবণ দ্রবণ' : 'filtrate: salt solution'}
          </Txt>
        </g>
      )}
      {step === 2 && (
        <g>
          <HeatSource cx={cx} flame={vNum(view, 'flame', 0)} t={t} />
          <Tripod cx={cx} y={GAUZE_Y} w={100} />
          <ChinaDish cx={cx} y={GAUZE_Y - 8} w={108} contents="#e6f0f7" level={level} crystals={crystals} />
          <Fumes cx={cx} y={GAUZE_Y - 12} w={40} h={80} color="#ffffff" amount={vNum(view, 'steam', 0)} t={t} />
          {vBool(view, 'spit') &&
            Array.from({ length: 8 }, (_, i) => {
              const p = (t * 1.3 + i / 8) % 1;
              return <rect key={i} x={cx - 50 + i * 14 + p * (i % 2 ? 20 : -20)} y={GAUZE_Y - 14 - Math.sin(p * Math.PI) * 50} width="2.5" height="2.5" fill="#ffffff" stroke="#c9d3dc" strokeWidth="0.4" />;
            })}
          <Txt x={cx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
            {bn ? 'পরিস্রুত বাষ্পীভূত হচ্ছে' : 'evaporating the filtrate'}
          </Txt>
        </g>
      )}
      {step === 2 && <Digital x={380} y={150} w={120} h={46} value={fmt(vNum(view, 'balance', 0), 2)} unit="g" label={bn ? 'বাটি + বস্তু' : 'basin + contents'} />}
      <g>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx={410 + i * 40} cy={232} r="11" fill={i === step ? C.chem : i < step ? '#9be3c9' : '#ffffff'} stroke={C.line} />
            <Txt x={410 + i * 40} y={236} size={9} color={i === step ? '#ffffff' : C.ink} weight={800}>
              {i + 1}
            </Txt>
          </g>
        ))}
        <Txt x={450} y={258} size={8} color={C.muted} weight={700}>
          {bn ? 'দ্রবণ · ছাঁকা · বাষ্পীভবন' : 'dissolve · filter · evaporate'}
        </Txt>
      </g>
      <Clock view={view} bn={bn} />
    </SceneFrame>
  );
}

function SolubilityScene({ view, t, bn }: SceneProps) {
  const cx = 240;
  const temp = vNum(view, 'temp', 80);
  const crystals = vNum(view, 'crystals', 0);
  const warmth = clampN((temp - 20) / 60, 0, 1);
  return (
    <SceneFrame label={bn ? 'KNO₃-এর দ্রাব্যতা' : 'Solubility of potassium nitrate'}>
      <Tripod cx={cx} y={GAUZE_Y} w={100} />
      <Beaker cx={cx} yb={GAUZE_Y - 3} w={120} h={110} liquid={warmth > 0.5 ? '#ffe9d6' : '#e3f1fb'} level={0.62} />
      <TestTube cx={cx} y={62} w={30} h={150} spec={{ label: '', liquid: '#f4f8fb', level: 0.42, crystals: crystals > 0 ? crystals : 0, crystalColor: '#ffffff', ppt: crystals * 0.08, pptColor: '#ffffff' }} t={t} seed={3} />
      <Thermometer x={cx + 4} y={44} h={150} value={temp} min={0} max={100} label={false} />
      <Digital x={330} y={120} w={98} h={42} value={fmt(temp, 1)} unit="°C" label={bn ? 'থার্মোমিটার' : 'thermometer'} />
      {crystals > 0 && <Tag x={cx} y={46} text={bn ? 'কেলাস!' : 'crystals!'} tone="chem" size={9} />}
      <Txt x={cx} y={BENCH + 20} size={9.5} color="#e7eef5" weight={800}>
        {`KNO₃ ${vNum(view, 'mass', 5)} g + ${bn ? 'পানি' : 'water'} 10.0 g`}
      </Txt>
      <Bubbles x0={cx - 50} x1={cx - 20} yTop={GAUZE_Y - 70} yBottom={GAUZE_Y - 8} rate={0} t={t} />
      <Plot view={view} x={440} y={20} w={186} h={136} />
    </SceneFrame>
  );
}

export function HeatingScene(props: SceneProps) {
  switch (vStr(props.view, 'kind', 'boil')) {
    case 'sublime':
      return <SublimeScene {...props} />;
    case 'crucible':
      return <CrucibleScene {...props} />;
    case 'evaporate':
      return <EvaporateScene {...props} />;
    case 'solubility':
      return <SolubilityScene {...props} />;
    default:
      return <BoilScene {...props} />;
  }
}
