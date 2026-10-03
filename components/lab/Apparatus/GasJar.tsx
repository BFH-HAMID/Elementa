'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type GasJarProps = Omit<VesselProps, 'shape'>;

/** gas jar — a preset of the generic glassware renderer. */
export function GasJar(props: GasJarProps) {
  return <Vessel {...props} shape="jar" />;
}
