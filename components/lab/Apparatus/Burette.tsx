'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type BuretteProps = Omit<VesselProps, 'shape'>;

/** burette — a preset of the generic glassware renderer. */
export function Burette(props: BuretteProps) {
  return <Vessel {...props} shape="burette" />;
}
