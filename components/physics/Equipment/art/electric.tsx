'use client';

import React from 'react';
import {
  BindingPost,
  Coil,
  Display,
  Etch,
  Knob,
  Led,
  LinearScale,
  MeterFace,
  Rod,
  WoodBoard,
  clamp,
  num,
  on,
  useArtDrag,
  type ArtEntry
} from './parts';
import { Contact, Sheen } from './materials';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Standard 4-band colour code so the drawn resistor really matches its value. */
const BAND_COLORS = ['#111827', '#7c3f00', '#dc2626', '#ea580c', '#eab308', '#16a34a', '#2563eb', '#7c3aed', '#9ca3af', '#f8fafc'];
const MULTS = [1, 10, 100, 1000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000];

function bandColors(ohms: number): string[] {
  const v = clamp(Math.abs(ohms), 1, 9.9e10);
  const digits = v.toPrecision(2);
  const a = parseInt(digits[0], 10);
  const b = parseInt(digits[1] ?? '0', 10);
  const exp = Math.max(0, Math.floor(Math.log10(v / (a * 10 + b))) + 1);
  return [BAND_COLORS[a], BAND_COLORS[b], BAND_COLORS[clamp(exp, 0, 9)], '#c9a227'];
}

function Lead({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      <line x1={x1} y1={y1 + 0.6} x2={x2} y2={y2 + 0.6} stroke="#0b1220" strokeOpacity={0.3} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#ix-chrome)" strokeWidth={2.2} strokeLinecap="round" />
      <line x1={x1} y1={y1 - 0.7} x2={x2} y2={y2 - 0.7} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={0.6} strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Electricity                                                          */
/* ------------------------------------------------------------------ */

const batteryDc: ArtEntry = {
  vb: '0 0 132 64',
  Comp: ({ p, bn }) => {
    const v = num(p.voltage, 6);
    return (
      <g>
        <Contact cx={66} cy={57} rx={42} opacity={0.34} />
        {/* moulded hard-rubber case: lit top, dark base, rounded shoulders */}
        <rect x={13} y={13} width={106} height={42} rx={6} fill="url(#ix-charcoal)" stroke="#0b1220" strokeOpacity={0.75} strokeWidth={0.9} filter="url(#ix-shadow)" />
        <rect x={13} y={13} width={106} height={7} rx={3.5} fill="#ffffff" opacity={0.16} />
        <rect x={13} y={46} width={106} height={9} rx={4} fill="#0b1220" opacity={0.28} />
        <rect x={16} y={16} width={100} height={36} rx={4} fill="none" stroke="#00000055" strokeWidth={0.6} />
        {/* recessed label: printed paper behind a glazed window */}
        <rect x={22} y={24} width={88} height={26} rx={2.4} fill="url(#ix-cream)" stroke="#9c8f76" strokeWidth={0.6} />
        <rect x={22} y={24} width={88} height={26} rx={2.4} fill="url(#ix-grain)" opacity={0.12} />
        <rect x={24} y={26} width={84} height={6} rx={1.4} fill="#2f6fbf" opacity={0.85} />
        <Etch x={66} y={31} size={5.4} color="#ffffff" weight={800}>
          {bn ? 'শুষ্ক কোষ' : 'DRY CELL'}
        </Etch>
        <Etch x={66} y={44} size={9.4} color="#1f2937" weight={800} mono>
          {`${v.toFixed(1)} V`}
        </Etch>
        {/* the red polarity flash moulded into the case */}
        <rect x={16} y={30} width={5} height={14} rx={2} fill="#b91c1c" opacity={0.9} />
        <rect x={16} y={30} width={5} height={4} rx={2} fill="#ffffff" opacity={0.25} />
        {/* glazing: one long reflection across the label */}
        <rect x={22} y={24} width={88} height={12} rx={2} fill="url(#ix-reflect)" opacity={0.4} />
        {/* brass terminals: a rivet, a shoulder and the engraved sign */}
        {[
          { x: 32, s: '+' },
          { x: 100, s: '−' }
        ].map((t) => (
          <g key={t.s}>
            <ellipse cx={t.x} cy={13} rx={9} ry={3} fill="#0b1220" opacity={0.3} />
            <rect x={t.x - 8} y={7} width={16} height={7} rx={1.6} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.5} />
            <rect x={t.x - 4.6} y={2} width={9.2} height={6} rx={1.4} fill="url(#ix-brass-ball)" stroke="#7c560f" strokeWidth={0.45} />
            <ellipse cx={t.x - 1.4} cy={4} rx={2} ry={1.2} fill="#fff8d8" opacity={0.7} />
            <Etch x={t.x} y={21} size={7} color="#f8fafc" weight={800}>
              {t.s}
            </Etch>
          </g>
        ))}
      </g>
    );
  }
};

const acSource: ArtEntry = {
  vb: '0 0 132 74',
  Comp: ({ p, bn, live }) => {
    const f = num(p.frequency, 50);
    const v = num(p.voltageRms, 12);
    return (
      <g>
        <Contact cx={66} cy={66} rx={42} opacity={0.3} />
        <rect x={12} y={12} width={108} height={50} rx={5} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={12} y={12} width={108} height={10} rx={4} fill="#ffffff" opacity={0.4} />
        <Etch x={66} y={30} size={7} color="#3f4a56" weight={800}>
          {bn ? 'এসি সাপ্লাই' : 'AC MAINS UNIT'}
        </Etch>
        <Display x={36} y={33} w={60} h={14} text={`${v.toFixed(0)}V ${f.toFixed(0)}Hz`} on color="amber" digits={7} />
        {/* neon indicator */}
        <circle cx={22} cy={40} r={3.4} fill={live ? '#ff8a5c' : '#6b7280'} stroke="#334155" strokeWidth={0.4} />
        {live && <circle cx={22} cy={40} r={6} fill="url(#ix-glow-amber)" opacity={0.7} style={{ animation: 'ix-pulse 2.2s ease-in-out infinite' }} />}
        <Etch x={22} y={50} size={4.6} color="#475569">
          ON
        </Etch>
        {/* transformer hum vents */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={96} y1={32 + i * 4} x2={114} y2={32 + i * 4} stroke="#6b7280" strokeWidth={1.1} opacity={0.7} />
        ))}
        {/* terminals L / N */}
        <BindingPost cx={40} cy={56} r={4} />
        <BindingPost cx={92} cy={56} r={4} />
        <Etch x={40} y={66} size={6} color="#7f1d1d" weight={800}>
          L
        </Etch>
        <Etch x={92} y={66} size={6} color="#1e3a8a" weight={800}>
          N
        </Etch>
      </g>
    );
  }
};

const powerSupply: ArtEntry = {
  vb: '0 0 152 86',
  Comp: ({ p, live }) => {
    const v = num(p.voltage, 5);
    const i = num(p.currentLimit, 2);
    return (
      <g>
        <Contact cx={76} cy={78} rx={52} opacity={0.32} />
        <rect x={10} y={8} width={132} height={68} rx={5} fill="url(#ix-charcoal)" stroke="#0b1220" strokeOpacity={0.7} strokeWidth={0.9} filter="url(#ix-drop)" />
        <rect x={10} y={8} width={132} height={12} rx={4} fill="#ffffff" opacity={0.1} />
        {/* twin LCD panels */}
        <Display x={20} y={20} w={40} h={16} text={v.toFixed(2)} unit="V" on color="lcd" />
        <Display x={64} y={20} w={30} h={16} text={i.toFixed(2)} unit="A" on color="lcd" />
        <Etch x={40} y={15} size={5.4} color="#cbd5e1">
          VOLTAGE
        </Etch>
        <Etch x={79} y={15} size={5.4} color="#cbd5e1">
          CURRENT
        </Etch>
        {/* coarse + fine knobs */}
        <Knob cx={116} cy={28} r={9} kind="black" />
        <Knob cx={136} cy={28} r={6} kind="black" />
        <Etch x={126} y={45} size={5} color="#94a3b8">
          COARSE · FINE
        </Etch>
        {/* ventilation louvres */}
        {Array.from({ length: 6 }).map((_, k) => (
          <line key={k} x1={20} y1={47 + k * 4} x2={96} y2={47 + k * 4} stroke="#94a3b8" strokeOpacity={0.45} strokeWidth={1.4} />
        ))}
        {/* terminals + power LED */}
        <BindingPost cx={116} cy={62} r={4.2} polarity="positive" />
        <BindingPost cx={136} cy={62} r={4.2} polarity="negative" />
        <Etch x={116} y={74} size={6} color="#fecaca" weight={800}>
          +
        </Etch>
        <Etch x={136} y={74} size={6} color="#cbd5e1" weight={800}>
          −
        </Etch>
        <Led cx={108} cy={70} r={2.6} color="green" lit={live} />
      </g>
    );
  }
};

