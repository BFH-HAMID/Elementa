'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'simple-pendulum')!;
export default function SimplePendulumSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
