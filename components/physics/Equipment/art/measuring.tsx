'use client';

import React from 'react';
import { Contact, Display, Etch, Knob, LinearScale, Rod, Screw, clamp, num, on, useArtDrag, type ArtEntry } from './shared';

/* ------------------------------------------------------------------ */
/* Precision measuring tools                                            */
/* ------------------------------------------------------------------ */

const vernierCaliper: ArtEntry = {
  vb: '0 0 168 62',
  Comp: ({ p, bn, live, setProp }) => {
    const opening = clamp(num(p.measuredObjectWidthMm, 24.6), 0, 120);
    const zero = num(p.zeroErrorMm, 0);
    const lc = num(p.leastCount, 0.1);
    const scale = 1.05; // mm → artwork units
    const beamX = 14;
    const jawX = beamX + 52 + opening * scale;
    const startOpening = React.useRef(opening);
    const drag = useArtDrag(
      (pt, start) => {
        const mm = clamp(Math.round((startOpening.current + (pt.x - start.x) / scale) * 10) / 10, 0, 120);
        setProp?.('measuredObjectWidthMm', mm);
      },
      { onStart: () => (startOpening.current = opening) }
    );
    return (
      <g>
        {/* hardened steel beam: bright top, dark underside, chamfered edges */}
        <rect x={beamX} y={22} width={140} height={13} rx={1.4} fill="url(#ix-chrome)" stroke="#5b6876" strokeWidth={0.6} filter="url(#ix-shadow)" />
        <rect x={beamX} y={22} width={140} height={13} rx={1.4} fill="url(#ix-brushed)" opacity={0.35} />
        <rect x={beamX + 0.7} y={22.7} width={138.6} height={2.2} rx={1} fill="#ffffff" opacity={0.7} />
        <rect x={beamX} y={32} width={140} height={3} rx={1.4} fill="#0b1220" opacity={0.22} />
        {/* the depth rod that runs out of the far end */}
        <rect x={beamX - 2} y={30} width={8} height={2.6} rx={1} fill="url(#ix-steel-h)" stroke="#5b6876" strokeWidth={0.3} />
        {/* main scale engraved into the beam */}
        <LinearScale x={beamX + 4} y={24} w={132} h={9} from={0} to={125} major={10} minor={1} unit="mm" size={3.4} tick={9} />
        {/* fixed jaws: a hardened tip brazed onto the beam */}
        <path d={`M ${beamX + 2} 22 v -14 h 6 v 14`} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.6} />
        <path d={`M ${beamX + 2} 34 v 14 h 6 v -14`} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.6} />
        <rect x={beamX + 1.4} y={8} width={7.2} height={4} fill="#dfe7ee" opacity={0.9} />
        <rect x={beamX + 1.4} y={44} width={7.2} height={4} fill="#4b5563" opacity={0.5} />
        {/* the sliding head: grab it and move it, like the real thumb roller */}
        <g {...drag}>
          <rect x={jawX - 10} y={6} width={64} height={52} fill="transparent" />
          {/* slider body with its machined groove riding the beam */}
          <rect x={jawX - 4} y={20} width={26} height={17} rx={2} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.5} />
          <rect x={jawX - 4} y={20} width={26} height={4} rx={2} fill="#ffffff" opacity={0.18} />
          <path d={`M ${jawX} 22 v -14 h 6 v 14`} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.6} />
          <path d={`M ${jawX} 34 v 14 h 6 v -14`} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.6} />
          <rect x={jawX - 0.6} y={8} width={7.2} height={4} fill="#eef4fa" opacity={0.95} />
          <rect x={jawX - 0.6} y={44} width={7.2} height={4} fill="#5c6570" opacity={0.6} />
          {/* vernier plate: ivory scale screwed to the slider */}
          <rect x={jawX + 4} y={36} width={52} height={16} rx={1.6} fill="url(#ix-steel)" stroke="#5b6876" strokeWidth={0.5} />
          <rect x={jawX + 6} y={37.6} width={48} height={12.6} rx={1} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.35} />
          <rect x={jawX + 6} y={37.6} width={48} height={4.6} rx={1} fill="#ffffff" opacity={0.4} />
          {/* vernier divisions, 10 of them across 9 mm */}
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={i}
              x1={jawX + 7 + i * (9 * scale)}
              y1={38.6}
              x2={jawX + 7 + i * (9 * scale)}
              y2={i % 5 === 0 ? 45 : 42.4}
              stroke="#1f2937"
              strokeWidth={i % 5 === 0 ? 0.75 : 0.4}
            />
          ))}
          <Etch x={jawX + 8} y={49.4} size={3.4} color="#475569" anchor="start" mono>
            {lc <= 0.05 ? '0.05 mm' : '0.1 mm'}
          </Etch>
          {/* knurled thumb roller + lock screw, exactly how a caliper is moved */}
          <Knob cx={jawX + 44} cy={47} r={5.6} kind="brass" teeth={14} />
          <circle cx={jawX + 44} cy={47} r={5.6} fill="url(#ix-knurl)" opacity={0.5} />
          <Screw cx={jawX + 20} cy={48} r={2.6} />
        </g>
        {/* the object clamped between the jaws, lit like a metal part on the bench */}
        {opening > 1 && (
          <g>
            <rect x={beamX + 8} y={9} width={Math.max(2, opening * scale)} height={13} rx={2} fill="#b45309" opacity={0.95} />
            <rect x={beamX + 8} y={9} width={Math.max(2, opening * scale)} height={4} rx={2} fill="#f0b27a" opacity={0.7} />
            <rect x={beamX + 8} y={18} width={Math.max(2, opening * scale)} height={4} rx={2} fill="#5a3208" opacity={0.35} />
            <rect x={beamX + 8} y={9} width={Math.max(2, opening * scale)} height={13} fill="url(#ix-varnish)" opacity={0.4} />
          </g>
        )}
        {/* engraved data: least count, zero error, and the reading */}
        <Etch x={beamX + 8} y={58} size={4.4} color="#475569" anchor="start" mono>
          {`LC ${lc} mm · zero ${zero >= 0 ? '+' : ''}${zero.toFixed(2)} mm`}
        </Etch>
        <Etch x={160} y={58} size={5} color="#334155" anchor="end" weight={800} mono>
          {`${(opening + zero).toFixed(2)} mm`}
        </Etch>
        {bn && (
          <Etch x={beamX + 8} y={6} size={4.6} color="#475569" anchor="start">
            {'ভার্নিয়ার ক্যালিপার্স'}
          </Etch>
        )}
      </g>
    );
  }
};

