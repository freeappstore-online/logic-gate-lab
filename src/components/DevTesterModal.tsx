import React, { useState, useEffect } from 'react';
import {
  X,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Activity,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { CircuitState } from '../engine/types';
import {
  runDevTestSuite,
  inspectCircuitHealth,
  TestResult,
  CircuitHealthStats,
} from '../engine/devTester';

interface DevTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuit: CircuitState;
  isOscillating: boolean;
}

export const DevTesterModal: React.FC<DevTesterModalProps> = ({
  isOpen,
  onClose,
  circuit,
  isOscillating,
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'health'>('tests');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [health, setHealth] = useState<CircuitHealthStats | null>(null);

  const executeTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runDevTestSuite();
      setTestResults(results);
      setIsRunningTests(false);
    }, 120);
  };

  useEffect(() => {
    if (isOpen) {
      executeTests();
      setHealth(inspectCircuitHealth(circuit, isOscillating));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = testResults.filter((r) => r.status === 'passed').length;
  const totalCount = testResults.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                Logic Test Bench &amp; Circuit Health
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Automated logic unit verification suite and real-time circuit diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-4 px-5 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Logic Unit Tests</span>
            {totalCount > 0 && (
              <span className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {passedCount}/{totalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setHealth(inspectCircuitHealth(circuit, isOscillating));
              setActiveTab('health');
            }}
            className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Circuit Diagnostics</span>
          </button>
        </div>

        {/* Tab 1: Unit Tests */}
        {activeTab === 'tests' && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Verifies DAG engine propagation, truth tables, feedback latching, and safety limiters.
              </div>
              <button
                onClick={executeTests}
                disabled={isRunningTests}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isRunningTests ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Run Suite</span>
              </button>
            </div>

            <div className="space-y-2">
              {testResults.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-start gap-2.5">
                    {t.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          [{t.category}]
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                        {t.details}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {t.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Live Circuit Health Diagnostics */}
        {activeTab === 'health' && health && (
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Nodes</span>
                <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                  {health.nodeCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Wires</span>
                <p className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                  {health.wireCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">HIGH Signals</span>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {health.highWireCount}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">LOW Signals</span>
                <p className="text-xl font-bold font-mono text-slate-500 mt-0.5">
                  {health.lowWireCount}
                </p>
              </div>
            </div>

            {/* Health Checklist */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Electrical Integrity
              </h4>

              <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  {health.floatingInputs === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span>Floating / Unconnected Inputs</span>
                </div>
                <span className={health.floatingInputs > 0 ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                  {health.floatingInputs} pin{health.floatingInputs !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  {!health.isOscillating ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  )}
                  <span>Oscillation &amp; Race Status</span>
                </div>
                <span className={health.isOscillating ? 'text-rose-500 font-bold' : 'text-emerald-500'}>
                  {health.isOscillating ? 'Oscillating (Stabilized)' : 'Steady State'}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>Diagnostic Step Latency</span>
                </div>
                <span className="text-slate-400 font-mono">
                  {health.tickExecutionMs}ms
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
