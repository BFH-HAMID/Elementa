'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'fluid-flow-bernoulli')!;
export default function FluidFlowBernoulliSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
