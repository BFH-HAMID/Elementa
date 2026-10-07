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

  it('connects any two tools: electrical wires and non-electrical links', () => {
    const s = usePhysicsStore.getState;
    const lens = s().addItem('lens-convex', 100, 100);
    const screen = s().addItem('projection-screen', 300, 100);
    const wireId = s().connectPorts({ itemId: lens, terminalId: 'linkR' }, { itemId: screen, terminalId: 'linkL' });
    expect(wireId).toBeTruthy();
    expect(s().wires[0].kind).toBe('link');

    // Connecting the same pair again does not stack a duplicate wire.
    s().connectPorts({ itemId: screen, terminalId: 'linkL' }, { itemId: lens, terminalId: 'linkR' });
    expect(s().wires.length).toBe(1);

    // A port can't be connected to itself.
    expect(s().connectPorts({ itemId: lens, terminalId: 'linkR' }, { itemId: lens, terminalId: 'linkR' })).toBeNull();
  });

  it('links never close an electrical circuit', () => {
    const s = usePhysicsStore.getState;
    const b = s().addItem('battery-dc', 50, 50);
    const r = s().addItem('resistor-fixed', 250, 50);
    s().connectPorts({ itemId: b, terminalId: 'pos' }, { itemId: r, terminalId: 't1' });
    s().connectPorts({ itemId: r, terminalId: 't2' }, { itemId: b, terminalId: 'neg' });
    expect(s().circuitResult.isOpenCircuit).toBe(false);
    expect(s().wires.every((w) => w.kind === 'wire')).toBe(true);
  });

  it('places new tools without overlapping and makes drags undoable', () => {
    const s = usePhysicsStore.getState;
    const a = s().addItem('battery-dc');
    const b = s().addItem('battery-dc');
    const ia = s().items.find((it) => it.id === a)!;
    const ib = s().items.find((it) => it.id === b)!;
    expect(ia.x !== ib.x || ia.y !== ib.y).toBe(true);

    s().pushHistory();
    s().moveItem(a, 400, 300);
    expect(s().items.find((it) => it.id === a)!.x).toBe(400);
    s().undo();
    expect(s().items.find((it) => it.id === a)!.x).toBe(ia.x);
  });

  it('duplicates a tool with its properties', () => {
    const s = usePhysicsStore.getState;
    const r = s().addItem('resistor-fixed', 100, 100);
    s().updateItemProperties(r, { resistance: 47 });
    const copy = s().duplicateItem(r);
    expect(s().items.find((it) => it.id === copy)!.properties.resistance).toBe(47);
  });
});
