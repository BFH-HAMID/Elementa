'use client';

import type React from 'react';
import type { ChemSceneId } from '@/engine/chemPracticals';
import type { SceneProps } from '../primitives';
import { TubesScene } from './tubes';
import { TitrationScene } from './titration';
import { FlameScene } from './flame';
import { GasScene } from './gas';
import { ElectrolysisScene } from './electrolysis';
import { HeatingScene } from './heating';
import { CalorimeterScene } from './calorimeter';
import { TroughScene } from './trough';
import { GasJarScene } from './gasJar';
import { CrossFlaskScene } from './crossFlask';
import { GalvanicScene } from './galvanic';
import { DiffusionScene } from './diffusion';
import { ChromatographyScene } from './chromatography';
import { DistillationScene } from './distillation';
import { AnalysisBenchScene } from './analysisBench';

export const chemScenes: Record<ChemSceneId, React.ComponentType<SceneProps>> = {
  tubes: TubesScene,
  titration: TitrationScene,
  flame: FlameScene,
  gas: GasScene,
  electrolysis: ElectrolysisScene,
  heating: HeatingScene,
  calorimeter: CalorimeterScene,
  trough: TroughScene,
  gasJar: GasJarScene,
  crossFlask: CrossFlaskScene,
  galvanic: GalvanicScene,
  diffusion: DiffusionScene,
  chromatography: ChromatographyScene,
  distillation: DistillationScene,
  analysisBench: AnalysisBenchScene
};