const screwGauge: ArtEntry = {
  vb: '0 0 158 74',
  Comp: ({ p, bn }) => {
    const gap = clamp(num(p.gapMm, 3.74), 0, 25);
    const pitch = Math.max(0.1, num(p.pitchMm, 1));
    const div = Math.max(10, num(p.circularDivisions, 100));
    const zero = num(p.zeroErrorMm, 0);
    const thimbleOffset = ((gap / pitch) % 1) * div;
    const sleeveX = 78;
    const spindleLen = 22 - gap * 0.7;
    return (
      <g>
        {/* the U-frame: forged and enamel-baked, with its outline catching the light */}
        <path d="M 22 12 h 46 a 30 30 0 0 1 0 60 h -46 a 6 6 0 0 1 -6 -6 v -48 a 6 6 0 0 1 6 -6 Z" fill="url(#ix-enamel)" stroke="#0b1220" strokeWidth={0.8} filter="url(#ix-shadow)" />
        <path d="M 20 14 h 44 a 26 26 0 0 1 0 56 h -44 Z" fill="url(#ix-steel)" opacity={0.22} />
        <path d="M 22 12 h 46 a 30 30 0 0 1 0 60 h -46 a 6 6 0 0 1 -6 -6 v -48 a 6 6 0 0 1 6 -6 Z" fill="url(#ix-reflect)" opacity={0.28} />
        {/* insulating pads so the frame is not warmed by the hand */}
        <rect x={13} y={22} width={11} height={40} rx={4.5} fill="url(#ix-bakelite)" stroke="#0b1220" strokeWidth={0.5} />
        <rect x={13} y={22} width={11} height={40} rx={4.5} fill="url(#ix-knurl)" opacity={0.35} />
        {/* anvil and spindle, both with hardened measuring faces */}
        <rect x={58} y={33} width={8} height={18} rx={1.2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.5} />
        <rect x={57.2} y={35} width={1.6} height={14} fill="#f7fafd" opacity={0.85} />
        <rect x={66} y={36} width={spindleLen} height={12} rx={1.4} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.5} />
        <rect x={66} y={36} width={spindleLen} height={3} rx={1.2} fill="#ffffff" opacity={0.6} />
        {/* the object being measured */}
        {gap > 0.2 && (
          <g>
            <rect x={64} y={30} width={Math.max(1.6, gap * 0.7)} height={24} rx={1.4} fill="#0ea5e9" opacity={0.85} />
            <rect x={64} y={30} width={Math.max(1.6, gap * 0.7)} height={5} rx={1.4} fill="#bae6fd" opacity={0.7} />
          </g>
        )}
        {/* barrel: datum line with the mm scale above it */}
        <rect x={sleeveX} y={32} width={34} height={20} rx={2} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.6} />
        <rect x={sleeveX} y={32} width={34} height={20} rx={2} fill="url(#ix-brushed)" opacity={0.3} />
        <rect x={sleeveX + 1} y={32.8} width={32} height={2.6} rx={1.2} fill="#ffffff" opacity={0.55} />
        <line x1={sleeveX + 4} y1={46} x2={sleeveX + 32} y2={46} stroke="#0f172a" strokeWidth={0.7} />
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1={sleeveX + 6 + i * 3.4} y1={34.4} x2={sleeveX + 6 + i * 3.4} y2={i % 5 === 0 ? 41 : 37.6} stroke="#0f172a" strokeWidth={i % 5 === 0 ? 0.75 : 0.4} />
        ))}
        {/* spindle lock — the little lever that freezes the reading */}
        <path d={`M ${sleeveX + 2} 52 l 8 6`} stroke="url(#ix-steel-h)" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={sleeveX + 10} cy={58} r={3} fill="url(#ix-knurl)" stroke="#475569" strokeWidth={0.4} />
        {/* thimble: bevelled rim, knurled band and the circular scale */}
        <g>
          <rect x={sleeveX + 33} y={27} width={32} height={30} rx={3.4} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.6} />
          <rect x={sleeveX + 33} y={27} width={32} height={30} rx={3.4} fill="url(#ix-brushed)" opacity={0.25} />
          <ellipse cx={sleeveX + 65} cy={42} rx={3.4} ry={15} fill="url(#ix-steel)" opacity={0.5} />
          <rect x={sleeveX + 33} y={27} width={6} height={30} rx={3} fill="#0b1220" opacity={0.35} />
          <g style={{ transform: `rotate(${thimbleOffset * 3.6}deg)`, transformOrigin: `${sleeveX + 45}px 42px`, transition: 'transform 140ms ease-out' }}>
            {Array.from({ length: 20 }).map((_, i) => {
              const a = (i * 18 * Math.PI) / 180;
              return (
                <g key={i}>
                  <line
                    x1={sleeveX + 45 + Math.sin(a) * 11}
                    y1={42 - Math.cos(a) * 11}
                    x2={sleeveX + 45 + Math.sin(a) * 14}
                    y2={42 - Math.cos(a) * 14}
                    stroke="#e2e8f0"
                    strokeWidth={i % 5 === 0 ? 0.9 : 0.5}
                  />
                  {i % 5 === 0 && (
                    <Etch x={sleeveX + 45 + Math.sin(a) * 8.4} y={42 - Math.cos(a) * 8.4 + 1.4} size={3.6} color="#e2e8f0" mono>
                      {i * 5}
                    </Etch>
                  )}
                </g>
              );
            })}
          </g>
          {/* the reading index notch on the bevel */}
          <path d={`M ${sleeveX + 34.4} 39 h 3 v 6 h -3`} fill="#ffd166" opacity={0.85} />
        </g>
        {/* ratchet stop: knurled brass so it slips at a constant force */}
        <rect x={sleeveX + 64} y={36} width={13} height={13} rx={3} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={sleeveX + 64} y={36} width={13} height={13} rx={3} fill="url(#ix-knurl)" opacity={0.45} />
        <Etch x={30} y={70} size={5} color="#334155" weight={800} mono>
          {`${(gap + zero).toFixed(3)} mm`}
        </Etch>
        <Etch x={120} y={70} size={4.4} color="#475569" anchor="end" mono>
          {`pitch ${pitch} mm · ${div} div`}
        </Etch>
        {bn && (
          <Etch x={30} y={8} size={4.6} color="#475569">
            {'স্ক্রু গজ'}
          </Etch>
        )}
      </g>
    );
  }
};

