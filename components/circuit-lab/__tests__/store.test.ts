import { beforeEach, describe, expect, it } from 'vitest';
import { useCircuitStore } from '@/store/circuitStore';
import { EXAMPLE_PROJECTS } from '../projects/examples';
import { CircuitEngine } from '../simulator/engine';
import { billOfMaterials, checkCircuit } from '../lib/analysis';
import { PARTS } from '../parts/registry';

describe('circuit store', () => {
  beforeEach(() => {
    useCircuitStore.getState().loadExample('led-blink');
    useCircuitStore.setState({ past: [], future: [] });
  });

  it('undo and redo restore component lists', () => {
    const st = useCircuitStore.getState();
    const before = st.components.length;
    st.addComponent('resistor', 0, 0);
    expect(useCircuitStore.getState().components.length).toBe(before + 1);
    useCircuitStore.getState().undo();
    expect(useCircuitStore.getState().components.length).toBe(before);
    useCircuitStore.getState().redo();
    expect(useCircuitStore.getState().components.length).toBe(before + 1);
  });

  it('duplicate keeps internal wires between copied parts', () => {
    const { components } = useCircuitStore.getState();
    const ids = components.map((c) => c.id);
    useCircuitStore.getState().select(ids, []);
    const wiresBefore = useCircuitStore.getState().wires.length;
    useCircuitStore.getState().duplicateSelection();
    expect(useCircuitStore.getState().components.length).toBe(components.length * 2);
    expect(useCircuitStore.getState().wires.length).toBeGreaterThanOrEqual(wiresBefore);
  });

  it('rotation cycles through 0/90/180/270', () => {
    const st = useCircuitStore.getState();
    const id = st.addComponent('resistor', 0, 0);
    for (let i = 0; i < 4; i++) useCircuitStore.getState().rotateSelection(1);
    const comp = useCircuitStore.getState().components.find((c) => c.id === id)!;
    expect(comp.rotation).toBe(0);
  });

  it('all catalog parts can be moved, rotated, flipped, duplicated and deleted', () => {
    useCircuitStore.getState().newProject();
    const ids = PARTS.map((part, i) => useCircuitStore.getState().addComponent(part.id, i * 5, i * 10));
    const st = useCircuitStore.getState();
    st.select(ids, []);
    st.moveComponents(ids, 25, 35);
    st.rotateSelection(1);
    st.flipSelection();
    const placed = useCircuitStore.getState().components;
    expect(placed).toHaveLength(PARTS.length);
    for (const comp of placed) {
      expect(comp.x).toBeGreaterThanOrEqual(25);
      expect(comp.y).toBeGreaterThanOrEqual(35);
      expect(comp.rotation).toBe(90);
      expect(comp.flipH).toBe(true);
    }

    useCircuitStore.getState().duplicateSelection();
    expect(useCircuitStore.getState().components).toHaveLength(PARTS.length * 2);
    const copies = useCircuitStore.getState().selectedComps;
    useCircuitStore.getState().deleteSelection();
    expect(useCircuitStore.getState().components.map((c) => c.id).sort()).toEqual(ids.sort());
    expect(useCircuitStore.getState().components.some((c) => copies.includes(c.id))).toBe(false);
  });

  it('every example loads and has a non-empty BOM', () => {
    for (const ex of EXAMPLE_PROJECTS) {
      useCircuitStore.getState().loadExample(ex.id);
      expect(billOfMaterials(useCircuitStore.getState().components).length).toBeGreaterThan(0);
    }
  });

  it('the Check-circuit validator flags a board without GND', () => {
    const ex = EXAMPLE_PROJECTS.find((e) => e.id === 'servo-sweep')!;
    const comps = ex.components;
    const issues = checkCircuit(comps, ex.wires.filter((w) => !(w.to?.pinId === 'GND_B1' || w.from?.pinId === 'GND_B1')));
    expect(issues.some((i) => i.level === 'error' && /GND|ground/i.test(i.text.en))).toBe(true);
  });

  it('the Uno blink example lights its LED through breadboard holes', () => {
    const ex = EXAMPLE_PROJECTS.find((e) => e.id === 'led-blink')!;
    const engine = new CircuitEngine();
    engine.tick({ components: ex.components, wires: ex.wires, wallMs: 16, speed: 1, running: false });
    let peak = 0;
    for (let i = 0; i < 60; i++) {
      const f = engine.tick({ components: ex.components, wires: ex.wires, wallMs: 16, speed: 1, running: true }).frame;
      peak = Math.max(peak, f.components.led1?.glow ?? 0);
    }
    expect(peak).toBeGreaterThan(0.5);
  });
});
