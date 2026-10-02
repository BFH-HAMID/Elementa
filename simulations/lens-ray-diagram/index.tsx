'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'lens-ray-diagram')!;
export default function LensRayDiagramSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
