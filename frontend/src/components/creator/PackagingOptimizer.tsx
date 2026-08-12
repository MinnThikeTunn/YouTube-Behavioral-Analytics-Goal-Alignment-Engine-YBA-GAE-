import React, { useState } from 'react';
import { Card } from '../common/Card';
import {
  Sparkles, Target, Eye, Type, Zap, Copy, CheckCircle,
  ArrowUpRight, BarChart3, Palette, BookOpen, Activity
} from 'lucide-react';
import { VASEvalResponseDTO } from '../../types';
import { evaluateVAS, evaluateDetailedVAS } from '../../services/api';

interface ThumbnailAnalysis {
  brightness: number | null;
  contrast: number | null;
  color_balance: number;
  saturation_estimate: number;
  visual_impact_score: number;
  legibility_score: number;
  readability_grade: string;
}

interface TitlePattern {
  pattern_type: string;
  suggested_title: string;
}

interface TitleAnalysis {
  original_title: string;
  char_count: number;
  curiosity_word_count: number;
  power_word_count: number;
  has_number: boolean;
  has_question: boolean;
  pattern_suggestions: TitlePattern[];
}

interface HookAnalysis {
  word_count: number;
  word_pacing_score: number;
  emotional_arc_score: number;
  call_to_action_presence: boolean;
  hook_phrase_count: number;
  estimated_retention_pct: number;
}

interface DetailedAnalysis {
  overall_vas: number;
  title_score: number;
  thumbnail_score: number;
  hook_score: number;
  thumbnail_analysis: ThumbnailAnalysis;
  title_analysis: TitleAnalysis;
  hook_analysis: HookAnalysis;
  recommendations: string[];
  improved_title_ideas: TitlePattern[];
}

