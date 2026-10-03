'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type BeakerProps = Omit<VesselProps, 'shape'>;

/** beaker — a preset of the generic glassware renderer. */
export function Beaker(props: BeakerProps) {
  return <Vessel {...props} shape="beaker" />;
}
