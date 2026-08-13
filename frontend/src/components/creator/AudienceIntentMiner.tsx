import React, { useState, useEffect } from 'react';
import { getChannelIntentDistribution } from '../../services/api';
import { ChannelIntentDistributionDTO } from '../../types';
import { Card } from '../common/Card';
import { Loader2, Flame, HelpCircle, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

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
      case 'REQUEST': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300';
      case 'CONFUSION': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300';
      case 'PRAISE': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300';
      case 'DEBATE': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-300';
    }
  };

  const getHeatBgColor = (intent: string, heat: number) => {
    const opacity = Math.max(0.12, heat / 100);
    switch (intent) {
      case 'REQUEST': return `rgba(59, 130, 246, ${opacity})`;
      case 'CONFUSION': return `rgba(245, 158, 11, ${opacity})`;
      case 'PRAISE': return `rgba(16, 185, 129, ${opacity})`;
      case 'DEBATE': return `rgba(244, 63, 94, ${opacity})`;
      default: return `rgba(161, 161, 170, ${opacity})`;
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
    <Card className="rounded-[32px] border-none shadow-lg overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-6 lg:p-8 space-y-6">
      {/* Header & Channel Handle Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h3 className="font-black text-2xl tracking-tight text-gray-900 dark:text-white">
            Audience Intent Miner & Channel Interest Heatmap
          </h3>
          <p className="text-gray-500 dark:text-zinc-400 text-xs mt-1">
            Analyze channel-wide viewer requests, confusion points, and topic heat density automatically across all uploads.
          </p>
        </div>

        <form onSubmit={handleSearchChannel} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={channelHandle}
            onChange={(e) => setChannelHandle(e.target.value)}
            placeholder="Channel handle (e.g. @Fireship)"
            className="px-4 py-2 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 w-full md:w-56"
          />
          <button
            type="submit"
            disabled={channelLoading}
            className="py-2 px-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            {channelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze Channel
          </button>
        </form>
      </div>

      <div className="space-y-6 animate-fadeIn">
        {channelLoading ? (
          <div className="flex items-center justify-center py-16 text-teal-400 gap-2 text-sm font-bold">
            <Loader2 className="w-5 h-5 animate-spin" /> Aggregating Channel Intent Heatmap...
          </div>
        ) : channelData ? (
          <>
            {channelData.total_comments_analyzed === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between">
                <span>No public video comments found for this channel handle. Metrics below reflect 0 comments analyzed.</span>
              </div>
            )}
            {/* Intent Distribution Bars */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {channelData.distribution.map((d) => (
                <div key={d.intent_label} className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-black px-2 py-0.5 rounded-md ${getIntentColor(d.intent_label)}`}>
                      {d.intent_label}
                    </span>
                    <span className="text-gray-900 dark:text-white font-black">{d.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.percentage}%`,
                        backgroundColor:
                          d.intent_label === 'REQUEST' ? '#3b82f6' :
                          d.intent_label === 'CONFUSION' ? '#f59e0b' :
                          d.intent_label === 'PRAISE' ? '#10b981' : '#f43f5e'
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold text-right">
                    {d.count} comments
                  </div>
                </div>
              ))}
            </div>

            {/* 2D Topic-by-Intent Heat Grid */}
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    2D Topic-by-Intent Interest Heat Matrix
                  </h4>
                </div>
                <span className="text-xs text-gray-400 dark:text-zinc-500 font-bold">
                  {channelData.total_comments_analyzed} comments across {channelData.total_videos_analyzed} videos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800">
                      <th className="py-3 px-4 text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase">Topic Cluster</th>
                      {intents.map((intLbl) => (
                        <th key={intLbl} className="py-3 px-4 text-xs font-bold text-center uppercase">
                          <span className={`px-2.5 py-1 rounded-lg ${getIntentColor(intLbl)}`}>
                            {intLbl}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                    {topics.map((top) => (
                      <tr key={top} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-bold text-gray-800 dark:text-zinc-200">
                          {top}
                        </td>
                        {intents.map((intLbl) => {
                          const cell = getCellData(top, intLbl);
                          return (
                            <td key={intLbl} className="py-2.5 px-3 text-center">
                              <div
                                className="py-2.5 px-2 rounded-xl text-xs font-black transition-all hover:scale-105 border border-white/10 shadow-sm"
                                style={{
                                  backgroundColor: getHeatBgColor(intLbl, cell.heat_score),
                                  color: '#ffffff'
                                }}
                              >
                                <div>{cell.heat_score.toFixed(0)}%</div>
                                <div className="text-[10px] opacity-80 font-normal">{cell.comment_count} comments</div>
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
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Top Audience Feature Requests
                </div>
                {channelData.top_feature_requests && channelData.top_feature_requests.length > 0 ? (
                  <ul className="space-y-2">
                    {channelData.top_feature_requests.map((req, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-zinc-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>"{formatCommentText(req)}"</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 italic">
                    No real feature requests detected in analyzed comments.
                  </p>
                )}
              </div>

              {/* Confusion Points */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Top Audience Confusion Points
                </div>
                {channelData.top_confusion_points && channelData.top_confusion_points.length > 0 ? (
                  <ul className="space-y-2">
                    {channelData.top_confusion_points.map((conf, i) => (
                      <li key={i} className="text-xs text-gray-700 dark:text-zinc-300 flex items-start gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>"{formatCommentText(conf)}"</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 italic">
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