const metreScale: ArtEntry = {
  vb: '0 0 190 34',
  Comp: ({ p, bn }) => (
    <g>
      {/* seasoned hardwood rule with a lacquered face and brass end cap */}
      <rect x={4} y={7.6} width={182} height={19} rx={1.6} fill="#0b1220" opacity={0.28} filter="url(#ix-blur)" />
      <rect x={4} y={8} width={182} height={18} rx={1.6} fill="url(#ix-wood)" stroke="#4a2f0f" strokeWidth={0.7} />
      <rect x={4} y={8} width={182} height={18} rx={1.6} fill="url(#ix-grain)" opacity={0.7} />
      <rect x={4} y={8} width={182} height={18} rx={1.6} fill="url(#ix-varnish)" />
      <rect x={5.4} y={9.4} width={179.2} height={15.2} rx={1} fill="url(#ix-ivorine)" opacity={0.96} />
      <rect x={5.4} y={9.4} width={179.2} height={4.4} rx={1} fill="#ffffff" opacity={0.45} />
      <LinearScale x={7} y={10.4} w={176} h={13.6} from={0} to={100} major={10} minor={1} unit="cm" size={5.2} />
      {/* brass ferrule at the zero end, where the rule is read against the bench */}
      <rect x={3} y={7.4} width={5} height={19.2} rx={1.4} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
      <rect x={3} y={7.4} width={5} height={19.2} rx={1.4} fill="url(#ix-brass-h)" opacity={0.5} />
      <Etch x={95} y={31} size={4.4} color="#334155" weight={700}>
        {`${bn ? 'মিটার স্কেল' : 'METRE SCALE'} · LC 0.1 cm`}
      </Etch>
      <Etch x={182} y={5.6} size={4.4} color="#475569" anchor="end">
        {`${num(p.lengthCm, 100)} cm`}
      </Etch>
    </g>
  )
};

