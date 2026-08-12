import React from 'react';
import { AnalyticsResultDTO, JobStatusResponseDTO } from '../../types';
import { GoalScoreCard } from './GoalScoreCard';
import { MetricCard } from './MetricCard';
import { CircadianChart } from './CircadianChart';
import { ChannelRecommendations } from './ChannelRecommendations';
import { TopicBreakdownChart } from './TopicBreakdownChart';
import { TimeOfDayHeatmap } from './TimeOfDayHeatmap';
import { BehavioralNudges } from './BehavioralNudges';
import { Target, Eye, Gauge, Moon, RefreshCw } from 'lucide-react';
import { LiveStreamWidget } from './LiveStreamWidget';
import { DAGSkillGraph } from './DAGSkillGraph';
import { CognitiveDecayChart } from './CognitiveDecayChart';
import { FatigueWindowAlert } from './FatigueWindowAlert';
import { VelocityAnalyticsResponseDTO, CohortAnalyticsResponseDTO } from '../../types';
import { CohortBenchmarkCard } from './CohortBenchmarkCard';
import { AudienceIntentMiner } from '../creator/AudienceIntentMiner';
import { NicheTrendRadar } from '../creator/NicheTrendRadar';
import { VideoOpportunityMatrix } from '../creator/VideoOpportunityMatrix';
import { PackagingOptimizer } from '../creator/PackagingOptimizer';

interface DashboardPageProps {
  analytics: AnalyticsResultDTO;
  velocityAnalytics?: VelocityAnalyticsResponseDTO;
  cohortAnalytics?: CohortAnalyticsResponseDTO;
  jobStatus: JobStatusResponseDTO;
  goalText: string;
  onReset: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  velocityAnalytics,
  cohortAnalytics,
  jobStatus,
  goalText,
  onReset,
}) => {
  const [activeTab, setActiveTab] = React.useState<'VIEWER' | 'CREATOR'>('VIEWER');

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
            YBA Dual-Mode Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Analyzing <strong className="text-slate-900 dark:text-white">{jobStatus.video_records.toLocaleString()}</strong> video events out of {jobStatus.total_records.toLocaleString()} raw records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 flex text-xs font-bold">
            <button
              onClick={() => setActiveTab('VIEWER')}
              className={`px-4 py-1.5 rounded-xl transition-all ${activeTab === 'VIEWER' ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Viewer Analytics
            </button>
            <button
              onClick={() => setActiveTab('CREATOR')}
              className={`px-4 py-1.5 rounded-xl transition-all ${activeTab === 'CREATOR' ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Creator Intelligence
            </button>
          </div>

          <button
            onClick={onReset}
            className="py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Upload
          </button>
        </div>
      </div>

      {activeTab === 'CREATOR' ? (
        <div className="space-y-6">
          <PackagingOptimizer />
          <NicheTrendRadar />
          <AudienceIntentMiner />
          <VideoOpportunityMatrix />
        </div>
      ) : (
        <>
          <LiveStreamWidget />

      <GoalScoreCard
        alignmentScore={analytics.alignment_score}
        goalText={goalText}
      />

      <DAGSkillGraph jobId={jobStatus.job_id} />
      <BehavioralNudges nudges={analytics.nudges} />

      {velocityAnalytics && velocityAnalytics.fatigue_windows && (
        <FatigueWindowAlert windows={velocityAnalytics.fatigue_windows} />
      )}
      {velocityAnalytics && velocityAnalytics.sessions && (
        <CognitiveDecayChart sessions={velocityAnalytics.sessions} />
      )}

      {cohortAnalytics && (
        <CohortBenchmarkCard cohortAnalytics={cohortAnalytics} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeOfDayHeatmap hourlyData={analytics.hourly_heatmap} />
        <TopicBreakdownChart categories={analytics.categories} />
      </div>

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

      <CircadianChart hourlyData={analytics.hourly_heatmap} circadianScore={circadianScore} />

      <ChannelRecommendations
        recommendations={analytics.recommendations}
        goalText={goalText}
      />
        </>
      )}
    </div>
  );
};
