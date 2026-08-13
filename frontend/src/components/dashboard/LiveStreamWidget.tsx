import React from 'react';
import { useWebSocket } from '../../services/websocket';
import { Activity, Circle, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Card } from '../common/Card';

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost:8000' : window.location.host;
  return `${protocol}//${host}/api/v1/sync/ws/live`;
};

export const LiveStreamWidget: React.FC = () => {
  const wsUrl = getWsUrl();
  const { isConnected, messages } = useWebSocket(wsUrl);

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'ALIGNED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'DISTRACTING':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'ALIGNED':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'DISTRACTING':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
      default:
        return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-400';
    }
  };

  return (
    <Card className="rounded-[32px] overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${isConnected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">Live Activity Stream</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {isConnected ? 'Connected to Hub' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm text-slate-500 dark:text-zinc-400">Waiting for live activity...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={`${msg.video_id}-${msg.timestamp}-${idx}`}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 shadow-sm animate-fadeIn"
              >
                <div className="mt-0.5">
                  {getClassificationIcon(msg.classification)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {msg.title || msg.video_id}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 truncate">
                    {msg.channel_name || 'Unknown Channel'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getClassificationColor(msg.classification)}`}>
                    {msg.classification}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    Score: {Math.round(msg.alignment_score <= 1.0 ? msg.alignment_score * 100 : msg.alignment_score)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
