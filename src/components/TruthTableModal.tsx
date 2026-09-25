import React, { useState } from 'react';
import { X, Table, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { TruthTableData } from '../engine/truthTable';

interface TruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TruthTableData;
  onApplyRowInputs: (inputValues: Record<string, boolean>) => void;
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplyRowInputs,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (data.rows.length === 0) return;

    const headers = [
      ...data.inputColumns.map((c) => c.name),
      '|',
      ...data.outputColumns.map((c) => c.name),
    ];
    const separator = headers.map(() => '---');

    const lines = [
      `| ${headers.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
    ];

    for (const r of data.rows) {
      const inVals = r.inputs.map((v) => (v ? '1' : '0'));
      const outVals = r.outputs.map((v) => (typeof v === 'boolean' ? (v ? '1' : '0') : String(v)));
      lines.push(`| ${inVals.join(' | ')} | | ${outVals.join(' | ')} |`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                Automated Truth Table
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {data.inputColumns.length} input{data.inputColumns.length !== 1 ? 's' : ''} &middot;{' '}
                {data.outputColumns.length} output{data.outputColumns.length !== 1 ? 's' : ''} &middot;{' '}
                {data.rows.length} combinations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data.rows.length > 0 && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {data.tooManyInputs ? (
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <strong className="font-semibold block mb-0.5">Too Many Independent Inputs</strong>
                The current circuit has {data.inputColumns.length} toggle switches. Evaluating 2^{data.inputColumns.length} combinations would exceed the 256-state limiter. Reduce inputs to 8 or fewer to generate a truth table.
              </div>
            </div>
          ) : data.rows.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 space-y-2">
              <Table className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Incomplete Circuit for Truth Table
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add at least one <span className="font-mono text-blue-600 dark:text-blue-400">Switch</span> input and at least one <span className="font-mono text-emerald-600 dark:text-emerald-400">LED / Probe</span> output to discover logic states.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-3 py-2 text-[10px] text-slate-400 font-bold uppercase w-10 text-center">
                      #
                    </th>
                    {data.inputColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-3 py-2 font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200/50 dark:border-slate-700/50 truncate max-w-[80px]"
                      >
                        {col.name}
                      </th>
                    ))}
                    {data.outputColumns.map((col) => (
                      <th
                        key={col.id}
                        className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200/50 dark:border-slate-700/50 truncate max-w-[80px]"
                      >
                        {col.name}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-[10px] text-slate-400 font-bold text-right">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.rows.map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => {
                        const config: Record<string, boolean> = {};
                        data.inputColumns.forEach((col, cIdx) => {
                          config[col.nodeId] = row.inputs[cIdx];
                        });
                        onApplyRowInputs(config);
                      }}
                      title="Click row to set live circuit inputs"
                      className={`cursor-pointer transition-colors ${
                        row.isCurrent
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-200'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <td className="px-3 py-2 text-center text-[10px] text-slate-400">
                        {idx}
                      </td>
                      {row.inputs.map((val, inIdx) => (
                        <td
                          key={inIdx}
                          className="px-3 py-2 border-r border-slate-100 dark:border-slate-800/60"
                        >
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-bold ${
                              val
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {val ? '1' : '0'}
                          </span>
                        </td>
                      ))}
                      {row.outputs.map((val, outIdx) => (
                        <td
                          key={outIdx}
                          className="px-3 py-2 border-r border-slate-100 dark:border-slate-800/60"
                        >
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-bold ${
                              val === true || val === '1'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                : typeof val === 'string'
                                ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {typeof val === 'boolean' ? (val ? '1' : '0') : val}
                          </span>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        {row.isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 hover:text-blue-500 transition-colors">
                            Apply
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            Click any row to instantly simulate that combination on the canvas.
          </p>
        </div>
      </div>
    </div>
  );
};
