'use client';

/** Global keyboard shortcuts for the bench. Ignored while typing in a field. */

import { useEffect } from 'react';
import { useCircuitStore } from '@/store/circuitStore';

function editing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
}

export function useCircuitShortcuts(onFit: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing(e.target)) return;
      const st = useCircuitStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const nudge = e.shiftKey ? 10 : 5;

      if (st.showHelp && e.key === 'Escape') {
        st.setShowHelp(false);
        return;
      }
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        st.undo();
      } else if ((mod && key === 'z' && e.shiftKey) || (mod && key === 'y')) {
        e.preventDefault();
        st.redo();
      } else if (mod && key === 'd') {
        e.preventDefault();
        st.duplicateSelection();
      } else if (mod && key === 'a') {
        e.preventDefault();
        st.select(st.components.map((c) => c.id), st.wires.map((w) => w.id));
      } else if (key === 'r' && !mod) {
        st.rotateSelection(e.shiftKey ? -1 : 1);
      } else if (key === 'f' && !mod) {
        st.flipSelection();
      } else if (key === 'delete' || key === 'backspace') {
        e.preventDefault();
        st.deleteSelection();
      } else if (key === 'escape') {
        st.clearSelection();
        st.setTool('select');
      } else if (key === 'f5') {
        e.preventDefault();
        st.setRunning(!st.running);
      } else if (key === '?' || (key === 'h' && !mod)) {
        st.setShowHelp(!st.showHelp);
      } else if (key === '0' && mod) {
        e.preventDefault();
        onFit();
      } else if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key) && st.selectedComps.length) {
        e.preventDefault();
        const dx = key === 'arrowleft' ? -nudge : key === 'arrowright' ? nudge : 0;
        const dy = key === 'arrowup' ? -nudge : key === 'arrowdown' ? nudge : 0;
        st.pushHistory();
        const updates: Record<string, { x: number; y: number }> = {};
        for (const c of st.components) if (st.selectedComps.includes(c.id)) updates[c.id] = { x: c.x + dx, y: c.y + dy };
        st.setPositions(updates);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onFit]);
}
