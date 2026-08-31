import React from 'react';
import { useWebSocket } from '../../services/websocket';
import { Activity, Circle, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Card } from '../common/Card';

const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'localhost:8000' : window.location.host;
  return `${protocol}//${host}/api/v1/sync/ws/live`;
};

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getRecentStreamRecords } from '../../services/api';

export const LiveStreamWidget: React.FC = () => {
  const wsUrl = getWsUrl();
  const { isConnected, messages, setMessages } = useWebSocket(wsUrl);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    getRecentStreamRecords('stream_job_default', 10)
      .then((records) => {
        if (!isMounted || !Array.isArray(records)) return;
        setMessages((prev) => {
          if (prev.length === 0) return records;
          const existingIds = new Set(prev.map(p => p.video_id));
          const newFromHistory = records.filter(r => !existingIds.has(r.video_id));
          return [...prev, ...newFromHistory].slice(0, 10);
        });
      })
      .catch((err) => {
        console.warn('Could not fetch recent stream records:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [setMessages]);

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'ALIGNED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'DISTRACTING':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'ALIGNED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
      case 'DISTRACTING':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <Card className="rounded-[28px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl shadow-md p-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-zinc-900 dark:text-white tracking-tight">Live Activity Stream</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {isConnected ? 'Connected to Hub' : 'Reconnecting...'}
                </span>
                {messages.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {messages.length} events
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all"
            title={isOpen ? "Collapse stream" : "Expand stream"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-5 space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Activity className="w-7 h-7 text-zinc-300 dark:text-zinc-700 mb-2" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Waiting for live extension activity...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={`${msg.video_id}-${msg.timestamp}-${idx}`}
                  className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs animate-fadeIn"
                >
                  <div className="mt-0.5">
                    {getClassificationIcon(msg.classification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {msg.title || msg.video_id}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {msg.channel_name || 'Unknown Channel'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getClassificationColor(msg.classification)}`}>
                      {msg.classification}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                      Score: {Math.round(msg.alignment_score <= 1.0 ? msg.alignment_score * 100 : msg.alignment_score)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default LiveStreamWidget;

