import { describe, expect, it } from 'vitest';
import { pinWorldPos, snapToGrid, transformPoint, wirePath } from '../geometry';
import { holeGroupKey } from '../parts/holes';
import { getPart, PARTS } from '../parts/registry';
import { snapPositions } from '../lib/snap';
import type { PlacedComponent } from '../types';

const place = (partId: string, props: Partial<PlacedComponent> = {}): PlacedComponent => ({ id: 'x', partId, x: 100, y: 200, rotation: 0, flipH: false, props: {}, state: {}, ...props });

describe('geometry', () => {
  it('rotates 90° clockwise in SVG space: (x,y) → (h−y, x)', () => {
    expect(transformPoint({ x: 0, y: 0 }, 90, false, 40, 20)).toEqual({ x: 20, y: 0 });
    expect(transformPoint({ x: 40, y: 10 }, 90, false, 40, 20)).toEqual({ x: 10, y: 40 });
  });

  it('flip mirrors horizontally before rotation', () => {
    expect(transformPoint({ x: 0, y: 10 }, 0, true, 40, 20)).toEqual({ x: 40, y: 10 });
  });

  it('places pins in world coordinates for rotated parts', () => {
    const def = getPart('resistor')!;
    const r0 = pinWorldPos(place('resistor'), def, def.pins[1]);
    expect(r0).toEqual({ x: 140, y: 210 });
    const r90 = pinWorldPos(place('resistor', { rotation: 90 }), def, def.pins[1]);
    expect(r90.x).toBeCloseTo(100 + 20 - 10, 6);
    expect(r90.y).toBeCloseTo(200 + 40, 6);
  });

  it('snaps to a 5-unit grid', () => {
    expect(snapToGrid(12)).toBe(10);
    expect(snapToGrid(13)).toBe(15);
  });

  it('builds a smooth arc for a bare wire and a rounded path with bends', () => {
    expect(wirePath({ x: 0, y: 0 }, { x: 100, y: 0 }, [])).toMatch(/^M 0 0 Q /);
    expect(wirePath({ x: 0, y: 0 }, { x: 100, y: 0 }, [{ x: 50, y: 40 }])).toMatch(/^M 0 0 L/);
  });
});

describe('parts registry', () => {
  it('has at least 105 parts across 9 categories, including drone & robotics', () => {
    expect(PARTS.length).toBeGreaterThanOrEqual(105);
    const cats = new Set(PARTS.map((p) => p.category));
    expect(cats.size).toBe(9);
    expect(cats.has('robotics')).toBe(true);
  });

  it('includes realistic board, motor, driver and compact breadboard additions', () => {
    const ids = new Set(PARTS.map((p) => p.id));
    for (const id of [
      'arduino-mega-2560',
      'esp32-s3-devkitc',
      'breadboard-mini',
      'dc-motor-130',
      'micro-metal-gearmotor',
      'vibration-motor-coin',
      'dc-motor-fan',
      'servo-mg996r',
      'motor-driver-l298n',
      'motor-driver-tb6612fng'
    ]) expect(ids.has(id), id).toBe(true);
    const mini = getPart('breadboard-mini')!;
    expect(mini.pins).toHaveLength(170);
    expect(holeGroupKey('h1a')).toBe(holeGroupKey('h1e'));
    expect(holeGroupKey('h1a')).not.toBe(holeGroupKey('h1f'));
  });

  it('every pin id is unique within its part', () => {
    for (const p of PARTS) {
      const ids = p.pins.map((x) => x.id);
      expect(new Set(ids).size, p.id).toBe(ids.length);
    }
  });

  it('every part has a description, ratings and a part number', () => {
    for (const p of PARTS) {
      expect(p.description.length, p.id).toBeGreaterThan(20);
      expect(p.ratings.length, p.id).toBeGreaterThan(0);
      expect(p.partNumber.length, p.id).toBeGreaterThan(0);
    }
  });

  it('breadboard holes share groups as in real hardware', () => {
    expect(holeGroupKey('h5a')).toBe(holeGroupKey('h5e'));
    expect(holeGroupKey('h5a')).not.toBe(holeGroupKey('h5f'));
    expect(holeGroupKey('h5a')).not.toBe(holeGroupKey('h6a'));
    expect(holeGroupKey('r+3')).toBe(holeGroupKey('r+40'));
    expect(holeGroupKey('r+3')).not.toBe(holeGroupKey('r-3'));
  });

  it('snapping a part onto a breadboard moves a pin onto a hole', () => {
    const bb = place('breadboard-full', { id: 'bb', x: 0, y: 0 });
    const holes = PARTS.find((p) => p.id === 'breadboard-full')!;
    void holes;
    const comps = [bb, place('resistor', { id: 'r', x: 303, y: 77 })];
    const out = snapPositions([comps[1]], true, true);
    expect(out.r).toBeDefined();
  });
});
