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
    if (clickCount === 0) return '#334155'; // Inactive hour
    if (similarity >= 50) return '#10B981'; // High focus (emerald)
    if (similarity >= 25) return '#3B82F6'; // Medium focus (blue)
    if (similarity >= 10) return '#F59E0B'; // Low focus (amber)
    return '#64748B'; // Baseline / Noise (slate)
  };

  return (
    <Card className="p-8 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-black text-xl text-slate-900 dark:text-white">
              Time-of-Day Alignment Heatmap
            </h3>
          </div>
          <MetricBadge type="estimated" />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
          24-hour breakdown of average <strong className="text-slate-900 dark:text-white">Goal Alignment vs. Hour of Day</strong>. 
          {peakHourObj && peakHourObj.avg_similarity > 0 && (
            <span className="inline-flex items-center gap-1 ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Zap className="w-3 h-3 fill-current" /> Peak focus at {peakHourObj.formatted_hour} ({peakHourObj.avg_similarity.toFixed(1)}% alignment)
            </span>
          )}
        </p>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="formatted_hour"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, yAxisMax]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1d1f',
                  borderColor: '#2e3034',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(value: number, _name: string, props: any) => [
                  `${value.toFixed(1)}% Goal Alignment (${props.payload.click_count} clicks)`,
                  props.payload.formatted_hour
                ]}
              />
              <Bar dataKey="avg_similarity" radius={[6, 6, 0, 0]}>
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

        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>High Alignment (&ge;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Moderate (25-49%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Low (10-24%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span>Unaligned (&lt;10%)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
