import React from 'react';
import { X, Calculator, Code2 } from 'lucide-react';
import { JobLogDTO } from '../../types';

interface CalculationDetailModalProps {
  log: JobLogDTO | null;
  onClose: () => void;
}

export const CalculationDetailModal: React.FC<CalculationDetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  let parsedDetails: any = null;
  if (log.details_json) {
    try {
      parsedDetails = JSON.parse(log.details_json);
    } catch (e) {
      parsedDetails = null;
    }
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'INGESTION':
        return { label: 'Data Ingestion', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      case 'ENRICHMENT':
        return { label: 'YouTube API Enrichment', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 'METRICS':
        return { label: 'Proxy Metrics Math', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
      case 'AI_DISCOVERY':
        return { label: 'Gemini 3.5 Flash Lite', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
      default:
        return { label: stage, color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' };
    }
  };

  const badge = getStageBadge(log.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#18191b] border border-slate-200 dark:border-zinc-800 rounded-[32px] p-6 lg:p-8 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-lg text-slate-900 dark:text-white">Calculation Breakdown</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {new Date(log.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-sm">
          {/* Stage & Level Pills */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              LEVEL: {log.level}
            </span>
          </div>

          {/* Log Message */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800">
            <p className="font-medium text-slate-800 dark:text-zinc-200 leading-relaxed">
              {log.message}
            </p>
          </div>

          {/* Parsed JSON Math Payload */}
          {parsedDetails && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-zinc-400 mb-2">
                <Code2 className="w-4 h-4 text-teal-500" />
                Raw Variables & Math Parameters
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-teal-400 text-xs font-mono overflow-x-auto border border-slate-800 shadow-inner">
                {JSON.stringify(parsedDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-bold text-xs transition-all"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