const stopwatch: ArtEntry = {
  vb: '0 0 96 84',
  Comp: ({ p, bn, live }) => {
    const base = num(p.elapsedSeconds, 0);
    const running = on(p.running);
    const [t, setT] = React.useState(base);
    React.useEffect(() => {
      setT(base);
    }, [base]);
    React.useEffect(() => {
      if (!live || !running) return;
      const id = window.setInterval(() => setT((v) => Math.round((v + 0.01) * 100) / 100), 10);
      return () => window.clearInterval(id);
    }, [live, running]);
    const mm = Math.floor(t / 60);
    const ss = Math.floor(t % 60);
    const cc = Math.floor((t * 100) % 100);
    return (
      <g>
        <Contact cx={49} cy={80} rx={26} opacity={0.32} />
        {/* nickel-plated case: polished bezel, knurled flanks, a real crown */}
        <circle cx={49} cy={40} r={34} fill="url(#ix-chrome)" stroke="#475569" strokeWidth={0.9} filter="url(#ix-shadow)" />
        <circle cx={49} cy={40} r={34} fill="url(#ix-knurl)" opacity={0.5} />
        <circle cx={49} cy={40} r={29} fill="url(#ix-chrome)" stroke="#7a8794" strokeWidth={0.6} />
        <circle cx={49} cy={40} r={27} fill="#1b1f24" />
        {/* printed dial ring: 60 seconds with the 10 s numerals */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = ((i * 6 - 90) * Math.PI) / 180;
          const major = i % 5 === 0;
          return (
            <line
              key={i}
              x1={49 + Math.cos(a) * (major ? 19 : 21.4)}
              y1={40 + Math.sin(a) * (major ? 19 : 21.4)}
              x2={49 + Math.cos(a) * 25.4}
              y2={40 + Math.sin(a) * 25.4}
              stroke="#e6edf4"
              strokeWidth={major ? 0.8 : 0.35}
            />
          );
        })}
        {[0, 10, 20, 30, 40, 50].map((s) => {
          const a = ((s * 6 - 90) * Math.PI) / 180;
          return (
            <Etch key={s} x={49 + Math.cos(a) * 16.8} y={40 + Math.sin(a) * 16.8 + 2} size={4.4} color="#cbd5e1" weight={700} mono>
              {s}
            </Etch>
          );
        })}
        {/* the digital window shows min:sec, as it does on a real hybrid stopwatch,
            and is small enough to leave the printed ring readable */}
        <Display x={35} y={35} w={28} h={12} text={`${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`} on color="lcd" digits={5} />
        <Etch x={49} y={24} size={3.8} color="#cbd5e1" weight={700}>
          {bn ? 'স্টপওয়াচ' : 'STOPWATCH'}
        </Etch>
        {/* the second hand, driven by the same clock */}
        <g style={{ transform: `rotate(${(t % 60) * 6}deg)`, transformOrigin: '49px 40px' }}>
          <line x1={49} y1={43} x2={49} y2={25} stroke="#ef4444" strokeWidth={1.1} strokeLinecap="round" />
        </g>
        <circle cx={49} cy={40} r={1.8} fill="#cbd5e1" />
        {/* domed glass over the dial */}
        <circle cx={49} cy={40} r={27} fill="url(#ix-reflect)" opacity={0.5} />
        <ellipse cx={41} cy={29} rx={7} ry={3.4} fill="#ffffff" opacity={0.28} transform="rotate(-32 41 29)" />
        {/* crown + start/stop/reset plungers */}
        <rect x={42} y={1} width={14} height={8} rx={2} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={0.4} />
        <rect x={42} y={1} width={14} height={8} rx={2} fill="url(#ix-knurl)" opacity={0.5} />
        {[28, 70].map((x) => (
          <g key={x}>
            <rect x={x - 4.6} y={66} width={9.2} height={8} rx={2.4} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={0.4} />
            <rect x={x - 4.6} y={66} width={9.2} height={8} rx={2.4} fill="url(#ix-knurl)" opacity={0.4} />
          </g>
        ))}
        <circle cx={49} cy={76} r={3.4} fill={running ? '#ef4444' : '#6b7280'} />
        {running && <circle cx={49} cy={76} r={6} fill="url(#ix-glow-red)" opacity={0.6} />}
        <Etch x={49} y={84} size={4.4} color="#475569" weight={700} mono>
          {running ? 'RUNNING' : 'STOPPED'}
        </Etch>
      </g>
    );
  }
};

