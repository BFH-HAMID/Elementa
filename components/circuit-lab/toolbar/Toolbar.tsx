'use client';

/** Top toolbar: simulation controls, editing tools, view options, file and share actions. */

import { useRef, useState } from 'react';
import { Play, Square, RotateCcw, Undo2, Redo2, RotateCw, FlipHorizontal2, Copy, Trash2, Maximize2, Activity, Magnet, FilePlus2, Save, FolderOpen, Download, Upload, Share2, ImageDown, FileCode2, HelpCircle, MousePointer2, Hand, Cable } from 'lucide-react';
import { useCircuitStore, CIRCUIT_STORAGE_KEY, isValidProject } from '@/store/circuitStore';
import { EXAMPLE_PROJECTS } from '../projects/examples';
import { useCircuitI18n } from '../lib/i18n';
import { exportPng, exportSvg, projectFileText, shareUrl } from '../lib/exporters';
import { cn, downloadText } from '@/lib/utils';
import { benchBounds } from '../geometry';
import { getPart } from '../parts/registry';
import type { CircuitProject } from '../types';

const SPEEDS = [0.1, 0.25, 0.5, 1, 2];

function IconBtn({ label, onClick, active, disabled, children, danger }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-sm transition disabled:opacity-40',
        active ? 'border-physics-300 bg-physics-50 text-physics-800 dark:bg-physics-900/40 dark:text-physics-100' : 'border-line bg-surface text-ink hover:bg-surface-soft',
        danger && 'text-coral-700 hover:bg-coral-50 dark:hover:bg-coral-900/20'
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({ svgId, onFit }: { svgId: string; onFit: () => void }) {
  const { t, locale } = useCircuitI18n();
  const running = useCircuitStore((s) => s.running);
  const simSpeed = useCircuitStore((s) => s.simSpeed);
  const showFlow = useCircuitStore((s) => s.showFlow);
  const snap = useCircuitStore((s) => s.snap);
  const tool = useCircuitStore((s) => s.tool);
  const projectName = useCircuitStore((s) => s.projectName);
  const activeExampleId = useCircuitStore((s) => s.activeExampleId);
  const canUndo = useCircuitStore((s) => s.past.length > 0);
  const canRedo = useCircuitStore((s) => s.future.length > 0);
  const hasSelection = useCircuitStore((s) => s.selectedComps.length + s.selectedWires.length > 0);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2200);
  };

  const project = (): CircuitProject => useCircuitStore.getState().toProject();

  const onSave = () => {
    try {
      window.localStorage.setItem(`${CIRCUIT_STORAGE_KEY}:saved`, JSON.stringify(project()));
      flash(locale === 'bn' ? 'ব্রাউজারে সংরক্ষিত হয়েছে' : 'Saved in this browser');
    } catch {
      flash(locale === 'bn' ? 'সংরক্ষণ ব্যর্থ' : 'Could not save (storage full?)');
    }
  };

  const onLoadSaved = () => {
    try {
      const raw = window.localStorage.getItem(`${CIRCUIT_STORAGE_KEY}:saved`);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (isValidProject(parsed)) {
        useCircuitStore.getState().loadProject(parsed, null);
        flash(t('loaded'));
      } else {
        flash(locale === 'bn' ? 'কোনো সংরক্ষিত প্রকল্প নেই' : 'No saved project in this browser');
      }
    } catch {
      flash(t('invalidFile'));
    }
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isValidProject(parsed)) throw new Error('invalid');
      useCircuitStore.getState().loadProject(parsed, null);
      flash(t('imported'));
    } catch {
      flash(t('invalidFile'));
    }
  };

  const onShare = async () => {
    const url = shareUrl(project());
    try {
      await navigator.clipboard.writeText(url);
      flash(t('copied'));
    } catch {
      window.prompt(locale === 'bn' ? 'এই লিংকটি কপি করুন' : 'Copy this link', url);
    }
  };

  const onExportSvg = () => {
    const svg = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svg) return;
    const st = useCircuitStore.getState();
    const box = boundsOf(st);
    exportSvg(svg, box, st.projectName);
  };

  const onExportPng = async () => {
    const svg = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svg) return;
    const st = useCircuitStore.getState();
    try {
      await exportPng(svg, boundsOf(st), st.projectName);
    } catch {
      flash(locale === 'bn' ? 'PNG তৈরি করা যায়নি' : 'PNG export failed');
    }
  };

  const onExportFile = () => downloadText(`${projectName || 'circuit'}.json`, projectFileText(project()), 'application/json');

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t('title')}>
      <IconBtn label={running ? t('stop') : t('run')} active={running} onClick={() => useCircuitStore.getState().setRunning(!running)}>
        {running ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        <span className="hidden sm:inline">{running ? t('stop') : t('run')}</span>
      </IconBtn>
      <IconBtn
        label={t('reset')}
        onClick={() => {
          useCircuitStore.getState().resetSim();
        }}
      >
        <RotateCcw className="h-4 w-4" />
      </IconBtn>
      <label className="flex items-center gap-1 rounded-xl border border-line bg-surface px-2 py-1 text-sm">
        <span className="sr-only">{t('speed')}</span>
        <select aria-label={t('speed')} value={simSpeed} onChange={(e) => useCircuitStore.getState().setSimSpeed(Number(e.target.value))} className="bg-transparent py-1 text-sm outline-none">
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>

      <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />

      <IconBtn label={t('undo')} disabled={!canUndo} onClick={() => useCircuitStore.getState().undo()}>
        <Undo2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('redo')} disabled={!canRedo} onClick={() => useCircuitStore.getState().redo()}>
        <Redo2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('rotate')} disabled={!hasSelection} onClick={() => useCircuitStore.getState().rotateSelection(1)}>
        <RotateCw className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('flip')} disabled={!hasSelection} onClick={() => useCircuitStore.getState().flipSelection()}>
        <FlipHorizontal2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('duplicate')} disabled={!hasSelection} onClick={() => useCircuitStore.getState().duplicateSelection()}>
        <Copy className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('delete')} disabled={!hasSelection} danger onClick={() => useCircuitStore.getState().deleteSelection()}>
        <Trash2 className="h-4 w-4" />
      </IconBtn>

      <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />

      <IconBtn label="Select" active={tool === 'select'} onClick={() => useCircuitStore.getState().setTool('select')}>
        <MousePointer2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label="Pan" active={tool === 'pan'} onClick={() => useCircuitStore.getState().setTool(tool === 'pan' ? 'select' : 'pan')}>
        <Hand className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('fit')} onClick={onFit}>
        <Maximize2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('flow')} active={showFlow} onClick={() => useCircuitStore.getState().setShowFlow(!showFlow)}>
        <Activity className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('snap')} active={snap} onClick={() => useCircuitStore.getState().setSnap(!snap)}>
        <Magnet className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('help')} onClick={() => useCircuitStore.getState().setShowHelp(true)}>
        <HelpCircle className="h-4 w-4" />
      </IconBtn>

      <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />

      <label className="min-w-[10rem] flex-1">
        <span className="sr-only">Project name</span>
        <input
          value={projectName}
          onChange={(e) => useCircuitStore.getState().setProjectName(e.target.value.slice(0, 60))}
          className="input h-9 w-full text-sm"
          aria-label="Project name"
        />
      </label>
      <label className="max-w-[12rem]">
        <span className="sr-only">{t('examples')}</span>
        <select
          aria-label={t('examples')}
          value={activeExampleId ?? ''}
          onChange={(e) => {
            if (e.target.value) useCircuitStore.getState().loadExample(e.target.value);
          }}
          className="input h-9 w-full text-sm"
        >
          <option value="">{t('examples')}…</option>
          {EXAMPLE_PROJECTS.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {locale === 'bn' ? ex.title.bn : ex.title.en}
            </option>
          ))}
        </select>
      </label>
      <IconBtn label={t('newProject')} onClick={() => useCircuitStore.getState().newProject()}>
        <FilePlus2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('save')} onClick={onSave}>
        <Save className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('load')} onClick={onLoadSaved}>
        <FolderOpen className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('exportFile')} onClick={onExportFile}>
        <Download className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('importFile')} onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" />
      </IconBtn>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label={t('importFile')}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImport(f);
          e.target.value = '';
        }}
      />
      <IconBtn label={t('share')} onClick={onShare}>
        <Share2 className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('exportPng')} onClick={() => void onExportPng()}>
        <ImageDown className="h-4 w-4" />
      </IconBtn>
      <IconBtn label={t('exportSvg')} onClick={onExportSvg}>
        <FileCode2 className="h-4 w-4" />
      </IconBtn>

      {notice ? (
        <p role="status" className="basis-full text-xs text-physics-700 dark:text-physics-200">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function boundsOf(st: { components: import('../types').PlacedComponent[]; wires: import('../types').PlacedWire[] }) {
  const defs = new Map(st.components.map((c) => [c.id, getPart(c.partId) ?? { w: 0, h: 0, pins: [] }]));
  return benchBounds(st.components, st.wires, defs);
}