const switchSpst: ArtEntry = {
  vb: '0 0 112 54',
  Comp: ({ p, onToggle, bn }) => {
    const closed = on(p.closed);
    return (
      <g>
        {/* steel base plate */}
        <rect x={8} y={26} width={96} height={18} rx={2.5} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.7} filter="url(#ix-drop)" />
        <rect x={8} y={26} width={96} height={4} rx={2} fill="#ffffff" opacity={0.4} />
        <Etch x={56} y={24} size={5.4} color="#3f4a56" weight={700}>
          {bn ? 'একমুখী কী' : 'ONE-WAY KEY'}
        </Etch>
        {/* brass contact blocks */}
        <rect x={18} y={20} width={12} height={9} rx={1.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={82} y={20} width={12} height={9} rx={1.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
        {/* hinged lever: rotates true to a real knife switch */}
        <g style={{ transform: `rotate(${closed ? 0 : -34}deg)`, transformOrigin: '24px 24px', transition: 'transform 160ms cubic-bezier(.2,.9,.3,1.1)' }}>
          <rect x={22} y={20.4} width={closed ? 66 : 68} height={6} rx={1.6} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.4} />
          <circle cx={24} cy={23.4} r={3} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={0.4} />
        </g>
        <circle cx={88} cy={23.4} r={2.6} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={0.4} />
        {/* bakelite knob on the lever end + engraved state */}
        <g style={{ transform: `rotate(${closed ? 0 : -34}deg)`, transformOrigin: '24px 24px', transition: 'transform 160ms cubic-bezier(.2,.9,.3,1.1)' }}>
          <rect x={78} y={12} width={10} height={16} rx={4} fill="url(#ix-bakelite)" stroke="#0b1220" strokeOpacity={0.6} strokeWidth={0.5} />
        </g>
        <Etch x={56} y={52} size={7} color={closed ? '#047857' : '#b91c1c'} weight={800} mono>
          {closed ? 'CLOSED · ON' : 'OPEN · OFF'}
        </Etch>
        {onToggle && <rect x={8} y={6} width={96} height={42} fill="transparent" data-no-drag onPointerDown={(e) => e.stopPropagation()} onClick={onToggle} style={{ cursor: 'pointer' }} />}
      </g>
    );
  }
};

const tapKey: ArtEntry = {
  vb: '0 0 102 52',
  Comp: ({ p, onToggle, bn }) => {
    const closed = on(p.closed);
    return (
      <g>
        <rect x={8} y={24} width={86} height={18} rx={2.5} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.7} filter="url(#ix-drop)" />
        <rect x={8} y={24} width={86} height={18} rx={2.5} fill="url(#ix-grain)" />
        <Etch x={51} y={21} size={5.4} color="#3f2a0e" weight={700}>
          {bn ? 'ট্যাপিং কী' : 'TAPPING KEY'}
        </Etch>
        {/* brass strip with a contact stud, pressed down when closed */}
        <g style={{ transform: `translateY(${closed ? 2.4 : 0}px)`, transition: 'transform 90ms ease-out' }}>
          <rect x={16} y={17} width={70} height={4} rx={1.4} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.4} />
          <rect x={32} y={10} width={38} height={8} rx={3.4} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={0.5} />
          <circle cx={51} cy={13.6} r={2.2} fill="#7c560f" opacity={0.6} />
        </g>
        <rect x={80} y={14} width={10} height={10} rx={1.6} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={0.5} />
        {closed && <circle cx={85} cy={19} r={5} fill="#fbbf24" opacity={0.35} filter="url(#ix-glow)" />}
        <Etch x={51} y={50} size={6.4} color={closed ? '#047857' : '#6b7280'} weight={800} mono>
          {closed ? 'PRESSED' : 'RELEASED'}
        </Etch>
        {onToggle && <rect x={8} y={4} width={86} height={44} fill="transparent" data-no-drag onPointerDown={(e) => e.stopPropagation()} onClick={onToggle} style={{ cursor: 'pointer' }} />}
      </g>
    );
  }
};

const switchSpdt: ArtEntry = {
  vb: '0 0 122 62',
  Comp: ({ p, live }) => {
    const sel = typeof p.selectedPosition === 'string' ? p.selectedPosition : '1';
    const angle = sel === '1' ? -32 : sel === '2' ? 32 : 0;
    return (
      <g>
        <rect x={10} y={30} width={102} height={20} rx={2.5} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.7} filter="url(#ix-drop)" />
        <rect x={10} y={30} width={102} height={4} rx={2} fill="#ffffff" opacity={0.4} />
        {/* three brass studs: common + two ways */}
        {[
          { x: 24, y: 34 },
          { x: 96, y: 22 },
          { x: 96, y: 46 }
        ].map((s) => (
          <rect key={`${s.x}-${s.y}`} x={s.x - 6} y={s.y - 3.4} width={12} height={7} rx={1.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
        ))}
        <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '24px 36px', transition: 'transform 190ms cubic-bezier(.2,.9,.3,1.1)' }}>
          <Rod x1={24} y1={36} x2={92} y2={36} w={4} variant="brass" />
          <rect x={84} y={30} width={9} height={12} rx={3.4} fill="url(#ix-bakelite)" />
        </g>
        <Etch x={24} y={54} size={5.6} color="#475569" weight={700}>
          C
        </Etch>
        <Etch x={96} y={16} size={5.6} color="#475569" weight={700}>
          1
        </Etch>
        <Etch x={96} y={58} size={5.6} color="#475569" weight={700}>
          2
        </Etch>
        <Etch x={58} y={56} size={6} color={sel === 'off' ? '#b91c1c' : '#047857'} weight={800} mono>
          {sel === 'off' ? 'OPEN' : `WAY ${sel}`}
        </Etch>
        {live && sel !== 'off' && <circle cx={92} cy={sel === '1' ? 22 : 46} r={4} fill="#fbbf24" opacity={0.4} filter="url(#ix-glow)" />}
      </g>
    );
  }
};

const resistorFixed: ArtEntry = {
  vb: '0 0 122 46',
  Comp: ({ p, res }) => {
    const R = num(p.resistance, 100);
    const bands = bandColors(R);
    const i = res?.current ?? 0;
    return (
      <g>
        <Lead x1={4} y1={24} x2={30} y2={24} />
        <Lead x1={92} y1={24} x2={118} y2={24} />
        {/* ceramic body + end caps */}
        <rect x={28} y={13} width={66} height={22} rx={4} fill="#d8c9a8" stroke="#a08a63" strokeWidth={0.6} filter="url(#ix-drop)" />
        <rect x={28} y={13} width={66} height={22} rx={4} fill="url(#ix-rough)" opacity={0.35} />
        <rect x={28} y={13} width={66} height={7} rx={3} fill="#ffffff" opacity={0.28} />
        <rect x={24} y={11} width={9} height={26} rx={2} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.4} />
        <rect x={89} y={11} width={9} height={26} rx={2} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.4} />
        {/* printed colour code */}
        {bands.map((c, k) => (
          <rect key={k} x={36 + k * 13} y={13} width={c === '#c9a227' ? 5 : 6.5} height={22} fill={c} opacity={0.95} />
        ))}
        <Etch x={61} y={44} size={6.6} color="#334155" weight={800} mono>
          {R >= 1000 ? `${(R / 1000).toFixed(R % 1000 === 0 ? 0 : 1)} kΩ` : `${R.toFixed(R < 10 ? 1 : 0)} Ω`}
          {i > 0.001 ? ` · ${(i * 1000).toFixed(1)} mA` : ''}
        </Etch>
        {res?.burnedOut && <Etch x={61} y={9} size={6} color="#b91c1c" weight={800}>{'BURNED OUT'}</Etch>}
      </g>
    );
  }
};