const protractor: ArtEntry = {
  vb: '0 0 106 96',
  Comp: ({ p, bn, live }) => {
    const ang = clamp(num(p.angleDeg, 45), -180, 180);
    return (
      <g>
        <Contact cx={53} cy={92} rx={34} opacity={0.26} />
        {/* clear acrylic disc with a bevelled rim and a printed ring */}
        <circle cx={53} cy={48} r={44} fill="#f2faff" fillOpacity={0.4} stroke="#8fc0e0" strokeWidth={0.9} filter="url(#ix-shadow)" />
        <circle cx={53} cy={48} r={44} fill="none" stroke="#ffffff" strokeWidth={2.2} opacity={0.55} />
        <circle cx={53} cy={48} r={37} fill="url(#ix-ivorine)" opacity={0.72} />
        <circle cx={53} cy={48} r={37} fill="none" stroke="#a99b7f" strokeWidth={0.4} />
        <circle cx={53} cy={48} r={29} fill="none" stroke="#c2b79e" strokeWidth={0.45} />
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i * 5 * Math.PI) / 180;
          const major = i % 6 === 0;
          return (
            <line
              key={i}
              x1={53 + Math.cos(a) * 37}
              y1={48 + Math.sin(a) * 37}
              x2={53 + Math.cos(a) * (major ? 29 : 33.4)}
              y2={48 + Math.sin(a) * (major ? 29 : 33.4)}
              stroke="#1f2937"
              strokeWidth={major ? 0.8 : 0.35}
            />
          );
        })}
        {[0, 90, 180, 270].map((d) => {
          const a = ((d - 90) * Math.PI) / 180;
          return (
            <g key={d}>
              <Etch x={53 + Math.cos(a) * 23.4} y={48 + Math.sin(a) * 23.4 + 2} size={4.8} color="#1f2937" weight={800} mono>
                {d}
              </Etch>
              <Etch x={53 + Math.cos(a) * 13.4} y={48 + Math.sin(a) * 13.4 + 2} size={3.8} color="#64748b" mono>
                {d + 90}
              </Etch>
            </g>
          );
        })}
        {/* the index arm, pivoted on its brass bush */}
        <g style={{ transform: `rotate(${ang}deg)`, transformOrigin: '53px 48px', transition: live ? 'transform 300ms cubic-bezier(.2,.9,.3,1.05)' : undefined }}>
          <rect x={43} y={45.4} width={48} height={5.2} rx={2.6} fill="#b91c1c" opacity={0.92} />
          <rect x={43} y={45.4} width={48} height={1.8} rx={0.9} fill="#ffffff" opacity={0.4} />
          <path d="M 88 44 l 5.4 4 l -5.4 4 Z" fill="#b91c1c" opacity={0.9} />
          <circle cx={44.6} cy={48} r={2.8} fill="#7f1d1d" opacity={0.9} />
        </g>
        <circle cx={53} cy={48} r={5.6} fill="url(#ix-brass-ball)" stroke="#6d4a0a" strokeWidth={0.5} />
        <circle cx={53} cy={48} r={5.6} fill="url(#ix-knurl)" opacity={0.4} />
        {/* the gloss of acrylic over everything */}
        <circle cx={53} cy={48} r={44} fill="url(#ix-reflect)" opacity={0.4} />
        <Etch x={53} y={94} size={5.4} color="#334155" weight={800} mono>
          {`${ang.toFixed(0)}°`}
        </Etch>
        {bn && (
          <Etch x={53} y={8} size={4.6} color="#475569">
            {'প্রোট্রাক্টর'}
          </Etch>
        )}
      </g>
    );
  }
};

