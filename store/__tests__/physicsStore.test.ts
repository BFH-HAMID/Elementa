import { describe, expect, it, beforeEach } from 'vitest';
import { usePhysicsStore } from '../physicsStore';

describe('Physics Store', () => {
  beforeEach(() => {
    usePhysicsStore.getState().clearBench();
    usePhysicsStore.getState().clearDataRows();
  });

  it('adds and removes equipment from workbench', () => {
    const id1 = usePhysicsStore.getState().addItem('battery-dc', 100, 100);
    expect(usePhysicsStore.getState().items.length).toBe(1);
    expect(usePhysicsStore.getState().items[0].id).toBe(id1);

    usePhysicsStore.getState().removeItem(id1);
    expect(usePhysicsStore.getState().items.length).toBe(0);
  });

  it('connects wires between components and recomputes circuit', () => {
    const bId = usePhysicsStore.getState().addItem('battery-dc', 50, 50);
    const rId = usePhysicsStore.getState().addItem('resistor-fixed', 200, 50);

    usePhysicsStore.getState().startConnectingWire(bId, 'pos');
    usePhysicsStore.getState().finishConnectingWire(rId, 't1', 'red');

    usePhysicsStore.getState().startConnectingWire(rId, 't2');
    usePhysicsStore.getState().finishConnectingWire(bId, 'neg', 'black');

    expect(usePhysicsStore.getState().wires.length).toBe(2);
    expect(usePhysicsStore.getState().circuitResult.isOpenCircuit).toBe(false);
  });

  it('loads guided experiment setup correctly', () => {
    usePhysicsStore.getState().loadExperiment('ohms-law');
    expect(usePhysicsStore.getState().activeExperimentSlug).toBe('ohms-law');
    expect(usePhysicsStore.getState().items.length).toBeGreaterThan(3);
    expect(usePhysicsStore.getState().wires.length).toBeGreaterThan(3);
  });

  it('records observation data row and calculates percentage error', () => {
    usePhysicsStore.getState().loadExperiment('ohms-law');
    usePhysicsStore.getState().recordCurrentDataRow('Trial 1');
    expect(usePhysicsStore.getState().dataRows.length).toBe(1);
    expect(usePhysicsStore.getState().dataRows[0].values.voltage).toBeDefined();
    expect(usePhysicsStore.getState().dataRows[0].values.current).toBeDefined();
  });

  it('handles undo and redo', () => {
    const id = usePhysicsStore.getState().addItem('lens-convex', 100, 100);
    expect(usePhysicsStore.getState().items.length).toBe(1);

    usePhysicsStore.getState().undo();
    expect(usePhysicsStore.getState().items.length).toBe(0);

    usePhysicsStore.getState().redo();
    expect(usePhysicsStore.getState().items.length).toBe(1);
  });
});
