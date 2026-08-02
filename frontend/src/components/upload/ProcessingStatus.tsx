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
      <Card className="max-w-3xl mx-auto my-12 text-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">Connecting to processing engine...</p>
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
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-2xl text-slate-900 dark:text-white mb-1 flex items-center gap-3">
              {isPaused ? (
                <>
                  <PauseCircle className="w-6 h-6 text-amber-500 animate-pulse" />
                  API Quota Limit Reached
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
                  Live Processing & Calculations
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Job ID: <code className="text-teal-600 dark:text-teal-400 font-bold">{jobId}</code>
            </p>
          </div>
          <span className="text-base font-black px-4 py-1.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm">
            {jobStatus.progress_pct.toFixed(0)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-8 p-0.5 border border-slate-200/50 dark:border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-500 rounded-full shadow-inner"
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
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                  status === 'completed'
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300'
                    : status === 'active'
                    ? 'bg-white dark:bg-zinc-900 border-teal-500 text-teal-600 dark:text-teal-400 shadow-md ring-2 ring-teal-500/20 animate-pulse'
                    : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200/60 dark:border-zinc-800/60 text-slate-400 dark:text-zinc-600'
                }`}
              >
                <div className={`p-2 rounded-xl ${status === 'completed' ? 'bg-teal-500 text-white' : status === 'active' ? 'bg-teal-500/20 text-teal-500' : 'bg-slate-200/50 dark:bg-zinc-800 text-slate-400'}`}>
                  {status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{st.label}</p>
                  <p className="text-[10px] opacity-75 font-mono capitalize">{status}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isPaused && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
            Daily YouTube API quota reached. Partial analytics computed up to this point remain available while waiting for daily reset.
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}
      </Card>

      {/* Interactive Live Terminal & Calculation Trace Console */}
      <Card className="p-6 overflow-hidden">
        {/* Terminal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-zinc-800 flex items-center justify-center text-teal-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                Execution & Calculation Traces
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Showing {filteredLogs.length} live trace logs. Click calculation entries for details.
              </p>
            </div>
          </div>

          {/* Filter Tabs & AutoScroll Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200/50 dark:border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'ALL' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('CALCULATION')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${activeFilter === 'CALCULATION' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
              >
                <Calculator className="w-3 h-3" />
                Math
              </button>
              <button
                onClick={() => setActiveFilter('SYSTEM')}
                className={`px-3 py-1 rounded-lg transition-all ${activeFilter === 'SYSTEM' ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}
              >
                System
              </button>
            </div>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 ${autoScroll ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'}`}
              title="Toggle Auto-Scroll"
            >
              <ArrowDown className={`w-3.5 h-3.5 ${autoScroll ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>

        {/* Log Terminal Screen */}
        <div className="h-72 overflow-y-auto font-mono text-xs space-y-2 p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 shadow-inner scrollbar-thin scrollbar-thumb-slate-800">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600">
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
                  className={`group p-2.5 rounded-xl transition-all border flex items-start justify-between gap-3 ${
                    log.details_json ? 'cursor-pointer hover:bg-slate-900/90' : ''
                  } ${
                    isCalc
                      ? 'bg-purple-950/20 border-purple-900/40 text-purple-200 hover:border-purple-500/50'
                      : isSuccess
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                      : 'bg-slate-900/40 border-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 overflow-hidden">
                    <span className="text-[10px] text-slate-500 shrink-0 pt-0.5 font-bold">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span
                      className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase shrink-0 ${
                        isCalc
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : isSuccess
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.stage}
                    </span>

                    <p className="leading-snug break-words">{log.message}</p>
                  </div>

                  {log.details_json && (
                    <span className="shrink-0 text-[10px] font-bold text-teal-400 group-hover:text-teal-300 flex items-center gap-0.5 pt-0.5">
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
