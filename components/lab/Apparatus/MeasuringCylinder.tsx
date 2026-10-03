'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type MeasuringCylinderProps = Omit<VesselProps, 'shape'>;

/** measuring cylinder — a preset of the generic glassware renderer. */
export function MeasuringCylinder(props: MeasuringCylinderProps) {
  return <Vessel {...props} shape="cylinder" />;
}
