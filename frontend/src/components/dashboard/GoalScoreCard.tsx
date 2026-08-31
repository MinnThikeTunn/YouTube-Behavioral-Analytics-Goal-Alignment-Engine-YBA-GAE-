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

  let badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  let badgeLabel = 'HIGHLY ALIGNED';
  let diagnosticSummary = 'High Goal Alignment — The majority of your watch history directly reinforces your target learning domain.';

  if (score < 40) {
    badgeColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    badgeLabel = 'LOW ALIGNMENT';
    diagnosticSummary = 'Drift Detected — Your watch history is currently concentrated in non-goal entertainment topics.';
  } else if (score < 70) {
    badgeColor = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
    badgeLabel = 'MODERATELY ALIGNED';
    diagnosticSummary = 'Moderate Alignment — Balanced consumption between your target goal and general topics.';
  }

  return (
    <Card className="relative overflow-hidden bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 p-8 lg:p-10 shadow-xl rounded-[32px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Target Goal: <span className="text-zinc-900 dark:text-white font-bold">{goalText}</span>
            </span>
            {onEditGoal && (
              <button
                onClick={onEditGoal}
                className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-xs"
              >
                <Edit3 className="w-3 h-3 text-emerald-500" />
                Change Goal
              </button>
            )}
          </div>
          <h2 className="font-black text-2xl lg:text-3xl text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            Goal Alignment Score
            <MetricBadge type="estimated" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </h2>
        </div>

        <span className={`self-start md:self-auto text-xs font-bold px-4 py-1.5 rounded-full border ${badgeColor} shadow-xs transition-colors duration-500`}>
          {badgeLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 flex items-baseline gap-4">
          <span className="font-black text-6xl lg:text-7xl text-zinc-900 dark:text-white tracking-tighter">
            {score.toFixed(0)}%
          </span>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p className="font-bold text-zinc-800 dark:text-zinc-200">Content Match Probability</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              sentence-transformers (384-d)
            </p>
          </div>
        </div>

        <div className="md:col-span-7 space-y-4">
          <div className="w-full h-3.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-200 dark:border-zinc-700/80">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-sky-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-xs"
              style={{ width: `${Math.max(3, score)}%` }}
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{diagnosticSummary}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Score derived from channel context, Wikipedia taxonomy categories, and video metadata embeddings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GoalScoreCard;

