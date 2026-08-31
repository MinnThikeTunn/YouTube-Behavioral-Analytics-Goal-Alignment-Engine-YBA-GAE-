import React from 'react';
import { Card } from '../common/Card';
import { RecommendedChannelDTO } from '../../types';
import { ExternalLink, Sparkles, Compass } from 'lucide-react';

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
  const discoveryChannels = recommendations.filter((r) => r.category === 'discovery');
  const displayedChannels = discoveryChannels.length > 0 ? discoveryChannels : recommendations;
  const activeFocusUrl = focusPlaylistUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(goalText || 'Software Engineering')}+tutorial+masterclass`;

  return (
    <Card className="p-8 rounded-[32px] border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <h3 className="font-headline text-xl font-black text-[#0f0f0f] dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e1002d]" />
              Recommended Goal-Aligned Channels
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e1002d]/10 text-[#e1002d] dark:bg-[#e1002d]/20 border border-[#e1002d]/20">
              <Sparkles className="w-3 h-3" />
              Gemini AI Curated
            </span>
          </div>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
            Top channels aligned with <strong className="text-[#0f0f0f] dark:text-white">{goalText}</strong> to replace low-completion entertainment viewing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {discoveryChannels.length > 0 && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#eeeeee] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-xs font-medium text-[#606060] dark:text-[#aaaaaa]">
              <Compass className="w-3.5 h-3.5 text-[#e1002d]" />
              <span>New Discovery</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#dbdbdb] dark:bg-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1] font-bold">
                {discoveryChannels.length}
              </span>
            </div>
          )}

          <a
            href={activeFocusUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="launch-focus-queue-btn"
            title={`Launch YouTube Focus Queue for ${goalText}`}
            className="h-9 px-4 rounded-full bg-[#e1002d] hover:bg-[#cc0026] text-white text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 group cursor-pointer"
          >
            <span className="group-hover:scale-105 transition-transform">▶️ Launch YouTube Focus Queue</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      {displayedChannels.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#dbdbdb] dark:border-[#3f3f3f] rounded-2xl text-xs text-[#606060] dark:text-[#aaaaaa]">
          No new discovery recommendations generated yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedChannels.map((chan, idx) => {
            const url = chan.channel_url || (chan.channel_id ? `https://www.youtube.com/channel/${chan.channel_id}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(chan.channel_title)}`);
            return (
              <div
                key={chan.channel_id || chan.channel_title || idx}
                className="p-5 rounded-2xl border border-[#dbdbdb] dark:border-[#2e2e2e] bg-[#f9f9f9] dark:bg-[#272727] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f] transition-all duration-200 flex items-start justify-between gap-4 shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#ffcccc]/60 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center flex-shrink-0 border border-[#e1002d]/30 font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-sm text-[#0f0f0f] dark:text-white mb-1 flex items-center gap-1.5">
                      {chan.channel_title}
                    </h4>
                    <p className="text-xs text-[#606060] dark:text-[#aaaaaa] line-clamp-2 leading-relaxed">
                      {chan.channel_description || `High-alignment educational content for ${goalText}.`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30">
                    {(chan.similarity_score * 100).toFixed(0)}% Match
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 px-3 rounded-full bg-[#eeeeee] dark:bg-[#383838] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-[#e0e0e0] dark:hover:bg-[#484848] transition-colors flex items-center gap-1.5 text-[11px] font-medium"
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

