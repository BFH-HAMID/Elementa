import { describe, expect, it } from 'vitest';
import type { BenchItem } from '@/engine/physicsTypes';
import { findFreeSpot, findPortNear, getPorts, portPosition } from '../physicsBench';
import { equipmentById } from '../physicsData';

const item = (id: string, equipmentId: string, x: number, y: number, rotation = 0): BenchItem => ({
  id,
  equipmentId,
  x,
  y,
  rotation,
  properties: {},
  state: {}
});

describe('physics bench geometry', () => {
  it('gives every tool at least one connectable port', () => {
    for (const def of equipmentById.values()) {
      expect(getPorts(def).length).toBeGreaterThan(0);
    }
  });

  it('rotates port positions with the tool', () => {
    // resistor-fixed: 100 x 50, t1 at (10%, 50%)
    const flat = portPosition(item('r', 'resistor-fixed', 0, 0), 't1')!;
    expect(flat.x).toBeCloseTo(10);
    expect(flat.y).toBeCloseTo(25);
    const turned = portPosition(item('r', 'resistor-fixed', 0, 0, 90), 't1')!;
    expect(turned.x).toBeCloseTo(50);
    expect(turned.y).toBeCloseTo(-15);
  });

  it('snaps to the nearest port, or to a port of the tool under the pointer', () => {
    const items = [item('b', 'battery-dc', 0, 0), item('r', 'resistor-fixed', 300, 0)];
    const nearPos = portPosition(items[0], 'pos')!;
    expect(findPortNear(items, { x: nearPos.x + 5, y: nearPos.y }, null)).toEqual({ itemId: 'b', terminalId: 'pos' });
    // Pointer on the resistor's right half → its right terminal.
    expect(findPortNear(items, { x: 380, y: 20 }, { itemId: 'b', terminalId: 'pos' })).toEqual({ itemId: 'r', terminalId: 't2' });
    expect(findPortNear(items, { x: 700, y: 700 }, null)).toBeNull();
  });

  it('finds a free spot that does not overlap existing tools', () => {
    const items = [item('b', 'battery-dc', 40, 40)];
    const spot = findFreeSpot(items, equipmentById.get('battery-dc'));
    expect(spot.x >= 40 + 120 || spot.y >= 40 + 70).toBe(true);
  });
});
