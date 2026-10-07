'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { Play, Pause, RotateCcw, FastForward, Activity, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MechanicsStage() {
  const { isBangla } = usePhysicsI18n();
  const [activeTab, setActiveTab] = useState<'pendulum' | 'spring' | 'incline' | 'projectile' | 'atwood'>('pendulum');

  const mechanicsState = usePhysicsStore((s) => s.mechanicsState);
  const stepMechanics = usePhysicsStore((s) => s.stepMechanics);
  const toggleMechanicsRunning = usePhysicsStore((s) => s.toggleMechanicsRunning);
  const resetMechanics = usePhysicsStore((s) => s.resetMechanics);

  // Animation Loop
  const requestRef = useRef<number>();
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

  return (
    <div className="space-y-6">
      {/* Simulation Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pendulum')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'pendulum' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Activity size={15} />
            {isBangla ? 'সরল দোলক' : 'Simple Pendulum'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spring')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'spring' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Compass size={15} />
            {isBangla ? 'স্প্রিং ও হুকের সূত্র' : 'Spring & Hooke’s Law'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('incline')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'incline' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <FastForward size={15} />
            {isBangla ? 'নততল ও ঘর্ষণ' : 'Inclined Plane'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('projectile')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'projectile' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Activity size={15} />
            {isBangla ? 'প্রাসের গতি' : 'Projectile Motion'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('atwood')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              activeTab === 'atwood' ? 'bg-physics-600 text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Compass size={15} />
            {isBangla ? 'অ্যাটউড মেশিন' : 'Atwood Machine'}
          </button>
        </div>

        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMechanicsRunning}
            className="flex items-center gap-1.5 rounded-xl bg-physics-600 px-3.5 py-2 text-xs font-black text-white shadow-sm hover:bg-physics-700"
          >
            {mechanicsState.running ? <Pause size={14} /> : <Play size={14} />}
            {mechanicsState.running ? (isBangla ? 'থামান' : 'Pause') : (isBangla ? 'চালু করুন' : 'Play')}
          </button>
          <button
            type="button"
            onClick={resetMechanics}
            className="btn-ghost flex items-center gap-1 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <RotateCcw size={14} />
            {isBangla ? 'রিসেট' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Main Simulation Stage SVG Canvas */}
      <div className="relative rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card overflow-hidden">
        <svg viewBox="0 0 800 360" className="w-full select-none font-mono">
          <defs>
            <pattern id="mech-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
            </pattern>
          </defs>
          <rect width="800" height="360" fill="url(#mech-grid)" opacity="0.6" />

          {/* --- Mode: Simple Pendulum --- */}
          {activeTab === 'pendulum' && (() => {
            const pivotX = 400;
            const pivotY = 50;
            const lengthPx = mechanicsState.pendulumLength * 160;
            const bobX = pivotX + lengthPx * Math.sin(mechanicsState.pendulumAngle);
            const bobY = pivotY + lengthPx * Math.cos(mechanicsState.pendulumAngle);

            return (
              <g>
                {/* Rigid Stand Base */}
                <rect x="250" y="320" width="300" height="15" rx="3" fill="#334155" />
                <rect x="390" y="30" width="20" height="290" fill="#475569" />
                <rect x="360" y="40" width="80" height="15" rx="3" fill="#334155" />

                {/* Pivot point */}
                <circle cx={pivotX} cy={pivotY} r="5" fill="#ef4444" />

                {/* Equilibrium Reference Line */}
                <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + lengthPx + 20} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />

                {/* Inextensible Pendulum String */}
                <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#0f172a" strokeWidth="2.5" />

                {/* Metallic Spherical Bob */}
                <circle cx={bobX} cy={bobY} r="18" fill="url(#rainbow-grad)" stroke="#1e293b" strokeWidth="2.5" className="fill-physics-600" />
                <circle cx={bobX - 4} cy={bobY - 4} r="4" fill="#ffffff" opacity="0.6" />

                {/* Real-time Angle & Period Readout */}
                <g transform="translate(40, 60)">
                  <rect x="0" y="0" width="180" height="110" rx="12" fill="#0f172a" opacity="0.85" />
                  <text x="15" y="28" fill="#38bdf8" fontSize="12" fontWeight="bold">PENDULUM STATS</text>
                  <text x="15" y="52" fill="#ffffff" fontSize="11">Period T = {mechanicsState.pendulumPeriod.toFixed(3)} s</text>
                  <text x="15" y="72" fill="#ffffff" fontSize="11">Length L = {mechanicsState.pendulumLength.toFixed(2)} m</text>
                  <text x="15" y="92" fill="#34d399" fontSize="11">g = {mechanicsState.gravity.toFixed(2)} m/s²</text>
                </g>
              </g>
            );
          })()}

          {/* --- Mode: Spring-Mass Hooke's Law --- */}
          {activeTab === 'spring' && (() => {
            const pivotX = 400;
            const pivotY = 50;
            const baseLen = 100;
            const extension = mechanicsState.springDisplacement * 600;
            const springLen = Math.max(40, baseLen + extension);
            const massY = pivotY + springLen;

            return (
              <g>
                <rect x="340" y="40" width="120" height="15" rx="3" fill="#334155" />
                {/* Spiral Coils (Zigzag path) */}
                <path
                  d={`M ${pivotX} ${pivotY} 
                      L ${pivotX - 15} ${pivotY + springLen * 0.15} 
                      L ${pivotX + 15} ${pivotY + springLen * 0.3} 
                      L ${pivotX - 15} ${pivotY + springLen * 0.45} 
                      L ${pivotX + 15} ${pivotY + springLen * 0.6} 
                      L ${pivotX - 15} ${pivotY + springLen * 0.75} 
                      L ${pivotX + 15} ${pivotY + springLen * 0.9} 
                      L ${pivotX} ${massY}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hanging Slotted Brass Mass */}
                <rect x={pivotX - 25} y={massY} width="50" height="35" rx="4" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
                <text x={pivotX} y={massY + 22} fill="#78350f" fontSize="11" textAnchor="middle" fontWeight="bold">
                  {(mechanicsState.springMass * 1000).toFixed(0)}g
                </text>

                {/* Stats Readout */}
                <g transform="translate(40, 60)">
                  <rect x="0" y="0" width="180" height="110" rx="12" fill="#0f172a" opacity="0.85" />
                  <text x="15" y="28" fill="#38bdf8" fontSize="12" fontWeight="bold">SPRING OSCILLATOR</text>
                  <text x="15" y="52" fill="#ffffff" fontSize="11">Period T = {mechanicsState.springPeriod.toFixed(3)} s</text>
                  <text x="15" y="72" fill="#ffffff" fontSize="11">Constant k = {mechanicsState.springConstant} N/m</text>
                  <text x="15" y="92" fill="#34d399" fontSize="11">F = k·x Hooke&apos;s Law</text>
                </g>
              </g>
            );
          })()}

          {/* --- Mode: Projectile Motion --- */}
          {activeTab === 'projectile' && (() => {
            const startX = 80;
            const groundY = 300;
            const angleRad = (mechanicsState.projectileAngle * Math.PI) / 180;
            const barrelLen = 50;
            const endX = startX + barrelLen * Math.cos(angleRad);
            const endY = groundY - barrelLen * Math.sin(angleRad);

            // Scale trajectory
            const trajPoints = (mechanicsState.projectileTrajectory || []).map((p) => {
              const px = startX + (p.x / (mechanicsState.projectileRange || 1)) * 620;
              const py = groundY - (p.y / (mechanicsState.projectileMaxHeight || 1)) * 180;
              return `${px},${py}`;
            }).join(' ');

            return (
              <g>
                {/* Ground plane */}
                <line x1="40" y1={groundY} x2="760" y2={groundY} stroke="#334155" strokeWidth="4" />

                {/* Parabolic Trajectory Trail */}
                {trajPoints && (
                  <polyline points={trajPoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="6 4" />
                )}

                {/* Cannon Base & Barrel */}
                <line x1={startX} y1={groundY} x2={endX} y2={endY} stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
                <circle cx={startX} cy={groundY} r="16" fill="#334155" />

                {/* Stats */}
                <g transform="translate(560, 40)">
                  <rect x="0" y="0" width="200" height="120" rx="12" fill="#0f172a" opacity="0.85" />
                  <text x="15" y="26" fill="#38bdf8" fontSize="12" fontWeight="bold">PROJECTILE RESULTS</text>
                  <text x="15" y="48" fill="#ffffff" fontSize="11">Range R = {mechanicsState.projectileRange.toFixed(2)} m</text>
                  <text x="15" y="68" fill="#ffffff" fontSize="11">Max Height H = {mechanicsState.projectileMaxHeight.toFixed(2)} m</text>
                  <text x="15" y="88" fill="#ffffff" fontSize="11">Flight Time = {mechanicsState.projectileFlightTime.toFixed(2)} s</text>
                  <text x="15" y="108" fill="#34d399" fontSize="10">Max Range at 45°</text>
                </g>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
