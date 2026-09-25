import React, { useState } from 'react';
import {
  ToggleLeft,
  Clock,
  Zap,
  Power,
  Lightbulb,
  Binary,
  Grid3X3,
  Cpu,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { ComponentType } from '../engine/types';
import { COMPONENT_DEFINITIONS } from '../engine/definitions';
import { GateSvg } from './GateSvg';

interface PaletteDrawerProps {
  onAddComponent: (type: ComponentType) => void;
  onDragStartComponent: (type: ComponentType, e: React.DragEvent) => void;
}

export const PaletteDrawer: React.FC<PaletteDrawerProps> = ({
  onAddComponent,
  onDragStartComponent,
}) => {
  // Mobile screens: collapsed by default; desktop: open by default
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return false;
  });

  const [activeCategory, setActiveCategory] = useState<'all' | 'input' | 'gate' | 'output' | 'memory'>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'input', label: 'Inputs' },
    { id: 'gate', label: 'Gates' },
    { id: 'output', label: 'Outputs' },
    { id: 'memory', label: 'Memory' },
  ] as const;

  const componentList: Array<{
    type: ComponentType;
    category: 'input' | 'gate' | 'output' | 'memory';
    icon: React.ReactNode;
  }> = [
    { type: 'SWITCH', category: 'input', icon: <ToggleLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> },
    { type: 'CLOCK', category: 'input', icon: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" /> },
    { type: 'VCC', category: 'input', icon: <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" /> },
    { type: 'GND', category: 'input', icon: <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" /> },

    { type: 'AND', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="AND" width={18} height={14} /></div> },
    { type: 'OR', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="OR" width={18} height={14} /></div> },
    { type: 'NOT', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="NOT" width={18} height={14} /></div> },
    { type: 'NAND', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="NAND" width={18} height={14} /></div> },
    { type: 'NOR', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="NOR" width={18} height={14} /></div> },
    { type: 'XOR', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="XOR" width={18} height={14} /></div> },
    { type: 'XNOR', category: 'gate', icon: <div className="w-4 h-3.5 sm:w-5 sm:h-4"><GateSvg type="XNOR" width={18} height={14} /></div> },

    { type: 'LED', category: 'output', icon: <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> },
    { type: 'PROBE', category: 'output', icon: <Binary className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" /> },
    { type: 'SEVENSEG', category: 'output', icon: <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" /> },

    { type: 'D_FLIPFLOP', category: 'memory', icon: <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" /> },
  ];

  const filteredComponents = componentList.filter(
    (c) => activeCategory === 'all' || c.category === activeCategory
  );

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-auto sm:w-80 z-30 transition-all duration-200">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Drawer Header Toggle */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-3 py-1.5 sm:py-2 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 select-none"
        >
          <div className="flex items-center gap-2">
            {/* Mobile handle notch */}
            <div className="w-1.5 h-3 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
            <span className="font-heading font-bold text-xs tracking-wide text-slate-800 dark:text-slate-100">
              Component Palette
            </span>

            {/* Collapsed "+ Add Gate" Badge on Mobile */}
            {!isOpen && (
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                <Plus className="w-3 h-3" />
                <span>Add Gate</span>
              </span>
            )}

            {isOpen && (
              <span className="text-[10px] text-slate-400 font-mono hidden xs:inline">
                ({filteredComponents.length})
              </span>
            )}
          </div>

          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Drawer: Clamped to max 38svh on mobile to never cover >40% screen */}
        {isOpen && (
          <div className="p-1.5 sm:p-2 space-y-1.5 max-h-[38svh] sm:max-h-72 flex flex-col overflow-hidden">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px] font-medium text-slate-500 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap text-[10px] sm:text-[11px] transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dense 4-column compact grid on both mobile and desktop */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5 overflow-y-auto flex-1 pr-0.5">
              {filteredComponents.map((item) => {
                const meta = COMPONENT_DEFINITIONS[item.type];
                return (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onDragStart={(e) => onDragStartComponent(item.type, e)}
                    onClick={() => onAddComponent(item.type)}
                    title={`Click or drag to add: ${meta.description}`}
                    className="flex flex-col items-center justify-center p-1 sm:p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group active:scale-95 text-center"
                  >
                    <div className="h-5 sm:h-6 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5 truncate w-full">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-[9px] sm:text-[10px] text-center text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800 shrink-0">
              Tap icon to add to circuit
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
