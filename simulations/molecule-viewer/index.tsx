'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'molecule-viewer')!;
export default function MoleculeViewerSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
