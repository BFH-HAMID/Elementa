'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'wheatstone-bridge')!;
export default function WheatstoneBridgeSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
