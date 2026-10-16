'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type WatchGlassProps = Omit<VesselProps, 'shape'>;

/** Shallow, curved glass plate used to cover a beaker or hold a small sample. */
export function WatchGlass(props: WatchGlassProps) {
  return <Vessel {...props} shape="watch-glass" />;
}
