'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useMemo } from 'react';

export type MoleculeName = 'water' | 'methane' | 'benzene';

type Atom = { position: [number, number, number]; color: string; size: number; label: string };

const models: Record<MoleculeName, { atoms: Atom[]; bonds: Array<[number, number]> }> = {
  water: {
    atoms: [{ position: [0, 0, 0], color: '#e94545', size: 0.55, label: 'O' }, { position: [-0.8, -0.3, 0], color: '#f4f7fa', size: 0.3, label: 'H' }, { position: [0.8, -0.3, 0], color: '#f4f7fa', size: 0.3, label: 'H' }], bonds: [[0, 1], [0, 2]]
  },
  methane: {
    atoms: [{ position: [0, 0, 0], color: '#303c4b', size: 0.5, label: 'C' }, { position: [0.95, 0.65, 0.45], color: '#f4f7fa', size: 0.27, label: 'H' }, { position: [-0.95, 0.65, 0.45], color: '#f4f7fa', size: 0.27, label: 'H' }, { position: [0.2, -1, 0.45], color: '#f4f7fa', size: 0.27, label: 'H' }, { position: [0.2, 0.1, -1], color: '#f4f7fa', size: 0.27, label: 'H' }], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
  },
  benzene: {
    atoms: [{ position: [1.1, 0, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [0.55, 0.95, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [-0.55, 0.95, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [-1.1, 0, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [-0.55, -0.95, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [0.55, -0.95, 0], color: '#303c4b', size: 0.38, label: 'C' }, { position: [1.8, 0, 0], color: '#f4f7fa', size: 0.22, label: 'H' }, { position: [0.9, 1.55, 0], color: '#f4f7fa', size: 0.22, label: 'H' }, { position: [-0.9, 1.55, 0], color: '#f4f7fa', size: 0.22, label: 'H' }, { position: [-1.8, 0, 0], color: '#f4f7fa', size: 0.22, label: 'H' }, { position: [-0.9, -1.55, 0], color: '#f4f7fa', size: 0.22, label: 'H' }, { position: [0.9, -1.55, 0], color: '#f4f7fa', size: 0.22, label: 'H' }], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]]
  }
};

function Bond({ from, to }: { from: Atom; to: Atom }) {
  const midpoint: [number, number, number] = [(from.position[0] + to.position[0]) / 2, (from.position[1] + to.position[1]) / 2, (from.position[2] + to.position[2]) / 2];
  const length = Math.hypot(to.position[0] - from.position[0], to.position[1] - from.position[1], to.position[2] - from.position[2]);
  return <mesh position={midpoint}><boxGeometry args={[0.08, length, 0.08]} /><meshStandardMaterial color="#9fb1c2" /></mesh>;
}

export function MoleculeScene({ molecule }: { molecule: MoleculeName }) {
  const model = useMemo(() => models[molecule], [molecule]);
  return <div className="h-[260px] w-full overflow-hidden rounded-2xl bg-[#0c2236] sm:h-[340px] lg:h-[410px]" aria-label={`${molecule} 3D molecule viewer`}><Canvas dpr={[1, 1.5]}><PerspectiveCamera makeDefault position={[0, 0, 6]} /><ambientLight intensity={1.8} /><directionalLight position={[3, 4, 5]} intensity={3} /><OrbitControls enablePan={false} minDistance={3} maxDistance={9} autoRotate autoRotateSpeed={0.5} />{model.bonds.map(([from, to]) => <Bond key={`${from}-${to}`} from={model.atoms[from]} to={model.atoms[to]} />)}{model.atoms.map((atom, index) => <mesh key={`${atom.label}-${index}`} position={atom.position}><sphereGeometry args={[atom.size, 24, 24]} /><meshStandardMaterial color={atom.color} roughness={0.28} metalness={0.1} /></mesh>)}</Canvas></div>;
}
