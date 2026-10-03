'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type TestTubeProps = Omit<VesselProps, 'shape'>;

/** test tube — a preset of the generic glassware renderer. */
export function TestTube(props: TestTubeProps) {
  return <Vessel {...props} shape="tube" />;
}
