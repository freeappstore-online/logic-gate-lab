import { ComponentType, Pin, CircuitNode } from './types';

export interface ComponentMeta {
  type: ComponentType;
  label: string;
  category: 'input' | 'gate' | 'output' | 'memory';
  width: number;
  height: number;
  description: string;
  pins: Pin[];
}

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentMeta> = {
  // --- INPUTS ---
  SWITCH: {
    type: 'SWITCH',
    label: 'Switch',
    category: 'input',
    width: 80,
    height: 56,
    description: 'Manual toggle switch (0 or 1)',
    pins: [
      { id: 'out-0', label: 'Q', type: 'output', relX: 80, relY: 28 },
    ],
  },
  CLOCK: {
    type: 'CLOCK',
    label: 'Clock',
    category: 'input',
    width: 84,
    height: 56,
    description: 'Periodic pulse generator (0.5 - 5 Hz)',
    pins: [
      { id: 'out-0', label: 'CLK', type: 'output', relX: 84, relY: 28 },
    ],
  },
  VCC: {
    type: 'VCC',
    label: 'VCC (+5V)',
    category: 'input',
    width: 76,
    height: 48,
    description: 'Constant logic HIGH (1)',
    pins: [
      { id: 'out-0', label: '1', type: 'output', relX: 76, relY: 24 },
    ],
  },
  GND: {
    type: 'GND',
    label: 'GND (0V)',
    category: 'input',
    width: 76,
    height: 48,
    description: 'Constant logic LOW (0)',
    pins: [
      { id: 'out-0', label: '0', type: 'output', relX: 76, relY: 24 },
    ],
  },

  // --- GATES ---
  AND: {
    type: 'AND',
    label: 'AND',
    category: 'gate',
    width: 88,
    height: 60,
    description: 'Output 1 only when both inputs are 1',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 88, relY: 30 },
    ],
  },
  OR: {
    type: 'OR',
    label: 'OR',
    category: 'gate',
    width: 88,
    height: 60,
    description: 'Output 1 if either input is 1',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 88, relY: 30 },
    ],
  },
  NOT: {
    type: 'NOT',
    label: 'NOT',
    category: 'gate',
    width: 80,
    height: 52,
    description: 'Inverts signal (0 -> 1, 1 -> 0)',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 26 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 80, relY: 26 },
    ],
  },
  NAND: {
    type: 'NAND',
    label: 'NAND',
    category: 'gate',
    width: 92,
    height: 60,
    description: 'Inverted AND gate (NOT AND)',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 92, relY: 30 },
    ],
  },
  NOR: {
    type: 'NOR',
    label: 'NOR',
    category: 'gate',
    width: 92,
    height: 60,
    description: 'Inverted OR gate (NOT OR)',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 92, relY: 30 },
    ],
  },
  XOR: {
    type: 'XOR',
    label: 'XOR',
    category: 'gate',
    width: 92,
    height: 60,
    description: 'Exclusive OR: 1 when inputs differ',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 92, relY: 30 },
    ],
  },
  XNOR: {
    type: 'XNOR',
    label: 'XNOR',
    category: 'gate',
    width: 96,
    height: 60,
    description: 'Equivalence gate: 1 when inputs are equal',
    pins: [
      { id: 'in-0', label: 'A', type: 'input', relX: 0, relY: 18 },
      { id: 'in-1', label: 'B', type: 'input', relX: 0, relY: 42 },
      { id: 'out-0', label: 'OUT', type: 'output', relX: 96, relY: 30 },
    ],
  },

  // --- OUTPUTS ---
  LED: {
    type: 'LED',
    label: 'LED Indicator',
    category: 'output',
    width: 68,
    height: 56,
    description: 'Lights up and glows brightly on HIGH',
    pins: [
      { id: 'in-0', label: 'IN', type: 'input', relX: 0, relY: 28 },
    ],
  },
  PROBE: {
    type: 'PROBE',
    label: 'Binary Probe',
    category: 'output',
    width: 76,
    height: 52,
    description: 'Displays digital voltage / logic value',
    pins: [
      { id: 'in-0', label: 'IN', type: 'input', relX: 0, relY: 26 },
    ],
  },
  SEVENSEG: {
    type: 'SEVENSEG',
    label: '7-Segment Display',
    category: 'output',
    width: 90,
    height: 104,
    description: '4-bit BCD Hex decoder (0-9, A-F)',
    pins: [
      { id: 'in-0', label: 'D3 (8)', type: 'input', relX: 0, relY: 20 },
      { id: 'in-1', label: 'D2 (4)', type: 'input', relX: 0, relY: 42 },
      { id: 'in-2', label: 'D1 (2)', type: 'input', relX: 0, relY: 64 },
      { id: 'in-3', label: 'D0 (1)', type: 'input', relX: 0, relY: 86 },
    ],
  },

  // --- MEMORY / FLIP-FLOP ---
  D_FLIPFLOP: {
    type: 'D_FLIPFLOP',
    label: 'D Flip-Flop',
    category: 'memory',
    width: 96,
    height: 74,
    description: 'Edge-triggered data storage cell',
    pins: [
      { id: 'in-0', label: 'D', type: 'input', relX: 0, relY: 24 },
      { id: 'in-1', label: 'CLK', type: 'input', relX: 0, relY: 54 },
      { id: 'out-0', label: 'Q', type: 'output', relX: 96, relY: 24 },
      { id: 'out-1', label: '!Q', type: 'output', relX: 96, relY: 54 },
    ],
  },
};

/**
 * Evaluates the new output pin states for a node given its input pin states.
 */
export function evaluateNode(node: CircuitNode, inputs: Record<string, boolean>): Record<string, boolean> {
  const inA = !!inputs['in-0'];
  const inB = !!inputs['in-1'];

  switch (node.type) {
    case 'SWITCH':
      return { 'out-0': !!node.state.switchOn };

    case 'CLOCK':
      return { 'out-0': !!node.state.clockValue };

    case 'VCC':
      return { 'out-0': true };

    case 'GND':
      return { 'out-0': false };

    case 'AND':
      return { 'out-0': inA && inB };

    case 'OR':
      return { 'out-0': inA || inB };

    case 'NOT':
      return { 'out-0': !inA };

    case 'NAND':
      return { 'out-0': !(inA && inB) };

    case 'NOR':
      return { 'out-0': !(inA || inB) };

    case 'XOR':
      return { 'out-0': inA !== inB };

    case 'XNOR':
      return { 'out-0': inA === inB };

    case 'D_FLIPFLOP': {
      const d = inA;
      const clk = inB;
      const prevClk = !!node.state.lastClock;
      let stored = !!node.state.storedBit;

      // Positive edge trigger (0 -> 1)
      if (!prevClk && clk) {
        stored = d;
        node.state.storedBit = stored;
      }
      node.state.lastClock = clk;

      return {
        'out-0': stored,
        'out-1': !stored,
      };
    }

    case 'LED':
    case 'PROBE':
    case 'SEVENSEG':
      // Outputs don't produce outbound signals
      return {};

    default:
      return {};
  }
}
