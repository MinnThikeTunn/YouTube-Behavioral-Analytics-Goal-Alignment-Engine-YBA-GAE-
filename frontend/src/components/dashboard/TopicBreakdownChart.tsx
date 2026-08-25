import React from 'react';
import { Card } from '../common/Card';
import { MetricBadge } from '../common/MetricBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { TopicCategoryBreakdownDTO } from '../../types';

interface TopicBreakdownChartProps {
  categories?: TopicCategoryBreakdownDTO[];
}

export const TopicBreakdownChart: React.FC<TopicBreakdownChartProps> = ({ categories = [] }) => {
  if (!categories || categories.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="font-black text-xl text-slate-900 dark:text-white">Content Categorization Breakdown</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400">No category breakdown data available for this job.</p>
      </Card>
    );
  }

  const totalClicks = categories.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-[#e1002d]" />
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">
              Content Categorization Breakdown
            </h3>
          </div>
          <MetricBadge type="estimated" />
        </div>
        <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mb-6">
          Viewing distribution grouped by canonical topic categories across {totalClicks} total video clicks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="count"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f1f1f',
                    borderColor: '#3f3f3f',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                  }}
                  formatter={(value: number, name: string) => [`${value} clicks`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-[#0f0f0f] dark:text-[#f1f1f1] truncate">
                    {item.category_name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-xs font-semibold text-[#0f0f0f] dark:text-white">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[#606060] dark:text-[#aaaaaa]">
                    ({item.count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TopicBreakdownChart;

