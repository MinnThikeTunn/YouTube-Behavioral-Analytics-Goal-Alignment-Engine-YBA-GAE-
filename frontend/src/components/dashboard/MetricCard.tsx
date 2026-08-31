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
    <Card className="flex flex-col justify-between p-6 rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/80 shadow-xs">
            <Icon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <MetricBadge type={badgeType} />
        </div>

        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="font-black text-3xl text-zinc-900 dark:text-white tracking-tight mb-2">
          {value}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {subtitle}
        </p>
      </div>

      {alert && alertText && (
        <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center gap-1.5 shadow-xs">
          <span>⚠️</span>
          <span>{alertText}</span>
        </div>
      )}
    </Card>
  );
};

export default MetricCard;