const resistanceBox: ArtEntry = {
  vb: '0 0 152 70',
  Comp: ({ p, bn }) => {
    const total = num(p.resistance, 50);
    const digits = [Math.floor(total / 1000) % 10, Math.floor(total / 100) % 10, Math.floor(total / 10) % 10, total % 10];
    return (
      <g>
        <WoodBoard x={6} y={8} w={140} h={54} rx={3} />
        <Etch x={76} y={20} size={6.4} color="#3f2a0e" weight={800}>
          {bn ? 'রেজিস্ট্যান্স বক্স' : 'RESISTANCE BOX'}
        </Etch>
        {/* four decade dials with engraved numerals */}
        {digits.map((d, k) => (
          <g key={k}>
            <circle cx={28 + k * 32} cy={40} r={13} fill="url(#ix-dial)" stroke="#8a8272" strokeWidth={0.6} />
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (-120 + i * 24) * (Math.PI / 180);
              return (
                <g key={i}>
                  <line
                    x1={28 + k * 32 + Math.sin(a) * 9.4}
                    y1={40 - Math.cos(a) * 9.4}
                    x2={28 + k * 32 + Math.sin(a) * 12}
                    y2={40 - Math.cos(a) * 12}
                    stroke="#1f2937"
                    strokeWidth={i % 5 === 0 ? 0.9 : 0.5}
                  />
                  <Etch x={28 + k * 32 + Math.sin(a) * 7} y={40 - Math.cos(a) * 7 + 1.6} size={3.4} color="#334155">
                    {i}
                  </Etch>
                </g>
              );
            })}
            <Knob cx={28 + k * 32} cy={40} r={6.4} kind="black" teeth={10} />
            <g style={{ transform: `rotate(${d * 24}deg)`, transformOrigin: `${28 + k * 32}px 40px`, transition: 'transform 220ms cubic-bezier(.2,.9,.3,1.1)' }}>
              <line x1={28 + k * 32} y1={40} x2={28 + k * 32} y2={34.4} stroke="#f8fafc" strokeWidth={1.2} />
            </g>
            <Etch x={28 + k * 32} y={60} size={4.2} color="#4b5563" mono>
              {`${d}×${10 ** (3 - k)}`}
            </Etch>
          </g>
        ))}
        <BindingPost cx={16} cy={14} r={3.4} />
        <BindingPost cx={136} cy={14} r={3.4} />
      </g>
    );
  }
};

const rheostat: ArtEntry = {
  vb: '0 0 162 76',
  Comp: ({ p, bn, setProp, live }) => {
    const max = num(p.maxResistance, 100);
    const pos = clamp(num(p.sliderPosition, 50), 0, 100);
    const x0 = 30;
    const x1 = 132;
    const knobX = x0 + (pos / 100) * (x1 - x0);
    const grabOffset = React.useRef(0);
    const drag = useArtDrag((pt) => {
      setProp?.('sliderPosition', clamp(Math.round(((pt.x - grabOffset.current - x0) / (x1 - x0)) * 100), 0, 100));
    });
    const startDrag = (e: React.PointerEvent<SVGElement>) => {
      grabOffset.current = 0;
      const svg = e.currentTarget.ownerSVGElement;
      if (svg) {
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const art = pt.matrixTransform(ctm.inverse());
          grabOffset.current = art.x - knobX;
        }
      }
      drag.onPointerDown(e);
    };
    return (
      <g>
        <Contact cx={81} cy={70} rx={44} opacity={0.3} />
        {/* porcelain tube with a wire winding */}
        <rect x={26} y={30} width={110} height={22} rx={6} fill="url(#ix-cream)" stroke="#b9ac93" strokeWidth={0.6} />
        {Array.from({ length: 46 }).map((_, i) => (
          <line key={i} x1={28 + i * 2.36} y1={31} x2={28 + i * 2.36} y2={51} stroke="url(#ix-nichrome)" strokeWidth={1.5} opacity={0.9} />
        ))}
        <rect x={26} y={30} width={110} height={6} rx={3} fill="#ffffff" opacity={0.22} />
        {/* brass guide rod + travelling contact */}
        <Rod x1={24} y1={22} x2={138} y2={22} w={4} variant="brass" />
        <g
          {...drag}
          onPointerDown={startDrag}
        >
          <rect x={knobX - 7} y={14} width={14} height={20} rx={2.4} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.5} />
          <rect x={knobX - 4} y={17} width={8} height={5} rx={1.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
          <line x1={knobX} y1={30} x2={knobX} y2={34} stroke="#cbd5e1" strokeWidth={1.6} />
          <rect x={knobX - 16} y={8} width={32} height={16} fill="transparent" />
        </g>
        {/* end brackets + terminals */}
        <rect x={20} y={26} width={8} height={34} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.4} />
        <rect x={134} y={26} width={8} height={34} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.4} />
        <BindingPost cx={24} cy={62} r={3.6} />
        <BindingPost cx={138} cy={62} r={3.6} />
        <BindingPost cx={knobX} cy={8} r={3.2} />
        <Contact cx={81} cy={64} rx={40} opacity={0.25} />
        <Etch x={81} y={74} size={6} color="#334155" weight={800} mono>
          {`${Math.round((pos / 100) * max)} Ω / ${max} Ω`}
        </Etch>
        <Etch x={150} y={20} size={4.6} color="#6b7280">
          {bn ? 'স্লাইড' : 'SLIDE'}
        </Etch>
        {live && pos > 2 && pos < 98 && <circle cx={knobX} cy={40} r={7} fill="#fbbf24" opacity={0.18} filter="url(#ix-glow)" />}
      </g>
    );
  }
};

const potentiometerWire: ArtEntry = {
  vb: '0 0 202 92',
  Comp: ({ p, bn }) => {
    const total = num(p.totalLengthCm, 1000);
    const jockeyCm = clamp(num(p.jockeyPositionCm, 350), 0, total);
    const R = num(p.wireResistance, 50);
    const x0 = 18;
    const x1 = 186;
    const jx = x0 + (jockeyCm / total) * (x1 - x0);
    return (
      <g>
        <WoodBoard x={6} y={6} w={190} h={72} rx={3} />
        {/* ten parallel constantan wires on brass strips */}
        {Array.from({ length: 10 }).map((_, i) => (
          <g key={i}>
            <line x1={16} y1={16 + i * 6.4} x2={186} y2={16 + i * 6.4} stroke="#8d949c" strokeWidth={1.5} />
            <line x1={16} y1={15.4 + i * 6.4} x2={186} y2={15.4 + i * 6.4} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.5} />
            <rect x={14} y={14.6 + i * 6.4} width={5} height={3.6} fill="url(#ix-brass)" />
            <rect x={183} y={14.6 + i * 6.4} width={5} height={3.6} fill="url(#ix-brass)" />
          </g>
        ))}
        {/* metre scale along the bottom edge */}
        <LinearScale x={18} y={74} w={168} h={12} from={0} to={total} major={100} minor={20} unit="cm" />
        {/* travelling jockey */}
        <g>
          <Rod x1={jx} y1={4} x2={jx} y2={70} w={3} variant="steel" />
          <rect x={jx - 6} y={2} width={12} height={7} rx={2} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
          <line x1={jx} y1={70} x2={jx} y2={82} stroke="#0f172a" strokeWidth={1.4} />
          <rect x={jx - 4} y={78} width={8} height={5} rx={1.4} fill="url(#ix-copper)" />
        </g>
        <Etch x={101} y={90} size={6} color="#3f2a0e" weight={800} mono>
          {bn ? 'জকি' : 'JOCKEY'} {Math.round(jockeyCm)} cm {`· ${((jockeyCm / total) * R).toFixed(1)} Ω`}
        </Etch>
      </g>
    );
  }
};

const meterBridge: ArtEntry = {
  vb: '0 0 212 96',
  Comp: ({ p, bn }) => {
    const jockeyCm = clamp(num(p.jockeyPositionCm, 50), 0, 100);
    const x0 = 26;
    const x1 = 186;
    const jx = x0 + (jockeyCm / 100) * (x1 - x0);
    return (
      <g>
        <WoodBoard x={4} y={6} w={204} h={72} rx={3} />
        {/* brass bus-bars and the four resistance gaps */}
        <rect x={16} y={14} width={180} height={4} rx={1.4} fill="url(#ix-brass-h)" />
        {[26, 60, 100, 140, 176].map((x) => (
          <rect key={x} x={x - 2.4} y={12} width={4.8} height={9} rx={1} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.3} />
        ))}
        {/* one-metre constantan wire with end L-brackets */}
        <path d={`M ${x0} 34 L ${x0} 60 L ${x1} 60 L ${x1} 34`} fill="none" stroke="#8d949c" strokeWidth={2} />
        <path d={`M ${x0} 33 L ${x0} 59 L ${x1} 59 L ${x1} 33`} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={0.6} />
        <LinearScale x={x0} y={64} w={x1 - x0} h={12} from={0} to={100} major={10} minor={1} unit="cm" vertical={false} />
        {/* jockey knife-edge */}
        <g>
          <Rod x1={jx} y1={22} x2={jx} y2={58} w={2.6} />
          <rect x={jx - 5} y={20} width={10} height={6} rx={1.6} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.4} />
          <path d={`M ${jx - 3} 58 L ${jx} 64 L ${jx + 3} 58 Z`} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.4} />
        </g>
        <Etch x={106} y={88} size={6} color="#3f2a0e" weight={800} mono>
          {bn ? 'মিটার ব্রিজ · জকি' : 'METER BRIDGE · JOCKEY'} {jockeyCm.toFixed(1)} cm
        </Etch>
        {/* galvanometer connecting screws */}
        <BindingPost cx={100} cy={10} r={3.4} />
        <Etch x={100} y={4} size={4.6} color="#4b5563">
          G
        </Etch>
      </g>
    );
  }
};

