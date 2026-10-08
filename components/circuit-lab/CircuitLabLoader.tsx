'use client';

/**
 * Client-only loader for the Circuit Lab. The bench, simulator UI and sketch
 * editor are large, and they depend on browser APIs (SVG pointer events,
 * Web Workers), so they are split out and never rendered on the server.
 */

import dynamic from 'next/dynamic';

const CircuitLab = dynamic(() => import('./CircuitLab'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4" aria-busy="true">
      <div className="card h-14 animate-pulse p-3" />
      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        <div className="card h-[70vh] min-h-[420px] animate-pulse" />
        <div className="card h-[70vh] min-h-[420px] animate-pulse" />
        <div className="card h-[70vh] min-h-[420px] animate-pulse" />
      </div>
    </div>
  )
});

export function CircuitLabLoader() {
  return <CircuitLab />;
}
