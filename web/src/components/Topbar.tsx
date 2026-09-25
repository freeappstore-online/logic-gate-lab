import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Table,
  FlaskConical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Moon,
  Sun,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
  X,
  Copy,
} from 'lucide-react';
import { PRESET_CIRCUITS } from '../engine/presets';

interface TopbarProps {
  isRunning: boolean;
  onToggleRun: () => void;
  isOscillating: boolean;
  activePresetId: string;
  onLoadPreset: (presetId: string) => void;
  onOpenTruthTable: () => void;
  onOpenDevTester: () => void;
  onClearAll: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  selectedNodeId?: string | null;
  onDuplicateSelected?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  isRunning,
  onToggleRun,
  isOscillating,
  activePresetId,
  onLoadPreset,
  onOpenTruthTable,
  onOpenDevTester,
  onClearAll,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  theme,
  onToggleTheme,
  selectedNodeId,
  onDuplicateSelected,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs flex flex-col shrink-0">
      {/* Main Top Bar Row */}
      <div className="w-full h-12 sm:h-14 px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand & Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs">
            <span className="font-mono">&amp;</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              <span className="inline md:hidden">LogicGate</span>
              <span className="hidden md:inline">LogicGate Lab</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline leading-none">
              Interactive Digital Workbench
            </span>
          </div>
        </div>

        {/* Center: Preset Selector */}
        <div className="flex items-center gap-1.5 max-w-[150px] xs:max-w-[200px] sm:max-w-[240px] flex-1">
          <select
            value={activePresetId}
            onChange={(e) => {
              onLoadPreset(e.target.value);
              setMobileMenuOpen(false);
            }}
            title="Load template circuit"
            className="w-full h-7 sm:h-8 pl-2 pr-6 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer truncate"
          >
            <option value="" disabled>
              Load Preset...
            </option>
            {PRESET_CIRCUITS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Controls (Visible on md and up) */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={onToggleRun}
            title={isRunning ? 'Pause simulation' : 'Run simulation'}
            className={`h-8 px-2.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              isRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                : 'bg-amber-500 hover:bg-amber-400 text-white'
            }`}
          >
            {isRunning ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running' : 'Paused'}</span>
          </button>

          {/* Truth Table */}
          <button
            type="button"
            onClick={onOpenTruthTable}
            title="Open Automated Truth Table"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Table className="w-3.5 h-3.5 text-blue-500" />
            <span>Truth Table</span>
          </button>

          {/* Test Bench */}
          <button
            type="button"
            onClick={onOpenDevTester}
            title="Open Circuit Test Bench & Automated Verification"
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 transition-colors flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Test Bench</span>
          </button>

          {/* Quick Duplicate for Selected Component */}
          {selectedNodeId && onDuplicateSelected && (
            <button
              type="button"
              onClick={onDuplicateSelected}
              title="Duplicate selected component (Ctrl+D / D)"
              className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span>Duplicate</span>
            </button>
          )}

          {/* Oscillation Badge */}
          {isOscillating && (
            <div
              title="Oscillation / race condition detected."
              className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-800 animate-pulse"
            >
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden xl:inline">Oscillating</span>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={onZoomOut}
              title="Zoom out"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetView}
              title="Click to reset zoom & center circuit"
              className="px-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 hover:text-blue-500"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={onZoomIn}
              title="Zoom in"
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear All */}
          <button
            onClick={onClearAll}
            title="Clear all components and wires"
            className="h-8 w-8 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title="Toggle theme"
            className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Attribution */}
          <div className="hidden xl:flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 text-[11px]">
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <span>Built for freeappstore.online</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Mobile Header Right Controls (< md) */}
        <div className="flex md:hidden items-center gap-1 relative" ref={menuRef}>
          {/* Quick Play / Pause Button */}
          <button
            type="button"
            onClick={onToggleRun}
            title={isRunning ? 'Pause' : 'Run'}
            className={`h-7 px-2 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors ${
              isRunning
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-white'
            }`}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span className="text-[11px]">{isRunning ? 'Run' : 'Pause'}</span>
          </button>

          {/* Kebab Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="More actions"
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
              mobileMenuOpen
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
          </button>

          {/* Mobile Kebab Dropdown Menu Popover */}
          {mobileMenuOpen && (
            <div className="absolute top-9 right-0 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                Workbench Tools
              </div>

              {/* Quick Duplicate in Mobile Menu */}
              {selectedNodeId && onDuplicateSelected && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateSelected();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 flex items-center gap-2 text-left mb-1"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-500" />
                  <span>Duplicate Selected</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenTruthTable();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-left"
              >
                <Table className="w-3.5 h-3.5 text-blue-500" />
                <span>Truth Table</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenDevTester();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-left"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                <span>Test Bench Suite</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="text-slate-500 text-[11px]">Zoom: {Math.round(zoom * 100)}%</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={onZoomOut}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onResetView}
                    title="Reset view"
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onZoomIn}
                    className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onToggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>Theme</span>
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{theme}</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Canvas</span>
              </button>

              <div className="px-2 pt-1.5 text-[9px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 mt-1">
                <a
                  href="https://freeappstore.online"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-blue-500"
                >
                  freeappstore.online
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Horizontal Touch-Row for Fast Actions (scrollable, no-scrollbar, never cuts off) */}
      <div className="flex md:hidden items-center gap-1.5 px-2 py-1 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-200/70 dark:border-slate-800/70 overflow-x-auto no-scrollbar shrink-0 text-xs">
        {/* Quick Duplicate for Mobile */}
        {selectedNodeId && onDuplicateSelected && (
          <button
            type="button"
            onClick={onDuplicateSelected}
            className="px-2 py-0.5 rounded-md bg-blue-600 text-white flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0 shadow-2xs font-semibold animate-in fade-in"
          >
            <Copy className="w-3 h-3" />
            <span>Duplicate</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenTruthTable}
          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0 shadow-2xs"
        >
          <Table className="w-3 h-3 text-blue-500" />
          <span>Truth Table</span>
        </button>

        <button
          type="button"
          onClick={onOpenDevTester}
          className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0 shadow-2xs"
        >
          <FlaskConical className="w-3 h-3 text-purple-500" />
          <span>Test Bench</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

        {/* Zoom quick buttons */}
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={onResetView}
          title="Reset Zoom & Center"
          className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] shrink-0"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
        >
          <ZoomIn className="w-3 h-3" />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5" />

        {/* Theme button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle Theme"
          className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-3 h-3 text-amber-400" />
          ) : (
            <Moon className="w-3 h-3 text-slate-600" />
          )}
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={onClearAll}
          title="Clear Canvas"
          className="p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Oscillation alert indicator on mobile */}
        {isOscillating && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 shrink-0 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Oscillating</span>
          </div>
        )}
      </div>
    </header>
  );
};
