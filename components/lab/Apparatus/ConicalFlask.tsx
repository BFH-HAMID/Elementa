'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type ConicalFlaskProps = Omit<VesselProps, 'shape'>;

/** conical flask — a preset of the generic glassware renderer. */
export function ConicalFlask(props: ConicalFlaskProps) {
  return <Vessel {...props} shape="flask" />;
}
