import React from 'react';
import { Eye, Calculator } from 'lucide-react';

interface MetricBadgeProps {
  type: 'observed' | 'estimated';
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({ type }) => {
  if (type === 'observed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
        <Eye className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
        Observed Data
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 shadow-xs">
      <Calculator className="w-3 h-3 text-sky-500 dark:text-sky-400" />
      Derived Estimate
    </span>
  );
};

