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
    <Card className="p-8 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-black text-xl text-slate-900 dark:text-white">
              Content Categorization Breakdown
            </h3>
          </div>
          <MetricBadge type="estimated" />
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
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
                    backgroundColor: '#1c1d1f',
                    borderColor: '#2e3034',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(value: number, name: string) => [`${value} clicks`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-6 space-y-2 max-h-56 overflow-y-auto pr-1">
            {categories.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {item.category_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
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