const postOfficeBox: ArtEntry = {
  vb: '0 0 176 88',
  Comp: ({ p, bn }) => {
    const ratio = num(p.ratioArmP, 100) / (num(p.ratioArmQ, 100) || 1);
    const R = num(p.resistanceR, 45);
    return (
      <g>
        <WoodBoard x={6} y={6} w={164} h={70} rx={3} />
        <Etch x={88} y={17} size={6} color="#3f2a0e" weight={800}>
          {bn ? 'পোস্ট অফিস বক্স' : 'POST OFFICE BOX'}
        </Etch>
        {/* three plug-key rows: ratio arms P/Q and the rheostat R */}
        {[
          { label: 'P', n: 3, y: 26 },
          { label: 'Q', n: 3, y: 42 },
          { label: 'R', n: 4, y: 58 }
        ].map((row) => (
          <g key={row.label}>
            <Etch x={20} y={row.y + 2} size={5.6} color="#4b5563" weight={800}>
              {row.label}
            </Etch>
            {Array.from({ length: row.n }).map((_, i) => {
              const cx = 40 + i * 30;
              return (
                <g key={i}>
                  <circle cx={cx} cy={row.y} r={5.6} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
                  <circle cx={cx} cy={row.y} r={3.2} fill="#5b3f08" opacity={0.55} />
                  <circle cx={cx - 1.4} cy={row.y - 1.4} r={1.5} fill="#fff8dc" opacity={0.7} />
                  <Etch x={cx} y={row.y + 12} size={4.4} color="#4b5563" mono>
                    {`${10 ** (row.n - 1 - i)}×`}
                  </Etch>
                </g>
              );
            })}
          </g>
        ))}
        <BindingPost cx={136} cy={26} r={3.4} />
        <BindingPost cx={136} cy={58} r={3.4} />
        <Etch x={88} y={74} size={5} color="#3f2a0e" mono>
          {`R(plugged) = ${R} Ω · P/Q = ${ratio.toFixed(2)}`}
        </Etch>
      </g>
    );
  }
};

const bulb: ArtEntry = {
  vb: '0 0 96 82',
  Comp: ({ p, res, live, burned }) => {
    const power = res?.power ?? 0;
    const dead = burned || res?.burnedOut;
    const lit = power > 0.05 && !dead;
    return (
      <g>
        <Contact cx={48} cy={79} rx={20} opacity={0.3} />
        {/* bayonet cap: brass shell, rolled seam, glass pip */}
        <rect x={41} y={52} width={14} height={17} rx={2.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={i} x1={41} y1={55 + i * 3.6} x2={55} y2={55 + i * 3.6} stroke="#6d4a0a" strokeWidth={0.5} opacity={0.65} />
        ))}
        <rect x={41} y={52} width={14} height={17} rx={2.4} fill="url(#ix-brass-h)" opacity={0.35} />
        <ellipse cx={48} cy={70} rx={7} ry={2.6} fill="#8a6a12" />
        <ellipse cx={48} cy={52} rx={7} ry={2.4} fill="#3a2708" opacity={0.6} />
        {/* glass envelope: rim light down each side, shadow where it meets the cap */}
        <path
          d={`M 48 7 C 67 7 75 24 75 36 C 75 49 64 55 58 55 L 38 55 C 32 55 21 48 21 36 C 21 24 29 7 48 7 Z`}
          fill={lit ? 'url(#ix-lens-bulb)' : 'url(#ix-lens-bulb-dark)'}
          stroke="#7f93a6"
          strokeWidth={0.9}
        />
        <path d={`M 48 7 C 67 7 75 24 75 36 C 75 49 64 55 58 55 L 38 55 C 32 55 21 48 21 36 C 21 24 29 7 48 7 Z`} fill="url(#ix-envelope)" opacity={lit ? 0.25 : 0.6} />
        <path d={`M 30 16 C 26 24 25 32 26 40`} fill="none" stroke="#ffffff" strokeOpacity={0.75} strokeWidth={2.4} strokeLinecap="round" />
        <path d={`M 66 16 C 70 24 71 32 70 40`} fill="none" stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round" />
        <path d={`M 24 44 C 30 52 40 55 48 55`} fill="none" stroke="#4b6b86" strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />
        {lit && (
          <g style={live ? { animation: 'ix-pulse 1.9s ease-in-out infinite' } : undefined}>
            <circle cx={48} cy={32} r={30} fill="url(#ix-glow-white)" opacity={clamp(power / 8, 0.15, 0.95)} />
          </g>
        )}
        {/* stem, support wires and the coiled filament */}
        <path d="M 42 54 L 42 44 M 54 54 L 54 44" fill="none" stroke="#8a939c" strokeWidth={0.8} />
        <path d="M 42 44 L 44 30 M 54 44 L 52 30" fill="none" stroke="#8a939c" strokeWidth={0.7} />
        <path
          d="M 44 30 l 1.4 -5 1.6 5 1.6 -5 1.6 5 1.6 -5 1.4 5"
          fill="none"
          stroke={dead ? '#3f4650' : lit ? '#ffe3b0' : '#a8b0b8'}
          strokeWidth={1.15}
          strokeLinejoin="round"
          filter={power > 0.1 ? 'url(#ix-glow)' : undefined}
        />
        {lit && power > 0.1 && <ellipse cx={48} cy={29} rx={8} ry={6} fill="#fff6d8" opacity={clamp(power / 6, 0.2, 0.85)} filter="url(#ix-glow-wide)" />}
        {dead && <path d="M 45 30 l 6 4" stroke="#111827" strokeWidth={1.4} />}
        <Etch x={48} y={81} size={5.6} color="#334155" weight={800} mono>
          {dead ? 'FILAMENT OPEN' : `${num(p.ratedPower, 3)} W · ${num(p.ratedVoltage, 6)} V`}
        </Etch>
      </g>
    );
  }
};

function meterEntry(kind: 'ammeter' | 'voltmeter' | 'galvanometer'): ArtEntry {
  return {
    vb: '0 0 112 82',
    Comp: ({ res, p, live, detailed }) => {
      const reading = res?.displayReading ?? 0;
      const value = kind === 'galvanometer' ? (res?.deflection ?? 0) : reading;
      const maxScale = kind === 'ammeter' ? Math.max(1, num(p.rangeAmps ?? (kind === 'ammeter' ? 3 : 6), kind === 'ammeter' ? 3 : 6)) : undefined;
      return (
        <g>
          <Contact cx={56} cy={78} rx={36} opacity={0.3} />
          <MeterFace
            cx={56}
            cy={36}
            r={30}
            kind={kind}
            value={value}
            maxScale={maxScale}
            polarityError={res?.polarityError}
            detailed={detailed}
            live={live}
          />
          <BindingPost cx={30} cy={74} r={3.4} polarity={kind === 'galvanometer' ? 'none' : 'positive'} />
          <BindingPost cx={82} cy={74} r={3.4} polarity={kind === 'galvanometer' ? 'none' : 'negative'} />
          {res?.displayUnit && (
            <Etch x={56} y={80} size={5.4} color="#334155" weight={700} mono>
              {`${reading.toFixed(reading < 10 ? 2 : 1)} ${res.displayUnit}`}
            </Etch>
          )}
        </g>
      );
    }
  };
}