const travellingMicroscope: ArtEntry = {
  vb: '0 0 138 128',
  Comp: ({ p, bn }) => {
    const v = num(p.verticalScaleCm, 4.523);
    const h = num(p.horizontalScaleCm, 2.145);
    return (
      <g>
        {/* cast base with levelling feet, brushed on top */}
        <path d="M 12 106 h 78 l -8 -12 h -62 Z" fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.7} filter="url(#ix-shadow)" />
        <ellipse cx={51} cy={106} rx={39} ry={6} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.6} />
        <ellipse cx={51} cy={100} rx={31} ry={4.4} fill="#6b7684" opacity={0.5} />
        {[20, 82].map((x) => (
          <g key={x}>
            <circle cx={x} cy={108} r={4.4} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.5} />
            <circle cx={x} cy={108} r={4.4} fill="url(#ix-knurl)" opacity={0.45} />
          </g>
        ))}
        {/* vertical column with its rack cut into the back */}
        <Rod x1={30} y1={94} x2={30} y2={16} w={8} />
        <rect x={27} y={18} width={6} height={74} fill="#0b1220" opacity={0.18} />
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={i} x1={27} y1={20 + i * 3.4} x2={33} y2={20 + i * 3.4} stroke="#0b1220" strokeOpacity={0.35} strokeWidth={0.6} />
        ))}
        {/* cross-slide with the vernier plate */}
        <rect x={44} y={44} width={56} height={23} rx={3} fill="url(#ix-charcoal)" stroke="#0b1220" strokeWidth={0.7} filter="url(#ix-shadow)" />
        <rect x={44} y={44} width={56} height={5} rx={2.4} fill="#ffffff" opacity={0.16} />
        <rect x={47} y={48} width={48} height={13} rx={1.2} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.4} />
        <rect x={47} y={48} width={48} height={5} rx={1.2} fill="#ffffff" opacity={0.4} />
        <LinearScale x={48} y={49} w={46} h={11} from={0} to={15} major={5} minor={0.5} unit="cm" size={3.6} tick={11} />
        <Screw cx={96} cy={55} r={2.6} />
        {/* slow-motion screw: a brass drum with its own scale */}
        <rect x={98} y={40} width={12} height={30} rx={2} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.5} />
        <rect x={98} y={40} width={12} height={30} rx={2} fill="url(#ix-brass-h)" opacity={0.4} />
        <LinearScale x={98} y={42} w={12} h={26} from={0} to={10} major={2} minor={0.2} vertical size={3.4} tick={12} />
        <Knob cx={104} cy={80} r={6.4} kind="brass" teeth={16} />
        <circle cx={104} cy={80} r={6.4} fill="url(#ix-knurl)" opacity={0.45} />
        {/* body tube: eyepiece collar, draw tube, objective in its ring */}
        <rect x={62} y={16} width={13} height={32} rx={3} fill="url(#ix-chrome)" stroke="#64748b" strokeWidth={0.6} />
        <rect x={62} y={16} width={13} height={32} rx={3} fill="url(#ix-brushed)" opacity={0.35} />
        <rect x={61} y={16} width={15} height={7} rx={2.4} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.4} />
        <rect x={61} y={16} width={15} height={7} rx={2.4} fill="url(#ix-knurl)" opacity={0.5} />
        <ellipse cx={68.5} cy={16} rx={7.5} ry={2.6} fill="#111827" />
        <rect x={63.4} y={48} width={10} height={18} rx={2} fill="url(#ix-steel)" stroke="#475569" strokeWidth={0.5} />
        <rect x={62.6} y={64} width={12.4} height={6} rx={2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.4} />
        <circle cx={68.8} cy={70} r={4} fill="url(#ix-lens-glass)" stroke="#7ea9c9" strokeWidth={0.6} />
        <circle cx={68.8} cy={70} r={1.6} fill="#dff1ff" opacity={0.8} />
        {/* stage: glass slide on a blackened plate, with the sub-stage mirror */}
        <rect x={40} y={92} width={56} height={5.4} rx={1.6} fill="url(#ix-charcoal)" stroke="#111827" strokeWidth={0.5} />
        <rect x={40} y={92} width={56} height={2} rx={1} fill="#ffffff" opacity={0.16} />
        <rect x={48} y={88.6} width={40} height={3.4} rx={1} fill="#dbeafe" stroke="#7ea9c9" strokeWidth={0.4} />
        <ellipse cx={68} cy={90} rx={5} ry={1.6} fill="#bfdbfe" opacity={0.85} />
        <ellipse cx={68} cy={103} rx={9} ry={3.4} fill="url(#ix-mercury)" stroke="#8b97a3" strokeWidth={0.4} />
        <path d="M 60 100 l 16 0 l -8 5 Z" fill="#cbd5e1" opacity={0.35} />
        {/* brass scales and the engraved readings */}
        <Etch x={69} y={122} size={5} color="#334155" weight={800} mono>
          {`V ${v.toFixed(3)} cm · H ${h.toFixed(3)} cm`}
        </Etch>
        {bn && (
          <Etch x={69} y={10} size={4.6} color="#475569">
            {'ভ্রাম্যমাণ অণুবীক্ষণ'}
          </Etch>
        )}
      </g>
    );
  }
};

