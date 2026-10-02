'use client';

import { useEffect, useRef } from 'react';
import type { MoleculeName } from './MoleculeScene';

const xyz: Record<MoleculeName, string> = {
  water: `3\nwater\nO 0 0 0\nH -0.76 0.58 0\nH 0.76 0.58 0`,
  methane: `5\nmethane\nC 0 0 0\nH 0.63 0.63 0.63\nH -0.63 -0.63 0.63\nH -0.63 0.63 -0.63\nH 0.63 -0.63 -0.63`,
  benzene: `12\nbenzene\nC 1.40 0 0\nC 0.70 1.21 0\nC -0.70 1.21 0\nC -1.40 0 0\nC -0.70 -1.21 0\nC 0.70 -1.21 0\nH 2.48 0 0\nH 1.24 2.15 0\nH -1.24 2.15 0\nH -2.48 0 0\nH -1.24 -2.15 0\nH 1.24 -2.15 0`
};

type Viewer = { addModel: (data: string, format: string) => { setStyle: (selection: object, style: object) => void }; setStyle: (selection: object, style: object) => void; zoomTo: () => void; render: () => void; clear: () => void; resize: () => void };

type ThreeDmolModule = { createViewer: (element: HTMLElement, config: object) => Viewer };

export function MoleculeScene3DMol({ molecule }: { molecule: MoleculeName }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let viewer: Viewer | undefined;
    let alive = true;
    import('3dmol').then((module) => {
      if (!alive || !containerRef.current) return;
      const api = module as unknown as ThreeDmolModule;
      viewer = api.createViewer(containerRef.current, { backgroundColor: '#0c2236', antialias: true });
      const model = viewer.addModel(xyz[molecule], 'xyz');
      model.setStyle({}, { stick: { radius: 0.12, colorscheme: 'Jmol' }, sphere: { scale: 0.28, colorscheme: 'Jmol' } });
      viewer.zoomTo(); viewer.render();
    }).catch(() => undefined);
    return () => { alive = false; viewer?.clear(); };
  }, [molecule]);
  return <div ref={containerRef} className="h-[330px] w-full rounded-2xl sm:h-[410px]" aria-label={`${molecule} 3Dmol.js molecule viewer`} />;
}