const digitalMultimeter: ArtEntry = {
  vb: '0 0 122 92',
  Comp: ({ p, res, bn, live }) => {
    const reading = res?.displayReading;
    const mode = typeof p.mode === 'string' ? p.mode : 'V';
    return (
      <g>
        <Contact cx={61} cy={88} rx={38} opacity={0.3} />
        {/* yellow rubber-armoured case */}
        <rect x={16} y={6} width={90} height={78} rx={9} fill="#f2b90d" stroke="#a97c07" strokeWidth={1} filter="url(#ix-drop)" />
        <rect x={20} y={10} width={82} height={70} rx={7} fill="url(#ix-charcoal)" />
        <rect x={16} y={6} width={90} height={22} rx={9} fill="#ffffff" opacity={0.12} />
        {/* LCD + printed annunciators */}
        <Display x={28} y={16} w={66} h={18} text={reading !== undefined ? reading.toFixed(reading < 10 ? 3 : 2) : '0.000'} unit={res?.displayUnit ?? mode} on color="lcd" digits={7} />
        <Etch x={30} y={26} size={4.4} color="#1f2937" anchor="start" weight={800}>
          {res?.polarityError ? '−' : ''}
        </Etch>
        {/* rotary function dial */}
        <circle cx={61} cy={58} r={17} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.6} />
        {['V⎓', 'A⎓', 'Ω', 'V~'].map((m, i) => {
          const a = (-90 + i * 60) * (Math.PI / 180);
          return (
            <Etch key={m} x={61 + Math.sin(a) * 11.5} y={58 - Math.cos(a) * 11.5 + 2} size={4.6} color="#334155" weight={800}>
              {m}
            </Etch>
          );
        })}
        <Knob cx={61} cy={58} r={5.4} kind="black" teeth={12} />
        <line x1={61} y1={58} x2={61} y2={49} stroke="#f8fafc" strokeWidth={1.3} />
        {/* probe jacks */}
        <circle cx={40} cy={76} r={4.6} fill="#111827" stroke="#e2e8f0" strokeWidth={0.6} />
        <circle cx={82} cy={76} r={4.6} fill="#7f1d1d" stroke="#fecaca" strokeWidth={0.6} />
        <Etch x={40} y={85} size={4} color="#f8fafc">
          COM
        </Etch>
        <Etch x={82} y={85} size={4} color="#f8fafc">
          VΩA
        </Etch>
        {live && <Led cx={98} cy={12} r={2.4} color="green" lit />}
        {bn && (
          <Etch x={61} y={4} size={4.6} color="#475569" weight={700}>
            {'মাল্টিমিটার'}
          </Etch>
        )}
      </g>
    );
  }
};

const capacitor: ArtEntry = {
  vb: '0 0 102 54',
  Comp: ({ p, bn }) => {
    const uf = num(p.capacitanceMicroFarad, 100);
    const v = num(p.voltageRating, 25);
    return (
      <g>
        <Lead x1={4} y1={30} x2={24} y2={30} />
        <Lead x1={78} y1={30} x2={98} y2={30} />
        {/* the can body: brushed aluminium, then the printed sleeve over it */}
        <rect x={22} y={8} width={58} height={42} rx={3.4} fill="url(#ix-alu-ball)" stroke="#0b1220" strokeOpacity={0.4} strokeWidth={0.6} filter="url(#ix-shadow)" />
        <rect x={22} y={8} width={58} height={42} rx={3.4} fill="url(#ix-brushed)" opacity={0.4} />
        <rect x={24} y={10} width={54} height={38} rx={2.6} fill="url(#ix-blue-plastic)" opacity={0.94} />
        <rect x={24} y={10} width={54} height={38} rx={2.6} fill="url(#ix-varnish)" opacity={0.5} />
        {/* the polarity band and the printed ratings */}
        <rect x={24} y={10} width={7} height={38} fill="#cbd5e1" opacity={0.9} />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={25.4} y1={12 + i * 6} x2={29.6} y2={12 + i * 6} stroke="#1f2937" strokeOpacity={0.6} strokeWidth={0.7} />
        ))}
        <Etch x={56} y={26} size={7.4} color="#f1f5f9" weight={800} mono rotate={90}>
          {uf >= 1000 ? `${(uf / 1000).toFixed(1)}mF` : `${uf}µF`}
        </Etch>
        <Etch x={56} y={45} size={5} color="#bfdbfe" mono rotate={90}>
          {`${v}V`}
        </Etch>
        {/* crimped top with its vent cross, and the soldered lead-out */}
        <ellipse cx={51} cy={8.4} rx={28} ry={3.2} fill="#dfe6ee" stroke="#8b97a3" strokeWidth={0.5} />
        <ellipse cx={51} cy={8.4} rx={27} ry={2.6} fill="url(#ix-alu-ball)" />
        <path d="M 43 8 h 16 M 51 1.6 v 9" stroke="#8b97a3" strokeWidth={1.1} opacity={0.85} />
        <ellipse cx={51} cy={48} rx={28} ry={3} fill="#0b1220" opacity={0.25} />
        <Etch x={16} y={23} size={7.4} color="#b91c1c" weight={800}>
          +
        </Etch>
        <Etch x={30} y={52.4} size={5} color="#334155" weight={700}>
          {bn ? 'ধারক' : 'CAPACITOR'}
        </Etch>
      </g>
    );
  }
};

const inductor: ArtEntry = {
  vb: '0 0 112 52',
  Comp: ({ p }) => {
    const mh = num(p.inductanceMilliHenry, 50);
    return (
      <g>
        <Lead x1={4} y1={28} x2={22} y2={28} />
        <Lead x1={90} y1={28} x2={108} y2={28} />
        {/* laminated iron core + copper winding + ferrite bobbin */}
        <rect x={20} y={20} width={72} height={16} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.5} filter="url(#ix-drop)" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={21} y1={21.4 + i * 3.2} x2={91} y2={21.4 + i * 3.2} stroke="#0b1220" strokeOpacity={0.25} strokeWidth={0.5} />
        ))}
        <rect x={20} y={12} width={72} height={20} rx={9} fill="none" stroke="url(#ix-copper-h)" strokeWidth={9} />
        {Array.from({ length: 17 }).map((_, i) => (
          <g key={i}>
            <ellipse cx={25 + i * 4.4} cy={22} rx={1.9} ry={10} fill="none" stroke="#4a2410" strokeOpacity={0.55} strokeWidth={1.1} />
            <ellipse cx={25 + i * 4.4} cy={22} rx={1.9} ry={10} fill="none" stroke="#f5c396" strokeOpacity={0.5} strokeWidth={0.5} />
          </g>
        ))}
        <Etch x={56} y={46} size={6} color="#334155" weight={800} mono>
          {`${mh} mH`}
          {p.dcResistance ? ` · ${num(p.dcResistance, 1)} Ω` : ''}
        </Etch>
      </g>
    );
  }
};

const diode: ArtEntry = {
  vb: '0 0 106 44',
  Comp: ({ p, res }) => {
    const vf = num(p.forwardVoltageDrop, 0.7);
    const conducting = (res?.current ?? 0) > 1e-4;
    return (
      <g>
        <Lead x1={4} y1={22} x2={30} y2={22} />
        <Lead x1={76} y1={22} x2={102} y2={22} />
        {/* axial-lead epoxy body: rounded shoulders, moulded flat, crimped ends */}
        <rect x={28} y={11} width={50} height={22} rx={5} fill="#2a2622" stroke="#0f0d0b" strokeOpacity={0.8} strokeWidth={0.7} filter="url(#ix-shadow)" />
        <rect x={28} y={11} width={50} height={22} rx={5} fill="url(#ix-varnish)" opacity={0.6} />
        <rect x={30} y={12} width={46} height={5} rx={2.5} fill="#ffffff" opacity={0.12} />
        <rect x={28} y={27} width={50} height={6} rx={3} fill="#000000" opacity={0.3} />
        {/* the silver cathode band, crimped round the body */}
        <rect x={69} y={10.6} width={6} height={22.8} rx={2} fill="url(#ix-steel-h)" stroke="#5b6876" strokeWidth={0.4} />
        <rect x={69} y={10.6} width={6} height={3} rx={1.4} fill="#ffffff" opacity={0.5} />
        {/* printed diode symbol */}
        <path d="M 39 16 L 39 28 L 51 22 Z" fill="#c9ced6" />
        <line x1={51} y1={15} x2={51} y2={29} stroke="#c9ced6" strokeWidth={2.2} />
        {conducting && <path d="M 39 16 L 39 28 L 51 22 Z" fill="#fca5a5" filter="url(#ix-glow)" />}
        <Etch x={34} y={37.6} size={4.6} color="#8b8f96" mono>
          {'1N4007'}
        </Etch>
        <Etch x={53} y={40.4} size={6} color="#334155" weight={800} mono>
          {`Vf ≈ ${vf.toFixed(2)} V`}
        </Etch>
        <Etch x={18} y={16} size={6} color="#b91c1c" weight={800}>
          A
        </Etch>
        <Etch x={88} y={16} size={6} color="#1e3a8a" weight={800}>
          K
        </Etch>
      </g>
    );
  }
};

