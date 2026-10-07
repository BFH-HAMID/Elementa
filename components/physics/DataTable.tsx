'use client';

import React from 'react';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePhysicsI18n } from '@/lib/i18n';
import { physicsExperimentsBySlug } from '@/lib/physicsData';
import { calculateStatistics } from '@/engine/measurement';
import { Download, Plus, Trash2, Camera, BarChart2 } from 'lucide-react';

export function DataTable() {
  const { isBangla } = usePhysicsI18n();
  const dataRows = usePhysicsStore((s) => s.dataRows);
  const activeExperimentSlug = usePhysicsStore((s) => s.activeExperimentSlug);
  const recordCurrentDataRow = usePhysicsStore((s) => s.recordCurrentDataRow);
  const removeDataRow = usePhysicsStore((s) => s.removeDataRow);
  const clearDataRows = usePhysicsStore((s) => s.clearDataRows);
  const noiseEnabled = usePhysicsStore((s) => s.noiseEnabled);
  const setNoiseEnabled = usePhysicsStore((s) => s.setNoiseEnabled);

  const exp = activeExperimentSlug ? physicsExperimentsBySlug.get(activeExperimentSlug) : null;
  const columns = exp?.dataColumns || [
    { key: 'obsNo', label_en: 'Obs #', label_bn: 'পর্যবেক্ষণ নং' },
    { key: 'voltage', label_en: 'Voltage (V)', label_bn: 'ভোল্টেজ (V)', unit: 'V' },
    { key: 'current', label_en: 'Current (I)', label_bn: 'কারেন্ট (I)', unit: 'A' },
    { key: 'resistanceCalc', label_en: 'R = V/I (Ω)', label_bn: 'R = V/I (Ω)', unit: 'Ω' }
  ];

  // Export CSV handler
  const handleExportCsv = () => {
    if (dataRows.length === 0) return;
    const header = columns.map((c) => (isBangla ? c.label_bn : c.label_en)).join(',');
    const rows = dataRows.map((r) =>
      columns.map((c) => r.values[c.key] !== undefined ? r.values[c.key] : '').join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exp?.slug || 'physics_lab'}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute statistics for target calculated column
  const targetCol = exp?.theoreticalTarget?.yColumn || columns[columns.length - 1]?.key;
  const targetValues = dataRows
    .map((r) => r.values[targetCol])
    .filter((v): v is number => typeof v === 'number');
  const stats = calculateStatistics(targetValues);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => recordCurrentDataRow()}
            className="flex items-center gap-1.5 rounded-xl bg-physics-600 px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-physics-700"
          >
            <Camera size={14} />
            {isBangla ? 'লাইভ পাঠ রেকর্ড করুন' : 'Record Reading'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={dataRows.length === 0}
            className="btn-ghost flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3.5 py-2 text-xs font-bold disabled:opacity-40"
          >
            <Download size={14} />
            {isBangla ? 'CSV ডাউনলোড' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={clearDataRows}
            disabled={dataRows.length === 0}
            className="btn-ghost flex items-center gap-1.5 rounded-xl border border-[var(--line)] px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40"
          >
            <Trash2 size={14} />
            {isBangla ? 'সব মুছুন' : 'Clear All'}
          </button>
        </div>

        {/* Real Lab Measurement Noise Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--muted)]">
          <input
            type="checkbox"
            checked={noiseEnabled}
            onChange={(e) => setNoiseEnabled(e.target.checked)}
            className="h-4 w-4 rounded accent-physics-600"
          />
          <span>{isBangla ? 'বাস্তবসম্মত পরিমাপ ত্রুটি (Lab Noise)' : 'Measurement Noise (Real Lab Behavior)'}</span>
        </label>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--line)] bg-[var(--surface-soft)] font-mono text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="p-3.5 whitespace-nowrap">
                    {isBangla ? col.label_bn : col.label_en}
                  </th>
                ))}
                {exp?.theoreticalTarget?.expectedConstant !== undefined && (
                  <th className="p-3.5 text-right whitespace-nowrap">
                    {isBangla ? 'শতকরা ত্রুটি (%)' : '% Error'}
                  </th>
                )}
                <th className="p-3.5 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] font-mono">
              {dataRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="py-12 text-center text-[var(--muted)]">
                    <BarChart2 size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-bold">
                      {isBangla
                        ? 'এখনো কোনো পাঠ রেকর্ড করা হয়নি। "লাইভ পাঠ রেকর্ড করুন" চাপুন।'
                        : 'No observations recorded yet. Click "Record Reading" to log instrument data.'}
                    </p>
                  </td>
                </tr>
              ) : (
                dataRows.map((row, idx) => (
                  <tr key={row.id} className="transition hover:bg-[var(--surface-soft)]/60">
                    {columns.map((col) => (
                      <td key={col.key} className="p-3.5 font-bold text-[var(--ink)]">
                        {row.values[col.key] !== undefined ? String(row.values[col.key]) : '—'}
                      </td>
                    ))}
                    {exp?.theoreticalTarget?.expectedConstant !== undefined && (
                      <td className="p-3.5 text-right font-black text-physics-600 dark:text-physics-400">
                        {row.percentageError !== undefined ? `${row.percentageError.toFixed(2)}%` : '—'}
                      </td>
                    )}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeDataRow(row.id)}
                        className="rounded-lg p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statistical Summary Footer */}
        {dataRows.length > 0 && stats.mean > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] bg-[var(--surface-soft)] p-4 text-xs">
            <div className="flex items-center gap-4 font-mono font-bold">
              <span>
                {isBangla ? 'গড় মান (Mean): ' : 'Average Mean: '}
                <strong className="text-physics-600 dark:text-physics-300">{stats.mean.toFixed(3)}</strong>
              </span>
              <span>
                {isBangla ? 'স্ট্যান্ডার্ড এরর: ' : 'Std Error: '}
                <strong className="text-[var(--ink)]">{stats.standardError.toFixed(4)}</strong>
              </span>
            </div>
            {exp?.theoreticalTarget?.expectedConstant !== undefined && (
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {isBangla
                  ? `তাত্ত্বিক মান: ${exp.theoreticalTarget.expectedConstant} ${exp.theoreticalTarget.expectedConstantUnit || ''}`
                  : `Theoretical Target: ${exp.theoreticalTarget.expectedConstant} ${exp.theoreticalTarget.expectedConstantUnit || ''}`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
