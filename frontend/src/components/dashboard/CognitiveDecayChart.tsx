import React from 'react';
import { Card } from '../common/Card';
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
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] p-6 lg:p-8 shadow-yt-sm hover:shadow-yt-md overflow-hidden relative">
      <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white mb-1.5 tracking-tight">
        Cognitive Decay Velocity (V_cog)
      </h3>
      <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mb-6">
        Track your attention fatigue over time. Higher velocity indicates rapid switching and higher cognitive fatigue.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVcog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3ea6ff" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#3ea6ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#888888" strokeOpacity={0.2} vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #3f3f3f', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area type="monotone" dataKey="v_cog" stroke="#3ea6ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVcog)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CognitiveDecayChart;

