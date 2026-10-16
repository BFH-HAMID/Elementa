'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type ReagentBottleProps = Omit<VesselProps, 'shape'>;

/** Labelled laboratory bottle for storing prepared reagent solutions. */
export function ReagentBottle(props: ReagentBottleProps) {
  return <Vessel {...props} shape="reagent-bottle" />;
}
