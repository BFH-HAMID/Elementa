'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'ideal-gas-law')!;
export default function IdealGasLawSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
