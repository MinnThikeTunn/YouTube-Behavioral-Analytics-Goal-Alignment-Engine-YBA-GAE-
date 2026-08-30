import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { FatigueWindowDTO } from '../../types';

interface FatigueWindowAlertProps {
  windows: FatigueWindowDTO[];
}

export const FatigueWindowAlert: React.FC<FatigueWindowAlertProps> = ({ windows }) => {
  if (!windows || windows.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-[#e1002d]/30 bg-white dark:bg-[#1f1f1f] p-6 shadow-yt-sm hover:shadow-yt-md overflow-hidden relative mb-6 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#ffcccc]/60 dark:bg-[#e1002d]/20 rounded-full text-[#e1002d] border border-[#e1002d]/20">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h3 className="font-headline text-lg font-bold text-[#0f0f0f] dark:text-white tracking-tight">
          Fatigue Windows Detected
        </h3>
      </div>
      
      <div className="space-y-3">
        {windows.map((w, idx) => {
          const start = new Date(w.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const end = new Date(w.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={idx} className="bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#0f0f0f] dark:text-white text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#e1002d]" />
                  <span>{start} - {end}</span>
                </div>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">{w.trigger_reason}</p>
              </div>
              <div className="text-xs font-medium text-[#8b0000] dark:text-[#ff9999] bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 border border-[#e1002d]/20 px-3 py-1.5 rounded-full whitespace-nowrap self-start md:self-auto">
                {w.recommended_action}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default FatigueWindowAlert;

