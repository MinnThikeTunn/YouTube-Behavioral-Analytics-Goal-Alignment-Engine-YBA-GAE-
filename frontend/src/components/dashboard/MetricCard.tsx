import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeType: 'observed' | 'estimated';
  icon: LucideIcon;
  alert?: boolean;
  alertText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badgeType,
  icon: Icon,
  alert = false,
  alertText,
}) => {
  return (
    <Card className="flex flex-col justify-between p-6 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#ffcccc]/40 dark:bg-[#e1002d]/20 text-[#e1002d] dark:text-[#ff9999] flex items-center justify-center border border-[#e1002d]/20">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <MetricBadge type={badgeType} />
        </div>

        <h3 className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="font-headline text-3xl font-bold text-[#0f0f0f] dark:text-white tracking-tight mb-2">
          {value}
        </p>
        <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
          {subtitle}
        </p>
      </div>

      {alert && alertText && (
        <div className="mt-4 p-2.5 rounded-xl bg-[#ffcccc]/40 border border-[#e1002d]/30 text-[#8b0000] dark:bg-[#8b0000]/20 dark:text-[#ff9999] text-[11px] font-medium">
          ⚠️ {alertText}
        </div>
      )}
    </Card>
  );
};

export default MetricCard;

