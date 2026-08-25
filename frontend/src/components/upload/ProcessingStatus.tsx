import React, { useEffect, useState, useRef } from 'react';
import { Loader2, PauseCircle, Terminal, Calculator, CheckCircle2, Cpu, Sparkles, ChevronRight, Activity, ArrowDown } from 'lucide-react';
import { Card } from '../common/Card';
import { getJobStatus } from '../../services/api';
import { JobStatusResponseDTO, JobLogDTO } from '../../types';
import { CalculationDetailModal } from './CalculationDetailModal';

interface ProcessingStatusProps {
  jobId: string;
  onProcessingComplete: (status: JobStatusResponseDTO) => void;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ jobId, onProcessingComplete }) => {
  const [jobStatus, setJobStatus] = useState<JobStatusResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CALCULATION' | 'SYSTEM'>('ALL');
  const [selectedLog, setSelectedLog] = useState<JobLogDTO | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let intervalId: any = null;

    const pollStatus = async () => {
      try {
        if (jobId === "stream_job_default") {
          const mockStatus: JobStatusResponseDTO = {
            job_id: "stream_job_default",
            status: "COMPLETED",
            progress_pct: 100.0,
            total_records: 1,
            video_records: 1,
            community_post_records: 0,
            ad_records: 0,
            non_viewing_records: 0,
            error_message: undefined,
            completed_at: new Date().toISOString(),
            logs: []
          };
          setJobStatus(mockStatus);
          clearInterval(intervalId);
          onProcessingComplete(mockStatus);
          return;
        }

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

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobStatus?.logs, autoScroll]);

  if (!jobStatus) {
    return (
      <Card className="max-w-3xl mx-auto my-12 text-center p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm">
        <Loader2 className="w-8 h-8 animate-spin text-[#e1002d] mx-auto mb-3" />
        <p className="text-xs font-medium text-[#606060] dark:text-[#aaaaaa]">Connecting to processing engine...</p>
      </Card>
    );
  }

  const isPaused = jobStatus.status === 'QUOTA_PAUSED';
  const logs = jobStatus.logs || [];

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'CALCULATION') return log.level === 'CALCULATION';
    if (activeFilter === 'SYSTEM') return log.level !== 'CALCULATION';
    return true;
  });

  const getStageStatus = (stageMinPct: number) => {
    if (jobStatus.progress_pct >= stageMinPct + 25) return 'completed';
    if (jobStatus.progress_pct >= stageMinPct) return 'active';
    return 'pending';
  };

  const stages = [
    { label: 'Ingestion', icon: Cpu, minPct: 0 },
    { label: 'API Enrichment', icon: Activity, minPct: 25 },
    { label: 'Proxy Metrics', icon: Calculator, minPct: 50 },
    { label: 'Gemini AI Alignment', icon: Sparkles, minPct: 75 },
  ];

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-6">
      {/* Main Status Header Card */}
      <Card className="p-6 lg:p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-headline text-2xl font-bold text-[#0f0f0f] dark:text-white mb-1 flex items-center gap-3">
              {isPaused ? (
                <>
                  <PauseCircle className="w-6 h-6 text-[#e1002d] animate-pulse" />
                  API Quota Limit Reached
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-[#e1002d]" />
                  Live Processing & Calculations
                </>
              )}
            </h3>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] font-mono">
              Job ID: <code className="text-[#e1002d] font-bold">{jobId}</code>
            </p>
          </div>
          <span className="text-sm font-bold px-3.5 py-1 rounded-full bg-[#ffcccc]/40 text-[#8b0000] dark:bg-[#e1002d]/20 dark:text-[#ff9999] border border-[#e1002d]/20 shadow-sm">
            {jobStatus.progress_pct.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-[#eeeeee] dark:bg-[#383838] rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#e1002d] transition-all duration-500 rounded-full"
            style={{ width: `${Math.max(4, jobStatus.progress_pct)}%` }}
          />
        </div>

        {/* Pipeline Stage Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stages.map((st, idx) => {
            const status = getStageStatus(st.minPct);
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                  status === 'completed'
                    ? 'bg-[#c8e6c9]/40 border-[#2ba640]/30 text-[#1b5e20] dark:text-[#a5d6a7]'
                    : status === 'active'
                    ? 'bg-white dark:bg-[#272727] border-[#e1002d] text-[#8b0000] dark:text-[#ff9999] shadow-sm ring-1 ring-[#e1002d]/30'
                    : 'bg-[#f9f9f9] dark:bg-[#272727] border-[#dbdbdb] dark:border-[#2e2e2e] text-[#606060] dark:text-[#aaaaaa]'
                }`}
              >
                <div className={`p-2 rounded-full ${status === 'completed' ? 'bg-[#2ba640] text-white' : status === 'active' ? 'bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d]' : 'bg-[#eeeeee] dark:bg-[#383838] text-[#606060]'}`}>
                  {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate">{st.label}</p>
                  <p className="text-[10px] opacity-75 font-mono capitalize">{status}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isPaused && (
          <div className="mt-6 p-4 rounded-xl bg-[#ffcccc]/40 border border-[#e1002d]/30 text-[#8b0000] dark:bg-[#8b0000]/20 dark:text-[#ff9999] text-xs font-medium">
            Daily YouTube API quota reached. Partial analytics computed up to this point remain available while waiting for daily reset.
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-[#ffcccc]/40 border border-[#e1002d]/30 text-[#8b0000] dark:bg-[#8b0000]/20 dark:text-[#ff9999] text-xs font-medium">
            {error}
          </div>
        )}
      </Card>

      {/* Interactive Live Terminal & Calculation Trace Console */}
      <Card className="p-6 overflow-hidden rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
        {/* Terminal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#dbdbdb] dark:border-[#2e2e2e] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eeeeee] dark:bg-[#272727] flex items-center justify-center text-[#e1002d] border border-[#dbdbdb] dark:border-[#3f3f3f]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-headline text-sm font-bold text-[#0f0f0f] dark:text-white flex items-center gap-2">
                Execution & Calculation Traces
                <span className="w-2 h-2 rounded-full bg-[#2ba640] animate-ping" />
              </h4>
              <p className="text-[11px] text-[#606060] dark:text-[#aaaaaa]">
                Showing {filteredLogs.length} live trace logs. Click calculation entries for details.
              </p>
            </div>
          </div>

          {/* Filter Tabs & AutoScroll Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-[#f5f5f5] dark:bg-[#272727] rounded-full border border-[#dbdbdb] dark:border-[#3f3f3f] text-xs font-medium">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-full transition-all ${activeFilter === 'ALL' ? 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] font-semibold shadow-sm' : 'text-[#606060] dark:text-[#aaaaaa]'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('CALCULATION')}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 ${activeFilter === 'CALCULATION' ? 'bg-[#e1002d] text-white font-semibold shadow-sm' : 'text-[#606060] dark:text-[#aaaaaa]'}`}
              >
                <Calculator className="w-3 h-3" />
                Math
              </button>
              <button
                onClick={() => setActiveFilter('SYSTEM')}
                className={`px-3 py-1 rounded-full transition-all ${activeFilter === 'SYSTEM' ? 'bg-[#0f0f0f] dark:bg-white text-white dark:text-[#0f0f0f] font-semibold shadow-sm' : 'text-[#606060] dark:text-[#aaaaaa]'}`}
              >
                System
              </button>
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-2 rounded-full text-xs font-medium border border-[#dbdbdb] dark:border-[#3f3f3f] transition-all flex items-center gap-1 ${autoScroll ? 'bg-[#ffcccc]/40 text-[#8b0000] dark:bg-[#e1002d]/20 dark:text-[#ff9999]' : 'bg-[#f5f5f5] dark:bg-[#272727] text-[#606060]'}`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>

        {/* Log Terminal Screen */}
        <div className="h-72 overflow-y-auto font-mono text-xs space-y-2 p-4 rounded-xl bg-[#0f0f0f] text-[#f1f1f1] border border-[#272727] shadow-inner custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#606060]">
              <p>Waiting for engine calculation events...</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCalc = log.level === 'CALCULATION';
              const isSuccess = log.level === 'SUCCESS';
              const isWarning = log.level === 'WARNING' || log.level === 'ERROR';

              return (
                <div
                  key={log.id}
                  onClick={() => log.details_json && setSelectedLog(log)}
                  className={`group p-2.5 rounded-lg transition-all border flex items-start justify-between gap-3 ${
                    log.details_json ? 'cursor-pointer hover:bg-[#1f1f1f]' : ''
                  } ${
                    isCalc
                      ? 'bg-[#01579b]/20 border-[#3ea6ff]/30 text-[#b3e5fc] hover:border-[#3ea6ff]/60'
                      : isSuccess
                      ? 'bg-[#1b5e20]/20 border-[#2ba640]/30 text-[#c8e6c9]'
                      : isWarning
                      ? 'bg-[#8b0000]/20 border-[#e1002d]/30 text-[#ffcccc]'
                      : 'bg-[#1f1f1f]/50 border-white/5 text-[#aaaaaa]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <span className="text-[10px] text-[#606060] shrink-0 pt-0.5 font-medium">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span
                      className={`px-2 py-0.5 text-[9px] font-semibold rounded-full uppercase shrink-0 ${
                        isCalc
                          ? 'bg-[#b3e5fc]/30 text-[#3ea6ff] border border-[#3ea6ff]/30'
                          : isSuccess
                          ? 'bg-[#c8e6c9]/30 text-[#2ba640] border border-[#2ba640]/30'
                          : isWarning
                          ? 'bg-[#ffcccc]/30 text-[#e1002d] border border-[#e1002d]/30'
                          : 'bg-[#272727] text-[#888888]'
                      }`}
                    >
                      {log.stage}
                    </span>

                    <p className="leading-snug break-words">{log.message}</p>
                  </div>

                  {log.details_json && (
                    <span className="shrink-0 text-[10px] font-medium text-[#3ea6ff] group-hover:text-white flex items-center gap-0.5 pt-0.5">
                      Details
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </Card>

      {/* Calculation Detail Modal */}
      <CalculationDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};

export default ProcessingStatus;

