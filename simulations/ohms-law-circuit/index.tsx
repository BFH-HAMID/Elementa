'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'ohms-law-circuit')!;
export default function OhmsLawCircuitSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
