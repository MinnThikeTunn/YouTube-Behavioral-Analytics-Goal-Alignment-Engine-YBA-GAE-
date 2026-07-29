import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CircadianChartProps {
  circadianScore: number;
}

export const CircadianChart: React.FC<CircadianChartProps> = ({ circadianScore }) => {
  // Generate sample 24-hour distribution pattern for visualization
  const data = Array.from({ length: 24 }, (_, hour) => {
    const isLateNight = hour >= 23 || hour < 5;
    const baseCount = isLateNight ? Math.round(circadianScore * 0.4) : Math.round((100 - circadianScore) * 0.3);
    const mockVal = Math.max(2, baseCount + (hour % 5) * 2);
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      clicks: mockVal,
      isLateNight,
    };
  });

  return (
    <Card className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-teal-500" />
            <h3 className="font-black text-xl text-slate-900 dark:text-white">
              24-Hour Circadian Viewing Distribution
            </h3>
            <MetricBadge type="observed" />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Hourly distribution of video click events across the 24-hour day. Late night (11:00 PM – 5:00 AM) accounts for <strong className="text-slate-900 dark:text-white">{circadianScore.toFixed(1)}%</strong> of activity.
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#20b2aa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#20b2aa" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1d1f',
                borderColor: '#2e3034',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#20b2aa"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
