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
    <Card className="flex flex-col justify-between p-6 hover:border-teal-500/40 transition-all">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <MetricBadge type={badgeType} />
        </div>

        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="font-black text-3xl text-slate-900 dark:text-white tracking-tight mb-2">
          {value}
        </p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      {alert && alertText && (
        <div className="mt-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-medium">
          ⚠️ {alertText}
        </div>
      )}
    </Card>
  );
};
