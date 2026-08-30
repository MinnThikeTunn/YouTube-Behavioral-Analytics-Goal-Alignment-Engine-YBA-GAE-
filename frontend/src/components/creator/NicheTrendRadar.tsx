import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { NicheTrendRadarResponseDTO } from '../../types';
import { getNicheTrends } from '../../services/api';
import { Compass, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';

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
      <Card className="p-8 flex justify-center items-center rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f]">
        <Loader2 className="w-6 h-6 animate-spin text-[#e1002d]" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] p-6 lg:p-8 shadow-yt-sm hover:shadow-yt-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center border border-[#e1002d]/20">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">Niche Trend Radar & Emerging Angles</h3>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">High-Velocity Topics in Your Direct Knowledge Space</p>
        </div>
      </div>


      {loading ? (
        <div className="text-center py-10 text-xs text-[#606060] dark:text-[#aaaaaa] animate-pulse">
          Scanning YouTube niche trajectory signals...
        </div>
      ) : !data || data.trends.length === 0 ? (
        <div className="text-center py-10 text-xs text-[#606060] dark:text-[#aaaaaa]">
          No niche trends detected yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.trends.map((t, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] flex flex-col justify-between hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f] transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#b3e5fc]/60 text-[#01579b] dark:bg-[#01579b]/40 dark:text-[#81d4fa] border border-[#3ea6ff]/30">
                    {t.trajectory}
                  </span>
                  <span className="text-xs font-semibold text-[#2ba640] flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +{t.trend_velocity.toFixed(0)}%
                  </span>
                </div>

                <h4 className="font-headline font-bold text-sm text-[#0f0f0f] dark:text-white group-hover:text-[#e1002d] transition-colors mb-1">
                  {t.niche_name}
                </h4>
                <p className="text-xs text-[#606060] dark:text-[#aaaaaa] line-clamp-2 leading-relaxed">
                  {t.keyword_clusters.join(', ')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#dbdbdb] dark:border-[#2e2e2e] flex items-center justify-between text-xs text-[#606060] dark:text-[#aaaaaa]">
                <span>Market Sentiment {(data.overall_market_sentiment * 100).toFixed(0)}%</span>
                <ArrowUpRight className="w-4 h-4 text-[#e1002d] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
