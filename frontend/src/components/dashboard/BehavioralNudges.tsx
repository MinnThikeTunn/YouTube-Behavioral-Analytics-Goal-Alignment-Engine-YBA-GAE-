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
        return <AlertTriangle className="w-5 h-5 text-[#e1002d] flex-shrink-0" />;
      case 'focus_goalpost':
        return <Target className="w-5 h-5 text-[#3ea6ff] flex-shrink-0" />;
      case 'circadian_alert':
        return <Moon className="w-5 h-5 text-[#e1002d] flex-shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#3ea6ff] flex-shrink-0" />;
    }
  };

  const getBorderColor = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'border-[#e1002d]/30 bg-[#ffcccc]/20 dark:bg-[#e1002d]/10';
      case 'action':
        return 'border-[#3ea6ff]/30 bg-[#b3e5fc]/20 dark:bg-[#01579b]/15';
      case 'info':
        return 'border-[#2ba640]/30 bg-[#c8e6c9]/20 dark:bg-[#1b5e20]/15';
      default:
        return 'border-[#dbdbdb] dark:border-[#2e2e2e] bg-[#f9f9f9] dark:bg-[#272727]';
    }
  };

  return (
    <Card className="p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#e1002d]" />
          <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">
            Behavioral Interventions & Action Nudges
          </h3>
        </div>
        <MetricBadge type="estimated" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nudges.map((nudge, index) => (
          <div
            key={index}
            className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${getBorderColor(
              nudge.severity
            )}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  {getNudgeIcon(nudge.nudge_type)}
                  <h4 className="font-headline font-bold text-sm text-[#0f0f0f] dark:text-white">
                    {nudge.title}
                  </h4>
                </div>
                {nudge.swap_count !== undefined && nudge.swap_count !== null && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e1002d] text-white shadow-sm">
                    Swap {nudge.swap_count}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-[#606060] dark:text-[#aaaaaa]">
                {nudge.message}
              </p>
            </div>

            {nudge.nudge_type === 'focus_goalpost' && (
              <div className="mt-4 pt-3 border-t border-[#3ea6ff]/20 flex items-center justify-between text-xs font-medium text-[#3ea6ff]">
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

export default BehavioralNudges;

