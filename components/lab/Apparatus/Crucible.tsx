'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type CrucibleProps = Omit<VesselProps, 'shape'>;

/** Porcelain crucible with a fitted rim and lid, used for small heated samples. */
export function Crucible(props: CrucibleProps) {
  return <Vessel {...props} shape="crucible" />;
}
