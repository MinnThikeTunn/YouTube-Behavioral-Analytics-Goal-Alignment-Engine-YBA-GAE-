import React from 'react';
import { Card } from '../common/Card';
import { Users, TrendingUp, Medal, Info } from 'lucide-react';
import { CohortAnalyticsResponseDTO } from '../../types';

interface CohortBenchmarkCardProps {
  cohortAnalytics: CohortAnalyticsResponseDTO;
}

export const CohortBenchmarkCard: React.FC<CohortBenchmarkCardProps> = ({ cohortAnalytics }) => {
  const { benchmark, insights } = cohortAnalytics;

  return (
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] p-6 lg:p-8 shadow-yt-sm hover:shadow-yt-md transition-all duration-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center border border-[#e1002d]/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white tracking-tight">
            Peer Cohort Benchmark
          </h3>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
            Compared against {benchmark.cohort_size.toLocaleString()} {benchmark.cohort_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f9f9f9] dark:bg-[#272727] rounded-xl p-5 border border-[#dbdbdb] dark:border-[#2e2e2e] flex flex-col justify-center relative overflow-hidden transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5">
            <Medal className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1 flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-[#e1002d]" /> Cohort Tier
          </p>
          <div className="font-headline text-2xl lg:text-3xl font-bold text-[#0f0f0f] dark:text-white tracking-tight">
            {benchmark.cohort_tier}
          </div>
          <div className="mt-2 text-xs text-[#2ba640] font-semibold">
            Top {100 - benchmark.percentile_rank}% of learners
          </div>
        </div>

        <div className="bg-[#f9f9f9] dark:bg-[#272727] rounded-xl p-5 border border-[#dbdbdb] dark:border-[#2e2e2e] flex flex-col justify-center relative overflow-hidden transition-colors">
          <div className="absolute -right-4 -top-4 opacity-5">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#2ba640]" /> Focus Streak
          </p>
          <div className="font-headline text-2xl lg:text-3xl font-bold text-[#0f0f0f] dark:text-white tracking-tight">
            +{benchmark.focus_streak_comparison}%
          </div>
          <div className="mt-2 text-xs text-[#606060] dark:text-[#aaaaaa] font-medium">
            Longer than average peer
          </div>
        </div>
      </div>

      <div className="bg-[#b3e5fc]/20 dark:bg-[#01579b]/15 rounded-xl p-5 border border-[#3ea6ff]/30">
        <h4 className="text-xs font-bold flex items-center gap-2 text-[#01579b] dark:text-[#81d4fa] mb-3 uppercase tracking-wider">
          <Info className="w-4 h-4 text-[#3ea6ff]" /> AI Insights
        </h4>
        <ul className="space-y-2">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ea6ff] mt-1.5 flex-shrink-0" />
              <span className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] leading-relaxed">
                {insight}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default CohortBenchmarkCard;