const ScoreBar: React.FC<{ label: string; score: number; color: string }> = ({ label, score, color }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-zinc-400">{label}</span>
      <span className={`text-sm font-black ${color}`}>{score.toFixed(1)}</span>
    </div>
    <div className="w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, score)}%`,
          background: score >= 75 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                     score >= 50 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                     'linear-gradient(90deg, #ef4444, #f87171)'
        }}
      />
    </div>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/40 flex items-center gap-3">
    <div className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400">{icon}</div>
    <div>
      <div className="text-xs text-zinc-500 font-semibold">{label}</div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  </div>
);

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    EXCELLENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    GOOD: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FAIR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    POOR: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${colors[grade] || colors.FAIR}`}>
      {grade}
    </span>
  );
};

export const PackagingOptimizer: React.FC = () => {
  const [title, setTitle] = useState('');
  const [hookScript, setHookScript] = useState('');
  const [brightness, setBrightness] = useState(0.6);
  const [contrast, setContrast] = useState(0.7);
  const [basicData, setBasicData] = useState<VASEvalResponseDTO | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'QUICK' | 'DETAILED'>('QUICK');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleEvaluate = async () => {
    if (!title.trim() || !hookScript.trim()) return;
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        hook_script: hookScript.trim(),
        thumbnail_brightness: brightness,
        thumbnail_contrast: contrast,
      };
      if (activeView === 'DETAILED') {
        const res = await evaluateDetailedVAS(payload);
        setDetailedData(res);
        setBasicData(null);
      } else {
        const res = await evaluateVAS(payload);
        setBasicData(res);
        setDetailedData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTitle = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const data = detailedData || basicData;
  const vasColor = data
    ? data.overall_vas >= 75 ? 'text-emerald-400' :
      data.overall_vas >= 50 ? 'text-amber-400' : 'text-rose-400'
    : 'text-zinc-400';

  return (
    <Card className="rounded-[32px] backdrop-blur-xl bg-gradient-to-br from-violet-500/5 via-zinc-900/80 to-zinc-900/95 border border-violet-500/20 p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-2xl text-white">Pre-Publish Packaging Optimizer</h3>
            <p className="text-xs text-zinc-400">VAS = 0.40×Title + 0.35×Thumbnail + 0.25×Hook</p>
          </div>
        </div>

        {/* Quick / Detailed Toggle */}
        <div className="p-1 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex text-[10px] font-black">
          <button
            onClick={() => setActiveView('QUICK')}
            className={`px-3 py-1.5 rounded-xl transition-all ${activeView === 'QUICK' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Quick Score
          </button>
          <button
            onClick={() => setActiveView('DETAILED')}
            className={`px-3 py-1.5 rounded-xl transition-all ${activeView === 'DETAILED' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            Deep Analysis
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" /> Video Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to Deploy Sub-12ms FastAPI Models in Production"
            className="w-full px-4 py-3 rounded-2xl border border-zinc-700/60 bg-zinc-900/90 text-sm font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Opening 30s Hook Script
          </label>
          <textarea
            value={hookScript}
            onChange={(e) => setHookScript(e.target.value)}
            placeholder="Write the opening 30 seconds of your video script here (aim for 60-90 words)..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-700/60 bg-zinc-900/90 text-sm font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Thumbnail Brightness ({brightness.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Thumbnail Contrast ({contrast.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
        </div>

        <button
          onClick={handleEvaluate}
          disabled={loading || !title.trim() || !hookScript.trim()}
          className="w-full px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Analyzing...' : activeView === 'DETAILED' ? 'Run Deep Analysis' : 'Evaluate Video Packaging'}
        </button>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-6 animate-fadeIn">
          {/* Overall VAS Score */}
          <div className="text-center p-6 rounded-2xl bg-zinc-800/60 border border-zinc-700/50">
            <div className="text-xs font-bold text-zinc-400 mb-2">Overall Viewer Attraction Score</div>
            <div className={`text-6xl font-black ${vasColor} tabular-nums`}>
              {data.overall_vas.toFixed(1)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">out of 100.0</div>
          </div>

          {/* Sub-Score Breakdown */}
          <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 space-y-4">
            <div className="text-xs font-black text-zinc-300 uppercase tracking-wider">Score Breakdown</div>
            <ScoreBar label="Title Quality" score={data.title_score} color="text-indigo-400" />
            <ScoreBar label="Thumbnail Vision" score={data.thumbnail_score} color="text-cyan-400" />
            <ScoreBar label="Hook Script Retention" score={data.hook_score} color="text-amber-400" />
          </div>

          {/* ── Deep Analysis Panels (Ticket 02) ──────────────── */}
          {detailedData && (
            <>
              {/* Thumbnail Vision Diagnostics */}
              <div className="p-5 rounded-2xl bg-zinc-800/60 border border-cyan-500/20 space-y-4">
                <div className="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Thumbnail Vision Diagnostics
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MiniStat
                    label="Color Balance"
                    value={`${detailedData.thumbnail_analysis.color_balance.toFixed(1)}%`}
                    icon={<Palette className="w-4 h-4" />}
                  />
                  <MiniStat
                    label="Saturation"
                    value={`${detailedData.thumbnail_analysis.saturation_estimate.toFixed(1)}%`}
                    icon={<BarChart3 className="w-4 h-4" />}
                  />
                  <MiniStat
                    label="Visual Impact"
                    value={`${detailedData.thumbnail_analysis.visual_impact_score.toFixed(1)}%`}
                    icon={<Eye className="w-4 h-4" />}
                  />
                  <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/40 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 font-semibold">Text Legibility</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">{detailedData.thumbnail_analysis.legibility_score.toFixed(1)}%</span>
                        <GradeBadge grade={detailedData.thumbnail_analysis.readability_grade} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Pattern Analysis */}
              <div className="p-5 rounded-2xl bg-zinc-800/60 border border-indigo-500/20 space-y-4">
                <div className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" /> Title Pattern Analysis
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <MiniStat label="Characters" value={`${detailedData.title_analysis.char_count}`} icon={<Type className="w-4 h-4" />} />
                  <MiniStat label="Curiosity Words" value={`${detailedData.title_analysis.curiosity_word_count}`} icon={<Sparkles className="w-4 h-4" />} />
                  <MiniStat label="Power Words" value={`${detailedData.title_analysis.power_word_count}`} icon={<Zap className="w-4 h-4" />} />
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  {detailedData.title_analysis.has_number && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">✓ Number</span>
                  )}
                  {detailedData.title_analysis.has_question && (
                    <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">✓ Question</span>
                  )}
                  {!detailedData.title_analysis.has_number && (
                    <span className="px-2 py-1 rounded-lg bg-zinc-700/40 text-zinc-500 border border-zinc-700/30 font-bold">✗ No Number</span>
                  )}
                  {!detailedData.title_analysis.has_question && (
                    <span className="px-2 py-1 rounded-lg bg-zinc-700/40 text-zinc-500 border border-zinc-700/30 font-bold">✗ No Question</span>
                  )}
                </div>
              </div>

              {/* Hook Retention Curve */}
              <div className="p-5 rounded-2xl bg-zinc-800/60 border border-amber-500/20 space-y-4">
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Hook Retention Curve
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MiniStat label="Word Count" value={`${detailedData.hook_analysis.word_count}`} icon={<BookOpen className="w-4 h-4" />} />
                  <MiniStat label="Pacing Score" value={`${detailedData.hook_analysis.word_pacing_score.toFixed(1)}`} icon={<Activity className="w-4 h-4" />} />
                  <MiniStat label="Emotional Arc" value={`${detailedData.hook_analysis.emotional_arc_score.toFixed(1)}%`} icon={<Sparkles className="w-4 h-4" />} />
                  <MiniStat
                    label="Est. Retention"
                    value={`${detailedData.hook_analysis.estimated_retention_pct.toFixed(1)}%`}
                    icon={<Target className="w-4 h-4" />}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                    detailedData.hook_analysis.call_to_action_presence
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {detailedData.hook_analysis.call_to_action_presence ? '✓ CTA Detected' : '✗ No CTA Found'}
                  </span>
                  <span className="text-zinc-500">
                    {detailedData.hook_analysis.hook_phrase_count} hook phrase{detailedData.hook_analysis.hook_phrase_count !== 1 ? 's' : ''} found
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 space-y-3">
              <div className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-violet-400" /> AI Recommendations
              </div>
              {data.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                  <ArrowUpRight className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Improved Title Ideas */}
          {detailedData && detailedData.improved_title_ideas.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 space-y-3">
              <div className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI-Generated Title Patterns
              </div>
              {detailedData.improved_title_ideas.map((idea, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/40 hover:border-violet-500/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-[10px] font-black border border-violet-500/20">
                      {idea.pattern_type}
                    </span>
                    <span className="text-xs text-zinc-200 font-semibold">{idea.suggested_title}</span>
                  </div>
                  <button
                    onClick={() => handleCopyTitle(idea.suggested_title, idx)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    {copiedIdx === idx ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Basic mode title ideas (from Ticket 01) */}
          {basicData && basicData.improved_title_ideas && basicData.improved_title_ideas.length > 0 && (
            <div className="p-5 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 space-y-3">
              <div className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI-Generated Title Variations
              </div>
              {basicData.improved_title_ideas.map((idea: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/40 hover:border-violet-500/30 transition-all group">
                  <span className="text-xs text-zinc-200 font-semibold">{idea}</span>
                  <button
                    onClick={() => handleCopyTitle(idea, idx)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    {copiedIdx === idx ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
