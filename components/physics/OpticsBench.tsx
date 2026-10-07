'use client';

import React, { useState } from 'react';
import { usePhysicsI18n } from '@/lib/i18n';
import {
  calculateLensImage,
  calculateMirrorImage,
  calculatePrismRefraction,
  calculateDoubleSlitPattern,
  calculateScreenBlur
} from '@/engine/opticsEngine';
import { Sun, Sparkles, Layers, Sliders, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OpticsBench() {
  const { isBangla } = usePhysicsI18n();

  // Bench Component Positions in cm (0 to 150 cm rail)
  const [opticsMode, setOpticsMode] = useState<'lens' | 'mirror' | 'prism' | 'interference'>('lens');
  const [sourcePosCm, setSourcePosCm] = useState<number>(10);
  const [lensPosCm, setLensPosCm] = useState<number>(50);
  const [focalLengthCm, setFocalLengthCm] = useState<number>(15);
  const [screenPosCm, setScreenPosCm] = useState<number>(85);
  const [prismAngleDeg, setPrismAngleDeg] = useState<number>(60);
  const [prismIncidenceDeg, setPrismIncidenceDeg] = useState<number>(48.6);
  const [prismMu, setPrismMu] = useState<number>(1.517);
  const [slitSeparationMm, setSlitSeparationMm] = useState<number>(0.25);
  const [laserWavelengthNm, setLaserWavelengthNm] = useState<number>(632.8);

  // Calculations
  const objectDistCm = Math.max(1, lensPosCm - sourcePosCm);
  const lensImage = calculateLensImage(objectDistCm, focalLengthCm, 2.5, lensPosCm);
  const mirrorImage = calculateMirrorImage(objectDistCm, focalLengthCm, 2.5, lensPosCm);
  const prismData = calculatePrismRefraction(prismIncidenceDeg, prismAngleDeg, prismMu);
  const doubleSlitData = calculateDoubleSlitPattern(laserWavelengthNm, slitSeparationMm, 1.0);

  const blurRadius = calculateScreenBlur(screenPosCm, lensImage.x, 40);

  // Scale: 1 cm on rail = 5.5 pixels in SVG
  const pxPerCm = 5.5;
  const railStartX = 40;
  const railY = 160;

  return (
    <div className="space-y-6">
      {/* Top Selector Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpticsMode('lens')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              opticsMode === 'lens'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Sun size={15} />
            {isBangla ? 'উত্তল ও অবতল লেন্স' : 'Lenses (Convex / Concave)'}
          </button>
          <button
            type="button"
            onClick={() => setOpticsMode('mirror')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              opticsMode === 'mirror'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Sparkles size={15} />
            {isBangla ? 'গোলীয় দর্পণ / আয়না' : 'Spherical Mirrors'}
          </button>
          <button
            type="button"
            onClick={() => setOpticsMode('prism')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              opticsMode === 'prism'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Layers size={15} />
            {isBangla ? 'প্রিজম ও বিচ্ছুরণ' : 'Prism & Dispersion'}
          </button>
          <button
            type="button"
            onClick={() => setOpticsMode('interference')}
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition',
              opticsMode === 'interference'
                ? 'bg-physics-600 text-white shadow-sm'
                : 'text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            )}
          >
            <Maximize2 size={15} />
            {isBangla ? 'ইয়ং-এর দ্বি-চির ব্যতিচার' : 'Young’s Double Slit'}
          </button>
        </div>

        {/* Live Optical Readout Tag */}
        {opticsMode === 'lens' && (
          <div className="flex items-center gap-3 font-mono text-xs font-bold text-physics-700 dark:text-physics-300">
            <span>u = {objectDistCm.toFixed(1)} cm</span>
            <span>v = {lensImage.exists && isFinite(lensImage.x) ? (lensImage.x - lensPosCm).toFixed(1) : '∞'} cm</span>
            <span>m = {lensImage.magnification.toFixed(2)}x</span>
            <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-black', lensImage.isReal ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
              {lensImage.isReal ? (isBangla ? 'বাস্তব ও উল্টো' : 'Real & Inverted') : (isBangla ? 'অবাস্তব ও সোজা' : 'Virtual & Erect')}
            </span>
          </div>
        )}
      </div>

      {/* Main Optical Bench Rail SVG Canvas */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-card">
        <div className="overflow-x-auto pb-4">
          <svg viewBox="0 0 920 320" className="w-full min-w-[800px] select-none font-mono">
            {/* Background Grid */}
            <defs>
              <pattern id="optics-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
              </pattern>
              <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="75%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <rect width="920" height="320" fill="url(#optics-grid)" opacity="0.6" />

            {/* Principal Optical Axis */}
            <line x1="20" y1={railY} x2="900" y2={railY} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Optical Bench Metallic Rail Body */}
            <rect x="30" y={railY + 80} width="860" height="30" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
            <text x="45" y={railY + 100} fill="#94a3b8" fontSize="10" fontWeight="bold">OPTICAL BENCH RAIL (0 - 150 cm)</text>

            {/* Millimeter / Centimeter Markings */}
            {Array.from({ length: 16 }).map((_, i) => {
              const cm = i * 10;
              const x = railStartX + cm * pxPerCm;
              return (
                <g key={`cm-${cm}`}>
                  <line x1={x} y1={railY + 80} x2={x} y2={railY + 95} stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x={x} y={railY + 103} fill="#cbd5e1" fontSize="9" textAnchor="middle" fontWeight="bold">
                    {cm}
                  </text>
                </g>
              );
            })}

            {/* --- Mode: Lens Ray Tracing --- */}
            {opticsMode === 'lens' && (() => {
              const srcX = railStartX + sourcePosCm * pxPerCm;
              const lX = railStartX + lensPosCm * pxPerCm;
              const fPx = Math.abs(focalLengthCm) * pxPerCm;
              const scrX = railStartX + screenPosCm * pxPerCm;
              const objH = 45; // pixel height

              const imgX = railStartX + lensImage.x * pxPerCm;
              const imgH = objH * Math.abs(lensImage.magnification);

              return (
                <g>
                  {/* Focal Points F1 and F2 markers */}
                  <circle cx={lX - fPx} cy={railY} r="3" fill="#ef4444" />
                  <text x={lX - fPx} y={railY + 16} fill="#ef4444" fontSize="10" textAnchor="middle" fontWeight="bold">F1</text>
                  <circle cx={lX + fPx} cy={railY} r="3" fill="#ef4444" />
                  <text x={lX + fPx} y={railY + 16} fill="#ef4444" fontSize="10" textAnchor="middle" fontWeight="bold">F2</text>

                  {/* Object Arrow Pin */}
                  <line x1={srcX} y1={railY} x2={srcX} y2={railY - objH} stroke="#2563eb" strokeWidth="3" />
                  <polygon points={`${srcX},${railY - objH - 6} ${srcX - 5},${railY - objH} ${srcX + 5},${railY - objH}`} fill="#2563eb" />
                  <text x={srcX} y={railY - objH - 10} fill="#2563eb" fontSize="10" textAnchor="middle" fontWeight="bold">Object</text>

                  {/* Lens Glass Component */}
                  {focalLengthCm > 0 ? (
                    // Convex lens shape
                    <path
                      d={`M ${lX} ${railY - 60} Q ${lX + 16} ${railY} ${lX} ${railY + 60} Q ${lX - 16} ${railY} ${lX} ${railY - 60}`}
                      fill="#38bdf8"
                      fillOpacity="0.4"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                  ) : (
                    // Concave lens shape
                    <path
                      d={`M ${lX - 10} ${railY - 60} Q ${lX} ${railY} ${lX - 10} ${railY + 60} L ${lX + 10} ${railY + 60} Q ${lX} ${railY} ${lX + 10} ${railY - 60} Z`}
                      fill="#38bdf8"
                      fillOpacity="0.4"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                  )}

                  {/* Principal Rays */}
                  {/* Ray 1: Parallel to axis, then through F2 */}
                  <line x1={srcX} y1={railY - objH} x2={lX} y2={railY - objH} stroke="#f59e0b" strokeWidth="2" />
                  {lensImage.isReal ? (
                    <line x1={lX} y1={railY - objH} x2={imgX} y2={railY + imgH} stroke="#f59e0b" strokeWidth="2" />
                  ) : (
                    <line x1={lX} y1={railY - objH} x2={lX + 250} y2={railY - objH + (250 / fPx) * objH} stroke="#f59e0b" strokeWidth="2" />
                  )}

                  {/* Ray 2: Straight through optical center */}
                  {lensImage.isReal ? (
                    <line x1={srcX} y1={railY - objH} x2={imgX} y2={railY + imgH} stroke="#10b981" strokeWidth="2" />
                  ) : (
                    <line x1={srcX} y1={railY - objH} x2={lX + 250} y2={railY + (250 / objectDistCm) * objH} stroke="#10b981" strokeWidth="2" />
                  )}

                  {/* Real Formed Image Arrow */}
                  {lensImage.isReal && isFinite(imgX) && (
                    <g>
                      <line x1={imgX} y1={railY} x2={imgX} y2={railY + imgH} stroke="#dc2626" strokeWidth="3" strokeDasharray="3 3" />
                      <polygon points={`${imgX},${railY + imgH + 6} ${imgX - 5},${railY + imgH} ${imgX + 5},${railY + imgH}`} fill="#dc2626" />
                      <text x={imgX} y={railY + imgH + 18} fill="#dc2626" fontSize="10" textAnchor="middle" fontWeight="bold">Image (v)</text>
                    </g>
                  )}

                  {/* Movable Projection Screen Carrier */}
                  <rect x={scrX - 3} y={railY - 70} width="6" height="140" rx="2" fill="#475569" stroke="#0f172a" strokeWidth="1.5" />
                  <rect x={scrX - 18} y={railY + 70} width="36" height="10" fill="#64748b" rx="2" />
                  <text x={scrX} y={railY - 76} fill="#475569" fontSize="10" textAnchor="middle" fontWeight="bold">Screen</text>
                </g>
              );
            })()}

            {/* --- Mode: Prism & Dispersion --- */}
            {opticsMode === 'prism' && (() => {
              const pX = railStartX + 60 * pxPerCm;
              const pY = railY;

              return (
                <g>
                  {/* Triangular Prism Glass */}
                  <polygon
                    points={`${pX},${pY - 70} ${pX - 60},${pY + 50} ${pX + 60},${pY + 50}`}
                    fill="#38bdf8"
                    fillOpacity="0.3"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                  />
                  {/* Incident White Ray */}
                  <line x1={pX - 200} y1={pY + 20} x2={pX - 30} y2={pY - 10} stroke="#f8fafc" strokeWidth="4" />
                  <line x1={pX - 200} y1={pY + 20} x2={pX - 30} y2={pY - 10} stroke="#64748b" strokeWidth="1.5" />

                  {/* Dispersed Rainbow Beam */}
                  <path
                    d={`M ${pX + 25} ${pY - 15} L ${pX + 220} ${pY + 30} L ${pX + 220} ${pY + 70} L ${pX + 30} ${pY - 5} Z`}
                    fill="url(#rainbow-grad)"
                    opacity="0.8"
                  />
                  <text x={pX + 230} y={pY + 35} fill="#ef4444" fontSize="10" fontWeight="bold">Red (least dev)</text>
                  <text x={pX + 230} y={pY + 75} fill="#8b5cf6" fontSize="10" fontWeight="bold">Violet (most dev)</text>
                </g>
              );
            })()}

            {/* --- Mode: Young's Double Slit --- */}
            {opticsMode === 'interference' && (() => {
              const slitX = railStartX + 40 * pxPerCm;
              const scrX = railStartX + 120 * pxPerCm;

              return (
                <g>
                  {/* Double Slit Barrier */}
                  <rect x={slitX - 2} y={railY - 70} width="4" height="60" fill="#1e293b" />
                  <rect x={slitX - 2} y={railY + 10} width="4" height="60" fill="#1e293b" />
                  <text x={slitX} y={railY - 76} fill="#0f172a" fontSize="10" textAnchor="middle" fontWeight="bold">Double Slit (d)</text>

                  {/* Monochromatic Laser Beam */}
                  <line x1="40" y1={railY} x2={slitX} y2={railY} stroke="#dc2626" strokeWidth="3" />

                  {/* Fringes on Screen */}
                  <rect x={scrX} y={railY - 70} width="20" height="140" fill="#0f172a" rx="2" />
                  {Array.from({ length: 9 }).map((_, idx) => {
                    const y = railY - 55 + idx * 14;
                    return (
                      <line key={`fr-${idx}`} x1={scrX + 2} y1={y} x2={scrX + 18} y2={y} stroke="#ef4444" strokeWidth="5" opacity="0.9" />
                    );
                  })}
                  <text x={scrX + 30} y={railY} fill="#dc2626" fontSize="10" fontWeight="bold">
                    Fringe Width β = {doubleSlitData.fringeWidthMm} mm
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Real-time Focus & Sharpness Indicator on Screen */}
        {opticsMode === 'lens' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted)]">{isBangla ? 'পর্দায় প্রতিবিম্ব স্পষ্টতা:' : 'Screen Image Sharpness:'}</span>
              <span className={cn(
                'rounded-lg px-2.5 py-1 font-mono text-xs font-black',
                blurRadius < 2
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}>
                {blurRadius < 2 ? (isBangla ? '✓ সম্পূর্ণ তীক্ষ্ণ ও ফোকাসড' : '✓ Sharp & Focused') : (isBangla ? `অস্পষ্ট (Blur: ${blurRadius.toFixed(1)} mm)` : `Blur: ${blurRadius.toFixed(1)} mm`)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setScreenPosCm(lensImage.x)}
              className="btn-ghost rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-bold text-physics-600"
            >
              {isBangla ? 'পর্দা সরাসরি ফোকাসে আনুন' : 'Snap Screen to Focal Image'}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Controls & Parameters */}
      <div className="grid gap-5 sm:grid-cols-3">
        {opticsMode === 'lens' && (
          <>
            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'বস্তুর অবস্থান (u)' : 'Object Position (cm)'}</span>
                <span className="font-mono text-physics-600 font-black">{sourcePosCm} cm</span>
              </div>
              <input
                type="range"
                min="0"
                max={lensPosCm - 5}
                value={sourcePosCm}
                onChange={(e) => setSourcePosCm(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'লেন্সের ফোকাস দূরত্ব (f)' : 'Focal Length f (cm)'}</span>
                <span className="font-mono text-physics-600 font-black">{focalLengthCm} cm</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={focalLengthCm}
                onChange={(e) => setFocalLengthCm(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'পর্দার অবস্থান (Screen)' : 'Screen Position (cm)'}</span>
                <span className="font-mono text-physics-600 font-black">{screenPosCm} cm</span>
              </div>
              <input
                type="range"
                min={lensPosCm + 5}
                max="145"
                value={screenPosCm}
                onChange={(e) => setScreenPosCm(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>
          </>
        )}

        {opticsMode === 'prism' && (
          <>
            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'আপতন কোণ (i)' : 'Angle of Incidence i (°)'}</span>
                <span className="font-mono text-physics-600 font-black">{prismIncidenceDeg}°</span>
              </div>
              <input
                type="range"
                min="30"
                max="75"
                step="0.5"
                value={prismIncidenceDeg}
                onChange={(e) => setPrismIncidenceDeg(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'প্রতিসরাঙ্ক (μ)' : 'Refractive Index (μ)'}</span>
                <span className="font-mono text-physics-600 font-black">{prismMu}</span>
              </div>
              <input
                type="range"
                min="1.4"
                max="1.8"
                step="0.005"
                value={prismMu}
                onChange={(e) => setPrismMu(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-[var(--muted)]">{isBangla ? 'ন্যূনতম বিচ্যুতি কোণ (δm):' : 'Min Deviation (δm):'}</span>
              <p className="font-mono text-lg font-black text-physics-600">{prismData.minimumDeviationDeg.toFixed(2)}°</p>
            </div>
          </>
        )}

        {opticsMode === 'interference' && (
          <>
            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'চির ব্যবধান (d mm)' : 'Slit Separation d (mm)'}</span>
                <span className="font-mono text-physics-600 font-black">{slitSeparationMm} mm</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.02"
                value={slitSeparationMm}
                onChange={(e) => setSlitSeparationMm(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'লেজার তরঙ্গদৈর্ঘ্য (λ)' : 'Wavelength λ (nm)'}</span>
                <span className="font-mono text-physics-600 font-black">{laserWavelengthNm} nm</span>
              </div>
              <input
                type="range"
                min="400"
                max="700"
                step="10"
                value={laserWavelengthNm}
                onChange={(e) => setLaserWavelengthNm(parseFloat(e.target.value))}
                className="w-full accent-physics-600"
              />
            </div>

            <div className="card p-4 space-y-1">
              <span className="text-xs font-bold text-[var(--muted)]">{isBangla ? 'হিসাবকৃত পট্টি প্রস্থ (β):' : 'Fringe Width (β):'}</span>
              <p className="font-mono text-lg font-black text-physics-600">{doubleSlitData.fringeWidthMm} mm</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
