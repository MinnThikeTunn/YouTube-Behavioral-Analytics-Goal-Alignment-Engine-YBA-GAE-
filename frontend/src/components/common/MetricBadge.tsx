import React from 'react';
import { Eye, Calculator } from 'lucide-react';

interface MetricBadgeProps {
  type: 'observed' | 'estimated';
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({ type }) => {
  if (type === 'observed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700/60">
        <Eye className="w-3 h-3 text-sky-500" />
        Observed Data
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Calculator className="w-3 h-3" />
      Derived Estimate
    </span>
  );
};
