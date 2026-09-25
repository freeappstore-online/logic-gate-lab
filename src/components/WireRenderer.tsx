import React from 'react';
import { X } from 'lucide-react';
import { CircuitNode, Wire } from '../engine/types';
import { getPinPosition } from '../engine/circuit';

interface WireRendererProps {
  wires: Wire[];
  nodes: CircuitNode[];
  selectedWireId: string | null;
  onSelectWire: (wireId: string | null) => void;
  onDeleteWire: (wireId: string) => void;
  // Live dragging wire
  draftWire: {
    fromNodeId: string;
    fromPinId: string;
    toX: number;
    toY: number;
  } | null;
}

export const WireRenderer: React.FC<WireRendererProps> = ({
  wires,
  nodes,
  selectedWireId,
  onSelectWire,
  onDeleteWire,
  draftWire,
}) => {
  const nodeMap = new Map<string, CircuitNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <filter id="glow-high" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Render all established circuit wires */}
      {wires.map((wire) => {
        const fromNode = nodeMap.get(wire.fromNodeId);
        const toNode = nodeMap.get(wire.toNodeId);
        if (!fromNode || !toNode) return null;

        const p1 = getPinPosition(fromNode, wire.fromPinId);
        const p2 = getPinPosition(toNode, wire.toPinId);

        // Compute smooth cubic bezier control points
        const dx = Math.max(35, Math.abs(p2.x - p1.x) * 0.5);
        const pathData = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

        const isSelected = selectedWireId === wire.id;
        const isHigh = !!wire.state;

        // Midpoint for floating delete button
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        return (
          <g key={wire.id} className="pointer-events-none">
            {/* Transparent wide path for easy click/touch detection - ONLY on stroke */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="16"
              style={{ pointerEvents: 'stroke' }}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
              }}
            />

            {/* Selection highlight aura */}
            {isSelected && (
              <path
                d={pathData}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="7"
                strokeOpacity="0.6"
                className="pointer-events-none"
              />
            )}

            {/* Base Wire Path */}
            <path
              d={pathData}
              fill="none"
              stroke={isHigh ? '#22c55e' : '#64748b'}
              strokeWidth={isHigh ? '3' : '2'}
              strokeLinecap="round"
              filter={isHigh ? 'url(#glow-high)' : undefined}
              style={{ pointerEvents: 'stroke' }}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectWire(wire.id);
              }}
            />

            {/* Animated signal pulse dashes when active HIGH */}
            {isHigh && (
              <path
                d={pathData}
                fill="none"
                stroke="#bbf7d0"
                strokeWidth="2.5"
                strokeDasharray="6 8"
                className="wire-animated pointer-events-none"
                strokeLinecap="round"
              />
            )}

            {/* Selected Wire Delete Button badge */}
            {isSelected && (
              <g
                transform={`translate(${midX}, ${midY})`}
                className="pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteWire(wire.id);
                }}
              >
                <circle r="11" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="hover:scale-110 transition-transform" />
                <foreignObject x="-7" y="-7" width="14" height="14">
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}

      {/* Live drafting wire during pin drag */}
      {draftWire && (() => {
        const fromNode = nodeMap.get(draftWire.fromNodeId);
        if (!fromNode) return null;
        const p1 = getPinPosition(fromNode, draftWire.fromPinId);
        const p2 = { x: draftWire.toX, y: draftWire.toY };

        const dx = Math.max(35, Math.abs(p2.x - p1.x) * 0.5);
        const pathData = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

        return (
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        );
      })()}
    </svg>
  );
};
