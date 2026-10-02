'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'mass-spring-oscillator')!;
export default function MassSpringOscillatorSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
