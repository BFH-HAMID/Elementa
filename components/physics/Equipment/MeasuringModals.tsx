'use client';

import React, { useState } from 'react';
import { X, ZoomIn, Check, RotateCcw } from 'lucide-react';
import { calculateVernierReading, calculateScrewGaugeReading, calculateTravellingMicroscopeReading } from '@/engine/measurement';
import { usePhysicsI18n } from '@/lib/i18n';

interface MeasuringModalProps {
  tool: 'vernier-caliper' | 'screw-gauge' | 'travelling-microscope';
  onClose: () => void;
}

export function VernierCaliperModal({ onClose }: { onClose: () => void }) {
  const { isBangla } = usePhysicsI18n();
  const [openingMm, setOpeningMm] = useState<number>(24.6);
  const [zeroErrorMm, setZeroErrorMm] = useState<number>(0.0);
  const [msdMm] = useState<number>(1.0);
  const [vsdCount, setVsdCount] = useState<number>(10);

  const reading = calculateVernierReading(openingMm, msdMm, vsdCount, zeroErrorMm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 shadow-float border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-physics-600 text-white">
              <ZoomIn size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--ink)]">
                {isBangla ? 'ভার্নিয়ার ক্যালিপার্স স্কেল পরিদর্শন' : 'Vernier Caliper High-Precision Scale'}
              </h3>
              <p className="text-xs font-bold text-[var(--muted)]">
                {isBangla ? 'চোয়ালের ফাঁক পরিবর্তন করুন এবং স্কেলের মিল লক্ষ্য করুন' : 'Adjust jaw opening and inspect main & vernier scale coincidence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual Vernier Scale Canvas / SVG */}
        <div className="my-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-6">
          <div className="overflow-x-auto pb-4">
            <svg viewBox="0 0 700 180" className="w-full min-w-[600px] select-none font-mono">
              {/* Main Scale Body (Top) */}
              <rect x="20" y="20" width="660" height="70" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
              <text x="35" y="45" fill="#475569" fontSize="12" fontWeight="bold">MAIN SCALE (mm)</text>

              {/* Main Scale Markings (0 to 60 mm) */}
              {Array.from({ length: 61 }).map((_, mm) => {
                const x = 50 + mm * 10;
                const isCm = mm % 10 === 0;
                const isMid = mm % 5 === 0;
                const height = isCm ? 30 : isMid ? 20 : 12;
                return (
                  <g key={`ms-${mm}`}>
                    <line x1={x} y1="90" x2={x} y2={90 - height} stroke="#1e293b" strokeWidth={isCm ? 2 : 1.2} />
                    {isCm && (
                      <text x={x} y="55" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">
                        {mm / 10}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Vernier Slide Scale (Bottom, movable) */}
              {/* Offset based on uncorrected opening */}
              {(() => {
                const uncorrected = Math.max(0, openingMm + zeroErrorMm);
                const slideX = 50 + uncorrected * 10;
                return (
                  <g transform={`translate(${slideX}, 90)`}>
                    {/* Slide block */}
                    <rect x="0" y="0" width={vsdCount === 10 ? "110" : "210"} height="65" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
                    <text x="10" y="45" fill="#334155" fontSize="10" fontWeight="bold">VERNIER</text>

                    {/* Vernier scale lines */}
                    {Array.from({ length: vsdCount + 1 }).map((_, v) => {
                      // Vernier division = 0.9 mm * 10 = 9 mm for 10 div
                      const spacing = vsdCount === 10 ? 9.0 : 4.9; // 10 VSD = 9 MSD
                      const vx = v * spacing;
                      const isCoincident = v === reading.vernierOrCircularReading;
                      return (
                        <g key={`vs-${v}`}>
                          <line
                            x1={vx}
                            y1="0"
                            x2={vx}
                            y2={isCoincident ? "24" : "15"}
                            stroke={isCoincident ? "#dc2626" : "#0f172a"}
                            strokeWidth={isCoincident ? 3 : 1.5}
                          />
                          {v % 5 === 0 && (
                            <text x={vx} y="34" textAnchor="middle" fill={isCoincident ? "#dc2626" : "#1e293b"} fontSize="10" fontWeight="bold">
                              {v}
                            </text>
                          )}
                          {isCoincident && (
                            <circle cx={vx} cy="0" r="3.5" fill="#dc2626" />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              {isBangla ? 'লাল দাগ = নিখুঁত ভার্নিয়ার সমপাতন (Coincidence)' : 'Red mark = Exact Vernier Coincidence line'}
            </span>
            <span className="font-mono text-xs font-bold text-[var(--muted)]">
              {isBangla ? `ভার্নিয়ার ধ্রুবক (LC) = ${reading.leastCount} মিমি` : `Least Count (LC) = ${reading.leastCount} mm`}
            </span>
          </div>
        </div>

        {/* Interactive Sliders & Inputs */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'চোয়ালের ফাঁক / বস্তুর ব্যাস (mm)' : 'Jaw Opening / Diameter (mm)'}</span>
                <span className="font-mono text-physics-600 font-black">{openingMm.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={openingMm}
                onChange={(e) => setOpeningMm(parseFloat(e.target.value))}
                className="mt-2 w-full accent-physics-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'শূন্য ত্রুটি (Zero Error mm)' : 'Zero Error (mm)'}</span>
                <span className="font-mono text-physics-600 font-black">{zeroErrorMm >= 0 ? `+${zeroErrorMm.toFixed(2)}` : zeroErrorMm.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="0.5"
                step="0.05"
                value={zeroErrorMm}
                onChange={(e) => setZeroErrorMm(parseFloat(e.target.value))}
                className="mt-2 w-full accent-physics-600"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVsdCount(vsdCount === 10 ? 50 : 10)}
                className="btn-ghost rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold"
              >
                {isBangla ? `স্কেল মোড: ${vsdCount} ভাগ (LC=${1/vsdCount}mm)` : `Scale Mode: ${vsdCount} div (LC=${1/vsdCount}mm)`}
              </button>
              <button
                type="button"
                onClick={() => { setOpeningMm(24.6); setZeroErrorMm(0); }}
                className="btn-ghost flex items-center gap-1 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-bold"
              >
                <RotateCcw size={14} />
                {isBangla ? 'রিসেট' : 'Reset'}
              </button>
            </div>
          </div>

          {/* Reading Breakdown Box */}
          <div className="rounded-2xl border border-physics-200 bg-physics-50/50 p-4 dark:border-physics-900/60 dark:bg-physics-900/20">
            <h4 className="text-xs font-black uppercase tracking-wider text-physics-700 dark:text-physics-300">
              {isBangla ? 'পরিমাপ পাঠ বিশ্লেষণ' : 'Reading Calculation Breakdown'}
            </h4>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'প্রধান স্কেল পাঠ (MSR):' : 'Main Scale (MSR):'}</span>
                <span className="font-mono font-black">{reading.mainScaleReading.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'ভার্নিয়ার সমপাতন (VSR):' : 'Vernier Coincidence (VSR):'}</span>
                <span className="font-mono font-black text-red-600 dark:text-red-400">{reading.vernierOrCircularReading} div</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'ভার্নিয়ার ধ্রুবক (LC):' : 'Least Count (LC):'}</span>
                <span className="font-mono font-black">{reading.leastCount.toFixed(2)} mm</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'শূন্য ত্রুটি (ZE):' : 'Zero Error (ZE):'}</span>
                <span className="font-mono font-black">{reading.zeroError.toFixed(2)} mm</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-black text-physics-700 dark:text-physics-200">
                  {isBangla ? 'সর্বমোট সংশোধিত পাঠ:' : 'Total Corrected:'}
                </span>
                <span className="font-mono text-xl font-black text-physics-600 dark:text-physics-300">
                  {reading.correctedReading.toFixed(2)} mm
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-physics-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-physics-700"
          >
            <Check size={16} />
            {isBangla ? 'সম্পন্ন' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ScrewGaugeModal({ onClose }: { onClose: () => void }) {
  const { isBangla } = usePhysicsI18n();
  const [gapMm, setGapMm] = useState<number>(3.74);
  const [zeroErrorMm, setZeroErrorMm] = useState<number>(0.0);
  const [pitchMm] = useState<number>(1.0);
  const [circularDivisions] = useState<number>(100);

  const reading = calculateScrewGaugeReading(gapMm, pitchMm, circularDivisions, zeroErrorMm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 shadow-float border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-physics-600 text-white">
              <ZoomIn size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[var(--ink)]">
                {isBangla ? 'স্ক্রু গজ (মাইক্রোমিটার) স্কেল জুম' : 'Micrometer Screw Gauge Scale'}
              </h3>
              <p className="text-xs font-bold text-[var(--muted)]">
                {isBangla ? 'বৃত্তাকার স্কেল ও রৈখিক স্কেলের সমপাতন পর্যবেক্ষণ করুন' : 'Inspect pitch scale reading and circular scale division'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-lg p-2 text-[var(--muted)] hover:text-[var(--ink)]">
            <X size={20} />
          </button>
        </div>

        {/* Visual SVG Screw Gauge */}
        <div className="my-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-6">
          <div className="overflow-x-auto pb-4">
            <svg viewBox="0 0 650 160" className="w-full min-w-[550px] select-none font-mono">
              {/* Sleeve / Linear Pitch Scale */}
              <rect x="50" y="40" width="260" height="80" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" rx="4" />
              {/* Index Reference Line */}
              <line x1="50" y1="80" x2="310" y2="80" stroke="#0f172a" strokeWidth="2.5" />

              {/* Pitch scale markings (0 to 10 mm) */}
              {Array.from({ length: 11 }).map((_, mm) => {
                const x = 70 + mm * 20;
                return (
                  <g key={`psr-${mm}`}>
                    <line x1={x} y1="80" x2={x} y2="60" stroke="#0f172a" strokeWidth="2" />
                    <text x={x} y="52" textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="bold">{mm}</text>
                    {/* Half-mm markings below */}
                    {mm < 10 && (
                      <line x1={x + 10} y1="80" x2={x + 10} y2="95" stroke="#475569" strokeWidth="1.5" />
                    )}
                  </g>
                );
              })}

              {/* Rotating Thimble / Circular Scale */}
              {(() => {
                const uncorrected = Math.max(0, gapMm + zeroErrorMm);
                const thimbleX = 70 + uncorrected * 20;
                return (
                  <g transform={`translate(${thimbleX}, 20)`}>
                    {/* Thimble Bevel Body */}
                    <polygon points="0,20 30,0 240,0 240,120 30,120 0,100" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                    {/* Circular Scale Divisions around index line y=60 */}
                    {Array.from({ length: 21 }).map((_, idx) => {
                      const divNum = (reading.vernierOrCircularReading - 10 + idx + 100) % 100;
                      const y = 60 + (idx - 10) * 5;
                      const isIndex = idx === 10;
                      return (
                        <g key={`csr-${idx}`}>
                          <line
                            x1="0"
                            y1={y}
                            x2={isIndex ? "25" : "15"}
                            stroke={isIndex ? "#dc2626" : "#0f172a"}
                            strokeWidth={isIndex ? 2.5 : 1.2}
                          />
                          {divNum % 5 === 0 && (
                            <text x="32" y={y + 3} fill={isIndex ? "#dc2626" : "#0f172a"} fontSize="10" fontWeight="bold">
                              {divNum}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
              {isBangla ? 'রৈখিক অক্ষের সাথে মিলিত বৃত্তাকার ভাগ (CSR)' : 'Circular division aligned with reference index line'}
            </span>
            <span className="font-mono text-[var(--muted)]">
              {isBangla ? `লঘিষ্ঠ গণন (LC) = ${reading.leastCount} মিমি` : `Least Count (LC) = ${reading.leastCount} mm`}
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'তারের ব্যাস / ফাঁক (Gap mm)' : 'Spindle Gap / Wire Diameter (mm)'}</span>
                <span className="font-mono text-physics-600 font-black">{gapMm.toFixed(2)} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.01"
                value={gapMm}
                onChange={(e) => setGapMm(parseFloat(e.target.value))}
                className="mt-2 w-full accent-physics-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold">
                <span>{isBangla ? 'শূন্য ত্রুটি (Zero Error mm)' : 'Zero Error (mm)'}</span>
                <span className="font-mono text-physics-600 font-black">{zeroErrorMm >= 0 ? `+${zeroErrorMm.toFixed(3)}` : zeroErrorMm.toFixed(3)} mm</span>
              </div>
              <input
                type="range"
                min="-0.08"
                max="0.08"
                step="0.005"
                value={zeroErrorMm}
                onChange={(e) => setZeroErrorMm(parseFloat(e.target.value))}
                className="mt-2 w-full accent-physics-600"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-physics-200 bg-physics-50/50 p-4 dark:border-physics-900/60 dark:bg-physics-900/20">
            <h4 className="text-xs font-black uppercase tracking-wider text-physics-700 dark:text-physics-300">
              {isBangla ? 'পরিমাপ পাঠ বিশ্লেষণ' : 'Reading Calculation'}
            </h4>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'রৈখিক স্কেল পাঠ (PSR):' : 'Pitch Scale (PSR):'}</span>
                <span className="font-mono font-black">{reading.mainScaleReading.toFixed(2)} mm</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'বৃত্তাকার স্কেল ভাগ (CSR):' : 'Circular Division (CSR):'}</span>
                <span className="font-mono font-black text-red-600 dark:text-red-400">{reading.vernierOrCircularReading} div</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'লঘিষ্ঠ গণন (LC):' : 'Least Count (LC):'}</span>
                <span className="font-mono font-black">{reading.leastCount.toFixed(3)} mm</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-1.5">
                <span className="text-[var(--muted)]">{isBangla ? 'শূন্য ত্রুটি (ZE):' : 'Zero Error (ZE):'}</span>
                <span className="font-mono font-black">{reading.zeroError.toFixed(3)} mm</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-black text-physics-700 dark:text-physics-200">
                  {isBangla ? 'সর্বমোট সংশোধিত পাঠ:' : 'Total Reading:'}
                </span>
                <span className="font-mono text-xl font-black text-physics-600 dark:text-physics-300">
                  {reading.correctedReading.toFixed(3)} mm
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-physics-600 px-5 py-2.5 text-sm font-black text-white shadow-sm hover:bg-physics-700"
          >
            <Check size={16} />
            {isBangla ? 'সম্পন্ন' : 'Done & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MeasuringModal({ tool, onClose }: MeasuringModalProps) {
  if (tool === 'vernier-caliper') return <VernierCaliperModal onClose={onClose} />;
  if (tool === 'screw-gauge') return <ScrewGaugeModal onClose={onClose} />;
  return null;
}
