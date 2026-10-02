'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'acid-base-titration')!;
export default function AcidBaseTitrationSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
