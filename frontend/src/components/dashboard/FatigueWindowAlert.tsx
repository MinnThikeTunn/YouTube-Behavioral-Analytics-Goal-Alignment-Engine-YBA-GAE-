import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { FatigueWindowDTO } from '../../types';

interface FatigueWindowAlertProps {
  windows: FatigueWindowDTO[];
}

export const FatigueWindowAlert: React.FC<FatigueWindowAlertProps> = ({ windows }) => {
  if (!windows || windows.length === 0) return null;

  return (
    <div className="bg-[#1C1C1E] border border-red-900/50 rounded-[32px] p-6 shadow-sm overflow-hidden relative mb-6 transition-all hover:border-red-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-950/50 rounded-full">
          <AlertTriangle className="text-red-500 w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-white tracking-tight">Fatigue Windows Detected</h3>
      </div>
      
      <div className="space-y-4">
        {windows.map((w, idx) => {
          const start = new Date(w.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const end = new Date(w.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={idx} className="bg-[#27272A] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-zinc-300 text-sm mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{start} - {end}</span>
                </div>
                <p className="text-zinc-400 text-sm">{w.trigger_reason}</p>
              </div>
              <div className="text-sm font-medium text-red-400 bg-red-950/30 px-3 py-1.5 rounded-full whitespace-nowrap self-start md:self-auto">
                {w.recommended_action}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
