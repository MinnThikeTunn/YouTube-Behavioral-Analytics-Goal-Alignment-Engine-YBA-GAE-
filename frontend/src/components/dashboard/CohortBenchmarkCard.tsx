import React from 'react';
import { Card } from '../common/Card';
import { Sparkles } from 'lucide-react';
import { CohortAnalyticsResponseDTO } from '../../types';

export interface CohortBenchmarkCardProps {
  cohortAnalytics?: CohortAnalyticsResponseDTO;
  insights?: string[];
}

export const CohortBenchmarkCard: React.FC<CohortBenchmarkCardProps> = ({ cohortAnalytics, insights: directInsights }) => {
  const insights = directInsights || cohortAnalytics?.insights || [];

  return (
    <Card className="rounded-[28px] lg:rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight">
              AI Insights
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Synthesized behavioral patterns and personalized recommendations
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit">
          <Sparkles className="w-3.5 h-3.5" />
          AI Synthesized
        </span>
      </div>

      {insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="group flex items-start gap-3.5 p-4 lg:p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/50 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 border border-emerald-500/20">
                {idx + 1}
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed font-medium">
                {insight}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/30 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            No AI insights available yet. Process more goal-aligned watch history to generate personalized observations.
          </p>
        </div>
      )}
    </Card>
  );
};

export const AIInsightsCard = CohortBenchmarkCard;
export default CohortBenchmarkCard;

