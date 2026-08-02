import React, { useState } from 'react';
import { Card } from '../common/Card';
import { RecommendedChannelDTO } from '../../types';
import { ExternalLink, Sparkles, History, Compass } from 'lucide-react';

interface ChannelRecommendationsProps {
  recommendations: RecommendedChannelDTO[];
  goalText: string;
}

export const ChannelRecommendations: React.FC<ChannelRecommendationsProps> = ({
  recommendations,
  goalText,
}) => {
  const [activeTab, setActiveTab] = useState<'watched' | 'discovery'>('watched');

  const watchedChannels = recommendations.filter((r) => (r.category || 'watched') === 'watched');
  const discoveryChannels = recommendations.filter((r) => r.category === 'discovery');

  const displayedChannels = activeTab === 'watched' ? watchedChannels : discoveryChannels;

  return (
    <Card className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-500" />
            Recommended Goal-Aligned Channels
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Top channels aligned with <strong>{goalText}</strong> to replace low-completion entertainment viewing.
          </p>
        </div>

        {/* Tab Controls: [ Watched Channels ] | [ New Discovery ] */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('watched')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'watched'
                ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Watched Channels</span>
            {watchedChannels.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-teal-500/10 text-teal-500">
                {watchedChannels.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discovery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'discovery'
                ? 'bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>New Discovery</span>
            {discoveryChannels.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-teal-500/10 text-teal-500">
                {discoveryChannels.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {displayedChannels.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-400 dark:text-zinc-500">
          {activeTab === 'watched'
            ? 'No high-alignment channels found in your watch history for this goal yet.'
            : 'No new discovery recommendations generated yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedChannels.map((chan, idx) => {
            const url = chan.channel_url || (chan.channel_id ? `https://www.youtube.com/channel/${chan.channel_id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(chan.channel_title)}`);
            return (
              <div
                key={chan.channel_id || chan.channel_title || idx}
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
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl bg-slate-200/60 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-teal-500 transition-all flex items-center gap-1 text-[11px]"
                    title="Visit Channel on YouTube"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
