import { PresetCircuit, CircuitNode, Wire } from './types';
import { createNode } from './circuit';

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: 'half-adder',
    name: 'Half Adder',
    category: 'Arithmetic',
    description: 'Computes sum and carry of two single-bit inputs using XOR and AND gates.',
    load: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];

      // Inputs placed cleanly
      const swA = createNode('SWITCH', 80, 50);
      swA.label = 'Input A';
      swA.state.switchOn = true;
      swA.state.outputs['out-0'] = true;

      const swB = createNode('SWITCH', 80, 160);
      swB.label = 'Input B';
      swB.state.switchOn = false;
      swB.state.outputs['out-0'] = false;

      // Gates
      const xorGate = createNode('XOR', 260, 45);
      const andGate = createNode('AND', 260, 155);

      // Outputs
      const ledSum = createNode('LED', 430, 47);
      ledSum.label = 'SUM (S)';

      const ledCarry = createNode('LED', 430, 157);
      ledCarry.label = 'CARRY (C)';

      nodes.push(swA, swB, xorGate, andGate, ledSum, ledCarry);

      // Wires
      wires.push(
        { id: 'ha_w1', fromNodeId: swA.id, fromPinId: 'out-0', toNodeId: xorGate.id, toPinId: 'in-0', state: true },
        { id: 'ha_w2', fromNodeId: swA.id, fromPinId: 'out-0', toNodeId: andGate.id, toPinId: 'in-0', state: true },
        { id: 'ha_w3', fromNodeId: swB.id, fromPinId: 'out-0', toNodeId: xorGate.id, toPinId: 'in-1', state: false },
        { id: 'ha_w4', fromNodeId: swB.id, fromPinId: 'out-0', toNodeId: andGate.id, toPinId: 'in-1', state: false },
        { id: 'ha_w5', fromNodeId: xorGate.id, fromPinId: 'out-0', toNodeId: ledSum.id, toPinId: 'in-0', state: true },
        { id: 'ha_w6', fromNodeId: andGate.id, fromPinId: 'out-0', toNodeId: ledCarry.id, toPinId: 'in-0', state: false },
      );

      return { nodes, wires };
    },
  },

  {
    id: 'full-adder',
    name: 'Full Adder',
    category: 'Arithmetic',
    description: 'Adds three 1-bit binary values (A, B, Cin) producing SUM = A^B^Cin and COUT = (A&B)|((A^B)&Cin).',
    load: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];

      // Inputs placed with vertical space (higher up in canvas)
      const swA = createNode('SWITCH', 60, 40);
      swA.label = 'A';
      swA.state.switchOn = true;
      swA.state.outputs['out-0'] = true;

      const swB = createNode('SWITCH', 60, 120);
      swB.label = 'B';
      swB.state.switchOn = true;
      swB.state.outputs['out-0'] = true;

      const swCin = createNode('SWITCH', 60, 200);
      swCin.label = 'Cin';
      swCin.state.switchOn = false;
      swCin.state.outputs['out-0'] = false;

      // Stage 1: Half Adder 1 (XOR1 & AND1)
      const xor1 = createNode('XOR', 220, 40);
      xor1.label = 'XOR1';

      const and1 = createNode('AND', 220, 130);
      and1.label = 'AND1';

      // Stage 2: Half Adder 2 (XOR2 & AND2)
      const xor2 = createNode('XOR', 400, 60);
      xor2.label = 'XOR2';

      const and2 = createNode('AND', 400, 170);
      and2.label = 'AND2';

      // Stage 3: OR gate combining carry paths
      const or1 = createNode('OR', 560, 150);
      or1.label = 'OR1';

      // Outputs: SUM probe and COUT probe/LED
      const sumProbe = createNode('PROBE', 560, 62);
      sumProbe.label = 'SUM';

      const coutLed = createNode('LED', 690, 152);
      coutLed.label = 'COUT';

      nodes.push(swA, swB, swCin, xor1, and1, xor2, and2, or1, sumProbe, coutLed);

      wires.push(
        // Wire 1: Input A -> XOR1 (Pin 1 / in-0) & AND1 (Pin 1 / in-0)
        { id: 'fa_w1a', fromNodeId: swA.id, fromPinId: 'out-0', toNodeId: xor1.id, toPinId: 'in-0', state: true },
        { id: 'fa_w1b', fromNodeId: swA.id, fromPinId: 'out-0', toNodeId: and1.id, toPinId: 'in-0', state: true },

        // Wire 2: Input B -> XOR1 (Pin 2 / in-1) & AND1 (Pin 2 / in-1)
        { id: 'fa_w2a', fromNodeId: swB.id, fromPinId: 'out-0', toNodeId: xor1.id, toPinId: 'in-1', state: true },
        { id: 'fa_w2b', fromNodeId: swB.id, fromPinId: 'out-0', toNodeId: and1.id, toPinId: 'in-1', state: true },

        // Wire 3: XOR1 Output -> XOR2 (Pin 1 / in-0) & AND2 (Pin 1 / in-0)
        { id: 'fa_w3a', fromNodeId: xor1.id, fromPinId: 'out-0', toNodeId: xor2.id, toPinId: 'in-0', state: false },
        { id: 'fa_w3b', fromNodeId: xor1.id, fromPinId: 'out-0', toNodeId: and2.id, toPinId: 'in-0', state: false },

        // Wire 4: Input Cin -> XOR2 (Pin 2 / in-1) & AND2 (Pin 2 / in-1)
        { id: 'fa_w4a', fromNodeId: swCin.id, fromPinId: 'out-0', toNodeId: xor2.id, toPinId: 'in-1', state: false },
        { id: 'fa_w4b', fromNodeId: swCin.id, fromPinId: 'out-0', toNodeId: and2.id, toPinId: 'in-1', state: false },

        // Wire 5: XOR2 Output -> SUM probe
        { id: 'fa_w5', fromNodeId: xor2.id, fromPinId: 'out-0', toNodeId: sumProbe.id, toPinId: 'in-0', state: false },

        // Wire 6: AND1 Output -> OR1 (Pin 1 / in-0)
        { id: 'fa_w6', fromNodeId: and1.id, fromPinId: 'out-0', toNodeId: or1.id, toPinId: 'in-0', state: true },

        // Wire 7: AND2 Output -> OR1 (Pin 2 / in-1)
        { id: 'fa_w7', fromNodeId: and2.id, fromPinId: 'out-0', toNodeId: or1.id, toPinId: 'in-1', state: false },

        // Wire 8: OR1 Output -> COUT LED probe
        { id: 'fa_w8', fromNodeId: or1.id, fromPinId: 'out-0', toNodeId: coutLed.id, toPinId: 'in-0', state: true },
      );

      return { nodes, wires };
    },
  },

  {
    id: 'sr-latch',
    name: 'SR Latch (Memory Cell)',
    category: 'Sequential Logic',
    description: 'Bistable cross-coupled NOR gate memory. Stores 1 bit; demonstrates feedback settling.',
    load: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];

      // Inputs (Active High)
      const swR = createNode('SWITCH', 80, 50);
      swR.label = 'RESET (R)';
      swR.state.switchOn = false;
      swR.state.outputs['out-0'] = false;

      const swS = createNode('SWITCH', 80, 170);
      swS.label = 'SET (S)';
      swS.state.switchOn = false;
      swS.state.outputs['out-0'] = false;

      // NOR Gates cross-coupled
      const nor1 = createNode('NOR', 270, 55);
      nor1.label = 'NOR Top';

      const nor2 = createNode('NOR', 270, 165);
      nor2.label = 'NOR Bottom';

      // Output Indicators
      const ledQ = createNode('LED', 450, 57);
      ledQ.label = 'Q (Stored)';

      const ledNotQ = createNode('LED', 450, 167);
      ledNotQ.label = '!Q (Inverted)';

      nodes.push(swR, swS, nor1, nor2, ledQ, ledNotQ);

      wires.push(
        { id: 'w1', fromNodeId: swR.id, fromPinId: 'out-0', toNodeId: nor1.id, toPinId: 'in-0', state: false },
        { id: 'w2', fromNodeId: swS.id, fromPinId: 'out-0', toNodeId: nor2.id, toPinId: 'in-1', state: false },
        { id: 'w3', fromNodeId: nor1.id, fromPinId: 'out-0', toNodeId: ledQ.id, toPinId: 'in-0', state: true },
        { id: 'w4', fromNodeId: nor2.id, fromPinId: 'out-0', toNodeId: ledNotQ.id, toPinId: 'in-0', state: false },
        { id: 'w5', fromNodeId: nor1.id, fromPinId: 'out-0', toNodeId: nor2.id, toPinId: 'in-0', state: true },
        { id: 'w6', fromNodeId: nor2.id, fromPinId: 'out-0', toNodeId: nor1.id, toPinId: 'in-1', state: false },
      );

      return { nodes, wires };
    },
  },

  {
    id: 'mux-2to1',
    name: '2-to-1 Multiplexer (MUX)',
    category: 'Data Routing',
    description: 'Selects one of two data inputs (D0 or D1) to route to the output based on Select bit.',
    load: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];

      const swD0 = createNode('SWITCH', 70, 40);
      swD0.label = 'Data D0';
      swD0.state.switchOn = true;
      swD0.state.outputs['out-0'] = true;

      const swSel = createNode('SWITCH', 70, 120);
      swSel.label = 'Select (S)';
      swSel.state.switchOn = false;
      swSel.state.outputs['out-0'] = false;

      const swD1 = createNode('SWITCH', 70, 200);
      swD1.label = 'Data D1';
      swD1.state.switchOn = false;
      swD1.state.outputs['out-0'] = false;

      // Inverter for Select
      const notGate = createNode('NOT', 220, 100);

      // Data steering AND gates
      const and0 = createNode('AND', 360, 50);
      const and1 = createNode('AND', 360, 190);

      // Output combining OR gate
      const orGate = createNode('OR', 510, 120);

      // Outputs
      const ledOut = createNode('LED', 650, 122);
      ledOut.label = 'Output Y';

      const probeOut = createNode('PROBE', 650, 190);
      probeOut.label = 'Y Probe';

      nodes.push(swD0, swSel, swD1, notGate, and0, and1, orGate, ledOut, probeOut);

      wires.push(
        { id: 'w1', fromNodeId: swSel.id, fromPinId: 'out-0', toNodeId: notGate.id, toPinId: 'in-0', state: false },
        { id: 'w2', fromNodeId: swSel.id, fromPinId: 'out-0', toNodeId: and1.id, toPinId: 'in-1', state: false },
        { id: 'w3', fromNodeId: notGate.id, fromPinId: 'out-0', toNodeId: and0.id, toPinId: 'in-1', state: true },
        { id: 'w4', fromNodeId: swD0.id, fromPinId: 'out-0', toNodeId: and0.id, toPinId: 'in-0', state: true },
        { id: 'w5', fromNodeId: swD1.id, fromPinId: 'out-0', toNodeId: and1.id, toPinId: 'in-0', state: false },
        { id: 'w6', fromNodeId: and0.id, fromPinId: 'out-0', toNodeId: orGate.id, toPinId: 'in-0', state: true },
        { id: 'w7', fromNodeId: and1.id, fromPinId: 'out-0', toNodeId: orGate.id, toPinId: 'in-1', state: false },
        { id: 'w8', fromNodeId: orGate.id, fromPinId: 'out-0', toNodeId: ledOut.id, toPinId: 'in-0', state: true },
        { id: 'w9', fromNodeId: orGate.id, fromPinId: 'out-0', toNodeId: probeOut.id, toPinId: 'in-0', state: true },
      );

      return { nodes, wires };
    },
  },

  {
    id: 'counter-3bit',
    name: '3-Bit Binary Counter',
    category: 'Sequential Logic',
    description: 'Cascaded clock divider dividing by 2, 4, 8. Live output drives binary LEDs and a 7-Segment Display.',
    load: () => {
      const nodes: CircuitNode[] = [];
      const wires: Wire[] = [];

      // Clock (1.5 Hz)
      const clock = createNode('CLOCK', 50, 85);
      clock.label = 'Clock (1.5 Hz)';
      clock.state.clockFreq = 1.5;

      // 3 D Flip-Flops in toggle configuration (!Q -> D)
      const ff0 = createNode('D_FLIPFLOP', 190, 75);
      ff0.label = 'Bit 0 (Q0)';

      const ff1 = createNode('D_FLIPFLOP', 340, 75);
      ff1.label = 'Bit 1 (Q1)';

      const ff2 = createNode('D_FLIPFLOP', 490, 75);
      ff2.label = 'Bit 2 (Q2)';

      // Probes / LEDs for individual bits
      const ledQ0 = createNode('PROBE', 290, 180);
      ledQ0.label = 'Q0 (LSB)';

      const ledQ1 = createNode('PROBE', 440, 180);
      ledQ1.label = 'Q1';

      const ledQ2 = createNode('PROBE', 590, 180);
      ledQ2.label = 'Q2 (MSB)';

      // 7-Segment Display
      const seg7 = createNode('SEVENSEG', 670, 60);
      seg7.label = 'Hex Count';

      nodes.push(clock, ff0, ff1, ff2, ledQ0, ledQ1, ledQ2, seg7);

      wires.push(
        { id: 'w1', fromNodeId: clock.id, fromPinId: 'out-0', toNodeId: ff0.id, toPinId: 'in-1', state: false },
        { id: 'w2', fromNodeId: ff0.id, fromPinId: 'out-1', toNodeId: ff0.id, toPinId: 'in-0', state: true },
        { id: 'w3', fromNodeId: ff0.id, fromPinId: 'out-1', toNodeId: ff1.id, toPinId: 'in-1', state: true },
        { id: 'w4', fromNodeId: ff1.id, fromPinId: 'out-1', toNodeId: ff1.id, toPinId: 'in-0', state: true },
        { id: 'w5', fromNodeId: ff1.id, fromPinId: 'out-1', toNodeId: ff2.id, toPinId: 'in-1', state: true },
        { id: 'w6', fromNodeId: ff2.id, fromPinId: 'out-1', toNodeId: ff2.id, toPinId: 'in-0', state: true },
        { id: 'w7', fromNodeId: ff0.id, fromPinId: 'out-0', toNodeId: ledQ0.id, toPinId: 'in-0', state: false },
        { id: 'w8', fromNodeId: ff1.id, fromPinId: 'out-0', toNodeId: ledQ1.id, toPinId: 'in-0', state: false },
        { id: 'w9', fromNodeId: ff2.id, fromPinId: 'out-0', toNodeId: ledQ2.id, toPinId: 'in-0', state: false },
        { id: 'w10', fromNodeId: ff2.id, fromPinId: 'out-0', toNodeId: seg7.id, toPinId: 'in-1', state: false },
        { id: 'w11', fromNodeId: ff1.id, fromPinId: 'out-0', toNodeId: seg7.id, toPinId: 'in-2', state: false },
        { id: 'w12', fromNodeId: ff0.id, fromPinId: 'out-0', toNodeId: seg7.id, toPinId: 'in-3', state: false },
      );

      return { nodes, wires };
    },
  },
];
