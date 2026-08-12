import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SessionVelocityDTO } from '../../types';

interface CognitiveDecayChartProps {
  sessions: SessionVelocityDTO[];
}

export const CognitiveDecayChart: React.FC<CognitiveDecayChartProps> = ({ sessions }) => {
  const data = sessions.map((s, idx) => ({
    name: `Session ${idx + 1}`,
    v_cog: s.v_cog,
    state: s.fatigue_state
  }));

  return (
    <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[32px] p-6 shadow-sm overflow-hidden relative">
      <h3 className="text-xl font-black text-white mb-2 tracking-tight">Cognitive Decay Velocity (V_cog)</h3>
      <p className="text-zinc-400 text-sm mb-6">Track your attention fatigue over time. Higher velocity indicates rapid switching and higher fatigue.</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVcog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D30" vertical={false} />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#27272A', border: 'none', borderRadius: '12px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="v_cog" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVcog)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
