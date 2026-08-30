import React, { useState, useEffect } from 'react';
import { getChannelIntentDistribution } from '../../services/api';
import { ChannelIntentDistributionDTO } from '../../types';
import { Card } from '../common/Card';
import { Loader2, Brain, Flame, HelpCircle, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export const AudienceIntentMiner: React.FC = () => {
  const [channelHandle, setChannelHandle] = useState('');
  const [channelData, setChannelData] = useState<ChannelIntentDistributionDTO | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);

  const fetchChannelDistribution = async (handle?: string) => {
    setChannelLoading(true);
    try {
      const res = await getChannelIntentDistribution(handle);
      setChannelData(res);
    } catch (err) {
      console.error(`Failed to fetch channel intent distribution for ${handle || 'default'}:`, err);
    } finally {
      setChannelLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelDistribution();
  }, []);

  const handleSearchChannel = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChannelDistribution(channelHandle);
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'REQUEST': return 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border border-[#3ea6ff]/30';
      case 'CONFUSION': return 'bg-[#ffcccc]/60 text-[#8b0000] dark:bg-[#8b0000]/40 dark:text-[#ff9999] border border-[#e1002d]/30';
      case 'PRAISE': return 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30';
      case 'DEBATE': return 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border border-[#e1002d]/30';
      default: return 'bg-[#eeeeee] text-[#606060] dark:bg-[#383838] dark:text-[#aaaaaa] border border-[#dbdbdb] dark:border-[#3f3f3f]';
    }
  };

  const getHeatBgColor = (intent: string, heat: number) => {
    const opacity = Math.max(0.15, heat / 100);
    switch (intent) {
      case 'REQUEST': return `rgba(62, 166, 255, ${opacity})`;
      case 'CONFUSION': return `rgba(225, 0, 45, ${opacity * 0.7})`;
      case 'PRAISE': return `rgba(43, 166, 64, ${opacity})`;
      case 'DEBATE': return `rgba(225, 0, 45, ${opacity})`;
      default: return `rgba(136, 136, 136, ${opacity})`;
    }
  };

  // Group heatmap cells by topic
  const topics = channelData
    ? Array.from(new Set(channelData.heatmap.map((c) => c.topic)))
    : ["Setup & Config", "API & Performance", "Code Examples", "Tutorial Requests", "Troubleshooting"];
  const intents: ('REQUEST' | 'CONFUSION' | 'PRAISE' | 'DEBATE')[] = ["REQUEST", "CONFUSION", "PRAISE", "DEBATE"];

  const formatCommentText = (text: string) => {
    if (!text) return '';
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      let cleaned = doc.body.textContent || text;
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      if (cleaned.length > 200) {
        return cleaned.slice(0, 200) + '...';
      }
      return cleaned;
    } catch {
      return text;
    }
  };

  const getCellData = (topic: string, intent: string) => {
    if (!channelData) return { comment_count: 0, heat_score: 0 };
    const cell = channelData.heatmap.find((c) => c.topic === topic && c.intent_label === intent);
    return cell || { comment_count: 0, heat_score: 0 };
  };

  return (
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] shadow-yt-sm hover:shadow-yt-md overflow-hidden bg-white dark:bg-[#1f1f1f] p-6 lg:p-8 space-y-6">
      {/* Header & Channel Handle Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#dbdbdb] dark:border-[#2e2e2e] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center border border-[#e1002d]/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-xl lg:text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-white">
              Audience Intent Miner & Channel Interest Heatmap
            </h3>
            <p className="text-[#606060] dark:text-[#aaaaaa] text-xs mt-1">
              Analyze channel-wide viewer requests, confusion points, and topic heat density automatically across all uploads.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchChannel} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
            placeholder="Channel handle (e.g. @Fireship)"
            className="px-4 py-2 rounded-xl bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-xs text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 w-full md:w-56"
          />
          <button
            type="submit"
            disabled={channelLoading}
            className="h-9 px-4 rounded-full bg-[#e1002d] hover:bg-[#cc0026] text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {channelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze Channel
          </button>
        </form>
      </div>

      <div className="space-y-6 animate-fadeIn">
        {channelLoading ? (
          <div className="flex items-center justify-center py-16 text-[#e1002d] gap-2 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin" /> Aggregating Channel Intent Heatmap...
          </div>
        ) : channelData ? (
          <>
            {channelData.total_comments_analyzed === 0 && (
              <div className="p-4 rounded-xl bg-[#ffcccc]/40 border border-[#e1002d]/30 text-[#8b0000] dark:bg-[#8b0000]/20 dark:text-[#ff9999] text-xs font-medium flex items-center justify-between">
                <span>No public video comments found for this channel handle. Metrics below reflect 0 comments analyzed.</span>
              </div>
            )}
            {/* Intent Distribution Bars */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {channelData.distribution.map((d) => (
                <div key={d.intent_label} className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase ${getIntentColor(d.intent_label)}`}>
                      {d.intent_label}
                    </span>
                    <span className="text-[#0f0f0f] dark:text-white font-bold">{d.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eeeeee] dark:bg-[#383838] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.percentage}%`,
                        backgroundColor:
                          d.intent_label === 'REQUEST' ? '#3ea6ff' :
                          d.intent_label === 'CONFUSION' ? '#e1002d' :
                          d.intent_label === 'PRAISE' ? '#2ba640' : '#e1002d'
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-[#606060] dark:text-[#aaaaaa] font-medium text-right">
                    {d.count} comments
                  </div>
                </div>
              ))}
            </div>

            {/* 2D Topic-by-Intent Heat Grid */}
            <div className="p-6 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#e1002d]" />
                  <h4 className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider">
                    2D Topic-by-Intent Interest Heat Matrix
                  </h4>
                </div>
                <span className="text-xs text-[#606060] dark:text-[#aaaaaa] font-medium">
                  {channelData.total_comments_analyzed} comments across {channelData.total_videos_analyzed} videos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#dbdbdb] dark:border-[#3f3f3f]">
                      <th className="py-3 px-4 text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] uppercase">Topic Cluster</th>
                      {intents.map((intLbl) => (
                        <th key={intLbl} className="py-3 px-4 text-xs font-semibold text-center uppercase">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getIntentColor(intLbl)}`}>
                            {intLbl}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbdbdb] dark:divide-[#2e2e2e]">
                    {topics.map((top) => (
                      <tr key={top} className="hover:bg-[#eeeeee]/50 dark:hover:bg-[#383838]/50 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-semibold text-[#0f0f0f] dark:text-white">
                          {top}
                        </td>
                        {intents.map((intLbl) => {
                          const cell = getCellData(top, intLbl);
                          return (
                            <td key={intLbl} className="py-2.5 px-3 text-center">
                              <div
                                className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all border border-black/5 dark:border-white/10 shadow-sm"
                                style={{
                                  backgroundColor: getHeatBgColor(intLbl, cell.heat_score),
                                  color: '#ffffff'
                                }}
                              >
                                <div>{cell.heat_score.toFixed(0)}%</div>
                                <div className="text-[10px] opacity-90 font-normal">{cell.comment_count} comments</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actionable Insights Drawer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature Requests */}
              <div className="p-5 rounded-xl bg-[#b3e5fc]/20 dark:bg-[#01579b]/15 border border-[#3ea6ff]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#01579b] dark:text-[#81d4fa] text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#3ea6ff]" /> Top Audience Feature Requests
                </div>
                {channelData.top_feature_requests && channelData.top_feature_requests.length > 0 ? (
                  <ul className="space-y-2">
                    {channelData.top_feature_requests.map((req, i) => (
                      <li key={i} className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3ea6ff] flex-shrink-0 mt-0.5" />
                        <span>"{formatCommentText(req)}"</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#606060] dark:text-[#aaaaaa] italic">
                    No real feature requests detected in analyzed comments.
                  </p>
                )}
              </div>

              {/* Confusion Points */}
              <div className="p-5 rounded-xl bg-[#ffcccc]/20 dark:bg-[#e1002d]/10 border border-[#e1002d]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#8b0000] dark:text-[#ff9999] text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-[#e1002d]" /> Top Audience Confusion Points
                </div>
                {channelData.top_confusion_points && channelData.top_confusion_points.length > 0 ? (
                  <ul className="space-y-2">
                    {channelData.top_confusion_points.map((conf, i) => (
                      <li key={i} className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-[#e1002d] flex-shrink-0 mt-0.5" />
                        <span>"{formatCommentText(conf)}"</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#606060] dark:text-[#aaaaaa] italic">
                    No real confusion points detected in analyzed comments.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
};

export default AudienceIntentMiner;


