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
        return { label: 'Data Ingestion', color: 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30' };
      case 'ENRICHMENT':
        return { label: 'YouTube API Enrichment', color: 'bg-[#ffcccc]/60 text-[#8b0000] dark:bg-[#8b0000]/40 dark:text-[#ff9999] border-[#e1002d]/30' };
      case 'METRICS':
        return { label: 'Proxy Metrics Math', color: 'bg-[#b3e5fc]/80 text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30' };
      case 'AI_DISCOVERY':
        return { label: 'Gemini AI Alignment', color: 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border-[#2ba640]/30' };
      default:
        return { label: stage, color: 'bg-[#eeeeee] text-[#606060] dark:bg-[#383838] dark:text-[#aaaaaa] border-[#dbdbdb] dark:border-[#3f3f3f]' };
    }
  };

  const badge = getStageBadge(log.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#272727] rounded-2xl p-6 lg:p-8 shadow-yt-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dbdbdb] dark:border-[#2e2e2e] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 border border-[#e1002d]/20 flex items-center justify-center text-[#e1002d]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-headline text-lg font-bold text-[#0f0f0f] dark:text-white">Calculation Breakdown</h4>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
                {new Date(log.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#606060] dark:text-[#aaaaaa] hover:text-[#0f0f0f] dark:hover:text-white hover:bg-[#eeeeee] dark:hover:bg-[#383838] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4 text-xs">
          {/* Stage & Level Pills */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-0.5 text-xs font-semibold rounded-full border ${badge.color}`}>
              {badge.label}
            </span>
            <span className="px-3 py-0.5 text-xs font-mono font-semibold rounded-full bg-[#eeeeee] dark:bg-[#383838] text-[#606060] dark:text-[#aaaaaa] border border-[#dbdbdb] dark:border-[#3f3f3f]">
              LEVEL: {log.level}
            </span>
          </div>

          {/* Log Message */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e]">
            <p className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1] leading-relaxed">
              {log.message}
            </p>
          </div>

          {/* Parsed JSON Math Payload */}
          {parsedDetails && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#606060] dark:text-[#aaaaaa] mb-2">
                <Code2 className="w-4 h-4 text-[#e1002d]" />
                <span>Raw Variables & Math Parameters</span>
              </div>
              <pre className="p-4 rounded-xl bg-[#0f0f0f] text-[#3ea6ff] text-xs font-mono overflow-x-auto border border-[#272727] shadow-inner custom-scrollbar">
                {JSON.stringify(parsedDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#dbdbdb] dark:border-[#2e2e2e] flex justify-end">
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-full bg-[#eeeeee] dark:bg-[#383838] hover:bg-[#e8e8e8] dark:hover:bg-[#484848] text-[#0f0f0f] dark:text-[#f1f1f1] font-medium text-xs transition-all"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationDetailModal;