const led: ArtEntry = {
  vb: '0 0 88 64',
  Comp: ({ p, res, live }) => {
    const colour = typeof p.color === 'string' ? p.color : 'red';
    const key = colour === 'yellow' ? 'amber' : colour === 'green' ? 'green' : colour === 'blue' ? 'blue' : 'red';
    const lit = !res?.burnedOut && (res?.power ?? 0) > 0.0005;
    const dome = { red: 'url(#ix-lens-led-red)', green: 'url(#ix-lens-led-green)', blue: 'url(#ix-lens-led-blue)', amber: 'url(#ix-lens-led-amber)' }[key];
    // An unlit epoxy lens is a dark tint of its own colour, never a white ghost.
    const darkTint = {
      red: 'rgba(120,38,32,0.72)',
      green: 'rgba(24,86,46,0.72)',
      blue: 'rgba(22,52,110,0.75)',
      amber: 'rgba(126,84,14,0.72)'
    };
    return (
      <g>
        <Lead x1={30} y1={44} x2={30} y2={60} />
        <Lead x1={58} y1={44} x2={58} y2={60} />
        {lit && (
          <circle cx={44} cy={30} r={34} fill={`url(#ix-glow-${key})`} opacity={0.85} style={live ? { animation: 'ix-pulse 1.7s ease-in-out infinite' } : undefined} />
        )}
        {/* translucent epoxy lens; the cathode side of a 5 mm LED is flat */}
        <path
          d="M 22 30 a 22 22 0 1 1 44 0 v 12 a 3 3 0 0 1 -3 3 h -38 a 3 3 0 0 1 -3 -3 Z"
          fill={lit ? dome : darkTint[key]}
          stroke="#5b6875"
          strokeWidth={0.7}
        />
        {/* internal anode post, wire bond and die */}
        <path d="M 30 44 L 30 30 L 40 24 L 40 20" fill="none" stroke="#9aa4ad" strokeWidth={1.2} />
        <path d="M 58 44 L 58 34 L 51 30 Z" fill="#b8c2cb" />
        {lit && <circle cx={44} cy={26} r={9} fill="#ffffff" opacity={0.75} filter="url(#ix-glow)" />}
        <Etch x={44} y={62} size={6} color="#334155" weight={800} mono>
          {lit ? `${((res?.power ?? 0) * 1000).toFixed(0)} mW` : `${colour.toUpperCase()} LED`}
        </Etch>
      </g>
    );
  }
};

const transistor: ArtEntry = {
  vb: '0 0 110 74',
  Comp: ({ p, res }) => {
    const beta = num(p.beta, 100);
    const conducting = (res?.current ?? 0) > 1e-5;
    return (
      <g>
        <Contact cx={55} cy={70} rx={26} opacity={0.3} />
        {/* TO-92 body: flat front, bevelled sides, moulding flash down the middle */}
        <path d="M 34 12 h 42 a 6 6 0 0 1 6 6 v 26 a 22 22 0 0 1 -6 8 h -42 a 22 22 0 0 1 -6 -8 v -26 a 6 6 0 0 1 6 -6 Z" fill="url(#ix-charcoal)" stroke="#0b1220" strokeOpacity={0.7} strokeWidth={0.7} filter="url(#ix-shadow)" />
        <path d="M 34 12 h 42 a 6 6 0 0 1 6 6 v 7 h -54 v -7 a 6 6 0 0 1 6 -6 Z" fill="#ffffff" opacity={0.16} />
        <rect x={28} y={12} width={4} height={40} rx={2} fill="#ffffff" opacity={0.12} />
        <rect x={78} y={12} width={4} height={40} rx={2} fill="#000000" opacity={0.22} />
        <rect x={54.4} y={12} width={1.2} height={40} fill="#000000" opacity={0.18} />
        {/* laser-etched markings */}
        <Etch x={55} y={30} size={7} color="#dfe7ee" weight={800} mono>
          {`hFE ${Math.round(beta)}`}
        </Etch>
        <Etch x={55} y={40} size={5} color="#94a3b8" mono>
          NPN
        </Etch>
        {/* tin-plated legs with their weld shoulders */}
        <Rod x1={40} y1={52} x2={40} y2={70} w={2.4} />
        <Rod x1={55} y1={52} x2={55} y2={70} w={2.4} />
        <Rod x1={70} y1={52} x2={70} y2={70} w={2.4} />
        <ellipse cx={40} cy={52} rx={2.4} ry={1.2} fill="#cbd5e1" opacity={0.8} />
        <ellipse cx={55} cy={52} rx={2.4} ry={1.2} fill="#cbd5e1" opacity={0.8} />
        <ellipse cx={70} cy={52} rx={2.4} ry={1.2} fill="#cbd5e1" opacity={0.8} />
        <Etch x={40} y={64} size={4.6} color="#334155" weight={800}>
          B
        </Etch>
        <Etch x={70} y={64} size={4.6} color="#334155" weight={800}>
          E
        </Etch>
        {conducting && <circle cx={55} cy={26} r={4} fill="#fbbf24" opacity={0.45} filter="url(#ix-glow)" />}
      </g>
    );
  }
};

const transformer: ArtEntry = {
  vb: '0 0 146 82',
  Comp: ({ p, res }) => {
    const np = num(p.primaryTurns, 500);
    const ns = num(p.secondaryTurns, 100);
    const ratio = ns / (np || 1);
    const out = (res?.voltageDrop ?? 0) * ratio;
    const live = (res?.current ?? 0) > 1e-5;
    return (
      <g>
        <Contact cx={73} cy={78} rx={48} opacity={0.3} />
        {/* laminated silicon-steel core */}
        <rect x={26} y={12} width={94} height={58} rx={4} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} filter="url(#ix-drop)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={27} y1={14 + i * 7.4} x2={119} y2={14 + i * 7.4} stroke="#0b1220" strokeOpacity={0.22} strokeWidth={0.6} />
        ))}
        {/* primary + secondary bobbins */}
        <Coil x={30} y={18} w={38} h={46} turns={11} core="#6b4b21" />
        <Coil x={78} y={18} w={38} h={46} turns={5} core="#6b4b21" />
        <Etch x={49} y={16} size={5.2} color="#f8fafc" weight={800}>
          P {np}
        </Etch>
        <Etch x={97} y={16} size={5.2} color="#f8fafc" weight={800}>
          S {ns}
        </Etch>
        {/* terminals */}
        <BindingPost cx={22} cy={26} r={3} polarity="positive" />
        <BindingPost cx={22} cy={56} r={3} polarity="negative" />
        <BindingPost cx={124} cy={26} r={3} polarity="positive" />
        <BindingPost cx={124} cy={56} r={3} polarity="negative" />
        <Etch x={73} y={80} size={5.6} color="#334155" weight={800} mono>
          {`turns ratio ${ratio.toFixed(2)}${out > 0.01 ? ` · out ${out.toFixed(2)} V` : ''}`}
        </Etch>
        {live && <circle cx={97} cy={40} r={16} fill="url(#ix-glow-amber)" opacity={0.25} />}
      </g>
    );
  }
};

/* ------------------------------------------------------------------ */
/* Magnetism                                                            */
/* ------------------------------------------------------------------ */

const barMagnet: ArtEntry = {
  vb: '0 0 142 40',
  Comp: ({ p, bn }) => (
    <g>
      <Contact cx={71} cy={36} rx={58} opacity={0.3} />
      {/* the bar: painted poles over a brushed alnico body */}
      <rect x={8} y={10} width={60} height={20} rx={3} fill="url(#ix-red-plastic)" stroke="#7f1411" strokeWidth={0.7} />
      <rect x={68} y={10} width={60} height={20} rx={3} fill="url(#ix-blue-plastic)" stroke="#0d3b68" strokeWidth={0.7} />
      <rect x={8} y={10} width={122} height={20} rx={3} fill="url(#ix-brushed)" opacity={0.3} />
      <rect x={8} y={10} width={122} height={6} rx={3} fill="#ffffff" opacity={0.2} />
      <rect x={8} y={24} width={122} height={6} rx={3} fill="#0b1220" opacity={0.16} />
      <rect x={66} y={10} width={4} height={20} fill="#ffffff" opacity={0.28} />
      <rect x={66.6} y={10} width={1.2} height={20} fill="#0b1220" opacity={0.3} />
      <ellipse cx={8.6} cy={20} rx={1.6} ry={10} fill="#ffffff" opacity={0.28} />
      <ellipse cx={129.4} cy={20} rx={1.6} ry={10} fill="#0b1220" opacity={0.25} />
      <Etch x={38} y={25} size={11} color="#fff1f1" weight={800}>
        N
      </Etch>
      <Etch x={99} y={25} size={11} color="#eff6ff" weight={800}>
        S
      </Etch>
      <Etch x={71} y={38} size={5} color="#334155" mono weight={700}>
        {`m = ${num(p.magneticMoment, 1.5).toFixed(1)} A·m²`}
        {bn ? ' · অ্যালনিকো' : ' · ALNICO'}
      </Etch>
    </g>
  )
};

