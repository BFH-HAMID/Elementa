import type { ReactElement } from 'react';
import type { Apparatus, VesselShape } from '@/engine/types';
import { Beaker } from './Beaker';
import { Burette } from './Burette';
import { ConicalFlask } from './ConicalFlask';
import { Crucible } from './Crucible';
import { EvaporatingDish } from './EvaporatingDish';
import { GasJar } from './GasJar';
import { MeasuringCylinder } from './MeasuringCylinder';
import { ReagentBottle } from './ReagentBottle';
import { TestTube } from './TestTube';
import { WatchGlass } from './WatchGlass';
import type { VesselProps } from './Vessel';

export { ApparatusGlyph } from './ApparatusGlyph';
export { Beaker } from './Beaker';
export { Burette } from './Burette';
export { Burner } from './Burner';
export { ConicalFlask } from './ConicalFlask';
export { Crucible } from './Crucible';
export { Dropper } from './Dropper';
export { DeliveryTube } from './DeliveryTube';
export { ElectrolysisCell } from './ElectrolysisCell';
export { Spatula } from './Spatula';
export { TestTubeHolder } from './TestTubeHolder';
export { EvaporatingDish } from './EvaporatingDish';
export { GasJar } from './GasJar';
export { MeasuringCylinder } from './MeasuringCylinder';
export { ReagentBottle } from './ReagentBottle';
export { TestTube } from './TestTube';
export { Thermometer } from './Thermometer';
export { TripodStand } from './TripodStand';
export { Vessel } from './Vessel';
export { WatchGlass } from './WatchGlass';
export { apparatusGlyphPaths, vesselShapes, type ShapeGeometry } from './vesselShapes';

type VesselComponent = (props: Omit<VesselProps, 'shape'>) => ReactElement;

/** Look up the right drawing for an apparatus shape from `data/apparatus.json`. */
export const vesselComponents: Record<VesselShape, VesselComponent> = {
  tube: TestTube as VesselComponent,
  beaker: Beaker as VesselComponent,
  flask: ConicalFlask as VesselComponent,
  cylinder: MeasuringCylinder as VesselComponent,
  burette: Burette as VesselComponent,
  jar: GasJar as VesselComponent,
  dish: EvaporatingDish as VesselComponent,
  'watch-glass': WatchGlass as VesselComponent,
  crucible: Crucible as VesselComponent,
  'reagent-bottle': ReagentBottle as VesselComponent
};

/** Tools and heat sources have shapes of their own; anything that is not glassware falls back to a tube. */
export function VesselFor(shape: Apparatus['shape'] | VesselShape): VesselComponent {
  return vesselComponents[shape as VesselShape] ?? (TestTube as VesselComponent);
}
