import React, { useState, useEffect, useMemo } from 'react';
import { getChannelIntentDistribution } from '../../services/api';
import { ChannelIntentDistributionDTO, MinedCommentDTO, CommentIntentEnum } from '../../types';
import { Card } from '../common/Card';
import {
  Loader2,
  Brain,
  Flame,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Filter,
  Clock,
  Smile,
  Frown,
  Meh,
  X,
  Quote,
  Lightbulb,
  MessageCircleQuestion,
} from 'lucide-react';

export const AudienceIntentMiner: React.FC = () => {
  const [channelHandle, setChannelHandle] = useState('');
  const [channelData, setChannelData] = useState<ChannelIntentDistributionDTO | null>(null);
  const [channelLoading, setChannelLoading] = useState(false);

  // Mined Comments Explorer State
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [commentSearchQuery, setCommentSearchQuery] = useState('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<'ALL' | CommentIntentEnum>('ALL');
  const [visibleCommentsLimit, setVisibleCommentsLimit] = useState(8);
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);
  const [copiedQuoteKey, setCopiedQuoteKey] = useState<string | null>(null);

  const fetchChannelDistribution = async (handle?: string) => {
    setChannelLoading(true);
    try {
      const res = await getChannelIntentDistribution(handle);
      setChannelData(res);
      setVisibleCommentsLimit(8);
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
      case 'REQUEST':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30';
      case 'CONFUSION':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30';
      case 'PRAISE':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30';
      case 'DEBATE':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/30';
    }
  };

  const getIntentActiveStyle = (intent: 'ALL' | CommentIntentEnum) => {
    const isSelected = selectedIntentFilter === intent;
    if (!isSelected) {
      return 'bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border border-transparent';
    }

    switch (intent) {
      case 'ALL':
        return 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border border-zinc-900 dark:border-white shadow-xs font-bold';
      case 'REQUEST':
        return 'bg-sky-500 text-white dark:bg-sky-500 dark:text-white border border-sky-400 shadow-xs font-bold';
      case 'CONFUSION':
        return 'bg-rose-500 text-white dark:bg-rose-500 dark:text-white border border-rose-400 shadow-xs font-bold';
      case 'PRAISE':
        return 'bg-emerald-500 text-white dark:bg-emerald-500 dark:text-white border border-emerald-400 shadow-xs font-bold';
      case 'DEBATE':
        return 'bg-amber-500 text-white dark:bg-amber-500 dark:text-white border border-amber-400 shadow-xs font-bold';
    }
  };

  const getHeatBgColor = (intent: string, heat: number) => {
    const opacity = Math.max(0.15, heat / 100);
    switch (intent) {
      case 'REQUEST':
        return `rgba(62, 166, 255, ${opacity})`;
      case 'CONFUSION':
        return `rgba(225, 0, 45, ${opacity * 0.7})`;
      case 'PRAISE':
        return `rgba(43, 166, 64, ${opacity})`;
      case 'DEBATE':
        return `rgba(245, 158, 11, ${opacity})`;
      default:
        return `rgba(136, 136, 136, ${opacity})`;
    }
  };

  // Group heatmap cells by topic
  const topics = channelData
    ? Array.from(new Set(channelData.heatmap.map((c) => c.topic)))
    : ['Setup & Config', 'API & Performance', 'Code Examples', 'Tutorial Requests', 'Troubleshooting'];
  const intents: CommentIntentEnum[] = ['REQUEST', 'CONFUSION', 'PRAISE', 'DEBATE'];

  const cleanCommentText = (text: string) => {
    if (!text) return '';
    try {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      let cleaned = doc.body.textContent || text;
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      return cleaned;
    } catch {
      return text;
    }
  };

  const formatShortQuote = (text: string, maxLen = 220) => {
    const cleaned = cleanCommentText(text);
    if (cleaned.length > maxLen) {
      return cleaned.slice(0, maxLen) + '...';
    }
    return cleaned;
  };

  const formatRelativeTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getCellData = (topic: string, intent: string) => {
    if (!channelData) return { comment_count: 0, heat_score: 0 };
    const cell = channelData.heatmap.find((c) => c.topic === topic && c.intent_label === intent);
    return cell || { comment_count: 0, heat_score: 0 };
  };

  const copyCommentToClipboard = (text: string, id: string) => {
    const cleanText = cleanCommentText(text);
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedCommentId(id);
      setTimeout(() => {
        setCopiedCommentId((curr) => (curr === id ? null : curr));
      }, 2000);
    });
  };

  const copyQuoteToClipboard = (text: string, key: string) => {
    const cleanText = cleanCommentText(text);
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedQuoteKey(key);
      setTimeout(() => {
        setCopiedQuoteKey((curr) => (curr === key ? null : curr));
      }, 2000);
    });
  };

  const getSentimentBadge = (sentiment?: number) => {
    if (sentiment === undefined || sentiment === null) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          <Meh className="w-3 h-3 text-zinc-400" />
          Neutral
        </span>
      );
    }
    if (sentiment >= 0.25) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <Smile className="w-3 h-3 text-emerald-500" />
          +{sentiment.toFixed(2)} Positive
        </span>
      );
    }
    if (sentiment <= -0.15) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <Frown className="w-3 h-3 text-rose-500" />
          {sentiment.toFixed(2)} Critical
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
        <Meh className="w-3 h-3 text-zinc-400" />
        {sentiment >= 0 ? `+${sentiment.toFixed(2)}` : sentiment.toFixed(2)} Neutral
      </span>
    );
  };

  // Mined Comments processing and filtering
  const allComments: MinedCommentDTO[] = useMemo(() => {
    return channelData?.mined_comments || [];
  }, [channelData]);

  const intentCounts = useMemo(() => {
    const counts = {
      ALL: allComments.length,
      REQUEST: 0,
      CONFUSION: 0,
      PRAISE: 0,
      DEBATE: 0,
    };
    allComments.forEach((c) => {
      if (c.intent_label && counts[c.intent_label] !== undefined) {
        counts[c.intent_label]++;
      }
    });
    return counts;
  }, [allComments]);

  const filteredComments = useMemo(() => {
    return allComments.filter((c) => {
      // Filter by Intent
      if (selectedIntentFilter !== 'ALL' && c.intent_label !== selectedIntentFilter) {
        return false;
      }
      // Filter by Search Query
      if (commentSearchQuery.trim()) {
        const query = commentSearchQuery.toLowerCase();
        const textMatch = (c.text_display || '').toLowerCase().includes(query);
        const authorMatch = (c.author_name || '').toLowerCase().includes(query);
        if (!textMatch && !authorMatch) return false;
      }
      return true;
    });
  }, [allComments, selectedIntentFilter, commentSearchQuery]);

  const displayedComments = useMemo(() => {
    return filteredComments.slice(0, visibleCommentsLimit);
  }, [filteredComments, visibleCommentsLimit]);

  return (
    <Card className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 shadow-xl overflow-hidden bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl p-6 lg:p-8 space-y-8">
      {/* Header & Channel Handle Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-xl lg:text-2xl tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
              Audience Intent Miner & Channel Heatmap
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
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
            className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64 shadow-xs"
          />
          <button
            type="submit"
            disabled={channelLoading}
            className="h-9 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            {channelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze Channel
          </button>
        </form>
      </div>

      <div className="space-y-8 animate-fadeIn">
        {channelLoading ? (
          <div className="flex items-center justify-center py-20 text-emerald-500 gap-3 text-sm font-bold">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Aggregating Channel Intent Heatmap & Mining Comments...</span>
          </div>
        ) : channelData ? (
          <>
            {channelData.total_comments_analyzed === 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-between shadow-xs">
                <span>No public video comments found for this channel handle. Metrics below reflect 0 comments analyzed.</span>
              </div>
            )}

            {/* Intent Distribution Bars */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {channelData.distribution.map((d) => (
                <div
                  key={d.intent_label}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5 shadow-xs hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase ${getIntentColor(d.intent_label)} shadow-xs`}>
                      {d.intent_label}
                    </span>
                    <span className="text-zinc-900 dark:text-white font-black">{d.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${d.percentage}%`,
                        backgroundColor:
                          d.intent_label === 'REQUEST'
                            ? '#3ea6ff'
                            : d.intent_label === 'CONFUSION'
                            ? '#e1002d'
                            : d.intent_label === 'PRAISE'
                            ? '#2ba640'
                            : '#f59e0b',
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium text-right">
                    {d.count} comments
                  </div>
                </div>
              ))}
            </div>

            {/* 2D Topic-by-Intent Heat Grid */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                    2D Topic-by-Intent Interest Heat Matrix
                  </h4>
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {channelData.total_comments_analyzed} comments across {channelData.total_videos_analyzed} videos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700/80">
                      <th className="py-3 px-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Topic Cluster
                      </th>
                      {intents.map((intLbl) => (
                        <th key={intLbl} className="py-3 px-4 text-xs font-bold text-center uppercase tracking-wider">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getIntentColor(intLbl)}`}>
                            {intLbl}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/50">
                    {topics.map((top) => (
                      <tr key={top} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-3.5 px-4 text-xs font-bold text-zinc-900 dark:text-white">
                          {top}
                        </td>
                        {intents.map((intLbl) => {
                          const cell = getCellData(top, intLbl);
                          return (
                            <td key={intLbl} className="py-2.5 px-3 text-center">
                              <div
                                className="py-2.5 px-2 rounded-xl text-xs font-bold transition-all border border-black/5 dark:border-white/10 shadow-xs"
                                style={{
                                  backgroundColor: getHeatBgColor(intLbl, cell.heat_score),
                                  color: '#ffffff',
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

            {/* Actionable Insights: Top Feature Requests & Top Confusion Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature Requests Card */}
              <div className="p-5 rounded-2xl bg-sky-500/10 dark:bg-sky-950/20 border border-sky-500/20 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-sky-500" />
                    <span>Top Audience Feature Requests</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    Content Ideas
                  </span>
                </div>

                {channelData.top_feature_requests && channelData.top_feature_requests.length > 0 ? (
                  <div className="space-y-3">
                    {channelData.top_feature_requests.map((req, i) => {
                      const quoteKey = `req-${i}`;
                      const isCopied = copiedQuoteKey === quoteKey;
                      return (
                        <div
                          key={i}
                          className="group relative p-3.5 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-sky-500/20 hover:border-sky-500/40 transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <Quote className="w-4 h-4 text-sky-500 shrink-0 mt-0.5 opacity-80" />
                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed break-words whitespace-pre-wrap font-sans">
                                {formatShortQuote(req, 260)}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                                  <Lightbulb className="w-3 h-3" /> Viewer Requested
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => copyQuoteToClipboard(req, quoteKey)}
                              title="Copy quote to clipboard"
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 text-zinc-500 dark:text-zinc-400 transition-all"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-sky-500/10 text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                      No explicit feature requests detected in recent analyzed comments.
                    </p>
                  </div>
                )}
              </div>

              {/* Confusion Points Card */}
              <div className="p-5 rounded-2xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Top Audience Confusion Points</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Friction Points
                  </span>
                </div>

                {channelData.top_confusion_points && channelData.top_confusion_points.length > 0 ? (
                  <div className="space-y-3">
                    {channelData.top_confusion_points.map((conf, i) => {
                      const quoteKey = `conf-${i}`;
                      const isCopied = copiedQuoteKey === quoteKey;
                      return (
                        <div
                          key={i}
                          className="group relative p-3.5 rounded-xl bg-white/90 dark:bg-zinc-900/80 border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-xs"
                        >
                          <div className="flex items-start gap-2.5">
                            <MessageCircleQuestion className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 opacity-80" />
                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed break-words whitespace-pre-wrap font-sans">
                                {formatShortQuote(conf, 260)}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                  <HelpCircle className="w-3 h-3" /> Clarification Target
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => copyQuoteToClipboard(conf, quoteKey)}
                              title="Copy confusion point to clipboard"
                              className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 text-zinc-500 dark:text-zinc-400 transition-all"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 group-hover:text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/40 dark:bg-zinc-900/40 border border-rose-500/10 text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                      No significant confusion or blockers detected in analyzed comments.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* NEW: Mined Channel Comments Explorer Section */}
            <div className="p-6 rounded-[28px] bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-5 transition-all shadow-xs">
              {/* Explorer Header with Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/70 dark:border-zinc-700/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-base lg:text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                      Mined Channel Comments Explorer
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {allComments.length} Total Mined
                      </span>
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">
                      Explore raw viewer comments with AI intent classification, sentiment analysis, and community engagement.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                  className="self-start sm:self-center px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>{isExplorerOpen ? 'Collapse Explorer' : 'Expand Explorer'}</span>
                  {isExplorerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {isExplorerOpen && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Search and Intent Tabs Control Bar */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={commentSearchQuery}
                        onChange={(e) => {
                          setCommentSearchQuery(e.target.value);
                          setVisibleCommentsLimit(8);
                        }}
                        placeholder="Search comments by text or author..."
                        className="w-full pl-9 pr-9 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
                      />
                      {commentSearchQuery && (
                        <button
                          onClick={() => setCommentSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Intent Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedIntentFilter('ALL');
                          setVisibleCommentsLimit(8);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getIntentActiveStyle(
                          'ALL'
                        )}`}
                      >
                        All ({intentCounts.ALL})
                      </button>

                      <button
                        onClick={() => {
                          setSelectedIntentFilter('REQUEST');
                          setVisibleCommentsLimit(8);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getIntentActiveStyle(
                          'REQUEST'
                        )}`}
                      >
                        REQUEST ({intentCounts.REQUEST})
                      </button>

                      <button
                        onClick={() => {
                          setSelectedIntentFilter('CONFUSION');
                          setVisibleCommentsLimit(8);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getIntentActiveStyle(
                          'CONFUSION'
                        )}`}
                      >
                        CONFUSION ({intentCounts.CONFUSION})
                      </button>

                      <button
                        onClick={() => {
                          setSelectedIntentFilter('PRAISE');
                          setVisibleCommentsLimit(8);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getIntentActiveStyle(
                          'PRAISE'
                        )}`}
                      >
                        PRAISE ({intentCounts.PRAISE})
                      </button>

                      <button
                        onClick={() => {
                          setSelectedIntentFilter('DEBATE');
                          setVisibleCommentsLimit(8);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${getIntentActiveStyle(
                          'DEBATE'
                        )}`}
                      >
                        DEBATE ({intentCounts.DEBATE})
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {filteredComments.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {displayedComments.map((comment) => {
                          const isCopied = copiedCommentId === comment.comment_id;
                          const authorInitial = (comment.author_name || 'U').charAt(0).toUpperCase();

                          return (
                            <div
                              key={comment.comment_id}
                              className="group p-4 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-700/60 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3"
                            >
                              {/* Top Bar: Author, Date, Intent Pill, Sentiment */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                                    {authorInitial}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-[180px]">
                                      {comment.author_name || 'Anonymous Viewer'}
                                    </h5>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      {formatRelativeTimestamp(comment.published_at)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {comment.intent_label && (
                                    <span
                                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase ${getIntentColor(
                                        comment.intent_label
                                      )}`}
                                    >
                                      {comment.intent_label}
                                    </span>
                                  )}
                                  {getSentimentBadge(comment.sentiment_score)}
                                </div>
                              </div>

                              {/* Comment Body with Multilingual & Burmese Unicode support */}
                              <div className="text-xs text-zinc-800 dark:text-zinc-200 font-normal leading-relaxed break-words whitespace-pre-wrap font-sans">
                                {cleanCommentText(comment.text_display)}
                              </div>

                              {/* Footer: Likes, Copy Button */}
                              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-zinc-600 dark:text-zinc-300">
                                  <ThumbsUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                                  <span>{comment.like_count || 0} upvotes</span>
                                </div>

                                <button
                                  onClick={() => copyCommentToClipboard(comment.text_display, comment.comment_id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-all"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-zinc-400" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination / Load More */}
                      {filteredComments.length > visibleCommentsLimit ? (
                        <div className="pt-2 flex justify-center">
                          <button
                            onClick={() => setVisibleCommentsLimit((prev) => prev + 8)}
                            className="px-5 py-2 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>
                              Show More Comments ({filteredComments.length - visibleCommentsLimit} remaining)
                            </span>
                          </button>
                        </div>
                      ) : visibleCommentsLimit > 8 && filteredComments.length <= visibleCommentsLimit ? (
                        <div className="pt-2 flex justify-center">
                          <button
                            onClick={() => setVisibleCommentsLimit(8)}
                            className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Show Less</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    /* Empty Filter State */
                    <div className="p-8 rounded-2xl bg-white/60 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                        <Filter className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          No matching comments found
                        </h5>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {commentSearchQuery
                            ? `No comments match "${commentSearchQuery}" in intent "${selectedIntentFilter}".`
                            : `No comments categorized under "${selectedIntentFilter}" intent.`}
                        </p>
                      </div>
                      {(commentSearchQuery || selectedIntentFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setCommentSearchQuery('');
                            setSelectedIntentFilter('ALL');
                          }}
                          className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
};

export default AudienceIntentMiner;



