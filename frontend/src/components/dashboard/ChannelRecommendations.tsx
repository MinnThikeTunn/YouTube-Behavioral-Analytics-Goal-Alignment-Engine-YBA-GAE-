import React from 'react';
import { Card } from '../common/Card';
import { RecommendedChannelDTO } from '../../types';
import { ExternalLink, Sparkles } from 'lucide-react';

interface ChannelRecommendationsProps {
  recommendations: RecommendedChannelDTO[];
  goalText: string;
}

export const ChannelRecommendations: React.FC<ChannelRecommendationsProps> = ({
  recommendations,
  goalText,
}) => {
  return (
    <Card className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            Recommended Goal-Aligned Channels
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Top channels aligned with <strong>{goalText}</strong> to replace low-completion entertainment viewing.
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-400 dark:text-zinc-500">
          No channel recommendations available yet. Complete YouTube API enrichment to view top recommendations.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((chan, idx) => (
            <div
              key={chan.channel_id || idx}
              className="p-5 rounded-2xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-teal-500/40 transition-all flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center flex-shrink-0 border border-teal-500/20 font-black text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    {chan.channel_title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {chan.channel_description || 'High-alignment educational channel.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  {(chan.similarity_score * 100).toFixed(0)}% Match
                </span>
                <a
                  href={`https://www.youtube.com/channel/${chan.channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-teal-500 transition-all"
                  title="Visit Channel on YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
