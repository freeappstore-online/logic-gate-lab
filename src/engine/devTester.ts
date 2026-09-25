import { CircuitState, CircuitNode, Wire } from './types';
import { createNode, stepCircuit } from './circuit';
import { PRESET_CIRCUITS } from './presets';

export interface TestResult {
  id: string;
  name: string;
  category: 'Primitives' | 'Arithmetic' | 'Sequential' | 'Engine Safety';
  status: 'passed' | 'failed';
  durationMs: number;
  details: string;
  expected?: string;
  actual?: string;
}

export interface CircuitHealthStats {
  nodeCount: number;
  wireCount: number;
  highWireCount: number;
  lowWireCount: number;
  floatingInputs: number;
  floatingOutputs: number;
  isOscillating: boolean;
  tickExecutionMs: number;
}

/**
 * Runs the full digital logic automated test suite.
 */
export function runDevTestSuite(): TestResult[] {
  const results: TestResult[] = [];

  // 1. Primitive Gate Tests
  const gateTests: Array<{
    type: 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';
    cases: Array<{ a: boolean; b: boolean; expected: boolean }>;
  }> = [
    {
      type: 'AND',
      cases: [
        { a: false, b: false, expected: false },
        { a: false, b: true, expected: false },
        { a: true, b: false, expected: false },
        { a: true, b: true, expected: true },
      ],
    },
    {
      type: 'OR',
      cases: [
        { a: false, b: false, expected: false },
        { a: false, b: true, expected: true },
        { a: true, b: false, expected: true },
        { a: true, b: true, expected: true },
      ],
    },
    {
      type: 'NAND',
      cases: [
        { a: false, b: false, expected: true },
        { a: false, b: true, expected: true },
        { a: true, b: false, expected: true },
        { a: true, b: true, expected: false },
      ],
    },
    {
      type: 'NOR',
      cases: [
        { a: false, b: false, expected: true },
        { a: false, b: true, expected: false },
        { a: true, b: false, expected: false },
        { a: true, b: true, expected: false },
      ],
    },
    {
      type: 'XOR',
      cases: [
        { a: false, b: false, expected: false },
        { a: false, b: true, expected: true },
        { a: true, b: false, expected: true },
        { a: true, b: true, expected: false },
      ],
    },
    {
      type: 'XNOR',
      cases: [
        { a: false, b: false, expected: true },
        { a: false, b: true, expected: false },
        { a: true, b: false, expected: false },
        { a: true, b: true, expected: true },
      ],
    },
  ];

  for (const gt of gateTests) {
    const t0 = performance.now();
    let allPassed = true;
    let detailMsg = '';

    for (const c of gt.cases) {
      const swA = createNode('SWITCH', 0, 0);
      swA.state.switchOn = c.a;
      swA.state.outputs['out-0'] = c.a;

      const swB = createNode('SWITCH', 0, 50);
      swB.state.switchOn = c.b;
      swB.state.outputs['out-0'] = c.b;

      const gate = createNode(gt.type, 100, 20);

      const circuit: CircuitState = {
        nodes: [swA, swB, gate],
        wires: [
          { id: 'w1', fromNodeId: swA.id, fromPinId: 'out-0', toNodeId: gate.id, toPinId: 'in-0', state: c.a },
          { id: 'w2', fromNodeId: swB.id, fromPinId: 'out-0', toNodeId: gate.id, toPinId: 'in-1', state: c.b },
        ],
      };

      stepCircuit(circuit, 0, 16);
      const actual = !!gate.state.outputs['out-0'];
      if (actual !== c.expected) {
        allPassed = false;
        detailMsg = `Failed for inputs (${c.a ? 1 : 0}, ${c.b ? 1 : 0}): expected ${c.expected ? 1 : 0}, got ${actual ? 1 : 0}`;
        break;
      }
    }

    const t1 = performance.now();
    results.push({
      id: `gate_${gt.type.toLowerCase()}`,
      name: `${gt.type} Gate Truth Table`,
      category: 'Primitives',
      status: allPassed ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: allPassed ? `All 4 boolean vectors verified (${gt.type} logic valid)` : detailMsg,
    });
  }

  // NOT gate test
  {
    const t0 = performance.now();
    let notPassed = true;
    for (const inVal of [false, true]) {
      const sw = createNode('SWITCH', 0, 0);
      sw.state.switchOn = inVal;
      sw.state.outputs['out-0'] = inVal;
      const notGate = createNode('NOT', 100, 0);
      const circuit: CircuitState = {
        nodes: [sw, notGate],
        wires: [
          { id: 'w1', fromNodeId: sw.id, fromPinId: 'out-0', toNodeId: notGate.id, toPinId: 'in-0', state: inVal },
        ],
      };
      stepCircuit(circuit, 0, 16);
      if (notGate.state.outputs['out-0'] === inVal) {
        notPassed = false;
      }
    }
    const t1 = performance.now();
    results.push({
      id: 'gate_not',
      name: 'NOT Inverter Gate Test',
      category: 'Primitives',
      status: notPassed ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: notPassed ? '0 -> 1 and 1 -> 0 successfully inverted' : 'Inversion failed',
    });
  }

  // 2. Arithmetic: Half Adder Preset Circuit
  {
    const t0 = performance.now();
    const haPreset = PRESET_CIRCUITS.find((p) => p.id === 'half-adder')!;
    let haPassed = true;
    let haMsg = '';

    const testVectors = [
      { a: false, b: false, sum: false, carry: false },
      { a: false, b: true, sum: true, carry: false },
      { a: true, b: false, sum: true, carry: false },
      { a: true, b: true, sum: false, carry: true },
    ];

    for (const tv of testVectors) {
      const c = haPreset.load();
      const swA = c.nodes.find((n) => n.label === 'Input A')!;
      const swB = c.nodes.find((n) => n.label === 'Input B')!;
      const sumLed = c.nodes.find((n) => n.label === 'SUM (S)')!;
      const carryLed = c.nodes.find((n) => n.label === 'CARRY (C)')!;

      swA.state.switchOn = tv.a;
      swB.state.switchOn = tv.b;

      // Relax circuit
      for (let s = 0; s < 5; s++) stepCircuit(c, 0, 16);

      const actualSum = !!sumLed.state.inputs['in-0'];
      const actualCarry = !!carryLed.state.inputs['in-0'];

      if (actualSum !== tv.sum || actualCarry !== tv.carry) {
        haPassed = false;
        haMsg = `Failed at A=${tv.a ? 1 : 0}, B=${tv.b ? 1 : 0}: expected Sum=${tv.sum ? 1 : 0} Carry=${tv.carry ? 1 : 0}, got Sum=${actualSum ? 1 : 0} Carry=${actualCarry ? 1 : 0}`;
        break;
      }
    }

    const t1 = performance.now();
    results.push({
      id: 'circuit_ha',
      name: 'Half Adder (XOR + AND)',
      category: 'Arithmetic',
      status: haPassed ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: haPassed ? 'Sum (A^B) and Carry (A&B) verified for all 4 states' : haMsg,
    });
  }

  // 2b. Arithmetic: Full Adder Preset Circuit (8 Truth Vectors)
  {
    const t0 = performance.now();
    const faPreset = PRESET_CIRCUITS.find((p) => p.id === 'full-adder')!;
    let faPassed = true;
    let faMsg = '';

    // Truth table for Full Adder: SUM = A ^ B ^ Cin, COUT = (A & B) | ((A ^ B) & Cin)
    const faVectors = [
      { a: false, b: false, cin: false, sum: false, cout: false },
      { a: false, b: false, cin: true,  sum: true,  cout: false },
      { a: false, b: true,  cin: false, sum: true,  cout: false },
      { a: false, b: true,  cin: true,  sum: false, cout: true  },
      { a: true,  b: false, cin: false, sum: true,  cout: false },
      { a: true,  b: false, cin: true,  sum: false, cout: true  },
      { a: true,  b: true,  cin: false, sum: false, cout: true  },
      { a: true,  b: true,  cin: true,  sum: true,  cout: true  },
    ];

    for (const tv of faVectors) {
      const c = faPreset.load();
      const swA = c.nodes.find((n) => n.label === 'A')!;
      const swB = c.nodes.find((n) => n.label === 'B')!;
      const swCin = c.nodes.find((n) => n.label === 'Cin')!;
      const sumNode = c.nodes.find((n) => n.label === 'SUM')!;
      const coutNode = c.nodes.find((n) => n.label === 'COUT')!;

      swA.state.switchOn = tv.a;
      swA.state.outputs['out-0'] = tv.a;
      swB.state.switchOn = tv.b;
      swB.state.outputs['out-0'] = tv.b;
      swCin.state.switchOn = tv.cin;
      swCin.state.outputs['out-0'] = tv.cin;

      // Relax circuit
      for (let s = 0; s < 8; s++) stepCircuit(c, 0, 16);

      const actualSum = !!sumNode.state.inputs['in-0'];
      const actualCout = !!coutNode.state.inputs['in-0'];

      if (actualSum !== tv.sum || actualCout !== tv.cout) {
        faPassed = false;
        faMsg = `Failed at A=${tv.a ? 1 : 0}, B=${tv.b ? 1 : 0}, Cin=${tv.cin ? 1 : 0}: expected SUM=${tv.sum ? 1 : 0}, COUT=${tv.cout ? 1 : 0}, got SUM=${actualSum ? 1 : 0}, COUT=${actualCout ? 1 : 0}`;
        break;
      }
    }

    const t1 = performance.now();
    results.push({
      id: 'circuit_fa',
      name: 'Full Adder (Dual Half Adder + Carry OR)',
      category: 'Arithmetic',
      status: faPassed ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: faPassed ? 'All 8 binary input vectors verified (SUM=A^B^Cin, COUT=(A&B)|((A^B)&Cin))' : faMsg,
    });
  }

  // 3. Sequential: SR Latch Memory Retention Test
  {
    const t0 = performance.now();
    const srPreset = PRESET_CIRCUITS.find((p) => p.id === 'sr-latch')!;
    const c = srPreset.load();
    const swR = c.nodes.find((n) => n.label?.includes('RESET'))!;
    const swS = c.nodes.find((n) => n.label?.includes('SET'))!;
    const ledQ = c.nodes.find((n) => n.label?.includes('Q (Stored)'))!;

    // Phase 1: Pulse SET
    swS.state.switchOn = true;
    swR.state.switchOn = false;
    for (let s = 0; s < 5; s++) stepCircuit(c, 0, 16);
    const setPass = !!ledQ.state.inputs['in-0'] === true;

    // Phase 2: Release SET (S=0, R=0) -> Q must remain 1 (HOLD state!)
    swS.state.switchOn = false;
    swR.state.switchOn = false;
    for (let s = 0; s < 5; s++) stepCircuit(c, 0, 16);
    const holdSetPass = !!ledQ.state.inputs['in-0'] === true;

    // Phase 3: Pulse RESET (R=1, S=0) -> Q must go to 0
    swS.state.switchOn = false;
    swR.state.switchOn = true;
    for (let s = 0; s < 5; s++) stepCircuit(c, 0, 16);
    const resetPass = !!ledQ.state.inputs['in-0'] === false;

    // Phase 4: Release RESET (S=0, R=0) -> Q must remain 0 (HOLD state!)
    swS.state.switchOn = false;
    swR.state.switchOn = false;
    for (let s = 0; s < 5; s++) stepCircuit(c, 0, 16);
    const holdResetPass = !!ledQ.state.inputs['in-0'] === false;

    const allSrPassed = setPass && holdSetPass && resetPass && holdResetPass;
    const t1 = performance.now();

    results.push({
      id: 'circuit_sr_latch',
      name: 'SR Latch Bistable Memory',
      category: 'Sequential',
      status: allSrPassed ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: allSrPassed
        ? 'Cross-coupled NOR gates correctly hold state after inputs return to 0'
        : `Memory retention failed (Set=${setPass}, HoldSet=${holdSetPass}, Reset=${resetPass}, HoldReset=${holdResetPass})`,
    });
  }

  // 4. Engine Safety: Oscillation Limiter Test
  {
    const t0 = performance.now();
    // Create an inverter wired to itself: Inverter Loop (Ring Oscillator)
    const notGate = createNode('NOT', 0, 0);
    const oscCircuit: CircuitState = {
      nodes: [notGate],
      wires: [
        { id: 'w_loop', fromNodeId: notGate.id, fromPinId: 'out-0', toNodeId: notGate.id, toPinId: 'in-0', state: false },
      ],
    };

    const simResult = stepCircuit(oscCircuit, 0, 16);
    const t1 = performance.now();

    const passLimiter = simResult.oscillating === true && t1 - t0 < 50;
    results.push({
      id: 'safety_oscillation',
      name: 'Oscillation Guard & Tick Limiter',
      category: 'Engine Safety',
      status: passLimiter ? 'passed' : 'failed',
      durationMs: Number((t1 - t0).toFixed(2)),
      details: passLimiter
        ? 'Infinite feedback loop detected and safely stabilized within 30 iterations'
        : 'Failed to flag oscillation or exceeded time limit',
    });
  }

  return results;
}

