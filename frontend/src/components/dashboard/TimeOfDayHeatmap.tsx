import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { Clock, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { HourlyAlignmentDTO } from '../../types';

interface TimeOfDayHeatmapProps {
  hourlyData?: HourlyAlignmentDTO[];
}

export const TimeOfDayHeatmap: React.FC<TimeOfDayHeatmapProps> = ({ hourlyData = [] }) => {
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-500" />
          <h3 className="font-black text-xl text-slate-900 dark:text-white">Time-of-Day Alignment Heatmap</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400">No hourly alignment data available for this job.</p>
      </Card>
    );
  }

  // Find peak focus hour
  const sortedData = [...hourlyData].sort((a, b) => b.avg_similarity - a.avg_similarity);
  const peakHourObj = sortedData[0];

  // Dynamic Y-axis upper limit to ensure trends are prominently visible
  const maxSimilarity = Math.max(...hourlyData.map((d) => d.avg_similarity), 10);
  const yAxisMax = Math.min(100, Math.max(30, Math.ceil(maxSimilarity * 1.25)));

  const getBarColor = (similarity: number, clickCount: number) => {
    if (clickCount === 0) return '#383838'; // Inactive hour
    if (similarity >= 50) return '#2ba640'; // High focus (YouTube secondary green)
    if (similarity >= 25) return '#3ea6ff'; // Medium focus (YouTube tertiary blue)
    if (similarity >= 10) return '#e1002d'; // Low focus (YouTube primary red)
    return '#888888'; // Baseline
  };

  return (
    <Card className="p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#e1002d]" />
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">
              Time-of-Day Alignment Heatmap
            </h3>
          </div>
          <MetricBadge type="estimated" />
        </div>
        <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mb-6">
          24-hour breakdown of average <strong className="text-[#0f0f0f] dark:text-white">Goal Alignment vs. Hour of Day</strong>. 
          {peakHourObj && peakHourObj.avg_similarity > 0 && (
            <span className="inline-flex items-center gap-1 ml-1 text-[#2ba640] font-semibold">
              <Zap className="w-3 h-3 fill-current" /> Peak focus at {peakHourObj.formatted_hour} ({peakHourObj.avg_similarity.toFixed(1)}% alignment)
            </span>
          )}
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="formatted_hour"
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, yAxisMax]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f1f1f',
                  borderColor: '#3f3f3f',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                }}
                formatter={(value: number, _name: string, props: any) => [
                  `${value.toFixed(1)}% Goal Alignment (${props.payload.click_count} clicks)`,
                  props.payload.formatted_hour
                ]}
              />
              <Bar dataKey="avg_similarity" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.avg_similarity, entry.click_count)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#dbdbdb] dark:border-[#2e2e2e] text-[11px] text-[#606060] dark:text-[#aaaaaa]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2ba640]" />
            <span>High (&ge;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3ea6ff]" />
            <span>Moderate (25-49%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e1002d]" />
            <span>Low (10-24%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#888888]" />
            <span>Unaligned (&lt;10%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TimeOfDayHeatmap;

