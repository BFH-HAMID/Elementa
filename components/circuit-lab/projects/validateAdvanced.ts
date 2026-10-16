/** Pure checks for the guided harness; intentionally distinct from the global
 * electrical short-circuit checker. Missing required components/wires block
 * the mission scene rather than letting a disconnected motor appear to move. */
import type { PlacedComponent, PlacedWire, SimFrame } from '../types';
import type { AdvancedProject } from './catalog-advanced';

export interface BuildIssue { en: string; bn: string }
export function inspectAdvancedBuild(project: AdvancedProject, components: PlacedComponent[], wires: PlacedWire[], frame: SimFrame | null): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const placed = new Map(components.map((c) => [c.id, c]));
  for (const required of project.components) {
    if (placed.get(required.id)?.partId !== required.partId) {
      issues.push({ en: `Missing: ${required.partId} (${required.id}).`, bn: `নেই: ${required.partId} (${required.id})।` });
    }
  }
  const joined = new Set(wires.filter((w) => w.from && w.to).map((w) =>
    [ `${w.from!.compId}.${w.from!.pinId}`, `${w.to!.compId}.${w.to!.pinId}` ].sort().join('|')));
  for (const { from, to } of project.essentialWires) {
    if (!placed.has(from.split('.')[0]) || !placed.has(to.split('.')[0])) continue;
    if (!joined.has([from, to].sort().join('|'))) {
      issues.push({ en: `Connect ${from} → ${to}.`, bn: `${from} → ${to} সংযোগ দিন।` });
    }
  }
  if (frame?.isShortCircuit) issues.push({ en: 'Short circuit: disconnect power and correct the wiring.', bn: 'শর্ট সার্কিট: বিদ্যুৎ খুলে তার ঠিক করুন।' });
  if (frame) for (const [id, component] of Object.entries(frame.components)) {
    if (placed.has(id) && component.burnt) {
      issues.push({ en: `${id} is damaged: stop and correct the power/wiring before resetting.`, bn: `${id} নষ্ট হয়েছে: রিসেট করার আগে বিদ্যুৎ/তার ঠিক করুন।` });
    }
  }
  if (frame && project.kind !== 'bench' && !frame.components.pdb?.powered) {
    issues.push({ en: 'The power distribution board has no valid 2S/3S supply.', bn: 'PDB-তে বৈধ 2S/3S বিদ্যুৎ নেই।' });
  }
  if (frame && project.kind === 'drone' && !frame.components.fc?.powered) {
    issues.push({ en: 'The flight controller needs regulated 5 V.', bn: 'ফ্লাইট কন্ট্রোলারে নিয়ন্ত্রিত ৫ V প্রয়োজন।' });
  }
  if (frame && project.kind === 'bench' && frame.components.bat?.burnt) {
    issues.push({ en: 'Battery fault: stop the bench and check polarity.', bn: 'ব্যাটারি ত্রুটি: বেঞ্চ বন্ধ করে পোলারিটি যাচাই করুন।' });
  }
  return issues;
}
