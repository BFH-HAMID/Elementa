import type {
  BenchItem,
  CircuitWire,
  CircuitSolverResult,
  ComponentCircuitResult
} from './physicsTypes';

/**
 * Union-Find Disjoint Set for grouping connected terminals into electrical nodes.
 */
class DisjointSet {
  parent: Map<string, string> = new Map();

  find(id: string): string {
    if (!this.parent.has(id)) {
      this.parent.set(id, id);
      return id;
    }
    const p = this.parent.get(id)!;
    if (p === id) return id;
    const root = this.find(p);
    this.parent.set(id, root);
    return root;
  }

  union(idA: string, idB: string): void {
    const rootA = this.find(idA);
    const rootB = this.find(idB);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

/**
 * Solves a linear system Ax = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  // Clone matrix & vector
  const M = A.map((row) => [...row]);
  const x = [...b];

  for (let k = 0; k < n; k++) {
    // Find pivot
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let r = k + 1; r < n; r++) {
      if (Math.abs(M[r][k]) > maxVal) {
        maxVal = Math.abs(M[r][k]);
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      // Singular or rank-deficient matrix
      return null;
    }

    // Swap rows
    if (maxRow !== k) {
      [M[k], M[maxRow]] = [M[maxRow], M[k]];
      [x[k], x[maxRow]] = [x[maxRow], x[k]];
    }

    // Eliminate below
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j];
      }
      x[i] -= factor * x[k];
    }
  }

  // Back-substitution
  const sol = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * sol[j];
    }
    sol[i] = sum / M[i][i];
  }

  return sol;
}

export interface CircuitBranch {
  id: string;
  itemId: string;
  type: 'resistor' | 'voltage_source' | 'ac_source' | 'diode' | 'switch';
  nodeA: string;
  nodeB: string;
  value: number; // Resistance in Ohms or Voltage in Volts
  internalResistance?: number;
  isClosed?: boolean;
  forwardDrop?: number;
}

/**
 * Main Circuit Solver using Modified Nodal Analysis (MNA).
 */
export function solveCircuit(
  items: BenchItem[],
  wires: CircuitWire[],
  acFrequency = 50
): CircuitSolverResult {
  if (items.length === 0) {
    return {
      solved: true,
      isOpenCircuit: true,
      isShortCircuit: false,
      nodeVoltages: {},
      componentResults: {}
    };
  }

  // 1. Group terminals into nodes using DisjointSet
  const ds = new DisjointSet();

  // Register all terminals of all items
  for (const item of items) {
    // Standard terminal naming
    const termKeys = ['t1', 't2', 'pos', 'neg', 'live', 'neutral', 'anode', 'cathode', 'common', 'bottom1', 'bottom2', 'slider', 'termA', 'termB', 'jockey', 'endA', 'endB', 'centralD', 'gapLeft1', 'gapLeft2', 'gapRight1', 'gapRight2', 'jockeyB'];
    for (const t of termKeys) {
      ds.find(`${item.id}:${t}`);
    }
  }

  // Connect terminals via wires
  for (const wire of wires) {
    // Mechanical/optical links between tools carry no current.
    if (wire.kind === 'link' || wire.fromTerminalId.startsWith('link') || wire.toTerminalId.startsWith('link')) continue;
    const tA = `${wire.fromItemId}:${wire.fromTerminalId}`;
    const tB = `${wire.toItemId}:${wire.toTerminalId}`;
    ds.union(tA, tB);
  }

  // Identify components and map to branches
  const branches: CircuitBranch[] = [];
  const voltageSources: { itemId: string; nodePos: string; nodeNeg: string; voltage: number; internalR: number }[] = [];

  for (const item of items) {
    const props = item.properties || {};

    switch (item.equipmentId) {
      case 'battery-dc': {
        const nodePos = ds.find(`${item.id}:pos`);
        const nodeNeg = ds.find(`${item.id}:neg`);
        const emf = Number(props.voltage ?? 6);
        const internalR = Number(props.internalResistance ?? 0.1);
        voltageSources.push({ itemId: item.id, nodePos, nodeNeg, voltage: emf, internalR });
        break;
      }

      case 'power-supply-variable': {
        const nodePos = ds.find(`${item.id}:pos`);
        const nodeNeg = ds.find(`${item.id}:neg`);
        const v = Number(props.voltage ?? 5);
        voltageSources.push({ itemId: item.id, nodePos, nodeNeg, voltage: v, internalR: 0.05 });
        break;
      }

      case 'ac-source': {
        const nodePos = ds.find(`${item.id}:live`);
        const nodeNeg = ds.find(`${item.id}:neutral`);
        const vRms = Number(props.voltageRms ?? 12);
        voltageSources.push({ itemId: item.id, nodePos, nodeNeg, voltage: vRms, internalR: 0.1 });
        break;
      }

      case 'switch-spst':
      case 'tap-key': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const closed = Boolean(props.closed);
        branches.push({
          id: item.id,
          itemId: item.id,
          type: 'switch',
          nodeA,
          nodeB,
          value: closed ? 1e-4 : 1e9,
          isClosed: closed
        });
        break;
      }

      case 'switch-spdt': {
        const nodeCommon = ds.find(`${item.id}:common`);
        const node1 = ds.find(`${item.id}:t1`);
        const node2 = ds.find(`${item.id}:t2`);
        const pos = String(props.selectedPosition ?? '1');
        branches.push({
          id: `${item.id}:w1`,
          itemId: item.id,
          type: 'switch',
          nodeA: nodeCommon,
          nodeB: node1,
          value: pos === '1' ? 1e-4 : 1e9
        });
        branches.push({
          id: `${item.id}:w2`,
          itemId: item.id,
          type: 'switch',
          nodeA: nodeCommon,
          nodeB: node2,
          value: pos === '2' ? 1e-4 : 1e9
        });
        break;
      }

      case 'resistor-fixed': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const r = Number(props.resistance ?? 100);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: Math.max(0.01, r) });
        break;
      }

