import React, { useState } from 'react';
import { AnalyticsResultDTO, JobStatusResponseDTO } from '../../types';
import { GoalScoreCard } from './GoalScoreCard';
import { MetricCard } from './MetricCard';
import { CircadianChart } from './CircadianChart';
import { ChannelRecommendations } from './ChannelRecommendations';
import { TopicBreakdownChart } from './TopicBreakdownChart';
import { TimeOfDayHeatmap } from './TimeOfDayHeatmap';
import { BehavioralNudges } from './BehavioralNudges';
import { Target, Eye, Gauge, Moon, BarChart2, Compass } from 'lucide-react';
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
  onReset?: () => void;
  onEditGoal?: () => void;
}

import { Sparkles, Layers } from 'lucide-react';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  velocityAnalytics,
  cohortAnalytics,
  jobStatus,
  goalText,
  onEditGoal,
}) => {
  const [activeTab, setActiveTab] = useState<'VIEWER' | 'CREATOR'>('VIEWER');
  const [viewerSubTab, setViewerSubTab] = useState<'STATISTICS' | 'ROADMAP'>('STATISTICS');
  const [densityMode, setDensityMode] = useState<'FOCUS' | 'DIAGNOSTIC'>('FOCUS');
  const [creatorActiveSection, setCreatorActiveSection] = useState<'ALL' | 'PACKAGING' | 'MARKET' | 'INTENT'>('PACKAGING');

  const metrics = analytics.metrics;
  const focusRatio = metrics?.focus_ratio ?? 0;
  const completionProb = metrics?.median_completion_prob ?? 0;
  const sessionDensity = metrics?.session_density ?? 0;
  const circadianScore = metrics?.circadian_score ?? 0;

  const isHighDensity = sessionDensity > 15;

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto pb-20">
      {/* Top Navigation & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[28px] bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 backdrop-blur-xl shadow-sm">
        <div>
          <h2 className="font-black text-2xl sm:text-3xl tracking-tight text-zinc-900 dark:text-white">
            YBA Dual-Mode Engine
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 flex text-xs font-semibold shadow-xs">
            <button
              onClick={() => setActiveTab('VIEWER')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'VIEWER'
                  ? 'bg-emerald-500 text-white shadow-sm font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Viewer Analytics
            </button>
            <button
              onClick={() => setActiveTab('CREATOR')}
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                activeTab === 'CREATOR'
                  ? 'bg-emerald-500 text-white shadow-sm font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Creator Intelligence
            </button>
          </div>

          {onEditGoal && (
            <button
              onClick={onEditGoal}
              className="h-9 px-4 rounded-full border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>Edit Goal</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'CREATOR' ? (
        <div className="space-y-6">
          {/* Creator Studio Workspace Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[24px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
              {[
                { id: 'PACKAGING', label: '🎨 Packaging & Hook Studio', desc: 'Title, Thumbnail & Hook script optimization' },
                { id: 'MARKET', label: '📡 Market Trends & Opportunities', desc: 'Niche trajectories & content gap radar' },
                { id: 'INTENT', label: '🧠 Audience Intent & Pain-Points', desc: 'Comment mining & confusion heatmaps' },
                { id: 'ALL', label: '⚡ All Studio Tools', desc: 'Comprehensive multi-model view' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCreatorActiveSection(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
                    creatorActiveSection === tab.id
                      ? 'bg-emerald-500 text-white border-transparent shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden lg:block">
              {creatorActiveSection === 'PACKAGING' && <span>AI Title NLP, Thumbnail Computer Vision & Hook Retention</span>}
              {creatorActiveSection === 'MARKET' && <span>Real-time YouTube search velocity & 8-factor VOS gap radar</span>}
              {creatorActiveSection === 'INTENT' && <span>Clustered viewer comments, feature requests & confusion spots</span>}
              {creatorActiveSection === 'ALL' && <span>Complete end-to-end Creator Intelligence suite</span>}
            </div>
          </div>

          {/* Workspace 1: Packaging & Hook Studio */}
          {(creatorActiveSection === 'ALL' || creatorActiveSection === 'PACKAGING') && (
            <div className="animate-fadeIn">
              <PackagingOptimizer />
            </div>
          )}

          {/* Workspace 2: Market Trends & Content Opportunities */}
          {(creatorActiveSection === 'ALL' || creatorActiveSection === 'MARKET') && (
            <div className="space-y-6 animate-fadeIn">
              <NicheTrendRadar goal={goalText} />
              <VideoOpportunityMatrix goal={goalText} />
            </div>
          )}


          {/* Workspace 3: Audience Intent Miner */}
          {(creatorActiveSection === 'ALL' || creatorActiveSection === 'INTENT') && (
            <div className="animate-fadeIn">
              <AudienceIntentMiner />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tier 1: Real-time Live Stream & Hero Goal Score Card */}
          <div className="space-y-6">
            <LiveStreamWidget />

            <GoalScoreCard
              alignmentScore={analytics.alignment_score}
              goalText={goalText}
              onEditGoal={onEditGoal}
            />
          </div>

          {/* Progressive Disclosure Density Controller */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[24px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mr-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                View Density:
              </span>
              <div className="p-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex text-xs font-semibold shadow-xs">
                <button
                  type="button"
                  onClick={() => setDensityMode('FOCUS')}
                  className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    densityMode === 'FOCUS'
                      ? 'bg-emerald-500 text-white shadow-xs font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Focus Pulse</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDensityMode('DIAGNOSTIC')}
                  className={`px-3.5 py-1 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    densityMode === 'DIAGNOSTIC'
                      ? 'bg-emerald-500 text-white shadow-xs font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Deep Diagnostic</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              {densityMode === 'FOCUS' ? (
                <span>⚡ Streamlined daily pulse & actionable recommendations</span>
              ) : (
                <span>🔬 Full analytical suite with 24-hr distributions & decay models</span>
              )}
            </div>
          </div>

          {/* Tier 2: 4 Core Behavioral Proxy KPI Cards */}
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

          {/* Tier 3A: Focus Pulse Mode (Actionable Nudges & Recommended Channels) */}
          {densityMode === 'FOCUS' && (
            <div className="space-y-6 animate-fadeIn">
              <BehavioralNudges nudges={analytics.nudges} />

              {velocityAnalytics && velocityAnalytics.fatigue_windows && (
                <FatigueWindowAlert windows={velocityAnalytics.fatigue_windows} />
              )}

              <ChannelRecommendations
                recommendations={analytics.recommendations}
                goalText={goalText}
                focusPlaylistUrl={analytics.focus_playlist_url}
              />
            </div>
          )}

          {/* Tier 3B: Deep Diagnostic Mode (Categorized Full Analytical Suite) */}
          {densityMode === 'DIAGNOSTIC' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Viewer Sub-Tab Division Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 shadow-xs self-start">
                  <button
                    type="button"
                    onClick={() => setViewerSubTab('STATISTICS')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                      viewerSubTab === 'STATISTICS'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Behavioral Statistics & Patterns</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewerSubTab('ROADMAP')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                      viewerSubTab === 'ROADMAP'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Roadmap, Nudges & Recommendations</span>
                  </button>
                </div>

                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
                  {viewerSubTab === 'STATISTICS' ? (
                    <span>Quantitative proxies & activity distributions</span>
                  ) : (
                    <span>Taxonomy mastery & targeted action channels</span>
                  )}
                </div>
              </div>

              {/* Sub-Tab 1: Behavioral Statistics & Patterns */}
              {viewerSubTab === 'STATISTICS' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TimeOfDayHeatmap hourlyData={analytics.hourly_heatmap} />
                    <TopicBreakdownChart categories={analytics.categories} />
                  </div>

                  <CircadianChart hourlyData={analytics.hourly_heatmap} circadianScore={circadianScore} />

                  {velocityAnalytics && velocityAnalytics.sessions && (
                    <CognitiveDecayChart sessions={velocityAnalytics.sessions} />
                  )}

                  {cohortAnalytics && (
                    <CohortBenchmarkCard cohortAnalytics={cohortAnalytics} />
                  )}
                </div>
              )}

              {/* Sub-Tab 2: Roadmap, Nudges & Recommendations */}
              {viewerSubTab === 'ROADMAP' && (
                <div className="space-y-6 animate-fadeIn">
                  <DAGSkillGraph jobId={jobStatus.job_id} />

                  <BehavioralNudges nudges={analytics.nudges} />

                  {velocityAnalytics && velocityAnalytics.fatigue_windows && (
                    <FatigueWindowAlert windows={velocityAnalytics.fatigue_windows} />
                  )}

                  <ChannelRecommendations
                    recommendations={analytics.recommendations}
                    goalText={goalText}
                    focusPlaylistUrl={analytics.focus_playlist_url}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
