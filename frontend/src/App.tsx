import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { GoalSetupPage } from './components/dashboard/GoalSetupPage';
import { GoalEditModal } from './components/dashboard/GoalEditModal';
import { JobStatusResponseDTO, AnalyticsResultDTO } from './types';
import { getAnalyticsResults, getVelocityAnalytics, getCohortAnalytics, updateJobGoal } from './services/api';
import { Card } from './components/common/Card';
import { Loader2, Target } from 'lucide-react';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [currentGoal, setCurrentGoal] = useState<string>(
    localStorage.getItem('yba_user_goal') || ''
  );
  
  // viewMode: 'GOAL_SETUP' | 'ANALYTICS'
  const [viewMode, setViewMode] = useState<'GOAL_SETUP' | 'ANALYTICS'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'edit_goal') return 'GOAL_SETUP';
    return localStorage.getItem('yba_user_goal') ? 'ANALYTICS' : 'GOAL_SETUP';
  });

  const [analytics, setAnalytics] = useState<AnalyticsResultDTO | null>(null);
  const [velocityAnalytics, setVelocityAnalytics] = useState<any>(null);
  const [cohortAnalytics, setCohortAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);

  const [completedJob] = useState<JobStatusResponseDTO>({
    job_id: 'stream_job_default',
    status: 'COMPLETED',
    progress_pct: 100,
    total_records: 0,
    video_records: 0,
    community_post_records: 0,
    ad_records: 0,
    non_viewing_records: 0
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const loadAnalyticsData = useCallback(async (jobId: string = 'stream_job_default') => {
    setLoadingAnalytics(true);
    try {
      const [data, velocityData, cohortData] = await Promise.all([
        getAnalyticsResults(jobId),
        getVelocityAnalytics(jobId).catch(() => null),
        getCohortAnalytics(jobId).catch(() => null)
      ]);
      setAnalytics(data);
      if (data.goal_text) {
        setCurrentGoal(data.goal_text);
        localStorage.setItem('yba_user_goal', data.goal_text);
      }
      if (velocityData) setVelocityAnalytics(velocityData);
      if (cohortData) setCohortAnalytics(cohortData);
    } catch (err) {
      console.error('Failed to fetch analytics results:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSavedGoal = localStorage.getItem('yba_user_goal');

    if (params.get('action') === 'edit_goal') {
      setViewMode('GOAL_SETUP');
    } else if (hasSavedGoal && viewMode === 'ANALYTICS' && !analytics) {
      loadAnalyticsData('stream_job_default');
    }

    const handleGoalMessage = (event: MessageEvent) => {
      if (
        event.data &&
        (event.data.type === 'YBA_GOAL_SYNC' || event.data.type === 'YBA_GOAL_INITIAL_SYNC') &&
        event.data.goal
      ) {
        setCurrentGoal(event.data.goal);
        localStorage.setItem('yba_user_goal', event.data.goal);
      }
    };

    window.addEventListener('message', handleGoalMessage);
    return () => window.removeEventListener('message', handleGoalMessage);
  }, [viewMode, analytics, loadAnalyticsData]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost:8000' : window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/sync/ws/live`;
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'VELOCITY_UPDATE' && msg.data) {
            setVelocityAnalytics({
              job_id: msg.data.job_id,
              overall_v_cog: msg.data.overall_v_cog,
              sessions: msg.data.sessions,
              fatigue_windows: msg.data.fatigue_windows
            });
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      console.warn("WebSocket error:", e);
    }
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleSaveGoal = async (newGoal: string) => {
    setCurrentGoal(newGoal);
    localStorage.setItem('yba_user_goal', newGoal);
    window.postMessage({ type: 'YBA_GOAL_CHANGED', goal: newGoal }, '*');

    try {
      await updateJobGoal('stream_job_default', newGoal);
      await loadAnalyticsData('stream_job_default');
    } catch (err) {
      console.warn('Could not update job goal on backend:', err);
    } finally {
      setViewMode('ANALYTICS');
    }
  };

  const handleReset = () => {
    setViewMode('GOAL_SETUP');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#131415] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {viewMode === 'ANALYTICS' && (
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={() => setViewMode('GOAL_SETUP')}
              data-testid="edit-goal-nav-btn"
              className="py-2 px-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <Target className="w-4 h-4 text-teal-500" />
              Target Goal: {currentGoal || 'Set Goal'} (Edit)
            </button>
          </div>
        )}

        {viewMode === 'GOAL_SETUP' && (
          <GoalSetupPage
            currentGoal={currentGoal}
            onSaveGoal={handleSaveGoal}
          />
        )}

        {viewMode === 'ANALYTICS' && loadingAnalytics && (
          <Card className="max-w-xl mx-auto my-16 text-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-4" />
            <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1">
              Building Analytics Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Retrieving metrics, goal alignment scores, and channel recommendations...
            </p>
          </Card>
        )}

        {viewMode === 'ANALYTICS' && !loadingAnalytics && analytics && (
          <DashboardPage
            analytics={analytics}
            velocityAnalytics={velocityAnalytics}
            cohortAnalytics={cohortAnalytics}
            jobStatus={completedJob}
            goalText={analytics.goal_text || currentGoal}
            onReset={handleReset}
            onEditGoal={() => setViewMode('GOAL_SETUP')}
          />
        )}
      </main>

      <GoalEditModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currentGoal={currentGoal}
        onSaveGoal={handleSaveGoal}
      />
    </div>
  );
};

export default App;
