'use client';

import type { VesselProps } from './Vessel';
import { Vessel } from './Vessel';

export type EvaporatingDishProps = Omit<VesselProps, 'shape'>;

/** evaporating dish — a preset of the generic glassware renderer. */
export function EvaporatingDish(props: EvaporatingDishProps) {
  return <Vessel {...props} shape="dish" />;
}
