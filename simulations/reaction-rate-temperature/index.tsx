'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'reaction-rate-temperature')!;
export default function ReactionRateTemperatureSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
