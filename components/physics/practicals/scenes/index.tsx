'use client';

import type React from 'react';
import type { PracticalSceneId } from '@/engine/practicals';
import type { SceneProps } from '../primitives';
import { CircuitScene, InductionScene, WireBoardScene } from './electric';
import {
  AtwoodScene,
  FlywheelScene,
  InclineScene,
  PendulumScene,
  ProjectileScene,
  SearleScene,
  SpringScene,
  TorsionScene,
  TrolleyScene
} from './mechanics';
import { ScrewGaugeScene, VernierScene } from './measure';
import { FringesScene, OpticalBenchScene, RaysScene } from './optics';
import { CalorimeterScene, ConductionScene, DensityBottleScene } from './heat';
import { CapillaryScene, ResonanceTubeScene, StringScene } from './waves';
import { GmCounterScene, PhotoelectricScene } from './modern';

export const practicalScenes: Record<PracticalSceneId, React.ComponentType<SceneProps>> = {
  circuit: CircuitScene,
  wireBoard: WireBoardScene,
  induction: InductionScene,
  pendulum: PendulumScene,
  spring: SpringScene,
  incline: InclineScene,
  projectile: ProjectileScene,
  trolley: TrolleyScene,
  atwood: AtwoodScene,
  flywheel: FlywheelScene,
  torsion: TorsionScene,
  searle: SearleScene,
  vernier: VernierScene,
  screwGauge: ScrewGaugeScene,
  opticalBench: OpticalBenchScene,
  rays: RaysScene,
  fringes: FringesScene,
  calorimeter: CalorimeterScene,
  conduction: ConductionScene,
  densityBottle: DensityBottleScene,
  resonanceTube: ResonanceTubeScene,
  string: StringScene,
  capillary: CapillaryScene,
  photoelectric: PhotoelectricScene,
  gmCounter: GmCounterScene
};
