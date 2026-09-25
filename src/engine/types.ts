export type ComponentCategory = 'input' | 'gate' | 'output' | 'memory';

export type ComponentType =
  // Inputs
  | 'SWITCH'
  | 'CLOCK'
  | 'VCC'
  | 'GND'
  // Gates
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  // Outputs
  | 'LED'
  | 'PROBE'
  | 'SEVENSEG'
  // Memory / Sequential helper
  | 'D_FLIPFLOP';

export interface Pin {
  id: string; // e.g. "in-0", "out-0"
  label: string; // e.g. "A", "B", "OUT", "D0"
  type: 'input' | 'output';
  relX: number; // offset relative to node x
  relY: number; // offset relative to node y
}

export interface CircuitNode {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  // Node internal states
  state: {
    // For manual switch
    switchOn?: boolean;
    // For clock
    clockValue?: boolean;
    clockFreq?: number; // Hz (0.5 to 5.0)
    lastTickTime?: number;
    // For FlipFlop
    lastClock?: boolean;
    storedBit?: boolean;
    // Output pin cached boolean states
    outputs: Record<string, boolean>;
    // Input pin cached boolean states
    inputs: Record<string, boolean>;
  };
}

export interface Wire {
  id: string;
  fromNodeId: string;
  fromPinId: string;
  toNodeId: string;
  toPinId: string;
  state: boolean;
}

export interface CircuitState {
  nodes: CircuitNode[];
  wires: Wire[];
}

export interface PresetCircuit {
  id: string;
  name: string;
  description: string;
  category: string;
  load: () => { nodes: CircuitNode[]; wires: Wire[] };
}
