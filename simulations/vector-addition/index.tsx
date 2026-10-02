'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'vector-addition')!;
export default function VectorAdditionSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
