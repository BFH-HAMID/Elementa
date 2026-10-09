/**
 * Web Worker entry point for the Circuit Lab simulator. The main thread posts
 * the bench state every animation tick; the worker advances the engine and
 * replies with the newest frame. The engine itself lives in engine.ts.
 */

import { CircuitEngine, type TickRequest, type TickResult } from './engine';

export type WorkerIn = { type: 'tick'; id: number; req: TickRequest } | { type: 'reset' };
export type WorkerOut = { type: 'result'; id: number; result: TickResult } | { type: 'error'; message: string };

const engine = new CircuitEngine();

self.onmessage = (ev: MessageEvent<WorkerIn>) => {
  const msg = ev.data;
  if (msg.type === 'reset') {
    engine.reset();
    return;
  }
  try {
    const result = engine.tick(msg.req);
    const out: WorkerOut = { type: 'result', id: msg.id, result };
    (self as unknown as Worker).postMessage(out);
  } catch (e) {
    const out: WorkerOut = { type: 'error', message: (e as Error).message };
    (self as unknown as Worker).postMessage(out);
  }
};
