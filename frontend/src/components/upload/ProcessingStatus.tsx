import React, { useEffect, useState } from 'react';
import { Loader2, PauseCircle } from 'lucide-react';
import { Card } from '../common/Card';
import { getJobStatus } from '../../services/api';
import { JobStatusResponseDTO } from '../../types';

interface ProcessingStatusProps {
  jobId: string;
  onProcessingComplete: (status: JobStatusResponseDTO) => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ jobId, onProcessingComplete }) => {
  const [jobStatus, setJobStatus] = useState<JobStatusResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: any = null;

    const pollStatus = async () => {
      try {
        const data = await getJobStatus(jobId);
        setJobStatus(data);

        if (data.status === 'COMPLETED') {
          clearInterval(intervalId);
          onProcessingComplete(data);
        } else if (data.status === 'FAILED') {
          clearInterval(intervalId);
          setError(data.error_message || 'Processing failed.');
        }
      } catch (err: any) {
        console.error('Error polling status:', err);
      }
    };

    pollStatus();
    intervalId = setInterval(pollStatus, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, onProcessingComplete]);

  if (!jobStatus) {
    return (
      <Card className="max-w-xl mx-auto my-12 text-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Connecting to processing engine...</p>
      </Card>
    );
  }

  const isPaused = jobStatus.status === 'QUOTA_PAUSED';

  return (
    <Card className="max-w-2xl mx-auto my-12 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            {isPaused ? (
              <>
                <PauseCircle className="w-5 h-5 text-amber-500" />
                API Quota Limit Reached
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                Analyzing Viewing Behavior
              </>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Job ID: <code className="text-teal-600 dark:text-teal-400">{jobId}</code>
          </p>
        </div>
        <span className="text-sm font-black px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          {jobStatus.progress_pct.toFixed(0)}%
        </span>
      </div>

      <div className="w-full h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${Math.max(5, jobStatus.progress_pct)}%` }}
        />
      </div>

      {isPaused && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs mb-4">
          Daily YouTube API quota reached. Partial analytics computed up to this point remain available while waiting for daily reset.
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          {error}
        </div>
      )}
    </Card>
  );
};
