import { CircuitNode, CircuitState, ComponentType, Wire } from './types';
import { COMPONENT_DEFINITIONS, evaluateNode } from './definitions';

/**
 * Returns absolute coordinates of a pin in canvas space.
 */
export function getPinPosition(node: CircuitNode, pinId: string): { x: number; y: number } {
  const meta = COMPONENT_DEFINITIONS[node.type];
  if (!meta) return { x: node.x, y: node.y };

  const pin = meta.pins.find((p) => p.id === pinId);
  if (!pin) return { x: node.x, y: node.y };

  return {
    x: node.x + pin.relX,
    y: node.y + pin.relY,
  };
}

/**
 * Simulates a single tick of the circuit using an iterative relaxation settling loop.
 * Guards against infinite loops from unstable oscillators by capping iterations.
 */
export function stepCircuit(
  circuit: CircuitState,
  nowMs: number,
  deltaMs: number
): { settled: boolean; oscillating: boolean } {
  const { nodes, wires } = circuit;

  // 1. Advance clocks if any
  for (const node of nodes) {
    if (node.type === 'CLOCK') {
      const freq = node.state.clockFreq || 1.0; // 1 Hz default
      const periodMs = 1000 / freq;
      const halfPeriodMs = periodMs / 2;
      const lastTick = node.state.lastTickTime || 0;

      if (nowMs - lastTick >= halfPeriodMs) {
        node.state.clockValue = !node.state.clockValue;
        node.state.lastTickTime = nowMs;
        node.state.outputs['out-0'] = !!node.state.clockValue;
      }
    } else if (node.type === 'SWITCH') {
      node.state.outputs['out-0'] = !!node.state.switchOn;
    } else if (node.type === 'VCC') {
      node.state.outputs['out-0'] = true;
    } else if (node.type === 'GND') {
      node.state.outputs['out-0'] = false;
    }
  }

  // 2. Map outgoing wires to destination pins
  // Create quick lookup of incoming wire for each (nodeId, pinId)
  const incomingWireMap = new Map<string, Wire>();
  for (const wire of wires) {
    incomingWireMap.set(`${wire.toNodeId}:${wire.toPinId}`, wire);
  }

  const nodeMap = new Map<string, CircuitNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // 3. Iterative relaxation loop
  const MAX_ITERATIONS = 30;
  let iterations = 0;
  let settled = false;

  while (iterations < MAX_ITERATIONS && !settled) {
    iterations++;
    let anyWireChanged = false;
    let anyOutputChanged = false;

    // A. Propagate current node outputs to incoming wires
    for (const wire of wires) {
      const srcNode = nodeMap.get(wire.fromNodeId);
      const srcVal = srcNode ? !!srcNode.state.outputs[wire.fromPinId] : false;
      if (wire.state !== srcVal) {
        wire.state = srcVal;
        anyWireChanged = true;
      }
    }

    // B. Recompute inputs and outputs for every node
    for (const node of nodes) {
      const meta = COMPONENT_DEFINITIONS[node.type];
      if (!meta) continue;

      // Collect inputs from incoming wires
      const newInputs: Record<string, boolean> = {};
      for (const pin of meta.pins) {
        if (pin.type === 'input') {
          const wire = incomingWireMap.get(`${node.id}:${pin.id}`);
          newInputs[pin.id] = wire ? wire.state : false;
        }
      }
      node.state.inputs = newInputs;

      // Evaluate new outputs
      const nextOutputs = evaluateNode(node, newInputs);
      for (const [pinId, val] of Object.entries(nextOutputs)) {
        if (node.state.outputs[pinId] !== val) {
          node.state.outputs[pinId] = val;
          anyOutputChanged = true;
        }
      }
    }

    if (!anyWireChanged && !anyOutputChanged) {
      settled = true;
    }
  }

  const oscillating = !settled && iterations >= MAX_ITERATIONS;
  return { settled, oscillating };
}

/**
 * Creates a new node of a given type at specified coordinates.
 */
export function createNode(type: ComponentType, x: number, y: number): CircuitNode {
  const meta = COMPONENT_DEFINITIONS[type];
  const id = `node_${type.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;

  return {
    id,
    type,
    x,
    y,
    width: meta.width,
    height: meta.height,
    label: meta.label,
    state: {
      switchOn: false,
      clockValue: false,
      clockFreq: 1.0,
      lastTickTime: 0,
      storedBit: false,
      lastClock: false,
      outputs: {},
      inputs: {},
    },
  };
}

/**
 * Helper to deep clone a circuit state.
 */
export function cloneCircuit(circuit: CircuitState): CircuitState {
  return {
    nodes: circuit.nodes.map((n) => ({
      ...n,
      state: {
        ...n.state,
        outputs: { ...n.state.outputs },
        inputs: { ...n.state.inputs },
      },
    })),
    wires: circuit.wires.map((w) => ({ ...w })),
  };
}
