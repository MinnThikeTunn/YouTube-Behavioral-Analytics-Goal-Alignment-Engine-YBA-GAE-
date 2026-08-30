import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { GoalAlignmentScoreDTO } from '../../types';
import { Sparkles, Target, Info, Edit3 } from 'lucide-react';

interface GoalScoreCardProps {
  alignmentScore?: GoalAlignmentScoreDTO;
  goalText: string;
  onEditGoal?: () => void;
}

export const GoalScoreCard: React.FC<GoalScoreCardProps> = ({ alignmentScore, goalText, onEditGoal }) => {
  const score = alignmentScore?.alignment_probability_score ?? 0;

  let badgeColor = 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border-[#2ba640]/30';
  let badgeLabel = 'HIGHLY ALIGNED';

  if (score < 40) {
    badgeColor = 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border-[#e1002d]/30';
    badgeLabel = 'LOW ALIGNMENT';
  } else if (score < 70) {
    badgeColor = 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30';
    badgeLabel = 'MODERATELY ALIGNED';
  }

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#272727] p-8 lg:p-10 shadow-yt-sm hover:shadow-yt-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#606060] dark:text-[#aaaaaa] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#e1002d]" />
              Target Goal: <span className="text-[#0f0f0f] dark:text-white font-bold">{goalText}</span>
            </span>
            {onEditGoal && (
              <button
                onClick={onEditGoal}
                className="px-3 py-1 rounded-full bg-[#eeeeee] hover:bg-[#e8e8e8] dark:bg-[#272727] dark:hover:bg-[#383838] text-[#0f0f0f] dark:text-[#f1f1f1] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[11px] font-medium transition-all flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3 text-[#e1002d]" />
                Change Goal
              </button>
            )}
          </div>
          <h2 className="font-headline text-2xl lg:text-3xl font-bold text-[#0f0f0f] dark:text-white tracking-tight flex items-center gap-3">
            Goal Alignment Score
            <MetricBadge type="estimated" />
          </h2>
        </div>

        <span className={`self-start md:self-auto text-xs font-semibold px-3.5 py-1.5 rounded-full border ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 flex items-baseline gap-4">
          <span className="font-display text-6xl lg:text-7xl font-bold text-[#0f0f0f] dark:text-white tracking-tighter">
            {score.toFixed(0)}%
          </span>
          <div className="text-xs text-[#606060] dark:text-[#aaaaaa] space-y-1">
            <p className="font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">Content Match Probability</p>
            <p className="text-[11px] text-[#606060] dark:text-[#aaaaaa] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#e1002d]" />
              sentence-transformers (384-d)
            </p>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="w-full h-3.5 bg-[#eeeeee] dark:bg-[#272727] rounded-full overflow-hidden mb-4 p-0.5 border border-[#dbdbdb] dark:border-[#3f3f3f]">
            <div
              className="h-full bg-gradient-to-r from-[#e1002d] via-[#3ea6ff] to-[#2ba640] rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.max(3, score)}%` }}
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-xs text-[#606060] dark:text-[#aaaaaa] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#3ea6ff] flex-shrink-0 mt-0.5" />
            <span>
              This score represents <strong>content similarity to your stated goal</strong> derived from channel context, Wikipedia topic categories, and video metadata embeddings.
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GoalScoreCard;

