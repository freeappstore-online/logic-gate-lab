import { CircuitState, CircuitNode } from './types';
import { cloneCircuit, stepCircuit } from './circuit';

export interface TruthTableColumn {
  id: string;
  name: string;
  nodeId: string;
  type: 'input' | 'output';
}

export interface TruthTableRow {
  inputs: boolean[];
  outputs: Array<boolean | string | number>;
  isCurrent: boolean;
}

export interface TruthTableData {
  inputColumns: TruthTableColumn[];
  outputColumns: TruthTableColumn[];
  rows: TruthTableRow[];
  tooManyInputs: boolean;
}

export function generateTruthTable(circuit: CircuitState): TruthTableData {
  // Discover independent toggle switches
  const inputNodes: CircuitNode[] = circuit.nodes.filter(
    (n) => n.type === 'SWITCH'
  );

  // Discover all output nodes
  const outputNodes: CircuitNode[] = circuit.nodes.filter(
    (n) => n.type === 'LED' || n.type === 'PROBE' || n.type === 'SEVENSEG'
  );

  const inputColumns: TruthTableColumn[] = inputNodes.map((n, idx) => ({
    id: n.id,
    name: n.label || `In ${idx + 1}`,
    nodeId: n.id,
    type: 'input',
  }));

  const outputColumns: TruthTableColumn[] = outputNodes.map((n, idx) => ({
    id: n.id,
    name: n.label || (n.type === 'SEVENSEG' ? 'HEX' : `Out ${idx + 1}`),
    nodeId: n.id,
    type: 'output',
  }));

  if (inputNodes.length === 0 || outputNodes.length === 0) {
    return {
      inputColumns,
      outputColumns,
      rows: [],
      tooManyInputs: false,
    };
  }

  // Cap to 8 inputs max (256 rows) to ensure sub-millisecond execution
  if (inputNodes.length > 8) {
    return {
      inputColumns,
      outputColumns,
      rows: [],
      tooManyInputs: true,
    };
  }

  const currentConfig = inputNodes.map((n) => !!n.state.switchOn);
  const numRows = 1 << inputNodes.length;
  const rows: TruthTableRow[] = [];

  for (let i = 0; i < numRows; i++) {
    // Determine bits (MSB first)
    const rowInputs: boolean[] = [];
    for (let bit = inputNodes.length - 1; bit >= 0; bit--) {
      rowInputs.push(((i >> bit) & 1) === 1);
    }

    // Check if this row is the live circuit state
    const isCurrent = rowInputs.every((val, idx) => val === currentConfig[idx]);

    // Clone circuit and apply input states
    const simCircuit = cloneCircuit(circuit);
    for (let idx = 0; idx < inputNodes.length; idx++) {
      const targetNode = simCircuit.nodes.find((n) => n.id === inputNodes[idx].id);
      if (targetNode) {
        targetNode.state.switchOn = rowInputs[idx];
        targetNode.state.outputs['out-0'] = rowInputs[idx];
      }
    }

    // Step simulation until settled
    for (let s = 0; s < 10; s++) {
      stepCircuit(simCircuit, 0, 16);
    }

    // Read outputs
    const rowOutputs: Array<boolean | string | number> = outputNodes.map((outNode) => {
      const simNode = simCircuit.nodes.find((n) => n.id === outNode.id);
      if (!simNode) return false;

      if (simNode.type === 'SEVENSEG') {
        const d3 = simNode.state.inputs['in-0'] ? 1 : 0;
        const d2 = simNode.state.inputs['in-1'] ? 1 : 0;
        const d1 = simNode.state.inputs['in-2'] ? 1 : 0;
        const d0 = simNode.state.inputs['in-3'] ? 1 : 0;
        const val = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
        return val.toString(16).toUpperCase();
      }

      return !!simNode.state.inputs['in-0'];
    });

    rows.push({
      inputs: rowInputs,
      outputs: rowOutputs,
      isCurrent,
    });
  }

  return {
    inputColumns,
    outputColumns,
    rows,
    tooManyInputs: false,
  };
}