/**
 * Computes diagnostic circuit health metrics.
 */
export function inspectCircuitHealth(circuit: CircuitState, isOscillating: boolean): CircuitHealthStats {
  const t0 = performance.now();
  let highWireCount = 0;
  let lowWireCount = 0;

  for (const w of circuit.wires) {
    if (w.state) highWireCount++;
    else lowWireCount++;
  }

  // Check for floating input pins
  const incomingWireSet = new Set<string>();
  for (const w of circuit.wires) {
    incomingWireSet.add(`${w.toNodeId}:${w.toPinId}`);
  }

  let floatingInputs = 0;
  for (const node of circuit.nodes) {
    if (node.type !== 'SWITCH' && node.type !== 'CLOCK' && node.type !== 'VCC' && node.type !== 'GND') {
      // It has input pins
      if (node.type === 'NOT' || node.type === 'LED' || node.type === 'PROBE') {
        if (!incomingWireSet.has(`${node.id}:in-0`)) floatingInputs++;
      } else if (node.type === 'SEVENSEG') {
        for (let i = 0; i < 4; i++) {
          if (!incomingWireSet.has(`${node.id}:in-${i}`)) floatingInputs++;
        }
      } else {
        if (!incomingWireSet.has(`${node.id}:in-0`)) floatingInputs++;
        if (!incomingWireSet.has(`${node.id}:in-1`)) floatingInputs++;
      }
    }
  }

  const outgoingWireSet = new Set<string>();
  for (const w of circuit.wires) {
    outgoingWireSet.add(w.fromNodeId);
  }

  let floatingOutputs = 0;
  for (const node of circuit.nodes) {
    if (node.type !== 'LED' && node.type !== 'PROBE' && node.type !== 'SEVENSEG') {
      if (!outgoingWireSet.has(node.id)) floatingOutputs++;
    }
  }

  const t1 = performance.now();

  return {
    nodeCount: circuit.nodes.length,
    wireCount: circuit.wires.length,
    highWireCount,
    lowWireCount,
    floatingInputs,
    floatingOutputs,
    isOscillating,
    tickExecutionMs: Number((t1 - t0).toFixed(2)),
  };
}