const magneticCompass: ArtEntry = {
  vb: '0 0 84 78',
  Comp: ({ p, live }) => {
    const ang = num(p.needleAngleDeg, 0);
    return (
      <g>
        <Contact cx={42} cy={72} rx={30} opacity={0.3} />
        {/* brass case with a knurled bezel and glass lid */}
        <circle cx={42} cy={40} r={30} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.8} filter="url(#ix-drop)" />
        <circle cx={42} cy={40} r={25} fill="url(#ix-dial)" stroke="#b9ac93" strokeWidth={0.8} />
        {/* printed degree ring */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i * 5 - 90) * (Math.PI / 180);
          const major = i % 9 === 0;
          return (
            <line
              key={i}
              x1={42 + Math.cos(a) * 21}
              y1={40 + Math.sin(a) * 21}
              x2={42 + Math.cos(a) * (major ? 17 : 19)}
              y2={40 + Math.sin(a) * (major ? 17 : 19)}
              stroke="#1f2937"
              strokeWidth={major ? 0.8 : 0.4}
            />
          );
        })}
        {[0, 90, 180, 270].map((d) => {
          const a = ((d - 90) * Math.PI) / 180;
          return (
            <Etch key={d} x={42 + Math.cos(a) * 13} y={40 + Math.sin(a) * 13 + 2} size={4.6} color="#1f2937" weight={800}>
              {d}
            </Etch>
          );
        })}
        {/* magnetised needle */}
        <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: '42px 40px', transition: live ? 'transform 700ms cubic-bezier(.16,.9,.24,1.06)' : undefined }}>
          <path d="M 42 22 L 46 40 L 42 44 L 38 40 Z" fill="#c62828" />
          <path d="M 42 58 L 46 40 L 42 36 L 38 40 Z" fill="#e8eef5" stroke="#8a97a5" strokeWidth={0.4} />
          <circle cx={42} cy={40} r={2} fill="url(#ix-brass)" />
        </g>
        {/* glass reflection */}
        <circle cx={42} cy={40} r={25} fill="url(#ix-glass-sheen)" opacity={0.4} />
        <Sheen x={26} y={24} w={22} h={6} rx={3} opacity={0.3} rotate={-24} />
        <Etch x={42} y={76} size={6} color="#3f4a56" weight={800} mono>
          {`${ang.toFixed(0)}°`}
        </Etch>
      </g>
    );
  }
};

// (placeholder removed — kept the file explicit below)
type _Never = never;

const solenoidCoil: ArtEntry = {
  vb: '0 0 142 66',
  Comp: ({ p, res, live }) => {
    const turns = num(p.turns, 300);
    const current = Math.abs(res?.current ?? 0);
    return (
      <g>
        <Contact cx={71} cy={62} rx={46} opacity={0.3} />
        {/* soft-iron core protruding both ends */}
        <Rod x1={6} y1={30} x2={136} y2={30} w={14} variant="iron" />
        {/* wound former */}
        <rect x={22} y={16} width={98} height={28} rx={4} fill="#6b4b21" opacity={0.9} />
        {Array.from({ length: 26 }).map((_, i) => (
          <ellipse key={i} cx={24 + i * 3.8} cy={30} rx={2} ry={15} fill="none" stroke="url(#ix-copper-h)" strokeWidth={2.6} />
        ))}
        <rect x={22} y={16} width={98} height={6} rx={3} fill="#ffffff" opacity={0.14} />
        <BindingPost cx={30} cy={52} r={3.2} />
        <BindingPost cx={112} cy={52} r={3.2} />
        <Etch x={71} y={64} size={5.6} color="#334155" weight={800} mono>
          {`${Math.round(turns)} turns · ${num(p.lengthCm, 15)} cm`}
        </Etch>
        {live && current > 1e-4 && (
          <g>
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={32 + i * 20} cy={30} r={18} fill="url(#ix-glow-blue)" opacity={0.2} style={{ animation: `ix-pulse ${1.2 + i * 0.2}s ease-in-out infinite` }} />
            ))}
          </g>
        )}
      </g>
    );
  }
};

const ironFilingsBoard: ArtEntry = {
  vb: '0 0 152 104',
  Comp: ({ p, bn, live }) => {
    const active = on(p.active) !== false;
    const lines: React.ReactNode[] = [];
    for (let k = 0; k < 7; k++) {
      const spread = 10 + k * 9;
      lines.push(
        <path
          key={k}
          d={`M 52 52 q ${spread * 0.6} ${-spread * 0.9} ${spread * 1.5} ${-spread * 0.15} q ${spread * 0.7} ${spread * 0.7} 0 ${spread * 1.3} q ${-spread * 0.9} ${spread * 0.4} ${-spread * 1.5} ${-spread * 0.15}`}
          fill="none"
          stroke="#4b5563"
          strokeWidth={0.7}
          opacity={active ? 0.75 : 0.15}
        />
      );
    }
    return (
      <g>
        {/* magnet under the tray */}
        <rect x={40} y={44} width={72} height={16} rx={2} fill="url(#ix-red-plastic)" opacity={active ? 1 : 0.6} />
        <rect x={76} y={44} width={36} height={16} rx={2} fill="url(#ix-blue-plastic)" opacity={active ? 1 : 0.6} />
        {/* perspex tray with filings */}
        <rect x={10} y={12} width={132} height={80} rx={5} fill="#e8eef3" fillOpacity={0.5} stroke="#a9bccb" strokeWidth={1} filter="url(#ix-drop)" />
        <g opacity={active ? 1 : 0.35}>
          {(() => {
            // Every filing aligns with the local field: each pole pushes/pulls
            // along its own line, exactly how iron filings map a magnet.
            const poles = [
              { x: 52, y: 52, q: 1 },
              { x: 100, y: 52, q: -1 }
            ];
            const filings: React.ReactNode[] = [];
            for (let i = 0; i < 320; i++) {
              const a = (i * 2.399963) % (Math.PI * 2);
              const r = Math.sqrt(((i * 37) % 100) / 100) * 56;
              const x = 76 + Math.cos(a) * r * 1.05;
              const y = 52 + Math.sin(a) * r * 0.66;
              if (x < 14 || x > 138 || y < 16 || y > 88) continue;
              let fx = 0;
              let fy = 0;
              for (const pole of poles) {
                const dx = x - pole.x;
                const dy = y - pole.y;
                const d2 = Math.max(12, dx * dx + dy * dy);
                fx += (pole.q * dx) / d2;
                fy += (pole.q * dy) / d2;
              }
              const ang = Math.atan2(fy, fx);
              const len = 2.1 + Math.min(2.4, 1.6 / Math.max(0.35, Math.hypot(fx, fy) * 26));
              const near = Math.min(Math.hypot(x - 52, y - 52), Math.hypot(x - 100, y - 52));
              filings.push(
                <line
                  key={i}
                  x1={x - Math.cos(ang) * len}
                  y1={y - Math.sin(ang) * len}
                  x2={x + Math.cos(ang) * len}
                  y2={y + Math.sin(ang) * len}
                  stroke="#374151"
                  strokeWidth={0.65}
                  opacity={clamp(0.9 - near / 120, 0.28, 0.9)}
                />
              );
            }
            return filings;
          })()}
        </g>
        <g opacity={active ? 0.5 : 0.08}>{lines}</g>
        {/* tray edges + sheen */}
        <rect x={10} y={12} width={132} height={80} rx={5} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.4} />
        <Sheen x={20} y={18} w={100} h={10} rx={5} opacity={0.35} rotate={-4} />
        <Etch x={76} y={102} size={6} color="#334155" weight={800}>
          {active ? (bn ? 'ট্রেতে লোহার গুঁড়া' : 'IRON FILINGS ON TRAY') : bn ? 'কোনো ক্ষেত্র নেই' : 'NO FIELD'}
        </Etch>
        {live && active && <circle cx={76} cy={52} r={54} fill="url(#ix-glow-blue)" opacity={0.1} />}
      </g>
    );
  }
};

