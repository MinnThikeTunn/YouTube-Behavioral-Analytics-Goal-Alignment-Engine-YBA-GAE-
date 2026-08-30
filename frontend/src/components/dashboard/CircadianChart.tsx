import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { HourlyAlignmentDTO } from '../../types';

interface CircadianChartProps {
  circadianScore: number;
  hourlyData?: HourlyAlignmentDTO[];
}

export const CircadianChart: React.FC<CircadianChartProps> = ({ circadianScore, hourlyData = [] }) => {
  const data = hourlyData.length > 0
    ? hourlyData.map((h) => ({
        hour: h.formatted_hour,
        clicks: h.click_count,
        isLateNight: h.hour >= 23 || h.hour < 5,
      }))
    : Array.from({ length: 24 }, (_, hour) => {
        const isLateNight = hour >= 23 || hour < 5;
        return {
          hour: `${hour.toString().padStart(2, '0')}:00`,
          clicks: 0,
          isLateNight,
        };
      });

  return (
    <Card className="p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#e1002d]" />
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">
              24-Hour Circadian Viewing Distribution
            </h3>
            <MetricBadge type="observed" />
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
            Hourly distribution of video click events across the 24-hour day. Late night (11:00 PM – 5:00 AM) accounts for <strong className="text-[#0f0f0f] dark:text-white">{circadianScore.toFixed(1)}%</strong> of activity.
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e1002d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e1002d" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f1f1f',
                borderColor: '#3f3f3f',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="#e1002d"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default CircadianChart;

