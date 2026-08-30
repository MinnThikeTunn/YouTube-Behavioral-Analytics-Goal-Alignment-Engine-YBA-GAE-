import React from 'react';
import { Eye, Calculator } from 'lucide-react';

interface MetricBadgeProps {
  type: 'observed' | 'estimated';
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({ type }) => {
  if (type === 'observed') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#f5f5f5] dark:bg-[#272727] text-[#606060] dark:text-[#aaaaaa] border border-[#dbdbdb] dark:border-[#3f3f3f]">
        <Eye className="w-3 h-3 text-[#3ea6ff]" />
        Observed Data
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#b3e5fc]/40 dark:bg-[#01579b]/30 text-[#01579b] dark:text-[#81d4fa] border border-[#3ea6ff]/30">
      <Calculator className="w-3 h-3 text-[#3ea6ff]" />
      Derived Estimate
    </span>
  );
};

