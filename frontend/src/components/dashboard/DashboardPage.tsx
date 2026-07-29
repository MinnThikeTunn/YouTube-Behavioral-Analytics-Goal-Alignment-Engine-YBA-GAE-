import React from 'react';
import { AnalyticsResultDTO, JobStatusResponseDTO } from '../../types';
import { GoalScoreCard } from './GoalScoreCard';
import { MetricCard } from './MetricCard';
import { CircadianChart } from './CircadianChart';
import { ChannelRecommendations } from './ChannelRecommendations';
import { Target, Eye, Gauge, Moon, RefreshCw } from 'lucide-react';

interface DashboardPageProps {
  analytics: AnalyticsResultDTO;
  jobStatus: JobStatusResponseDTO;
  goalText: string;
  onReset: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  jobStatus,
  goalText,
  onReset,
}) => {
  const metrics = analytics.metrics;
  const focusRatio = metrics?.focus_ratio ?? 0;
  const completionProb = metrics?.median_completion_prob ?? 0;
  const sessionDensity = metrics?.session_density ?? 0;
  const circadianScore = metrics?.circadian_score ?? 0;

  const isHighDensity = sessionDensity > 15;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-3xl tracking-tight text-slate-900 dark:text-white">
            Behavioral Analytics Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Analyzing <strong className="text-slate-900 dark:text-white">{jobStatus.video_records.toLocaleString()}</strong> video events out of {jobStatus.total_records.toLocaleString()} raw records.
          </p>
        </div>

        <button
          onClick={onReset}
          className="py-2.5 px-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Upload New File
        </button>
      </div>

      <GoalScoreCard
        alignmentScore={analytics.alignment_score}
        goalText={goalText}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Focus Ratio"
          value={`${focusRatio.toFixed(1)}%`}
          subtitle="Goal-Aligned Clicks / Total Video Clicks"
          badgeType="estimated"
          icon={Target}
        />

        <MetricCard
          title="Completion Probability"
          value={completionProb.toFixed(2)}
          subtitle="Median Watch Ratio Proxy (30-min Boundary)"
          badgeType="estimated"
          icon={Eye}
        />

        <MetricCard
          title="Session Density"
          value={`${sessionDensity.toFixed(1)} / hr`}
          subtitle="Average Clicks per Active Session Hour"
          badgeType="observed"
          icon={Gauge}
          alert={isHighDensity}
          alertText={isHighDensity ? "High switching velocity (>15/hr flagged)" : undefined}
        />

        <MetricCard
          title="Circadian Score"
          value={`${circadianScore.toFixed(1)}%`}
          subtitle="Late-Night Activity (11:00 PM – 5:00 AM)"
          badgeType="observed"
          icon={Moon}
        />
      </div>

      <CircadianChart circadianScore={circadianScore} />

      <ChannelRecommendations
        recommendations={analytics.recommendations}
        goalText={goalText}
      />
    </div>
  );
};
