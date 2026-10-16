/**
 * Central lab registry - ensures Physics, Chemistry and Circuit labs are separate with no duplicates.
 * This is the single source of truth for lab organization.
 */

export type LabId = 'physics' | 'chemistry' | 'circuit';

export interface LabDefinition {
  id: LabId;
  slug: string;
  route: string;
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  description_en: string;
  description_bn: string;
  color: 'physics' | 'chemistry' | 'circuit';
  icon: 'atom' | 'beaker' | 'cpu';
  stats: { label_en: string; label_bn: string; value: number | string }[];
  features_en: string[];
  features_bn: string[];
  simulationsCount: number;
  experimentsCount: number;
  equipmentCount: number;
}

import { physicsDatasetStats } from './physicsData';
import { datasetStats } from './labData';
import { PARTS } from '@/components/circuit-lab/parts/registry';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';
import { ADVANCED_PROJECTS } from '@/components/circuit-lab/projects/catalog-advanced';
import { allPracticalModels } from '@/engine/practicals';
import { allChemPracticalModels } from '@/engine/chemPracticals';
import { simulationMetas } from './simulations';
import { phetSimulationCounts } from './phet-simulations';
import { physicsGuidedExperiments } from './physicsData';
import { guidedExperiments } from './labData';

export const LABS: Record<LabId, LabDefinition> = {
  physics: {
    id: 'physics',
    slug: 'physics',
    route: '/lab/physics',
    title_en: 'Physics Lab',
    title_bn: 'ফিজিক্স ল্যাব',
    subtitle_en: 'Physics',
    subtitle_bn: 'পদার্থবিজ্ঞান',
    description_en: 'Mechanics, heat, electricity, optics, waves and modern physics with realistic instruments.',
    description_bn: 'মেকানিক্স, তাপ, বিদ্যুৎ, আলোকবিজ্ঞান, তরঙ্গ ও আধুনিক পদার্থবিজ্ঞানের বাস্তব যন্ত্রপাতি।',
    color: 'physics',
    icon: 'atom',
    stats: [
      { label_en: 'Equipment', label_bn: 'যন্ত্রপাতি', value: physicsDatasetStats.equipment },
      { label_en: 'Experiments', label_bn: 'পরীক্ষা', value: physicsDatasetStats.experiments },
      { label_en: 'Simulations', label_bn: 'সিমুলেশন', value: allPracticalModels.length },
    ],
    features_en: ['Bench with realistic bulb glow', '46 practical simulations', 'Graphs & data tables', 'No duplicates'],
    features_bn: ['বাস্তব বাল্বের আলো সহ বেঞ্চ', '৪৬টি প্র্যাকটিক্যাল সিমুলেশন', 'গ্রাফ ও ডেটা টেবিল', 'কোনো ডুপ্লিকেট নেই'],
    simulationsCount: allPracticalModels.length + simulationMetas.filter(s => s.subject === 'physics').length,
    experimentsCount: physicsGuidedExperiments.length,
    equipmentCount: physicsDatasetStats.equipment,
  },
  chemistry: {
    id: 'chemistry',
    slug: 'chemistry',
    route: '/lab/chemistry',
    title_en: 'Chemistry Lab',
    title_bn: 'কেমিস্ট্রি ল্যাব',
    subtitle_en: 'Chemistry',
    subtitle_bn: 'রসায়ন',
    description_en: 'Beakers, test tubes, burettes, reactions, titration and 72 practical simulations.',
    description_bn: 'বিকার, টেস্টটিউব, ব্যুরেট, বিক্রিয়া, টাইট্রেশন ও ৭২টি প্র্যাকটিক্যাল সিমুলেশন।',
    color: 'chemistry',
    icon: 'beaker',
    stats: [
      { label_en: 'Chemicals', label_bn: 'রাসায়নিক', value: datasetStats.shelfChemicals },
      { label_en: 'Apparatus', label_bn: 'যন্ত্রপাতি', value: datasetStats.apparatus },
      { label_en: 'Simulations', label_bn: 'সিমুলেশন', value: allChemPracticalModels.length },
    ],
    features_en: ['Drag-drop bench', '72 practical simulations', 'pH & gas laws', 'No duplicates'],
    features_bn: ['ড্র্যাগ-ড্রপ বেঞ্চ', '৭২টি প্র্যাকটিক্যাল সিমুলেশন', 'pH ও গ্যাস সূত্র', 'কোনো ডুপ্লিকেট নেই'],
    simulationsCount: allChemPracticalModels.length + simulationMetas.filter(s => s.subject === 'chemistry').length,
    experimentsCount: guidedExperiments.length,
    equipmentCount: datasetStats.apparatus,
  },
  circuit: {
    id: 'circuit',
    slug: 'circuit',
    route: '/lab/circuit',
    title_en: 'Circuit Lab',
    title_bn: 'সার্কিট ল্যাব',
    subtitle_en: 'Electronics & Robotics',
    subtitle_bn: 'ইলেকট্রনিক্স ও রোবটিক্স',
    description_en: 'Build circuits, Arduino, sensors, motors, drones and 20+ robotics projects with Web Worker simulation.',
    description_bn: 'সার্কিট, Arduino, সেন্সর, মোটর, ড্রোন ও ২০+ রোবটিক্স প্রজেক্ট Web Worker সিমুলেশনে।',
    color: 'circuit',
    icon: 'cpu',
    stats: [
      { label_en: 'Parts', label_bn: 'পার্টস', value: PARTS.length },
      { label_en: 'Projects', label_bn: 'প্রজেক্ট', value: EXAMPLE_PROJECTS.length + ADVANCED_PROJECTS.length },
      { label_en: 'Simulation', label_bn: 'সিমুলেশন', value: 'Web Worker' },
    ],
    features_en: ['SVG bench with realistic wires', 'DC & transient solver', 'Drones & robots', 'No duplicates'],
    features_bn: ['বাস্তব তার সহ SVG বেঞ্চ', 'DC ও ট্রানজিয়েন্ট সলভার', 'ড্রোন ও রোবট', 'কোনো ডুপ্লিকেট নেই'],
    simulationsCount: EXAMPLE_PROJECTS.length + ADVANCED_PROJECTS.length,
    experimentsCount: EXAMPLE_PROJECTS.length + ADVANCED_PROJECTS.length,
    equipmentCount: PARTS.length,
  },
};

export const LAB_LIST = Object.values(LABS);

export const SIMULATION_HUB = {
  total: {
    physicsPracticals: allPracticalModels.length,
    chemistryPracticals: allChemPracticalModels.length,
    circuitProjects: EXAMPLE_PROJECTS.length + ADVANCED_PROJECTS.length,
    customPhysics: simulationMetas.filter(s => s.subject === 'physics').length,
    customChemistry: simulationMetas.filter(s => s.subject === 'chemistry').length,
    phetUnique: phetSimulationCounts.unique,
    phetPhysics: phetSimulationCounts.physics,
    phetChemistry: phetSimulationCounts.chemistry,
  },
  get allCount() {
    return this.total.physicsPracticals + this.total.chemistryPracticals + this.total.circuitProjects + this.total.customPhysics + this.total.customChemistry + this.total.phetUnique;
  }
};

export const EQUATION_HUB = {
  get physicsChapters() { return []; },
  get chemistryChapters() { return []; },
};
