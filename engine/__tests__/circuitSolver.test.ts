import { describe, expect, it } from 'vitest';
import { solveCircuit } from '../circuitSolver';
import type { BenchItem, CircuitWire } from '../physicsTypes';

describe('Circuit Solver Engine (MNA)', () => {
  it('solves simple Ohm’s law circuit: V = 6V, R = 10Ω -> I = 0.6A', () => {
    const items: BenchItem[] = [
      {
        id: 'batt-1',
        equipmentId: 'battery-dc',
        x: 0,
        y: 0,
        rotation: 0,
        properties: { voltage: 6, internalResistance: 0 },
        state: {}
      },
      {
        id: 'res-1',
        equipmentId: 'resistor-fixed',
        x: 100,
        y: 0,
        rotation: 0,
        properties: { resistance: 10 },
        state: {}
      },
      {
        id: 'amm-1',
        equipmentId: 'ammeter-dc',
        x: 200,
        y: 0,
        rotation: 0,
        properties: { maxRange: 3 },
        state: {}
      }
    ];

    const wires: CircuitWire[] = [
      { id: 'w1', fromItemId: 'batt-1', fromTerminalId: 'pos', toItemId: 'amm-1', toTerminalId: 'pos', color: 'red' },
      { id: 'w2', fromItemId: 'amm-1', fromTerminalId: 'neg', toItemId: 'res-1', toTerminalId: 't1', color: 'red' },
      { id: 'w3', fromItemId: 'res-1', fromTerminalId: 't2', toItemId: 'batt-1', toTerminalId: 'neg', color: 'black' }
    ];

    const result = solveCircuit(items, wires);
    expect(result.solved).toBe(true);
    expect(result.isOpenCircuit).toBe(false);
    expect(result.componentResults['res-1'].current).toBeCloseTo(0.6, 2);
    expect(result.componentResults['amm-1'].displayReading).toBeCloseTo(0.6, 2);
  });

  it('solves series combination of two resistors (10Ω + 20Ω = 30Ω) with 6V battery -> I = 0.2A', () => {
    const items: BenchItem[] = [
      {
        id: 'batt-1',
        equipmentId: 'battery-dc',
        x: 0,
        y: 0,
        rotation: 0,
        properties: { voltage: 6, internalResistance: 0 },
        state: {}
      },
      {
        id: 'res-1',
        equipmentId: 'resistor-fixed',
        x: 100,
        y: 0,
        rotation: 0,
        properties: { resistance: 10 },
        state: {}
      },
      {
        id: 'res-2',
        equipmentId: 'resistor-fixed',
        x: 200,
        y: 0,
        rotation: 0,
        properties: { resistance: 20 },
        state: {}
      }
    ];

    const wires: CircuitWire[] = [
      { id: 'w1', fromItemId: 'batt-1', fromTerminalId: 'pos', toItemId: 'res-1', toTerminalId: 't1', color: 'red' },
      { id: 'w2', fromItemId: 'res-1', fromTerminalId: 't2', toItemId: 'res-2', toTerminalId: 't1', color: 'blue' },
      { id: 'w3', fromItemId: 'res-2', fromTerminalId: 't2', toItemId: 'batt-1', toTerminalId: 'neg', color: 'black' }
    ];

    const result = solveCircuit(items, wires);
    expect(result.componentResults['res-1'].current).toBeCloseTo(0.2, 2);
    expect(result.componentResults['res-2'].current).toBeCloseTo(0.2, 2);
    expect(result.componentResults['res-1'].voltageDrop).toBeCloseTo(2.0, 2);
    expect(result.componentResults['res-2'].voltageDrop).toBeCloseTo(4.0, 2);
  });

  it('detects open circuit when switch is open', () => {
    const items: BenchItem[] = [
      {
        id: 'batt-1',
        equipmentId: 'battery-dc',
        x: 0,
        y: 0,
        rotation: 0,
        properties: { voltage: 6 },
        state: {}
      },
      {
        id: 'sw-1',
        equipmentId: 'switch-spst',
        x: 100,
        y: 0,
        rotation: 0,
        properties: { closed: false },
        state: {}
      },
      {
        id: 'res-1',
        equipmentId: 'resistor-fixed',
        x: 200,
        y: 0,
        rotation: 0,
        properties: { resistance: 10 },
        state: {}
      }
    ];

    const wires: CircuitWire[] = [
      { id: 'w1', fromItemId: 'batt-1', fromTerminalId: 'pos', toItemId: 'sw-1', toTerminalId: 't1', color: 'red' },
      { id: 'w2', fromItemId: 'sw-1', fromTerminalId: 't2', toItemId: 'res-1', toTerminalId: 't1', color: 'red' },
      { id: 'w3', fromItemId: 'res-1', fromTerminalId: 't2', toItemId: 'batt-1', toTerminalId: 'neg', color: 'black' }
    ];

    const result = solveCircuit(items, wires);
    expect(result.isOpenCircuit).toBe(true);
    expect(result.componentResults['res-1'].current).toBeLessThan(1e-5);
  });

  it('detects bulb burnout when overpowered', () => {
    const items: BenchItem[] = [
      {
        id: 'batt-1',
        equipmentId: 'battery-dc',
        x: 0,
        y: 0,
        rotation: 0,
        properties: { voltage: 24, internalResistance: 0 },
        state: {}
      },
      {
        id: 'bulb-1',
        equipmentId: 'incandescent-bulb',
        x: 100,
        y: 0,
        rotation: 0,
        properties: { ratedVoltage: 6, ratedPower: 3, filamentColdResistance: 4 },
        state: {}
      }
    ];

    const wires: CircuitWire[] = [
      { id: 'w1', fromItemId: 'batt-1', fromTerminalId: 'pos', toItemId: 'bulb-1', toTerminalId: 't1', color: 'red' },
      { id: 'w2', fromItemId: 'bulb-1', fromTerminalId: 't2', toItemId: 'batt-1', toTerminalId: 'neg', color: 'black' }
    ];

    const result = solveCircuit(items, wires);
    expect(result.componentResults['bulb-1'].burnedOut).toBe(true);
  });
});
