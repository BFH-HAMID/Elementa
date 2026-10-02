'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';

type ToastItem = { id: number; message: string; tone: 'success' | 'info' };
type ToastContextValue = { showToast: (message: string, tone?: ToastItem['tone']) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 2600);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[80] flex max-w-[calc(100vw-2rem)] flex-col gap-2 sm:bottom-6" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="pointer-events-auto flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm font-bold shadow-float">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-chemistry-100 text-chemistry-700">{item.tone === 'success' ? <Check size={14} /> : <span>i</span>}</span>
            <span>{item.message}</span>
            <button type="button" aria-label="Dismiss" className="ml-2 text-[var(--muted)]" onClick={() => setItems((current) => current.filter((old) => old.id !== item.id))}><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
