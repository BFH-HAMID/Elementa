'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'wave-interference')!;
export default function WaveInterferenceSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
