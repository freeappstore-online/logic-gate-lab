import React, { useState } from 'react';
import { Trash2, Copy, Edit2, Check } from 'lucide-react';
import { CircuitNode, Pin } from '../engine/types';
import { COMPONENT_DEFINITIONS } from '../engine/definitions';
import { GateSvg } from './GateSvg';
import { SevenSegmentSvg } from './SevenSegmentSvg';

interface NodeRendererProps {
  node: CircuitNode;
  isSelected: boolean;
  isWiring: boolean;
  wiringStartPin: { nodeId: string; pinId: string; type: 'input' | 'output' } | null;
  onSelect: (nodeId: string, e: React.MouseEvent | React.PointerEvent) => void;
  onStartDrag: (nodeId: string, e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => void;
  onToggleSwitch: (nodeId: string) => void;
  onChangeClockFreq: (nodeId: string, freq: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onStartWiring: (nodeId: string, pin: Pin, e: React.PointerEvent | React.MouseEvent | React.TouchEvent) => void;
  onEndWiring: (nodeId: string, pin: Pin) => void;
  onUpdateLabel: (nodeId: string, newLabel: string) => void;
}

export const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  isWiring,
  wiringStartPin,
  onSelect,
  onStartDrag,
  onToggleSwitch,
  onChangeClockFreq,
  onDeleteNode,
  onDuplicateNode,
  onStartWiring,
  onEndWiring,
  onUpdateLabel,
}) => {
  const meta = COMPONENT_DEFINITIONS[node.type];
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(node.label || meta.label);

  const handleSaveLabel = () => {
    setIsEditingLabel(false);
    onUpdateLabel(node.id, labelText.trim() || meta.label);
  };

  // Determine current active status
  const isOutputActive = !!node.state.outputs['out-0'];
  const isInputActive = !!node.state.inputs['in-0'];

  return (
    <div
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width,
        height: node.height,
        touchAction: 'none',
        userSelect: 'none',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id, e);
      }}
      onPointerDown={(e) => {
        // If middle click, let canvas handle panning
        if (e.button === 1) {
          return;
        }
        const target = e.target as HTMLElement;
        if (
          target.closest('button') ||
          target.closest('input') ||
          target.closest('.pin-handle') ||
          target.closest('a')
        ) {
          return;
        }
        e.stopPropagation();
        onSelect(node.id, e);
        onStartDrag(node.id, e);
      }}
      className={`absolute cursor-move pointer-events-auto select-none rounded-xl bg-white dark:bg-slate-900 border transition-shadow duration-150 ${
        isSelected
          ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-500/30 shadow-lg z-20'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm z-10'
      }`}
    >
      {/* Floating Action Menu for Selected Component */}
      {isSelected && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 rounded-lg shadow-xl border border-slate-700/80 px-1.5 py-0.5 z-50 text-[11px] font-sans whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateNode(node.id);
            }}
            title="Duplicate component (Ctrl+D / D)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-200 hover:text-blue-400 transition-colors cursor-pointer"
          >
            <Copy className="w-3 h-3 text-blue-400" />
            <span className="font-semibold text-[10px]">Duplicate</span>
          </button>

          <div className="w-px h-3 bg-slate-700" />

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
            title="Rename component"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            title="Delete component (Delete / Backspace)"
            className="p-1 rounded hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Node Mini Header / Label */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40 rounded-t-xl text-[10px] text-slate-500 font-medium">
        {isEditingLabel ? (
          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel()}
              className="w-full bg-white dark:bg-slate-800 border border-blue-400 rounded px-1 py-0.2 text-[10px] text-slate-800 dark:text-slate-100 outline-none"
              autoFocus
            />
            <button onClick={handleSaveLabel} className="p-0.5 text-green-600 hover:text-green-500">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
            title="Double click to rename"
            className="truncate w-full tracking-tight hover:text-blue-600 dark:hover:text-blue-400 cursor-text select-none"
          >
            {node.label || meta.label}
          </span>
        )}
      </div>

      {/* Node Interactive Content Body */}
      <div className="relative w-full h-[calc(100%-20px)] flex items-center justify-center p-1.5 overflow-hidden">
        {/* SWITCH COMPONENT */}
        {node.type === 'SWITCH' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSwitch(node.id);
            }}
            className={`w-full h-full rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer ${
              node.state.switchOn
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                node.state.switchOn ? 'bg-white shadow-xs' : 'bg-slate-400'
              }`}
            />
            <span>{node.state.switchOn ? 'HIGH 1' : 'LOW 0'}</span>
          </button>
        )}

        {/* CLOCK COMPONENT */}
        {node.type === 'CLOCK' && (
          <div className="flex flex-col items-center justify-center w-full h-full text-center">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <div
                className={`w-2 h-2 rounded-full transition-colors ${
                  node.state.clockValue ? 'bg-emerald-500 shadow-xs' : 'bg-slate-400'
                }`}
              />
              <span>{node.state.clockValue ? '1' : '0'}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Cycle clock speeds: 0.5 -> 1.0 -> 2.0 -> 3.0 -> 5.0 -> 0.5
                const speeds = [0.5, 1.0, 2.0, 3.0, 5.0];
                const current = node.state.clockFreq || 1.0;
                const nextIdx = (speeds.indexOf(current) + 1) % speeds.length;
                onChangeClockFreq(node.id, speeds[nextIdx]);
              }}
              title="Click to cycle clock frequency"
              className="text-[9px] font-mono text-blue-600 dark:text-blue-400 hover:underline mt-0.5 cursor-pointer"
            >
              {node.state.clockFreq || 1.0} Hz
            </button>
          </div>
        )}

        {/* CONSTANT VCC */}
        {node.type === 'VCC' && (
          <div className="flex flex-col items-center justify-center font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            <span>+5V</span>
            <span className="text-[10px] text-slate-400">HIGH (1)</span>
          </div>
        )}

        {/* CONSTANT GND */}
        {node.type === 'GND' && (
          <div className="flex flex-col items-center justify-center font-mono font-bold text-slate-500 text-xs">
            <span>GND</span>
            <span className="text-[10px] text-slate-400">LOW (0)</span>
          </div>
        )}

        {/* LED OUTPUT */}
        {node.type === 'LED' && (
          <div className="flex flex-col items-center justify-center">
            <div
              className={`w-7 h-7 rounded-full border-2 transition-all duration-100 flex items-center justify-center ${
                isInputActive
                  ? 'bg-emerald-500 border-emerald-300 shadow-lg shadow-emerald-500/60 scale-105'
                  : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-60'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isInputActive ? 'bg-white' : 'bg-slate-400/40'
                }`}
              />
            </div>
            <span
              className={`text-[9px] font-mono mt-0.5 font-bold ${
                isInputActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            >
              {isInputActive ? 'ON' : 'OFF'}
            </span>
          </div>
        )}

        {/* PROBE OUTPUT */}
        {node.type === 'PROBE' && (
          <div className="flex flex-col items-center justify-center">
            <div
              className={`px-3 py-1 rounded font-mono text-base font-extrabold tabular-nums border ${
                isInputActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-400/50'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isInputActive ? '1' : '0'}
            </div>
          </div>
        )}

        {/* 7-SEGMENT DISPLAY */}
        {node.type === 'SEVENSEG' && (
          <div className="flex items-center justify-center w-full h-full">
            {(() => {
              const d3 = node.state.inputs['in-0'] ? 1 : 0;
              const d2 = node.state.inputs['in-1'] ? 1 : 0;
              const d1 = node.state.inputs['in-2'] ? 1 : 0;
              const d0 = node.state.inputs['in-3'] ? 1 : 0;
              const hexVal = (d3 << 3) | (d2 << 2) | (d1 << 1) | d0;
              return <SevenSegmentSvg val={hexVal} width={48} height={70} />;
            })()}
          </div>
        )}

        {/* LOGIC GATES */}
        {meta.category === 'gate' && (
          <div className="w-full h-full flex items-center justify-center p-1">
            <GateSvg type={node.type} width={node.width - 24} height={node.height - 24} active={isOutputActive} />
          </div>
        )}

        {/* D FLIP-FLOP */}
        {node.type === 'D_FLIPFLOP' && (
          <div className="w-full h-full flex items-center justify-between px-2 text-[10px] font-mono text-slate-600 dark:text-slate-300">
            <div className="space-y-3">
              <div>D</div>
              <div className="flex items-center gap-0.5">
                <span>&gt;</span>
                <span>CLK</span>
              </div>
            </div>
            <div className="space-y-3 text-right">
              <div className={node.state.storedBit ? 'text-emerald-500 font-bold' : ''}>Q</div>
              <div className={!node.state.storedBit ? 'text-emerald-500 font-bold' : ''}>!Q</div>
            </div>
          </div>
        )}
      </div>

      {/* Input / Output Connection Pins */}
      {meta.pins.map((pin) => {
        const isInput = pin.type === 'input';
        const isCurrentPinActive = isInput
          ? !!node.state.inputs[pin.id]
          : !!node.state.outputs[pin.id];

        // Highlight pin if wiring is active and this is a compatible destination
        const isWiringTarget =
          isWiring &&
          wiringStartPin &&
          wiringStartPin.nodeId !== node.id &&
          wiringStartPin.type !== pin.type;

        return (
          <div
            key={pin.id}
            data-pin-id={pin.id}
            data-node-id={node.id}
            style={{
              left: pin.relX,
              top: pin.relY,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartWiring(node.id, pin, e);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onEndWiring(node.id, pin);
            }}
            title={`${pin.label} (${pin.type})`}
            className={`pin-handle absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-crosshair transition-all z-30 group ${
              isWiringTarget
                ? 'scale-125 ring-4 ring-emerald-400/50 bg-emerald-500'
                : 'hover:scale-125'
            }`}
          >
            {/* Outer wire contact anchor */}
            <div
              className={`w-2.5 h-2.5 rounded-full border transition-colors ${
                isCurrentPinActive
                  ? 'bg-emerald-500 border-white shadow-xs'
                  : 'bg-slate-400 dark:bg-slate-600 border-slate-200 dark:border-slate-800'
              }`}
            />

            {/* Pin tiny label badge */}
            <span
              className={`absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-900 text-white whitespace-nowrap z-50 ${
                isInput ? '-left-6 top-1/2 -translate-y-1/2' : '-right-6 top-1/2 -translate-y-1/2'
              }`}
            >
              {pin.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
