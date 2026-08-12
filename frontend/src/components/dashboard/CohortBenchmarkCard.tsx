import React from 'react';
import { Users, TrendingUp, Medal, Info } from 'lucide-react';
import { CohortAnalyticsResponseDTO } from '../../types';

interface CohortBenchmarkCardProps {
  cohortAnalytics: CohortAnalyticsResponseDTO;
}

export const CohortBenchmarkCard: React.FC<CohortBenchmarkCardProps> = ({ cohortAnalytics }) => {
  const { benchmark, insights } = cohortAnalytics;

  return (
    <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm transition-all duration-300 hover:shadow-md group">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-2xl">
          <Users className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Peer Cohort Benchmark
          </h3>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Compared against {benchmark.cohort_size.toLocaleString()} {benchmark.cohort_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800/50 flex flex-col justify-center relative overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-zinc-800/50 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Medal className="w-32 h-32" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-2">
            <Medal className="w-4 h-4" /> Cohort Tier
          </p>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {benchmark.cohort_tier}
          </div>
          <div className="mt-2 text-sm text-teal-600 dark:text-teal-400 font-medium">
            Top {100 - benchmark.percentile_rank}% of learners
          </div>
        </div>

        <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800/50 flex flex-col justify-center relative overflow-hidden group-hover:bg-slate-50 dark:group-hover:bg-zinc-800/50 transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Focus Streak
          </p>
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            +{benchmark.focus_streak_comparison}%
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-zinc-400 font-medium">
            Longer than average peer
          </div>
        </div>
      </div>

      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl p-6 border border-indigo-100/50 dark:border-indigo-800/30">
        <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300 mb-4 tracking-wide uppercase">
          <Info className="w-4 h-4" /> AI Insights
        </h4>
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-2 flex-shrink-0" />
              <span className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                {insight}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
