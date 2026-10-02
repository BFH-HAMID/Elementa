'use client';

import { SimulationWorkbench } from '@/components/sim/SimulationWorkbench';
import { simulationMetas } from '@/lib/simulations';

export const simulationMeta = simulationMetas.find((item) => item.slug === 'projectile-motion')!;
export default function ProjectileMotionSimulation() { return <SimulationWorkbench meta={simulationMeta} />; }
