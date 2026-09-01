import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { NicheTrendRadarResponseDTO } from '../../types';
import { getNicheTrends } from '../../services/api';
import { Compass, TrendingUp, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';

interface NicheTrendRadarProps {
  goal?: string;
}

export const NicheTrendRadar: React.FC<NicheTrendRadarProps> = ({ goal }) => {
  const [data, setData] = useState<NicheTrendRadarResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getNicheTrends(goal)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [goal]);

  if (loading) {
    return (
      <Card className="p-8 flex flex-col justify-center items-center gap-3 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
          Scanning YouTube niche trajectory signals {goal ? `for "${goal}"` : 'aligned with your goal'}...
        </p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl p-6 lg:p-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight">Niche Trend Radar & Emerging Angles</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">High-Velocity Topics in Your Direct Knowledge Space</p>
          </div>
        </div>

        {(goal || data.aligned_goal) && (
          <div className="self-start sm:self-center">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[280px]">Aligned with: {goal || data.aligned_goal}</span>
            </span>
          </div>
        )}
      </div>


      {loading ? (
        <div className="text-center py-10 text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
          Scanning YouTube niche trajectory signals...
        </div>
      ) : !data || data.trends.length === 0 ? (
        <div className="text-center py-10 text-xs text-zinc-500 dark:text-zinc-400">
          No niche trends detected yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.trends.map((t, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex flex-col justify-between hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-300 hover:scale-[1.01] group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    {t.trajectory}
                  </span>
                  <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +{t.trend_velocity.toFixed(0)}%
                  </span>
                </div>

                <h4 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors mb-1.5">
                  {t.niche_name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {t.keyword_clusters.join(', ')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Market Sentiment {(((t.sentiment_ratio ?? data.overall_market_sentiment)) * 100).toFixed(0)}%</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