const specificGravityBottle: ArtEntry = {
  vb: '0 0 118 74',
  Comp: ({ p, bn }) => {
    const vol = num(p.volumeMl, 100);
    const temp = num(p.temperatureC, 25);
    return (
      <g>
        <Contact cx={59} cy={70} rx={28} opacity={0.3} />
        {/* ground-glass stopper with its capillary bore */}
        <path d="M 51 5 h 16 a 3 3 0 0 1 3 3 v 9 a 3 3 0 0 1 -3 3 h -16 a 3 3 0 0 1 -3 -3 v -9 a 3 3 0 0 1 3 -3 Z" fill="url(#ix-glass-edge)" stroke="#7ea9c9" strokeWidth={0.7} />
        <path d="M 53 7 h 12 a 1.6 1.6 0 0 1 1.6 1.6 v 6.8 a 1.6 1.6 0 0 1 -1.6 1.6 h -12 a 1.6 1.6 0 0 1 -1.6 -1.6 v -6.8 a 1.6 1.6 0 0 1 1.6 -1.6 Z" fill="#f7fbff" opacity={0.6} />
        <line x1={55} y1={7} x2={55} y2={19} stroke="#ffffff" strokeOpacity={0.85} strokeWidth={1.4} strokeLinecap="round" />
        <line x1={59} y1={5} x2={59} y2={20} stroke="#7ea9c9" strokeWidth={0.6} />
        <Etch x={59} y={13} size={3.4} color="#4b6b86" mono>
          ▏
        </Etch>
        {/* the bulb: thick glass, filled to the mark */}
        <path
          d="M 44 20 h 30 v 10 l 10 12 v 24 a 6 6 0 0 1 -6 6 h -38 a 6 6 0 0 1 -6 -6 v -24 l 10 -12 Z"
          fill="#fdfcf7"
          opacity={0.5}
          stroke="#7ea9c9"
          strokeWidth={0.9}
          filter="url(#ix-shadow)"
        />
        <path d="M 46 22 h 26 v 9 l 9.4 11.2 v 22 a 4 4 0 0 1 -4 4 h -36 a 4 4 0 0 1 -4 -4 v -22 l 8.6 -11.2 Z" fill="url(#ix-water)" opacity={0.8} />
        <ellipse cx={59} cy={41} rx={20} ry={4} fill="#cbe9fb" opacity={0.55} />
        {/* the meniscus and the etched graduation mark it is read against */}
        <path d="M 39 41 q 20 -4 40 0" fill="none" stroke="#e0f2fe" strokeWidth={1} opacity={0.9} />
        <line x1={38} y1={37} x2={80} y2={37} stroke="#1f2937" strokeOpacity={0.5} strokeWidth={0.5} />
        <line x1={38} y1={37} x2={44} y2={37} stroke="#1f2937" strokeOpacity={0.7} strokeWidth={0.7} />
        {/* the two specular streaks that make glass look like glass */}
        <line x1={50} y1={24} x2={44} y2={68} stroke="#ffffff" strokeOpacity={0.75} strokeWidth={2} strokeLinecap="round" />
        <line x1={68} y1={26} x2={74} y2={66} stroke="#ffffff" strokeOpacity={0.28} strokeWidth={0.9} strokeLinecap="round" />
        <line x1={72} y1={28} x2={78} y2={62} stroke="#4b6b86" strokeOpacity={0.22} strokeWidth={1.2} strokeLinecap="round" />
        <Etch x={59} y={54} size={5.6} color="#0c4a6e" weight={800} mono>
          {`${vol} mL`}
        </Etch>
        <Etch x={59} y={72} size={4.8} color="#334155" weight={700} mono>
          {`pycnometer · ${temp} °C`}
        </Etch>
        {bn && (
          <Etch x={59} y={4} size={4.4} color="#475569">
            {'আপেক্ষিক ঘনত্ব বোতল'}
          </Etch>
        )}
      </g>
    );
  }
};

export const measuringArt: Record<string, ArtEntry> = {
  'vernier-caliper': vernierCaliper,
  'screw-gauge-micrometer': screwGauge,
  'meter-scale-wooden': metreScale,
  'digital-stopwatch': stopwatch,
  'circular-protractor': protractor,
  'travelling-microscope': travellingMicroscope,
  'specific-gravity-bottle': specificGravityBottle
};
