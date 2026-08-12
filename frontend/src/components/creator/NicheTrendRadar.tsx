import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { NicheTrendRadarResponseDTO } from '../../types';
import { getNicheTrends } from '../../services/api';
import { Activity, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

export const NicheTrendRadar: React.FC = () => {
  const [data, setData] = useState<NicheTrendRadarResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNicheTrends()
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-indigo-500" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Niche Trend Radar (T_i)
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.trends.map((trend) => (
          <div key={trend.niche_name} className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 transition-all hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-900 dark:text-white">{trend.niche_name}</span>
              {trend.trajectory === 'EXPLODING' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
              {trend.trajectory === 'RISING' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
              {trend.trajectory === 'STABLE' && <Minus className="w-4 h-4 text-slate-400" />}
              {trend.trajectory === 'DECLINING' && <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {trend.trend_velocity.toFixed(2)}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {trend.trajectory}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {trend.keyword_clusters.map(kw => (
                <span key={kw} className="px-2 py-1 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
          Overall Market Sentiment
        </span>
        <span className="text-sm font-black text-slate-900 dark:text-white">
          {(data.overall_market_sentiment * 100).toFixed(0)}% Positive
        </span>
      </div>
    </Card>
  );
};
