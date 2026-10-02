'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'newtons-second-law')!;
export default function NewtonsSecondLawSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
