import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const refreshDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  const loadAnalyticsData = useCallback(async (jobId: string = 'stream_job_default', silent: boolean = false) => {
    if (!silent) {
      setLoadingAnalytics(true);
    }
    try {
      const activeLocalGoal = localStorage.getItem('yba_user_goal');

      const [data, velocityData, cohortData] = await Promise.all([
        getAnalyticsResults(jobId, activeLocalGoal || undefined),
        getVelocityAnalytics(jobId).catch(() => null),
        getCohortAnalytics(jobId).catch(() => null)
      ]);

      // If user has a saved local goal that differs from backend DB, sync the saved goal to backend SQLite
      if (activeLocalGoal && activeLocalGoal.trim() && data.goal_text !== activeLocalGoal.trim()) {
        try {
          await updateJobGoal(jobId, activeLocalGoal.trim());
          data.goal_text = activeLocalGoal.trim();
        } catch (e) {
          console.warn('Could not sync local goal to backend:', e);
        }
      }

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
      if (!silent) {
        setLoadingAnalytics(false);
      }
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
        const syncedGoal = event.data.goal.trim();
        if (syncedGoal && syncedGoal !== currentGoal) {
          setCurrentGoal(syncedGoal);
          localStorage.setItem('yba_user_goal', syncedGoal);
          updateJobGoal('stream_job_default', syncedGoal)
            .then(() => loadAnalyticsData('stream_job_default', true))
            .catch((err) => console.warn('Could not sync goal from extension to backend SQLite:', err));
        }
      }
    };

    window.addEventListener('message', handleGoalMessage);
    return () => window.removeEventListener('message', handleGoalMessage);
  }, [viewMode, analytics, loadAnalyticsData, currentGoal]);

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
          if (msg.type === 'ALIGNMENT_UPDATE' && msg.data) {
            setAnalytics((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                alignment_score: msg.data.alignment_score ?? prev.alignment_score,
                metrics: msg.data.metrics ? { ...prev.metrics, ...msg.data.metrics } : prev.metrics,
              };
            });
          } else if (msg.type === 'VELOCITY_UPDATE' && msg.data) {
            setVelocityAnalytics({
              job_id: msg.data.job_id,
              overall_v_cog: msg.data.overall_v_cog,
              sessions: msg.data.sessions,
              fatigue_windows: msg.data.fatigue_windows
            });
          } else if (msg.type === 'WATCH_UPDATE') {
            if (refreshDebounceRef.current) {
              clearTimeout(refreshDebounceRef.current);
            }
            refreshDebounceRef.current = setTimeout(() => {
              loadAnalyticsData('stream_job_default', true);
            }, 800);
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
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    };
  }, [loadAnalyticsData]);

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
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#0f0f0f] text-[#0f0f0f] dark:text-[#f1f1f1] transition-colors duration-200">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        {viewMode === 'ANALYTICS' && (
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={() => setViewMode('GOAL_SETUP')}
              data-testid="edit-goal-nav-btn"
              className="h-10 px-4 rounded-full border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-[#eeeeee] dark:hover:bg-[#383838] transition-all text-xs font-medium flex items-center gap-2 shadow-yt-sm"
            >
              <Target className="w-4 h-4 text-[#e1002d]" />
              <span>Target Goal: <strong className="font-semibold text-[#0f0f0f] dark:text-white">{currentGoal || 'Set Goal'}</strong> (Edit)</span>
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
            <Loader2 className="w-10 h-10 animate-spin text-[#e1002d] mx-auto mb-4" />
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white mb-1">
              Building Analytics Dashboard
            </h3>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
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
            goalText={currentGoal || analytics.goal_text || ''}
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
