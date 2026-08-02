import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { AlertTriangle, Target, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { BehavioralNudgeDTO } from '../../types';

interface BehavioralNudgesProps {
  nudges?: BehavioralNudgeDTO[];
}

export const BehavioralNudges: React.FC<BehavioralNudgesProps> = ({ nudges = [] }) => {
  if (!nudges || nudges.length === 0) {
    return null;
  }

  const getNudgeIcon = (type: string) => {
    switch (type) {
      case 'switching_alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'focus_goalpost':
        return <Target className="w-5 h-5 text-indigo-500 flex-shrink-0" />;
      case 'circadian_alert':
        return <Moon className="w-5 h-5 text-teal-500 flex-shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10';
      case 'action':
        return 'border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10';
      case 'info':
        return 'border-teal-500/30 bg-teal-500/5 dark:bg-teal-500/10';
      default:
        return 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50';
    }
  };

  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-black text-xl text-slate-900 dark:text-white">
            Behavioral Interventions & Action Nudges
          </h3>
        </div>
        <MetricBadge type="estimated" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nudges.map((nudge, index) => (
          <div
            key={index}
            className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${getBorderColor(
              nudge.severity
            )}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {getNudgeIcon(nudge.nudge_type)}
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {nudge.title}
                  </h4>
                </div>
                {nudge.swap_count !== undefined && nudge.swap_count !== null && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-600 text-white shadow-sm">
                    Swap {nudge.swap_count}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
                {nudge.message}
              </p>
            </div>

            {nudge.nudge_type === 'focus_goalpost' && (
              <div className="mt-4 pt-3 border-t border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span>Actionable Goal Target</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