      case 'resistance-box': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const r = Number(props.resistance ?? 50);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: Math.max(0.1, r) });
        break;
      }

      case 'rheostat': {
        const nodeA = ds.find(`${item.id}:bottom1`);
        const nodeB = ds.find(`${item.id}:bottom2`);
        const nodeC = ds.find(`${item.id}:slider`);
        const maxR = Number(props.maxResistance ?? 100);
        const slider = Number(props.sliderPosition ?? 50) / 100;
        const r1 = Math.max(0.01, maxR * slider);
        const r2 = Math.max(0.01, maxR * (1 - slider));
        branches.push({ id: `${item.id}:ac`, itemId: item.id, type: 'resistor', nodeA, nodeB: nodeC, value: r1 });
        branches.push({ id: `${item.id}:cb`, itemId: item.id, type: 'resistor', nodeA: nodeC, nodeB, value: r2 });
        break;
      }

      case 'potentiometer-wire': {
        const nodeA = ds.find(`${item.id}:termA`);
        const nodeB = ds.find(`${item.id}:termB`);
        const nodeJ = ds.find(`${item.id}:jockey`);
        const totalL = Number(props.totalLengthCm ?? 1000);
        const jockeyPos = Number(props.jockeyPositionCm ?? 350);
        const totalR = Number(props.wireResistance ?? 50);
        const frac = Math.max(0.001, Math.min(0.999, jockeyPos / totalL));
        branches.push({ id: `${item.id}:aj`, itemId: item.id, type: 'resistor', nodeA, nodeB: nodeJ, value: totalR * frac });
        branches.push({ id: `${item.id}:jb`, itemId: item.id, type: 'resistor', nodeA: nodeJ, nodeB, value: totalR * (1 - frac) });
        break;
      }

      case 'meter-bridge': {
        const nodeA = ds.find(`${item.id}:endA`);
        const nodeB = ds.find(`${item.id}:endB`);
        const nodeJ = ds.find(`${item.id}:jockeyB`);
        const jockeyPos = Number(props.jockeyPositionCm ?? 50);
        const totalR = 5.0; // standard 5 ohm meter bridge wire
        const frac = Math.max(0.001, Math.min(0.999, jockeyPos / 100));
        branches.push({ id: `${item.id}:aj`, itemId: item.id, type: 'resistor', nodeA, nodeB: nodeJ, value: totalR * frac });
        branches.push({ id: `${item.id}:jb`, itemId: item.id, type: 'resistor', nodeA: nodeJ, nodeB, value: totalR * (1 - frac) });
        break;
      }

      case 'incandescent-bulb': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const coldR = Number(props.filamentColdResistance ?? 4);
        const isBurned = Boolean(item.burnedOut);
        branches.push({
          id: item.id,
          itemId: item.id,
          type: 'resistor',
          nodeA,
          nodeB,
          value: isBurned ? 1e9 : coldR
        });
        break;
      }

      case 'ammeter-dc': {
        const nodePos = ds.find(`${item.id}:pos`);
        const nodeNeg = ds.find(`${item.id}:neg`);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA: nodePos, nodeB: nodeNeg, value: 0.001 });
        break;
      }

      case 'voltmeter-dc': {
        const nodePos = ds.find(`${item.id}:pos`);
        const nodeNeg = ds.find(`${item.id}:neg`);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA: nodePos, nodeB: nodeNeg, value: 1e7 });
        break;
      }

      case 'galvanometer': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const rg = Number(props.internalResistance ?? 100);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: rg });
        break;
      }

      case 'digital-multimeter': {
        const nodeRed = ds.find(`${item.id}:red`);
        const nodeBlack = ds.find(`${item.id}:black`);
        const mode = String(props.mode ?? 'V_DC');
        const internalR = mode.startsWith('I_') ? 0.01 : 1e7;
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA: nodeRed, nodeB: nodeBlack, value: internalR });
        break;
      }

      case 'capacitor': {
        const nodeA = ds.find(`${item.id}:pos`);
        const nodeB = ds.find(`${item.id}:neg`);
        const capUf = Number(props.capacitanceMicroFarad ?? 100);
        // AC Reactance XC = 1 / (2*pi*f*C), DC = 1e8 ohm
        const xc = acFrequency > 0 ? 1 / (2 * Math.PI * acFrequency * (capUf * 1e-6)) : 1e8;
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: Math.max(0.1, xc) });
        break;
      }

      case 'inductor': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const indMh = Number(props.inductanceMilliHenry ?? 50);
        const dcR = Number(props.dcResistance ?? 1.2);
        // AC Reactance XL = 2*pi*f*L + dcR
        const xl = 2 * Math.PI * acFrequency * (indMh * 1e-3) + dcR;
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: Math.max(0.1, xl) });
        break;
      }

      case 'diode-pn': {
        const nodeA = ds.find(`${item.id}:anode`);
        const nodeK = ds.find(`${item.id}:cathode`);
        branches.push({ id: item.id, itemId: item.id, type: 'diode', nodeA, nodeB: nodeK, value: 0.5, forwardDrop: 0.7 });
        break;
      }

      case 'led': {
        const nodeA = ds.find(`${item.id}:anode`);
        const nodeK = ds.find(`${item.id}:cathode`);
        const vf = Number(props.forwardVoltage ?? 2.0);
        branches.push({ id: item.id, itemId: item.id, type: 'diode', nodeA, nodeB: nodeK, value: 10, forwardDrop: vf });
        break;
      }

      case 'immersion-heater': {
        const nodeA = ds.find(`${item.id}:t1`);
        const nodeB = ds.find(`${item.id}:t2`);
        const r = Number(props.coilResistance ?? 5);
        branches.push({ id: item.id, itemId: item.id, type: 'resistor', nodeA, nodeB, value: Math.max(0.1, r) });
        break;
      }

      default:
        break;
    }
  }

  // If no voltage source exists, return zero results
  if (voltageSources.length === 0) {
    const componentResults: Record<string, ComponentCircuitResult> = {};
    for (const item of items) {
      componentResults[item.id] = {
        itemId: item.id,
        voltageDrop: 0,
        current: 0,
        power: 0,
        burnedOut: Boolean(item.burnedOut),
        displayReading: 0,
        displayUnit: item.equipmentId === 'ammeter-dc' ? 'A' : 'V'
      };
    }
    return {
      solved: true,
      isOpenCircuit: true,
      isShortCircuit: false,
      nodeVoltages: {},
      componentResults
    };
  }

  // Collect all unique node IDs
  const allNodes = new Set<string>();
  for (const b of branches) {
    allNodes.add(b.nodeA);
    allNodes.add(b.nodeB);
  }
  for (const vs of voltageSources) {
    allNodes.add(vs.nodePos);
    allNodes.add(vs.nodeNeg);
  }

  const nodeList = Array.from(allNodes);
  // Pick ground node: negative of first voltage source, or first node
  const groundNode = voltageSources[0]?.nodeNeg || nodeList[0];
  const nonGroundNodes = nodeList.filter((n) => n !== groundNode);
  const nodeIndexMap = new Map<string, number>();
  nonGroundNodes.forEach((node, idx) => nodeIndexMap.set(node, idx));

  const N = nonGroundNodes.length;
  const M = voltageSources.length;
  const totalDim = N + M;

  if (totalDim === 0) {
    return {
      solved: true,
      isOpenCircuit: true,
      isShortCircuit: false,
      nodeVoltages: { [groundNode]: 0 },
      componentResults: {}
    };
  }

  // Iterate to handle diodes/non-linear elements (up to 6 iterations)
  let nodeVoltages: Record<string, number> = { [groundNode]: 0 };
  let currentSol: number[] = new Array(totalDim).fill(0);
  let isShortCircuit = false;

  for (let iter = 0; iter < 6; iter++) {
    const A: number[][] = Array.from({ length: totalDim }, () => new Array(totalDim).fill(0));
    const z: number[] = new Array(totalDim).fill(0);

    // Stamp conductance for passive branches
    for (const b of branches) {
      let g = 1 / b.value;

      if (b.type === 'diode') {
        const vA = nodeVoltages[b.nodeA] ?? 0;
        const vB = nodeVoltages[b.nodeB] ?? 0;
        const vDrop = vA - vB;
        if (vDrop < (b.forwardDrop ?? 0.7)) {
          g = 1e-8; // reverse biased / cut off
        } else {
          g = 1 / (b.value); // conducting
        }
      }

      const idxA = nodeIndexMap.get(b.nodeA);
      const idxB = nodeIndexMap.get(b.nodeB);

      if (idxA !== undefined) A[idxA][idxA] += g;
      if (idxB !== undefined) A[idxB][idxB] += g;
      if (idxA !== undefined && idxB !== undefined) {
        A[idxA][idxB] -= g;
        A[idxB][idxA] -= g;
      }
    }

    // Stamp voltage sources
    for (let k = 0; k < M; k++) {
      const vs = voltageSources[k];
      const row = N + k;
      const idxPos = nodeIndexMap.get(vs.nodePos);
      const idxNeg = nodeIndexMap.get(vs.nodeNeg);

      if (idxPos !== undefined) {
        A[row][idxPos] = 1;
        A[idxPos][row] = 1;
      }
      if (idxNeg !== undefined) {
        A[row][idxNeg] = -1;
        A[idxNeg][row] = -1;
      }

      // Internal resistance of voltage source
      if (vs.internalR > 0) {
        A[row][row] = -vs.internalR;
      }

      z[row] = vs.voltage;
    }

    const sol = solveLinearSystem(A, z);
    if (!sol) {
      // Numerical singularity -> open circuit or singular topology
      break;
    }

    currentSol = sol;
    nonGroundNodes.forEach((node, i) => {
      nodeVoltages[node] = sol[i];
    });
  }

  // Compute component circuit results
  const componentResults: Record<string, ComponentCircuitResult> = {};

  for (const item of items) {
    const props = item.properties || {};
    let vDrop = 0;
    let branchCurrent = 0;
    let polarityError = false;

    switch (item.equipmentId) {
      case 'battery-dc':
      case 'power-supply-variable':
      case 'ac-source': {
        const posKey = item.equipmentId === 'ac-source' ? 'live' : 'pos';
        const negKey = item.equipmentId === 'ac-source' ? 'neutral' : 'neg';
        const nPos = ds.find(`${item.id}:${posKey}`);
        const nNeg = ds.find(`${item.id}:${negKey}`);
        const vP = nodeVoltages[nPos] ?? 0;
        const vN = nodeVoltages[nNeg] ?? 0;
        vDrop = vP - vN;

        // Find voltage source current in MNA solution
        const vsIdx = voltageSources.findIndex((v) => v.itemId === item.id);
        if (vsIdx >= 0) {
          branchCurrent = Math.abs(currentSol[N + vsIdx] || 0);
          if (branchCurrent > 15) {
            isShortCircuit = true;
          }
        }
        break;
      }

      case 'resistor-fixed':
      case 'resistance-box':
      case 'incandescent-bulb':
      case 'immersion-heater': {
        const n1 = ds.find(`${item.id}:t1`);
        const n2 = ds.find(`${item.id}:t2`);
        const v1 = nodeVoltages[n1] ?? 0;
        const v2 = nodeVoltages[n2] ?? 0;
        vDrop = Math.abs(v1 - v2);
        const r = item.equipmentId === 'resistor-fixed' ? Number(props.resistance ?? 100)
          : item.equipmentId === 'resistance-box' ? Number(props.resistance ?? 50)
          : item.equipmentId === 'immersion-heater' ? Number(props.coilResistance ?? 5)
          : Number(props.filamentColdResistance ?? 4);
        branchCurrent = r > 0 ? vDrop / r : 0;
        break;
      }

      case 'ammeter-dc': {
        const nPos = ds.find(`${item.id}:pos`);
        const nNeg = ds.find(`${item.id}:neg`);
        const vP = nodeVoltages[nPos] ?? 0;
        const vN = nodeVoltages[nNeg] ?? 0;
        const netV = vP - vN;
        branchCurrent = netV / 0.001; // internal R = 0.001
        if (branchCurrent < -1e-6) {
          polarityError = true;
        }
        vDrop = Math.abs(netV);
        break;
      }

      case 'voltmeter-dc': {
        const nPos = ds.find(`${item.id}:pos`);
        const nNeg = ds.find(`${item.id}:neg`);
        const vP = nodeVoltages[nPos] ?? 0;
        const vN = nodeVoltages[nNeg] ?? 0;
        const netV = vP - vN;
        if (netV < -1e-6) {
          polarityError = true;
        }
        vDrop = Math.max(0, netV);
        branchCurrent = vDrop / 1e7;
        break;
      }

      case 'galvanometer': {
        const n1 = ds.find(`${item.id}:t1`);
        const n2 = ds.find(`${item.id}:t2`);
        const v1 = nodeVoltages[n1] ?? 0;
        const v2 = nodeVoltages[n2] ?? 0;
        const rg = Number(props.internalResistance ?? 100);
        const netV = v1 - v2;
        branchCurrent = netV / rg;
        vDrop = Math.abs(netV);
        break;
      }

      case 'digital-multimeter': {
        const nRed = ds.find(`${item.id}:red`);
        const nBlk = ds.find(`${item.id}:black`);
        const vR = nodeVoltages[nRed] ?? 0;
        const vB = nodeVoltages[nBlk] ?? 0;
        vDrop = vR - vB;
        branchCurrent = Math.abs(vDrop / 1e7);
        break;
      }

      case 'diode-pn':
      case 'led': {
        const nA = ds.find(`${item.id}:anode`);
        const nK = ds.find(`${item.id}:cathode`);
        const vA = nodeVoltages[nA] ?? 0;
        const vK = nodeVoltages[nK] ?? 0;
        const netV = vA - vK;
        const vf = item.equipmentId === 'led' ? Number(props.forwardVoltage ?? 2.0) : 0.7;
        if (netV > vf) {
          branchCurrent = (netV - vf) / (item.equipmentId === 'led' ? 10 : 0.5);
        } else {
          branchCurrent = 0;
        }
        vDrop = Math.max(0, netV);
        break;
      }

      default:
        break;
    }

    const power = vDrop * Math.abs(branchCurrent);
    let burnedOut = Boolean(item.burnedOut);

    // Bulb burnout detection
    if (item.equipmentId === 'incandescent-bulb') {
      const ratedP = Number(props.ratedPower ?? 3);
      if (power > ratedP * 1.8) {
        burnedOut = true;
      }
    }

    // Meter deflection or display calculation
    let deflection = 0;
    let displayReading = 0;
    let displayUnit = '';

    if (item.equipmentId === 'ammeter-dc') {
      displayReading = Number((polarityError ? 0 : Math.abs(branchCurrent)).toFixed(3));
      displayUnit = 'A';
    } else if (item.equipmentId === 'voltmeter-dc') {
      displayReading = Number((polarityError ? 0 : vDrop).toFixed(2));
      displayUnit = 'V';
    } else if (item.equipmentId === 'galvanometer') {
      const sens = Number(props.sensitivityMicroAmpPerDiv ?? 20); // uA per div
      const microAmps = branchCurrent * 1e6;
      deflection = Math.max(-30, Math.min(30, Number((microAmps / sens).toFixed(1))));
      displayReading = deflection;
      displayUnit = 'div';
    } else if (item.equipmentId === 'digital-multimeter') {
      const mode = String(props.mode ?? 'V_DC');
      if (mode === 'V_DC' || mode === 'V_AC') {
        displayReading = Number(vDrop.toFixed(3));
        displayUnit = 'V';
      } else if (mode === 'I_DC') {
        displayReading = Number(Math.abs(branchCurrent).toFixed(3));
        displayUnit = 'A';
      } else if (mode === 'RESISTANCE') {
        displayReading = branchCurrent > 1e-9 ? Number((vDrop / branchCurrent).toFixed(1)) : 999999;
        displayUnit = 'Ω';
      } else {
        displayReading = vDrop < 0.1 ? 1 : 0;
        displayUnit = '';
      }
    }

    componentResults[item.id] = {
      itemId: item.id,
      voltageDrop: Number(vDrop.toFixed(4)),
      current: Number(Math.abs(branchCurrent).toFixed(5)),
      power: Number(power.toFixed(4)),
      burnedOut,
      deflection,
      displayReading,
      displayUnit,
      polarityError
    };
  }

  const isOpenCircuit = Object.values(componentResults).every((r) => r.current < 1e-7);

  return {
    solved: true,
    isOpenCircuit,
    isShortCircuit,
    nodeVoltages,
    componentResults
  };
}
