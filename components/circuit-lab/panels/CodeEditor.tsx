'use client';

/**
 * Sketch editor for MCU boards: a lightweight code editor (line numbers,
 * tab-indent, bracket-aware Enter, keyword highlighting in the gutter-free
 * overlay). Monaco is not bundled — see CIRCUIT_LAB_GUIDE.md for the swap path.
 */

import { useMemo, useRef } from 'react';

const KEYWORDS = /\b(void|int|long|float|double|bool|byte|char|String|const|if|else|for|while|do|return|switch|case|break|true|false|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|define|include)\b/g;

function highlight(src: string): string {
  const esc = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/(\/\/[^\n]*)/g, '<span class="text-emerald-600 dark:text-emerald-400">$1</span>')
    .replace(/("[^"\n]*")/g, '<span class="text-amber-700 dark:text-amber-300">$1</span>')
    .replace(KEYWORDS, '<span class="text-brand dark:text-physics-300 font-semibold">$1</span>')
    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="text-coral-600 dark:text-coral-300">$1</span>');
}

export function CodeEditor({ value, onChange, errors, label }: { value: string; onChange: (v: string) => void; errors: string[]; label: string }) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const lines = useMemo(() => Math.max(1, value.split('\n').length), [value]);
  const html = useMemo(() => highlight(value) + '\n', [value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en } = ta;
      const next = `${value.slice(0, s)}  ${value.slice(en)}`;
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    } else if (e.key === 'Enter') {
      // Keep the indentation of the current line and add one level after '{'.
      const { selectionStart: s } = ta;
      const before = value.slice(0, s);
      const lineStart = before.lastIndexOf('\n') + 1;
      const indent = /^\s*/.exec(before.slice(lineStart))?.[0] ?? '';
      const extra = before.trimEnd().endsWith('{') ? '  ' : '';
      e.preventDefault();
      const insert = `\n${indent}${extra}`;
      const next = value.slice(0, s) + insert + value.slice(ta.selectionEnd);
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(s + insert.length, s + insert.length));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="relative flex min-h-[180px] flex-1 overflow-hidden rounded-xl border border-line bg-[#0f1822] font-mono text-[12px] leading-5 text-slate-100">
        <div aria-hidden className="select-none border-r border-white/10 bg-black/20 px-2 py-2 text-right text-slate-500">
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <pre aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre px-3 py-2" dangerouslySetInnerHTML={{ __html: html }} />
          <textarea
            ref={taRef}
            aria-label={label}
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent px-3 py-2 text-transparent caret-white outline-none selection:bg-physics-600/40"
          />
        </div>
      </div>
      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-coral-200 bg-coral-50 p-2 text-xs text-coral-700 dark:bg-coral-900/20 dark:text-coral-200" role="alert">
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
