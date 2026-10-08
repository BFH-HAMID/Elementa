'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { Etch, Knob, LinearScale, Protractor, RetortStand, Rod, Screw, SlottedWeight, WeightHanger } from './Equipment/art/parts';
import { Play, Pause, RotateCcw, FastForward, Activity, Compass, Mountain, Cog, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const G = 9.80665;
const TAU = Math.PI * 2;

/* Bench geometry: a real bench top with a wooden edge, and the wall behind. */
const BENCH_Y = 300; // top surface of the bench
const BENCH_FRONT = 360; // bottom of the front edge

/** Bench + wall backdrop for every mechanics scene. */
function LabBackdrop() {
  return (
    <g>
      <defs>
        <linearGradient id="mech-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dfe8f0" />
          <stop offset="70%" stopColor="#e9eff5" />
          <stop offset="100%" stopColor="#d5dee7" />
        </linearGradient>
        <linearGradient id="mech-bench-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6f2e8" />
          <stop offset="55%" stopColor="#e7dfd0" />
          <stop offset="100%" stopColor="#cfc5b3" />
        </linearGradient>
        <linearGradient id="mech-bench-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9773f" />
          <stop offset="45%" stopColor="#8b5e2f" />
          <stop offset="100%" stopColor="#5c3d1c" />
        </linearGradient>
      </defs>
      {/* wall */}
      <rect x={0} y={0} width={800} height={BENCH_Y} fill="url(#mech-wall)" />
      <rect x={0} y={0} width={800} height={BENCH_Y} fill="url(#ix-grain)" opacity={0.12} />
      {/* soft shadow the bench casts on the wall */}
      <rect x={0} y={BENCH_Y - 26} width={800} height={26} fill="#0b1220" opacity={0.06} filter="url(#ix-blur)" />
      {/* bench top: stone-effect laminate with a chamfered front edge */}
      <rect x={0} y={BENCH_Y} width={800} height={16} fill="url(#mech-bench-top)" />
      <rect x={0} y={BENCH_Y} width={800} height={2.4} fill="#ffffff" opacity={0.7} />
      <rect x={0} y={BENCH_Y + 16} width={800} height={(BENCH_FRONT - BENCH_Y) * 0.45} fill="url(#mech-bench-edge)" />
      <rect x={0} y={BENCH_Y + 16 + (BENCH_FRONT - BENCH_Y) * 0.45} width={800} height={(BENCH_FRONT - BENCH_Y) * 0.55} fill="#3f2a12" opacity={0.55} />
      <rect x={0} y={BENCH_Y + 16} width={800} height={1.6} fill="#d9b98a" opacity={0.55} />
      <rect x={0} y={BENCH_FRONT - 3} width={800} height={3} fill="#2b1c0d" opacity={0.35} />
    </g>
  );
}

/** Bench data logger: a moulded case with a backlit LCD and its rows of readings. */
function Readout({ x, y, w = 196, title, rows }: { x: number; y: number; w?: number; title: string; rows: Array<[string, string]> }) {
  const head = 24;
  const line = 16;
  const h = head + rows.length * line + 12;
  return (
    <g>
      {/* the body throws a shadow onto the bench */}
      <rect x={x + 2} y={y + 4} width={w} height={h} rx={7} fill="#0b1220" opacity={0.32} filter="url(#ix-blur)" />
      <rect x={x} y={y} width={w} height={h} rx={7} fill="url(#ix-enamel)" stroke="#0b1220" strokeOpacity={0.65} strokeWidth={0.9} />
      <rect x={x} y={y} width={w} height={h * 0.3} rx={7} fill="#ffffff" opacity={0.12} />
      {/* ivory name strip with the instrument's function */}
      <rect x={x + 8} y={y + 6} width={w - 16} height={head - 10} rx={2} fill="url(#ix-ivorine)" stroke="#a99b7f" strokeWidth={0.5} />
      <Etch x={x + 13} y={y + 18} size={9} color="#1f2937" weight={800} anchor="start" mono>
        {title}
      </Etch>
      {/* the LCD window with its green backlight */}
      <rect x={x + 8} y={y + head} width={w - 16} height={rows.length * line + 6} rx={3} fill="url(#ix-lcd)" stroke="#0b1220" strokeOpacity={0.5} strokeWidth={0.7} />
      <rect x={x + 8} y={y + head} width={w - 16} height={(rows.length * line + 6) * 0.42} rx={3} fill="url(#ix-reflect)" opacity={0.35} />
      {rows.map(([k, v], i) => (
        <g key={k}>
          <Etch x={x + 14} y={y + head + 13 + i * line} size={9.5} color="#1f3d21" weight={700} anchor="start" mono>
            {k}
          </Etch>
          <Etch x={x + w - 14} y={y + head + 13 + i * line} size={10} color="#12301a" weight={800} anchor="end" mono>
            {v}
          </Etch>
        </g>
      ))}
      {/* power lamp + holding screws */}
      <circle cx={x + w - 12} cy={y + 11} r={2.4} fill="#ef4444" opacity={0.85} />
      <circle cx={x + w - 12} cy={y + 11} r={4.6} fill="url(#ix-glow-red)" opacity={0.5} />
      <Screw cx={x + 7} cy={y + h - 7} r={2.2} />
      <Screw cx={x + w - 7} cy={y + h - 7} r={2.2} />
    </g>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex min-w-[168px] flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
      <span className="text-[11px] font-bold text-[var(--muted)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 accent-physics-600"
      />
      <span className="w-16 shrink-0 text-right font-mono text-[11px] font-black text-physics-700 dark:text-physics-200">
        {value.toFixed(step < 1 ? 2 : 0)} {unit}
      </span>
    </label>
  );
}

export type MechanicsTab = 'pendulum' | 'spring' | 'incline' | 'projectile' | 'atwood';

export function MechanicsStage({ initialTab = 'pendulum' }: { initialTab?: MechanicsTab } = {}) {
  const { isBangla } = usePhysicsI18n();
  const [activeTab, setActiveTab] = useState<MechanicsTab>(initialTab);

  const mechanicsState = usePhysicsStore((s) => s.mechanicsState);
  const stepMechanics = usePhysicsStore((s) => s.stepMechanics);
  const toggleMechanicsRunning = usePhysicsStore((s) => s.toggleMechanicsRunning);
  const resetMechanics = usePhysicsStore((s) => s.resetMechanics);

  // Animation loop — the store integrates the real equations of motion.
  const requestRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      stepMechanics(dt);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [stepMechanics]);

  const st = mechanicsState;

  const incline = useMemo(() => {
    const th = (st.inclineAngle * Math.PI) / 180;
    const slideGate = Math.tan(th) > st.inclineFrictionCoeff;
    const a = slideGate ? G * (Math.sin(th) - st.inclineFrictionCoeff * Math.cos(th)) : 0;
    const travel = Math.min(2.4, 0.5 * a * Math.min(st.time, 4) ** 2);
    return {
      a,
      travel: Math.max(0, travel),
      stalled: !slideGate,
      normal: st.inclineMass * G * Math.cos(th),
      parallel: st.inclineMass * G * Math.sin(th),
      friction: st.inclineMass * G * st.inclineFrictionCoeff * Math.cos(th)
    };
  }, [st.inclineAngle, st.inclineFrictionCoeff, st.inclineMass, st.time]);

  const atwood = useMemo(() => {
    const a = ((st.atwoodM1 - st.atwoodM2) * G) / (st.atwoodM1 + st.atwoodM2 || 1);
    const tension = (2 * st.atwoodM1 * st.atwoodM2 * G) / (st.atwoodM1 + st.atwoodM2 || 1);
    const travel = Math.max(-0.6, Math.min(0.6, 0.5 * a * Math.min(st.time, 3.2) ** 2));
    return { a, tension, travel };
  }, [st.atwoodM1, st.atwoodM2, st.time]);

  const tabs = [
    { id: 'pendulum' as const, icon: Activity, bn: 'সরল দোলক', en: 'Simple Pendulum' },
    { id: 'spring' as const, icon: Compass, bn: 'স্প্রিং ও হুকের সূত্র', en: 'Spring & Hooke’s Law' },
    { id: 'incline' as const, icon: Mountain, bn: 'নততল ও ঘর্ষণ', en: 'Inclined Plane' },
    { id: 'projectile' as const, icon: FastForward, bn: 'প্রাসের গতি', en: 'Projectile' },
    { id: 'atwood' as const, icon: Cog, bn: 'অ্যাটউড মেশিন', en: 'Atwood Machine' }
  ];

  return (
    <div className="space-y-4">
      {/* Selector + transport controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition',
                activeTab === t.id ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
              )}
            >
              <t.icon size={15} />
              {isBangla ? t.bn : t.en}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMechanicsRunning}
            className="flex items-center gap-1.5 rounded-xl bg-physics-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-physics-700"
          >
            {st.running ? <Pause size={14} /> : <Play size={14} />}
            {st.running ? (isBangla ? 'থামান' : 'Pause') : isBangla ? 'চালু করুন' : 'Play'}
          </button>
          <button
            type="button"
            onClick={resetMechanics}
            className="flex items-center gap-1 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <RotateCcw size={14} />
            {isBangla ? 'রিসেট' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Bench view */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] shadow-card">
        <svg viewBox="0 0 800 360" className="block w-full select-none">
          <LabBackdrop />

          {/* ================= Simple pendulum ================= */}
          {activeTab === 'pendulum' &&
            (() => {
              const pivotX = 400;
              const pivotY = 52;
              const lenPx = st.pendulumLength * 160;
              const bobR = 11 + Math.min(9, st.pendulumMass * 130);
              const bobX = pivotX + lenPx * Math.sin(st.pendulumAngle);
              const bobY = pivotY + lenPx * Math.cos(st.pendulumAngle);
              const amp = Math.max(0.03, Math.abs(st.pendulumAngle));
              const swing = (th: number) => ({
                x: pivotX + lenPx * Math.sin(th),
                y: pivotY + lenPx * Math.cos(th)
              });
              const l = swing(-amp);
              const r = swing(amp);
              const scaleX = pivotX + 104;
              return (
                <g>
                  <RetortStand x={pivotX} baseY={BENCH_Y} top={30} clampY={pivotY} length={0} direction={1} />
                  {/* mirror scale: the polished strip a real lab reads the swing against */}
                  <g>
                    <rect x={scaleX} y={pivotY - 6} width={28} height={lenPx + bobR * 2 + 18} rx={3} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.8} />
                    <rect x={scaleX + 2} y={pivotY - 4} width={7} height={lenPx + bobR * 2 + 14} fill="#ffffff" opacity={0.5} />
                    <LinearScale x={scaleX + 8} y={pivotY} w={18} h={lenPx + bobR * 2} from={0} to={Math.round(st.pendulumLength * 100)} major={10} minor={1} vertical unit="cm" size={7} tick={12} />
                    <Etch x={scaleX + 14} y={pivotY - 12} size={9} color="#334155" weight={800}>
                      {isBangla ? 'আয়না স্কেল' : 'mirror scale'}
                    </Etch>
                    {[l, r].map((p, i) => (
                      <line key={i} x1={scaleX - 14} y1={p.y} x2={scaleX + 2} y2={p.y} stroke="#0ea5e9" strokeWidth={0.9} strokeDasharray="4 4" opacity={0.7} />
                    ))}
                    <circle cx={scaleX + 14} cy={bobY} r={3} fill="#0ea5e9" opacity={0.75} />
                  </g>
                  {/* the arc the bob sweeps, at the true amplitude */}
                  <path
                    d={`M ${l.x} ${l.y} A ${lenPx} ${lenPx} 0 0 1 ${r.x} ${r.y}`}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    opacity={0.5}
                  />
                  {/* the ivory protractor sits behind the thread, as on the bench */}
                  <Protractor cx={pivotX} cy={pivotY + 4} r={86} angle={(st.pendulumAngle * 180) / Math.PI} spanDeg={90} />
                  {/* cotton thread, tied to the split bob */}
                  <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#3f3f46" strokeWidth={1.1} opacity={0.9} />
                  <g>
                    <circle cx={bobX} cy={bobY} r={bobR} fill="url(#ix-brass)" stroke="#5b3f08" strokeWidth={1} />
                    <circle cx={bobX} cy={bobY} r={bobR} fill="url(#ix-brass-h)" opacity={0.4} />
                    <circle cx={bobX - bobR * 0.34} cy={bobY - bobR * 0.36} r={bobR * 0.3} fill="#fffdf0" opacity={0.72} />
                    <rect x={bobX - 1.8} y={bobY - bobR} width={3.6} height={bobR * 0.72} fill="#7c560f" opacity={0.5} />
                    <circle cx={bobX} cy={bobY - bobR * 0.62} r={1.8} fill="url(#ix-chrome)" />
                    <ellipse cx={bobX + 2} cy={bobY + bobR * 1.05} rx={bobR * 0.95} ry={bobR * 0.22} fill="#0b1220" opacity={0.16} />
                  </g>
                  <Readout
                    x={22}
                    y={22}
                    title={isBangla ? 'দোলকের পরিমাপ' : 'PENDULUM MEASUREMENT'}
                    rows={[
                      ['T', `${st.pendulumPeriod.toFixed(3)} s`],
                      ['L', `${(st.pendulumLength * 100).toFixed(0)} cm`],
                      ['θ', `${((st.pendulumAngle * 180) / Math.PI).toFixed(1)}°`],
                      ['g = 4π²L/T²', `${((4 * Math.PI ** 2 * st.pendulumLength) / st.pendulumPeriod ** 2).toFixed(3)} m/s²`]
                    ]}
                  />
                </g>
              );
            })()}

          {/* ================= Spring / Hooke's law ================= */}
          {activeTab === 'spring' &&
            (() => {
              const standX = 296;
              const clampY = 54;
              const pivotX = standX + 84;
              const pivotY = clampY;
              const massG = st.springMass * 1000;
              const naturalPx = 132;
              const staticStretch = (massG / 1000) * G / Math.max(1, st.springConstant); // m
              const lenPx = Math.max(46, naturalPx + (staticStretch + st.springDisplacement) * 190);
              const coils = 17;
              const helix = (phase: number, width = 16) => {
                let d = `M ${pivotX} ${pivotY}`;
                for (let i = 1; i <= coils * 6; i++) {
                  const f = i / (coils * 6);
                  d += ` L ${(pivotX + Math.sin((f * coils + phase) * TAU) * width).toFixed(2)} ${(pivotY + f * lenPx).toFixed(2)}`;
                }
                return d;
              };
              const massY = pivotY + lenPx + 30;
              const reading = 40 - ((massY - (pivotY + 10)) / 190) * 40;
              return (
                <g>
                  <RetortStand x={standX} baseY={BENCH_Y} top={26} clampY={clampY} length={96} direction={1} />
                  {/* the spring hangs from the clamp hook */}
                  <path d={`M ${pivotX} ${pivotY - 6} L ${pivotX} ${pivotY + 2}`} stroke="#8a97a5" strokeWidth={2} />
                  <circle cx={pivotX} cy={pivotY - 2} r={3.2} fill="none" stroke="#cbd5e1" strokeWidth={1.6} />
                  <path d={helix(0)} fill="none" stroke="#334155" strokeWidth={3.4} strokeLinejoin="round" strokeLinecap="round" />
                  <path d={helix(0.5)} fill="none" stroke="#e2e8f0" strokeWidth={1.6} strokeLinejoin="round" opacity={0.85} />
                  <path d={helix(0.25, 15.4)} fill="none" stroke="#64748b" strokeWidth={0.7} strokeLinejoin="round" opacity={0.5} />
                  {/* hanger + slotted weights */}
                  <line x1={pivotX} y1={pivotY + lenPx} x2={pivotX} y2={massY - 30} stroke="#8a97a5" strokeWidth={1.5} />
                  <WeightHanger x={pivotX} y={massY} r={24} label={`${Math.round(massG)}`} hook={false} />
                  {/* vertical mirror scale with the red pointer */}
                  <g>
                    <rect x={pivotX + 40} y={pivotY - 4} width={30} height={250} rx={3} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.8} />
                    <rect x={pivotX + 42} y={pivotY - 2} width={7} height={246} fill="#ffffff" opacity={0.5} />
                    <LinearScale x={pivotX + 49} y={pivotY} w={19} h={240} from={0} to={40} major={5} minor={1} vertical unit="cm" size={7} tick={13} />
                    <line x1={pivotX + 12} y1={massY - 26} x2={pivotX + 54} y2={massY - 26} stroke="#b91c1c" strokeWidth={1.6} />
                    <line x1={pivotX + 12} y1={massY - 20} x2={pivotX + 54} y2={massY - 20} stroke="#b91c1c" strokeWidth={1} opacity={0.5} />
                    <Etch x={pivotX} y={massY + 60} size={9.5} color="#334155" weight={800} mono>
                      {`x = ${((staticStretch + st.springDisplacement) * 100).toFixed(2)} cm`}
                    </Etch>
                  </g>
                  <Etch x={pivotX} y={massY + 44} size={9.5} color="#475569" weight={800} mono>
                    {`w = ${((massG / 1000) * G).toFixed(2)} N`}
                  </Etch>
                  <Readout
                    x={22}
                    y={22}
                    title={isBangla ? 'স্প্রিং পরিমাপ' : 'SPRING MEASUREMENT'}
                    rows={[
                      ['T', `${st.springPeriod.toFixed(3)} s`],
                      ['k', `${st.springConstant} N/m`],
                      ['x', `${(st.springDisplacement * 100).toFixed(2)} cm`],
                      ['F = kx', `${(st.springConstant * st.springDisplacement).toFixed(2)} N`],
                      ['scale', `${Math.max(0, reading).toFixed(1)} cm`]
                    ]}
                  />
                </g>
              );
            })()}

          {/* ================= Inclined plane ================= */}
          {activeTab === 'incline' &&
            (() => {
              const th = (st.inclineAngle * Math.PI) / 180;
              const hingeX = 132;
              const planeLen = 470;
              const topX = hingeX + planeLen * Math.cos(th);
              const topY = BENCH_Y - planeLen * Math.sin(th);
              // up-slope unit vector (screen coords) and the outward normal
              const ux = Math.cos(th);
              const uy = -Math.sin(th);
              const nx = -Math.sin(th);
              const ny = -Math.cos(th);
              const frac = Math.min(0.86, 0.3 + incline.travel / 2.4);
              const cartX = hingeX + planeLen * frac * ux;
              const cartY = BENCH_Y + planeLen * frac * uy;
              const vec = (
                ox: number,
                oy: number,
                dx: number,
                dy: number,
                color: string,
                label: string,
                dash?: string,
                labelDx = 0,
                labelDy = 12
              ) => {
                const len = Math.hypot(dx, dy) || 1;
                const ux2 = dx / len;
                const uy2 = dy / len;
                const gap = 9; // clear of the trolley body
                const sx = ox + ux2 * gap;
                const sy = oy + uy2 * gap;
                const ex = ox + dx;
                const ey = oy + dy;
                return (
                  <g key={label}>
                    <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={color} strokeWidth={2.2} strokeDasharray={dash} />
                    <path d={`M ${ex} ${ey} L ${ex - ux2 * 10 - uy2 * 5} ${ey - uy2 * 10 + ux2 * 5} L ${ex - ux2 * 10 + uy2 * 5} ${ey - uy2 * 10 - ux2 * 5} Z`} fill={color} />
                    <Etch x={ex + labelDx} y={ey + labelDy} size={9.5} color={color} weight={800}>
                      {label}
                    </Etch>
                  </g>
                );
              };
              const scale = 34 / (st.inclineMass * G || 1); // px per newton, normalised to the weight
              const propLen = planeLen * 0.5;
              return (
                <g>
                  {/* wooden plank, hinged at the bench and propped on a block */}
                  <polygon
                    points={`${hingeX},${BENCH_Y} ${topX},${topY} ${topX + 14 * Math.cos(th)},${topY + 14 * Math.sin(th)} ${hingeX + 14 * Math.cos(th)},${BENCH_Y + 14 * Math.sin(th)}`}
                    fill="url(#ix-wood)"
                    stroke="#5b3c14"
                    strokeWidth={0.9}
                  />
                  <polygon points={`${hingeX},${BENCH_Y} ${topX},${topY} ${topX},${topY + 3} ${hingeX},${BENCH_Y + 3}`} fill="url(#ix-grain)" opacity={0.8} />
                  {/* the prop that holds the plank up: a slotted rod under the top end */}
                  <line x1={topX} y1={topY + 8} x2={topX - 96} y2={BENCH_Y} stroke="#7a5223" strokeWidth={10} />
                  <rect x={topX - 106} y={BENCH_Y - 6} width={22} height={6} rx={2} fill="url(#ix-iron)" />
                  {/* hinge bracket */}
                  <rect x={hingeX - 12} y={BENCH_Y - 4} width={26} height={8} rx={2} fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.7} />
                  <circle cx={hingeX} cy={BENCH_Y} r={3.4} fill="url(#ix-steel)" />
                  {/* angle scale at the hinge */}
                  <Protractor cx={hingeX} cy={BENCH_Y - 2} r={76} angle={st.inclineAngle} spanDeg={90} />
                  <Etch x={hingeX - 96} y={BENCH_Y - 22} size={12} color="#1f2937" weight={800} mono>
                    {`θ = ${st.inclineAngle}°`}
                  </Etch>

                  {/* trolley riding the plane */}
                  <g transform={`translate(${cartX} ${cartY}) rotate(${-st.inclineAngle})`}>
                    <ellipse cx={2} cy={-2} rx={34} ry={7} fill="#0b1220" opacity={0.2} />
                    <rect x={-32} y={-25} width={64} height={18} rx={3} fill="url(#ix-blue-plastic)" stroke="#0d3b68" strokeWidth={0.9} />
                    <rect x={-32} y={-25} width={64} height={6} rx={3} fill="#ffffff" opacity={0.24} />
                    <rect x={-20} y={-32} width={40} height={8} rx={2} fill="url(#ix-steel-h)" stroke="#64748b" strokeWidth={0.5} />
                    <SlottedWeight cx={0} cy={-34} r={9} />
                    <circle cx={-19} cy={-5} r={6.4} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.8} />
                    <circle cx={19} cy={-5} r={6.4} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.8} />
                    <circle cx={-19} cy={-5} r={2.3} fill="url(#ix-chrome)" />
                    <circle cx={19} cy={-5} r={2.3} fill="url(#ix-chrome)" />
                  </g>

                  {/* free-body vectors, drawn to scale from the real forces */}
                  <g>
                    {vec(cartX, cartY - 4, 0, Math.min(98, st.inclineMass * G * scale + 30), '#475569', 'mg', undefined, 0, 13)}
                    {vec(cartX, cartY - 4, nx * Math.min(86, incline.normal * scale), ny * Math.min(86, incline.normal * scale), '#2563eb', 'N', undefined, nx * 22, ny * 22 - 2)}
                    {vec(cartX, cartY - 4, -ux * Math.min(80, incline.parallel * scale + 12), -uy * Math.min(80, incline.parallel * scale + 12), '#dc2626', 'mg·sinθ', undefined, ux * 48, uy * 48 + 12)}
                    {incline.friction > 0.01 &&
                      vec(cartX, cartY - 4, ux * Math.min(72, incline.friction * scale + 6), uy * Math.min(72, incline.friction * scale + 6), '#059669', 'f = μN', '5 4', ux * 22, uy * 22 - 10)}
                  </g>

                  {/* pulley clamped over the top edge, with the string to a hanger */}
                  <g>
                    <rect x={topX - 4} y={topY - 16} width={26} height={12} rx={2} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
                    <Knob cx={topX + 4} cy={topY - 20} r={4.4} kind="black" teeth={10} />
                    <circle cx={topX + 16} cy={topY - 2} r={14} fill="url(#ix-steel)" stroke="#475569" strokeWidth={1} />
                    <circle cx={topX + 16} cy={topY - 2} r={11.4} fill="none" stroke="#0b1220" strokeOpacity={0.3} strokeWidth={2.6} />
                    <circle cx={topX + 16} cy={topY - 2} r={3.6} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.6} />
                  </g>
                  <path d={`M ${cartX + 30 * ux} ${cartY - 20 + 30 * uy} L ${topX + 16} ${topY - 2} L ${topX + 16} ${topY + 40}`} fill="none" stroke="#6b7280" strokeWidth={1.4} />
                  <WeightHanger x={topX + 16} y={topY + 52} r={15} label={`${Math.round(st.inclineMass * 1000)}`} hook={false} />

                  <Etch x={780} y={BENCH_Y + 26} size={9} color="#475569" weight={800} anchor="end">
                    {isBangla ? 'কাঠের নততল — হিংজ ও কীলকে ধরে রাখা কোণ' : 'wooden plane, held by the hinge and prop block'}
                  </Etch>
                  <Readout
                    x={22}
                    y={22}
                    title={isBangla ? 'নততলের হিসাব' : 'INCLINE SOLUTION'}
                    rows={[
                      ['a', `${incline.a.toFixed(2)} m/s²`],
                      ['μ', `${st.inclineFrictionCoeff.toFixed(2)}`],
                      ['tanθ', `${Math.tan(th).toFixed(2)}`],
                      ['m', `${(st.inclineMass * 1000).toFixed(0)} g`],
                      ['s(t)', `${incline.travel.toFixed(2)} m`]
                    ]}
                  />
                  {incline.stalled && (
                    <Etch x={400} y={BENCH_Y - 12} size={11} color="#b45309" weight={800}>
                      {isBangla ? 'ঘর্ষণ বেশি — ব্লক স্থির (μ ≥ tanθ)' : 'Friction holds the trolley still (μ ≥ tanθ)'}
                    </Etch>
                  )}
                </g>
              );
            })()}

          {/* ================= Projectile ================= */}
          {activeTab === 'projectile' &&
            (() => {
              const startX = 104;
              const muzzleY = BENCH_Y - 12;
              const angleRad = (st.projectileAngle * Math.PI) / 180;
              const barrel = 62;
              const v0 = st.projectileInitialVelocity;
              const px = 21; // px per metre
              const flight = (2 * v0 * Math.sin(angleRad)) / G;
              const cycle = Math.max(0.9, flight * 1.35);
              const t = st.time % cycle;
              const flying = t <= flight * 1.02;
              const bx = startX + v0 * Math.cos(angleRad) * Math.min(t, flight) * px;
              const by = muzzleY - (v0 * Math.sin(angleRad) * Math.min(t, flight) - 0.5 * G * Math.min(t, flight) ** 2) * px;
              const rangePx = st.projectileRange * px;
              // the exact parabola the ball must follow: y = x·tanθ − g x² /(2v₀²cos²θ)
              const parabola = Array.from({ length: 45 }, (_, i) => {
                const x = (i / 44) * st.projectileRange;
                const y = x * Math.tan(angleRad) - (G * x * x) / (2 * v0 * v0 * Math.cos(angleRad) ** 2);
                return `${(startX + x * px).toFixed(1)} ${(muzzleY - y * px).toFixed(1)}`;
              });
              const trace = (st.projectileTrajectory || []).map((p) => `${(startX + p.x * px).toFixed(1)} ${(muzzleY - p.y * px).toFixed(1)}`);
              const mx = startX + barrel * Math.cos(angleRad);
              const my = muzzleY - barrel * Math.sin(angleRad);
              return (
                <g>
                  {/* launcher carriage on the bench */}
                  <g transform={`translate(${startX} ${muzzleY})`}>
                    <ellipse cx={0} cy={20} rx={46} ry={7} fill="#0b1220" opacity={0.22} />
                    <path d="M -48 16 h 84 l -14 -24 h -56 Z" fill="url(#ix-iron)" stroke="#1f2937" strokeWidth={0.9} />
                    <path d="M -48 16 h 84 l -4 -6 h -76 Z" fill="#000000" opacity={0.18} />
                    <circle cx={-30} cy={17} r={9.5} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.8} />
                    <circle cx={17} cy={17} r={9.5} fill="url(#ix-rubber)" stroke="#111827" strokeWidth={0.8} />
                    <circle cx={-30} cy={17} r={3.2} fill="url(#ix-chrome)" />
                    <circle cx={17} cy={17} r={3.2} fill="url(#ix-chrome)" />
                    <rect x={-10} y={-14} width={20} height={16} rx={2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.6} />
                    {/* elevation drum + vernier */}
                    <circle cx={-4} cy={-6} r={7.5} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} />
                    <line x1={-4} y1={-6} x2={-4 + Math.cos(-angleRad) * 6} y2={-6 + Math.sin(-angleRad) * 6} stroke="#3f2a0e" strokeWidth={1.2} />
                    {/* the barrel, elevated */}
                    <g transform={`rotate(${-st.projectileAngle})`}>
                      <rect x={0} y={-11} width={barrel} height={14} rx={4} fill="url(#ix-brass-h)" stroke="#6d4a0a" strokeWidth={0.9} />
                      <rect x={3} y={-11} width={barrel - 6} height={4} rx={2} fill="#fff8dc" opacity={0.55} />
                      <rect x={barrel - 8} y={-11.6} width={6} height={15.2} rx={2} fill="url(#ix-steel-h)" stroke="#475569" strokeWidth={0.5} />
                      <circle cx={1} cy={-4} r={8} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} />
                      <circle cx={1} cy={-4} r={3} fill="#334155" />
                    </g>
                  </g>
                  {/* elevation quadrant */}
                  <Protractor cx={startX - 4} cy={muzzleY - 2} r={42} angle={st.projectileAngle} spanDeg={90} />
                  <Etch x={startX + 74} y={muzzleY - 40} size={10.5} color="#1f2937" weight={800} mono>
                    {`θ = ${st.projectileAngle}°`}
                  </Etch>
                  {/* bench scale in metres */}
                  <rect x={startX - 6} y={BENCH_Y + 3} width={Math.max(180, rangePx + 90)} height={13} rx={2} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.7} />
                  <LinearScale x={startX} y={BENCH_Y + 5} w={Math.max(170, rangePx + 80)} h={9} from={0} to={Math.max(5, Math.ceil(st.projectileRange))} major={5} minor={1} unit="m" size={8} />
                  {/* ideal parabola (dashed) and the measured trace */}
                  <path d={`M ${parabola.join(' L ')}`} fill="none" stroke="#0ea5e9" strokeWidth={1.2} strokeDasharray="6 5" opacity={0.75} />
                  {trace.length > 1 && <path d={`M ${trace.join(' L ')}`} fill="none" stroke="#dc2626" strokeWidth={1.8} opacity={0.9} />}
                  {/* where it lands */}
                  <g transform={`translate(${startX + rangePx} ${muzzleY})`}>
                    <line x1={0} y1={0} x2={0} y2={12} stroke="#dc2626" strokeWidth={1.4} />
                    <path d="M -5 12 h 10 l -5 6 Z" fill="#dc2626" />
                    <Etch x={0} y={-8} size={9.5} color="#b91c1c" weight={800}>
                      {`R = ${st.projectileRange.toFixed(2)} m`}
                    </Etch>
                  </g>
                  {/* apex marker */}
                  <g transform={`translate(${startX + (st.projectileRange / 2) * px} ${muzzleY - st.projectileMaxHeight * px})`}>
                    <circle cx={0} cy={0} r={2.6} fill="#0ea5e9" />
                    <Etch x={0} y={-8} size={9} color="#0369a1" weight={800}>
                      {`H = ${st.projectileMaxHeight.toFixed(2)} m`}
                    </Etch>
                  </g>
                  {/* the shot in flight + its velocity components */}
                  <g>
                    {t > 0.04 && (
                      <>
                        <circle cx={bx} cy={by} r={5.4} fill="url(#ix-steel-h)" stroke="#334155" strokeWidth={0.8} />
                        <circle cx={bx - 1.6} cy={by - 1.6} r={1.8} fill="#ffffff" opacity={0.8} />
                      </>
                    )}
                    {flying && t > 0.06 && (
                      <>
                        <line x1={bx} y1={by} x2={bx + v0 * Math.cos(angleRad) * 3.6} y2={by} stroke="#dc2626" strokeWidth={2} />
                        <line x1={bx} y1={by} x2={bx} y2={by + (v0 * Math.sin(angleRad) - G * t) * 3.6} stroke="#2563eb" strokeWidth={2} />
                        <line x1={mx} y1={my} x2={bx} y2={by} stroke="#f59e0b" strokeWidth={0.8} opacity={0.35} />
                      </>
                    )}
                  </g>
                  <Etch x={startX - 4} y={muzzleY - 56} size={9.5} color="#475569" weight={800} mono>
                    {`v₀ = ${v0.toFixed(1)} m/s`}
                  </Etch>
                  <Readout
                    x={22}
                    y={22}
                    title={isBangla ? 'প্রাসের ফলাফল' : 'PROJECTILE RESULTS'}
                    rows={[
                      ['R', `${st.projectileRange.toFixed(2)} m`],
                      ['H', `${st.projectileMaxHeight.toFixed(2)} m`],
                      ['T', `${st.projectileFlightTime.toFixed(2)} s`],
                      ['v₀', `${v0.toFixed(1)} m/s`],
                      ['θ', `${st.projectileAngle}°`]
                    ]}
                  />
                </g>
              );
            })()}

          {/* ================= Atwood machine ================= */}
          {activeTab === 'atwood' &&
            (() => {
              const standX = 400;
              const uprightTop = 34;
              const armY = 44;
              const pulleyY = armY + 40;
              const R = 44;
              // heavier mass sinks; the string is inextensible so the other rises
              const sink = Math.max(-150, Math.min(150, atwood.travel * 130));
              const y1 = 168 + sink;
              const y2 = 168 - sink;
              const spin = (sink / R) * (180 / Math.PI);
              const massBlock = (x: number, y: number, grams: number, tint: string) =>
                grams > 0 ? (
                  <g>
                    {/* the collar that clamps the mass to the string, as on a real Atwood rig */}
                    <rect x={x - 8} y={y - 32} width={16} height={11} rx={2.4} fill={tint} stroke="#0b1220" strokeWidth={0.7} />
                    <rect x={x - 8} y={y - 32} width={16} height={3} rx={1.6} fill="#ffffff" opacity={0.25} />
                    <circle cx={x} cy={y - 26.5} r={1.6} fill="#0b1220" opacity={0.5} />
                    <line x1={x} y1={y - 21} x2={x} y2={y - 12} stroke="#8a97a5" strokeWidth={1.4} />
                    <SlottedWeight cx={x} cy={y + 2} r={22} label={`${Math.round(grams)}`} />
                  </g>
                ) : null;
              return (
                <g>
                  <RetortStand x={standX} baseY={BENCH_Y} top={uprightTop} clampY={armY} length={0} direction={1} />
                  {/* horizontal arm carrying the sheave */}
                  <Rod x1={standX} y1={armY} x2={standX} y2={pulleyY - R - 2} w={10} />
                  <rect x={standX - 16} y={armY - 8} width={32} height={16} rx={2.4} fill="url(#ix-iron)" stroke="#111827" strokeWidth={0.7} />
                  <Knob cx={standX + 24} cy={armY} r={5} kind="black" teeth={10} />
                  <Rod x1={standX} y1={armY} x2={standX + 0} y2={armY} w={6} />
                  {/* pulley: turned steel, grooved, on a brass axle */}
                  <circle cx={standX} cy={pulleyY} r={R} fill="url(#ix-steel)" stroke="#475569" strokeWidth={1.1} />
                  <circle cx={standX} cy={pulleyY} r={R * 0.86} fill="none" stroke="#0b1220" strokeOpacity={0.35} strokeWidth={3} />
                  <circle cx={standX} cy={pulleyY} r={R * 0.7} fill="none" stroke="#e2e8f0" strokeOpacity={0.5} strokeWidth={1} />
                  <g style={{ transform: `rotate(${spin}deg)`, transformOrigin: `${standX}px ${pulleyY}px` }}>
                    {[0, 60, 120, 180, 240, 300].map((d) => (
                      <line
                        key={d}
                        x1={standX}
                        y1={pulleyY}
                        x2={standX}
                        y2={pulleyY - R * 0.82}
                        stroke="#cbd5e1"
                        strokeOpacity={0.45}
                        strokeWidth={2}
                        transform={`rotate(${d} ${standX} ${pulleyY})`}
                      />
                    ))}
                  </g>
                  <circle cx={standX} cy={pulleyY} r={11} fill="url(#ix-brass)" stroke="#6d4a0a" strokeWidth={0.7} />
                  <circle cx={standX} cy={pulleyY} r={3.4} fill="#334155" />
                  {/* the string: down both sides, with the masses clamped on */}
                  <path d={`M ${standX - R} ${pulleyY} L ${standX - R} ${y1 - 32}`} stroke="#6b7280" strokeWidth={1.6} fill="none" />
                  <path d={`M ${standX + R} ${pulleyY} L ${standX + R} ${y2 - 32}`} stroke="#6b7280" strokeWidth={1.6} fill="none" />
                  {massBlock(standX - R, y1, st.atwoodM1 * 1000, 'url(#ix-red-plastic)')}
                  {massBlock(standX + R, y2, st.atwoodM2 * 1000, 'url(#ix-blue-plastic)')}
                  {/* graduated height scale on the bench behind */}
                  <rect x={standX + R + 34} y={78} width={26} height={216} rx={3} fill="url(#ix-ivory)" stroke="#8a8272" strokeWidth={0.8} />
                  <rect x={standX + R + 36} y={80} width={6} height={212} fill="#ffffff" opacity={0.5} />
                  <LinearScale x={standX + R + 42} y={80} w={16} h={212} from={0} to={100} major={20} minor={5} vertical unit="cm" size={7} tick={13} />
                  {[y1, y2].map((yy, i) => (
                    <line key={i} x1={standX + (i ? R : -R) + (i ? 12 : -12)} y1={yy - 26} x2={standX + R + 40} y2={yy - 26} stroke="#0ea5e9" strokeWidth={0.9} strokeDasharray="4 4" opacity={0.7} />
                  ))}
                  <Etch x={standX - R} y={y1 + 40} size={11} color="#b91c1c" weight={800} mono>
                    {`m₁ ${st.atwoodM1.toFixed(2)} kg`}
                  </Etch>
                  <Etch x={standX + R} y={y2 + 40} size={11} color="#1d4ed8" weight={800} mono>
                    {`m₂ ${st.atwoodM2.toFixed(2)} kg`}
                  </Etch>
                  <Readout
                    x={22}
                    y={22}
                    title={isBangla ? 'অ্যাটউড সমাধান' : 'ATWOOD SOLUTION'}
                    rows={[
                      ['a', `${atwood.a.toFixed(3)} m/s²`],
                      ['T', `${atwood.tension.toFixed(3)} N`],
                      ['m₁', `${(st.atwoodM1 * 1000).toFixed(0)} g`],
                      ['m₂', `${(st.atwoodM2 * 1000).toFixed(0)} g`],
                      ['Δs', `${Math.abs(atwood.travel * 100).toFixed(1)} cm`]
                    ]}
                  />
                </g>
              );
            })()}
        </svg>

        {/* Parameter controls for the active machine */}
        <div className="flex flex-wrap gap-2 border-t border-[var(--line)] bg-[var(--surface)] p-3">
          {activeTab === 'pendulum' && (
            <>
              <Slider
                label={isBangla ? 'দৈর্ঘ্য L' : 'Length L'}
                value={st.pendulumLength}
                min={0.2}
                max={2}
                step={0.05}
                unit="m"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ pendulumLength: v })}
              />
              <Slider
                label={isBangla ? 'ভর m' : 'Bob mass'}
                value={st.pendulumMass * 1000}
                min={20}
                max={200}
                step={5}
                unit="g"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ pendulumMass: v / 1000 })}
              />
            </>
          )}
          {activeTab === 'spring' && (
            <>
              <Slider
                label={isBangla ? 'স্প্রিং ধ্রুবক k' : 'Spring constant k'}
                value={st.springConstant}
                min={5}
                max={100}
                unit="N/m"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ springConstant: v })}
              />
              <Slider
                label={isBangla ? 'ঝুলানো ভর' : 'Hanging mass'}
                value={st.springMass * 1000}
                min={20}
                max={800}
                step={10}
                unit="g"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ springMass: v / 1000 })}
              />
            </>
          )}
          {activeTab === 'incline' && (
            <>
              <Slider
                label={isBangla ? 'নতি কোণ θ' : 'Incline angle θ'}
                value={st.inclineAngle}
                min={5}
                max={60}
                unit="°"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ inclineAngle: v })}
              />
              <Slider
                label={isBangla ? 'ঘর্ষণ μ' : 'Friction μ'}
                value={st.inclineFrictionCoeff}
                min={0}
                max={1.2}
                step={0.01}
                unit=""
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ inclineFrictionCoeff: v })}
              />
              <Slider
                label={isBangla ? 'ট্রলির ভর' : 'Trolley mass'}
                value={st.inclineMass * 1000}
                min={100}
                max={2000}
                step={50}
                unit="g"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ inclineMass: v / 1000 })}
              />
            </>
          )}
          {activeTab === 'projectile' && (
            <>
              <Slider
                label={isBangla ? 'নিক্ষেপ কোণ θ' : 'Launch angle θ'}
                value={st.projectileAngle}
                min={5}
                max={85}
                unit="°"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ projectileAngle: v })}
              />
              <Slider
                label={isBangla ? 'আদিবেগ v₀' : 'Muzzle velocity v₀'}
                value={st.projectileInitialVelocity}
                min={4}
                max={24}
                step={0.5}
                unit="m/s"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ projectileInitialVelocity: v })}
              />
            </>
          )}
          {activeTab === 'atwood' && (
            <>
              <Slider
                label={isBangla ? 'ভর m₁' : 'Mass m₁'}
                value={st.atwoodM1 * 1000}
                min={50}
                max={1000}
                step={10}
                unit="g"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ atwoodM1: v / 1000 })}
              />
              <Slider
                label={isBangla ? 'ভর m₂' : 'Mass m₂'}
                value={st.atwoodM2 * 1000}
                min={50}
                max={1000}
                step={10}
                unit="g"
                onChange={(v) => usePhysicsStore.getState().updateMechanics({ atwoodM2: v / 1000 })}
              />
            </>
          )}
          <span className="flex items-center gap-1.5 rounded-xl bg-[var(--surface-soft)] px-3 py-2 text-[11px] font-bold text-[var(--muted)]">
            <Target size={12} className="text-physics-600" />
            {isBangla ? 'স্লাইডার সরালে সত্যিকারের সমীকরণ থেকে ফল বদলায়' : 'Move a slider — the result is solved from the real equations'}
          </span>
        </div>
      </div>
    </div>
  );
}
