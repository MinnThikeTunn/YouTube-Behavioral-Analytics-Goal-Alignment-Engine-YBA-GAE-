import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { FileUploader } from './components/upload/FileUploader';
import { ProcessingStatus } from './components/upload/ProcessingStatus';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { UploadResponseDTO, JobStatusResponseDTO, AnalyticsResultDTO } from './types';
import { getAnalyticsResults } from './services/api';
import { Card } from './components/common/Card';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeJob, setActiveJob] = useState<UploadResponseDTO | null>(null);
  const [completedJob, setCompletedJob] = useState<JobStatusResponseDTO | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResultDTO | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleProcessingComplete = async (status: JobStatusResponseDTO) => {
    setCompletedJob(status);
    setLoadingAnalytics(true);
    try {
      const data = await getAnalyticsResults(status.job_id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics results:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleReset = () => {
    setActiveJob(null);
    setCompletedJob(null);
    setAnalytics(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#131415] text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!activeJob && !completedJob && (
          <FileUploader
            onUploadSuccess={(response) => {
              setActiveJob(response);
            }}
          />
        )}

        {activeJob && !completedJob && (
          <ProcessingStatus
            jobId={activeJob.job_id}
            onProcessingComplete={handleProcessingComplete}
          />
        )}

        {loadingAnalytics && (
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

        {!loadingAnalytics && completedJob && analytics && (
          <DashboardPage
            analytics={analytics}
            jobStatus={completedJob}
            goalText="Software Engineering"
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  );
};

export default App;
