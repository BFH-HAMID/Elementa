'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'ph-scale')!;
export default function PhScaleSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
