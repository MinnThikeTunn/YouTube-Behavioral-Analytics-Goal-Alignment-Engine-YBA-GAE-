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
        return 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30';
      case 'DISTRACTING':
        return 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border border-[#e1002d]/30';
      default:
        return 'bg-[#eeeeee] text-[#606060] dark:bg-[#383838] dark:text-[#aaaaaa] border border-[#dbdbdb] dark:border-[#3f3f3f]';
    }
  };

  return (
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md transition-all duration-200">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isConnected ? 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/50 dark:text-[#a5d6a7]' : 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/50 dark:text-[#ff9999]'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold text-[#0f0f0f] dark:text-white">Live Activity Stream</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle className={`w-2 h-2 fill-current ${isConnected ? 'text-[#2ba640] animate-pulse' : 'text-[#e1002d]'}`} />
                <span className="text-xs font-medium text-[#606060] dark:text-[#aaaaaa]">
                  {isConnected ? 'Connected to Hub' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 text-[#dbdbdb] dark:text-[#3f3f3f] mb-2" />
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">Waiting for live activity...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={`${msg.video_id}-${msg.timestamp}-${idx}`}
                className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] shadow-sm animate-fadeIn"
              >
                <div className="mt-0.5">
                  {getClassificationIcon(msg.classification)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-[#0f0f0f] dark:text-white truncate">
                    {msg.title || msg.video_id}
                  </p>
                  <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5 truncate">
                    {msg.channel_name || 'Unknown Channel'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${getClassificationColor(msg.classification)}`}>
                    {msg.classification}
                  </span>
                  <span className="text-[10px] font-medium text-[#606060] dark:text-[#aaaaaa]">
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

export default LiveStreamWidget;

