'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'young-double-slit')!;
export default function YoungDoubleSlitSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
