'use client';

/**
 * Drives the circuit simulator from React. The engine runs inside a Web Worker
 * (simWorker.ts); if workers are unavailable it falls back to the same engine on
 * the main thread. Ticks are throttled: 30 Hz while running, 8 Hz when idle so
 * meters and LEDs still reflect edits.
 */

import { useEffect } from 'react';
import { useCircuitStore } from '@/store/circuitStore';
import { CircuitEngine, type TickResult } from './engine';
import type { WorkerIn, WorkerOut } from './simWorker';

export function useSimEngine() {
  useEffect(() => {
    let disposed = false;
    let worker: Worker | null = null;
    let fallback: CircuitEngine | null = null;
    let busy = false;
    let nextId = 1;

    const apply = (result: TickResult) => {
      const st = useCircuitStore.getState();
      st.setFrame(result.frame);
      st.appendSerial(result.serial);
      st.setSimErrors(result.errors);
    };

    try {
      worker = new Worker(new URL('./simWorker.ts', import.meta.url));
      worker.onmessage = (ev: MessageEvent<WorkerOut>) => {
        busy = false;
        if (ev.data.type === 'result') apply(ev.data.result);
        else useCircuitStore.getState().setSimErrors([`Simulator: ${ev.data.message}`]);
      };
      worker.onerror = () => {
        // Fall back to the main-thread engine if the worker fails to start.
        worker?.terminate();
        worker = null;
        fallback = new CircuitEngine();
      };
    } catch {
      fallback = new CircuitEngine();
    }

    let lastTick = 0;
    const timer = setInterval(() => {
      if (disposed) return;
      const st = useCircuitStore.getState();
      const now = performance.now();
      const interval = st.running ? 33 : 120;
      if (now - lastTick < interval) return;
      const wallMs = lastTick === 0 ? 16 : Math.min(60, now - lastTick);
      lastTick = now;
      const req = { components: st.components, wires: st.wires, wallMs, speed: st.simSpeed, running: st.running };
      if (worker) {
        if (busy) return;
        busy = true;
        const msg: WorkerIn = { type: 'tick', id: nextId++, req };
        worker.postMessage(msg);
      } else if (fallback) {
        apply(fallback.tick(req));
      }
    }, 16);

    const unsubscribeReset = useCircuitStore.subscribe((state, prev) => {
      // A reset clears the engine's memory (MCU state, burn-outs, time).
      if (prev.frame !== null && state.frame === null && !state.running) {
        worker?.postMessage({ type: 'reset' } satisfies WorkerIn);
        fallback?.reset();
      }
    });

    return () => {
      disposed = true;
      clearInterval(timer);
      unsubscribeReset();
      worker?.terminate();
      worker = null;
      fallback = null;
    };
  }, []);
}
