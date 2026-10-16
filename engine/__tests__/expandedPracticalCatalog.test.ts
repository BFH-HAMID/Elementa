import { describe, expect, it } from 'vitest';
import basePhysics from '@/data/physicsExperiments.json';
import baseChemistry from '@/data/experiments.json';
import expandedPhysics from '@/content/expanded-physics-practicals.json';
import expandedChemistry from '@/content/expanded-chemistry-practicals.json';
import { physicsGuidedExperiments } from '@/lib/physicsData';
import { guidedExperiments } from '@/lib/labData';
import { expandedPhysicsPracticalModels } from '@/engine/practicals/expanded';
import { expandedChemPracticalModels } from '@/engine/chemPracticals/expanded';
import { EXPANDED_CIRCUIT_PROJECTS } from '@/components/circuit-lab/projects/catalog-expanded';
import { EXAMPLE_PROJECTS } from '@/components/circuit-lab/projects/examples';

const unique = (values: string[]) => new Set(values).size === values.length;

describe('90-practical expansion inventory', () => {
  it('adds exactly 30 new Physics practicals without replacing the original 45', () => {
    expect(basePhysics.experiments).toHaveLength(45);
    expect(expandedPhysics.count).toBe(30);
    expect(expandedPhysics.experiments).toHaveLength(30);
    expect(physicsGuidedExperiments).toHaveLength(75);
    const base = new Set(basePhysics.experiments.map((entry) => entry.slug));
    expect(expandedPhysics.experiments.some((entry) => base.has(entry.slug))).toBe(false);
    expect(unique(expandedPhysics.experiments.map((entry) => entry.slug))).toBe(true);
    expect(unique(expandedPhysics.experiments.map((entry) => entry.title_en))).toBe(true);
  });

  it('adds exactly 30 new Chemistry practicals without replacing the original 67', () => {
    expect(baseChemistry.experiments).toHaveLength(67);
    expect(expandedChemistry.count).toBe(30);
    expect(expandedChemistry.experiments).toHaveLength(30);
    expect(guidedExperiments).toHaveLength(97);
    const base = new Set(baseChemistry.experiments.map((entry) => entry.slug));
    expect(expandedChemistry.experiments.some((entry) => base.has(entry.slug))).toBe(false);
    expect(unique(expandedChemistry.experiments.map((entry) => entry.slug))).toBe(true);
    expect(unique(expandedChemistry.experiments.map((entry) => entry.title_en))).toBe(true);
  });

  it('adds exactly 30 new Circuit practicals without replacing the original 50', () => {
    expect(EXPANDED_CIRCUIT_PROJECTS).toHaveLength(30);
    expect(EXAMPLE_PROJECTS).toHaveLength(80);
    expect(unique(EXPANDED_CIRCUIT_PROJECTS.map((entry) => entry.id))).toBe(true);
    expect(unique(EXPANDED_CIRCUIT_PROJECTS.map((entry) => entry.title.en))).toBe(true);
  });
});

describe('every expanded practical is full interactive and bilingual', () => {
  for (const model of expandedPhysicsPracticalModels) {
    it(`Physics ${model.slug}: apparatus, controls, readings, table, graph data and validation`, () => {
      const entry = expandedPhysics.experiments.find((item) => item.slug === model.slug)!;
      expect(model.scene).toBe('instrumentRig');
      expect(model.controls.length).toBeGreaterThanOrEqual(2);
      expect(model.sweep?.values).toHaveLength(5);
      expect(model.minReadings).toBe(5);
      expect(entry.model.apparatus_en).toHaveLength(3);
      expect(entry.model.apparatus_bn).toHaveLength(3);
      expect(entry.dataColumns.map((column) => column.key)).toEqual(['obsNo', 'x', 'y', 'estimate']);
      expect(entry.title_en.length).toBeGreaterThan(8);
      expect(entry.title_bn.length).toBeGreaterThan(3);
      expect(model.result.compute).toBeTypeOf('function');
    });
  }

  for (const model of expandedChemPracticalModels) {
    it(`Chemistry ${model.slug}: glassware, reagents, controls, readings, table, graph and validation`, () => {
      const entry = expandedChemistry.experiments.find((item) => item.slug === model.slug)!;
      expect(model.scene).toBe('analysisBench');
      expect(model.controls.length).toBeGreaterThanOrEqual(2);
      expect(model.tasks).toHaveLength(5);
      expect(model.columns.map((column) => column.key)).toEqual(['obsNo', 'x', 'y', 'estimate']);
      expect(model.graph).toBeTruthy();
      expect(entry.model.apparatus_en).toHaveLength(3);
      expect(entry.model.reagents_en).toHaveLength(3);
      expect(entry.title_en.length).toBeGreaterThan(8);
      expect(entry.title_bn.length).toBeGreaterThan(3);
      expect(entry.quiz.length).toBeGreaterThan(0);
      expect(model.result.compute).toBeTypeOf('function');
    });
  }

  for (const project of EXPANDED_CIRCUIT_PROJECTS) {
    it(`Circuit ${project.id}: wired engine rig and quantitative worksheet`, () => {
      const practical = project.practical!;
      expect(project.components.length).toBeGreaterThanOrEqual(5);
      expect(project.wires.length).toBeGreaterThanOrEqual(6);
      expect(project.steps.length).toBeGreaterThanOrEqual(4);
      expect(practical.control.values).toHaveLength(5);
      expect(practical.reading.kind).toMatch(/sourceCurrent|nodeVoltage/);
      expect(practical.result.expected).toBeGreaterThan(0);
      expect(project.title.en.length).toBeGreaterThan(8);
      expect(project.title.bn.length).toBeGreaterThan(3);
    });
  }
});
