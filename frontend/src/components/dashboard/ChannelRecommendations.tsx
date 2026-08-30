import React, { useState } from 'react';
import { Card } from '../common/Card';
import { RecommendedChannelDTO } from '../../types';
import { ExternalLink, Sparkles, History, Compass } from 'lucide-react';

interface ChannelRecommendationsProps {
  recommendations: RecommendedChannelDTO[];
  goalText: string;
  focusPlaylistUrl?: string;
}

export const ChannelRecommendations: React.FC<ChannelRecommendationsProps> = ({
  recommendations,
  goalText,
  focusPlaylistUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'watched' | 'discovery'>('watched');

  const watchedChannels = recommendations.filter((r) => (r.category || 'watched') === 'watched');
  const discoveryChannels = recommendations.filter((r) => r.category === 'discovery');

  React.useEffect(() => {
    if (watchedChannels.length === 0 && discoveryChannels.length > 0) {
      setActiveTab('discovery');
    } else if (discoveryChannels.length === 0 && watchedChannels.length > 0) {
      setActiveTab('watched');
    }
  }, [recommendations.length, watchedChannels.length, discoveryChannels.length]);

  const displayedChannels = activeTab === 'watched' ? watchedChannels : discoveryChannels;

  return (
    <Card className="p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e1002d]" />
              Recommended Goal-Aligned Channels
            </h3>
            {focusPlaylistUrl && (
              <a
                href={focusPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-3.5 rounded-full bg-[#e1002d] hover:bg-[#cc0026] text-white text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>▶️ Launch YouTube Focus Queue</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
            Top channels aligned with <strong>{goalText}</strong> to replace low-completion entertainment viewing.
          </p>
        </div>

        {/* Tab Controls: [ Watched Channels ] | [ New Discovery ] */}
        <div className="flex items-center p-1 rounded-full bg-[#eeeeee] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('watched')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'watched'
                ? 'bg-[#e1002d] text-white shadow-sm font-semibold'
                : 'text-[#606060] dark:text-[#aaaaaa] hover:text-[#0f0f0f] dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Watched Channels</span>
            {watchedChannels.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'watched' ? 'bg-white/20 text-white' : 'bg-[#dbdbdb] dark:bg-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1]'}`}>
                {watchedChannels.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discovery')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
              activeTab === 'discovery'
                ? 'bg-[#e1002d] text-white shadow-sm font-semibold'
                : 'text-[#606060] dark:text-[#aaaaaa] hover:text-[#0f0f0f] dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>New Discovery</span>
            {discoveryChannels.length > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${activeTab === 'discovery' ? 'bg-white/20 text-white' : 'bg-[#dbdbdb] dark:bg-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1]'}`}>
                {discoveryChannels.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {displayedChannels.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#dbdbdb] dark:border-[#3f3f3f] rounded-2xl text-xs text-[#606060] dark:text-[#aaaaaa]">
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
                className="p-4 rounded-xl border border-[#dbdbdb] dark:border-[#2e2e2e] bg-[#f9f9f9] dark:bg-[#272727] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f] transition-all flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ffcccc]/60 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center flex-shrink-0 border border-[#e1002d]/30 font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-[#0f0f0f] dark:text-white mb-1 flex items-center gap-1.5">
                      {chan.channel_title}
                    </h4>
                    <p className="text-xs text-[#606060] dark:text-[#aaaaaa] line-clamp-2">
                      {chan.channel_description || `High-alignment educational content for ${goalText}.`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30">
                    {(chan.similarity_score * 100).toFixed(0)}% Match
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-3 rounded-full bg-[#eeeeee] dark:bg-[#383838] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-[#e8e8e8] dark:hover:bg-[#484848] transition-colors flex items-center gap-1 text-[11px] font-medium"
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

export default ChannelRecommendations;

