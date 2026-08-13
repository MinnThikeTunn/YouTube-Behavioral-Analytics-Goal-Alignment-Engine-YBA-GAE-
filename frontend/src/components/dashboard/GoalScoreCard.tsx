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

  let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  let badgeLabel = 'HIGHLY ALIGNED';

  if (score < 40) {
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    badgeLabel = 'LOW ALIGNMENT';
  } else if (score < 70) {
    badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    badgeLabel = 'MODERATELY ALIGNED';
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white/90 via-white/80 to-teal-500/5 dark:from-[#1c1d1f] dark:via-[#1c1d1f] dark:to-teal-500/10 p-8 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-teal-500" />
              Target Goal: <span className="text-slate-900 dark:text-white font-bold">{goalText}</span>
            </span>
            {onEditGoal && (
              <button
                onClick={onEditGoal}
                className="px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[11px] font-bold transition-all flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                Change Goal
              </button>
            )}
          </div>
          <h2 className="font-black text-2xl lg:text-3xl text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Goal Alignment Score
            <MetricBadge type="estimated" />
          </h2>
        </div>

        <span className={`self-start md:self-auto text-xs font-black px-3.5 py-1.5 rounded-full border ${badgeColor}`}>
          {badgeLabel}
        </span>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 flex items-baseline gap-4">
          <span className="font-black text-6xl lg:text-7xl text-slate-900 dark:text-white tracking-tighter">
            {score.toFixed(0)}%
          </span>
          <div className="text-xs text-slate-500 dark:text-zinc-400 space-y-1">
            <p className="font-medium">Content Match Probability</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-500" />
              sentence-transformers (384-d)
            </p>
          </div>
        </div>

        <div className="md:col-span-7">
          <div className="w-full h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4 p-0.5 border border-slate-200/60 dark:border-zinc-700/60">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.max(3, score)}%` }}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60 text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
            <span>
              This score represents <strong>content similarity to your stated goal</strong> derived from channel context, Wikipedia topic categories, and video metadata embeddings.
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