const electromagnet: ArtEntry = {
  vb: '0 0 122 96',
  Comp: ({ res, live, bn }) => {
    const current = Math.abs(res?.current ?? 0);
    const energised = current > 1e-4;
    return (
      <g>
        <Contact cx={61} cy={92} rx={34} opacity={0.3} />
        {/* U-shaped soft-iron core */}
        <path
          d="M 32 30 v 30 a 29 29 0 0 0 58 0 v -30"
          fill="none"
          stroke="url(#ix-iron)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path d="M 32 30 v 30 a 29 29 0 0 0 58 0 v -30" fill="none" stroke="#0b1220" strokeOpacity={0.25} strokeWidth={16.6} strokeLinecap="round" opacity={0.35} />
        <path d="M 30 30 v 30 a 29 29 0 0 0 58 0 v -30" fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={3} strokeLinecap="round" />
        {/* coils on both limbs */}
        {[32, 90].map((x, k) => (
          <g key={k}>
            {Array.from({ length: 9 }).map((_, i) => (
              <ellipse key={i} cx={x} cy={30 + i * 3.6} rx={9.5} ry={2.6} fill="none" stroke="url(#ix-copper-h)" strokeWidth={2.6} />
            ))}
          </g>
        ))}
        {/* terminals + indicator */}
        <BindingPost cx={24} cy={84} r={3.4} polarity="positive" />
        <BindingPost cx={98} cy={84} r={3.4} polarity="negative" />
        <Led cx={61} cy={88} r={2.8} color="red" lit={energised} live={live} />
        {/* keeper armature snaps on when energised */}
        <g style={{ transform: `translateY(${energised ? 0 : 7}px)`, transition: 'transform 220ms cubic-bezier(.3,1.4,.4,1)' }}>
          <rect x={38} y={8} width={46} height={9} rx={2} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.5} />
          <rect x={38} y={8} width={46} height={3} rx={1.5} fill="#ffffff" opacity={0.45} />
        </g>
        {energised && live && <circle cx={61} cy={20} r={26} fill="url(#ix-glow-blue)" opacity={0.28} />}
        <Etch x={61} y={94} size={5.6} color="#334155" weight={800} mono>
          {energised ? (bn ? 'চুম্বক সক্রিয়' : 'MAGNETISED') : bn ? 'নিরপেক্ষ' : 'RELEASED'}
        </Etch>
      </g>
    );
  }
};

const magnetometer: ArtEntry = {
  vb: '0 0 182 74',
  Comp: ({ p, bn }) => (
    <g>
      <Contact cx={91} cy={70} rx={74} opacity={0.3} />
      {/* long teak base with a graduated brass circle */}
      <rect x={6} y={52} width={170} height={14} rx={2.5} fill="url(#ix-wood)" stroke="#5b3c14" strokeWidth={0.7} filter="url(#ix-drop)" />
      <rect x={6} y={52} width={170} height={14} rx={2.5} fill="url(#ix-grain)" />
      <circle cx={91} cy={40} r={30} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.8} />
      <circle cx={91} cy={40} r={25} fill="url(#ix-dial)" stroke="#b9ac93" strokeWidth={0.6} />
      {Array.from({ length: 61 }).map((_, i) => {
        const a = (i * 6 - 180) * (Math.PI / 180);
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            x1={91 + Math.sin(a) * 20}
            y1={40 - Math.cos(a) * 20}
            x2={91 + Math.sin(a) * (major ? 15 : 17.5)}
            y2={40 - Math.cos(a) * (major ? 15 : 17.5)}
            stroke="#1f2937"
            strokeWidth={major ? 0.8 : 0.4}
          />
        );
      })}
      {[0, 30, 60, 90].map((d) => {
        const a = (d * Math.PI) / 180;
        return (
          <g key={d}>
            <Etch x={91 + Math.sin(a) * 11} y={40 - Math.cos(a) * 11 + 2} size={4.6} color="#1f2937" weight={800}>
              {d}
            </Etch>
            <Etch x={91 - Math.sin(a) * 11} y={40 + Math.cos(a) * 11 + 2} size={4.6} color="#1f2937" weight={800}>
              {d}
            </Etch>
          </g>
        );
      })}
      {/* short magnetised needle */}
      <g>
        <path d="M 91 26 L 94 40 L 91 43 L 88 40 Z" fill="#c62828" />
        <path d="M 91 54 L 94 40 L 91 37 L 88 40 Z" fill="#e8eef5" stroke="#8a97a5" strokeWidth={0.3} />
        <circle cx={91} cy={40} r={1.8} fill="url(#ix-brass)" />
      </g>
      <circle cx={91} cy={40} r={25} fill="url(#ix-glass-sheen)" opacity={0.35} />
      <Etch x={91} y={64} size={5.4} color="#3f2a0e" weight={800} mono>
        {`${typeof p.positionMode === 'string' ? p.positionMode.toUpperCase() : 'TAN-A'} · arm ${num(p.armDistanceCm, 20)} cm`}
      </Etch>
      {bn && (
        <Etch x={91} y={10} size={5.4} color="#334155" weight={800}>
          {'ডিফ্লেকশন ম্যাগনেটোমিটার'}
        </Etch>
      )}
    </g>
  )
};

const faradayKit: ArtEntry = {
  vb: '0 0 152 86',
  Comp: ({ p, live, bn }) => {
    const pos = clamp(num(p.magnetPosition, 0), -10, 10);
    const vel = num(p.magnetVelocity, 0);
    const [phase, setPhase] = React.useState(0);
    React.useEffect(() => {
      if (!live) return;
      let raf = 0;
      let t0 = performance.now();
      const step = (t: number) => {
        setPhase(((t - t0) / 1000) % 6.28);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [live]);
    const slide = live ? Math.sin(phase) * 8 : pos;
    const emf = Math.abs(vel) > 0.01 ? Math.cos(phase) : 0;
    return (
      <g>
        <WoodBoard x={6} y={10} w={140} h={62} rx={3} />
        {/* coil of many turns on a cardboard former */}
        <rect x={52} y={22} width={46} height={38} rx={3} fill="#8a6a3a" opacity={0.9} />
        {Array.from({ length: 22 }).map((_, i) => (
          <ellipse key={i} cx={54 + i * 2.1} cy={41} rx={2.2} ry={19} fill="none" stroke="url(#ix-copper-h)" strokeWidth={2.2} />
        ))}
        {/* the bar magnet that slides in and out */}
        <g style={{ transition: live ? 'none' : 'transform 200ms ease-out' }}>
          <rect x={70 + slide * 3} y={34} width={44} height={14} rx={2} fill="url(#ix-red-plastic)" />
          <rect x={92 + slide * 3} y={34} width={22} height={14} rx={2} fill="url(#ix-blue-plastic)" />
          <Etch x={80 + slide * 3} y={45} size={8} color="#fff1f1" weight={800}>
            N
          </Etch>
        </g>
        {/* galvanometer pointer deflecting with dΦ/dt */}
        <g transform="translate(132 26)">
          <circle r={14} fill="url(#ix-dial)" stroke="#b9ac93" strokeWidth={0.7} />
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={-11 + i * 2.75} y1={8} x2={-11 + i * 2.75} y2={i % 4 === 0 ? 3 : 5} stroke="#1f2937" strokeWidth={i % 4 === 0 ? 0.8 : 0.4} />
          ))}
          <line
            x1={0}
            y1={8}
            x2={emf * 10}
            y2={8 - Math.cos((emf * 40 * Math.PI) / 180) * 12}
            stroke="#0f172a"
            strokeWidth={1.2}
            style={{ transition: 'all 120ms linear' }}
          />
          <Etch x={0} y={-16} size={4.6} color="#334155" weight={800}>
            G
          </Etch>
        </g>
        <Etch x={76} y={80} size={5.6} color="#3f2a0e" weight={800} mono>
          {bn ? 'তামার কুণ্ডলী · চুম্বক গতিশীল' : 'INDUCTION COIL · MOVING MAGNET'}
        </Etch>
      </g>
    );
  }
};

export const electricityArt: Record<string, ArtEntry> = {
  'battery-dc': batteryDc,
  'ac-source': acSource,
  'power-supply-variable': powerSupply,
  'switch-spst': switchSpst,
  'tap-key': tapKey,
  'switch-spdt': switchSpdt,
  'resistor-fixed': resistorFixed,
  'resistance-box': resistanceBox,
  rheostat,
  'potentiometer-wire': potentiometerWire,
  'meter-bridge': meterBridge,
  'post-office-box': postOfficeBox,
  'incandescent-bulb': bulb,
  'ammeter-dc': meterEntry('ammeter'),
  'voltmeter-dc': meterEntry('voltmeter'),
  galvanometer: meterEntry('galvanometer'),
  'digital-multimeter': digitalMultimeter,
  capacitor,
  inductor,
  'diode-pn': diode,
  led,
  'transistor-npn': transistor,
  'step-transformer': transformer,
  'bar-magnet': barMagnet,
  'magnetic-compass': magneticCompass,
  'solenoid-coil': solenoidCoil,
  'iron-filings-board': ironFilingsBoard,
  electromagnet,
  'deflection-magnetometer': magnetometer,
  'faraday-induction-kit': faradayKit
};
