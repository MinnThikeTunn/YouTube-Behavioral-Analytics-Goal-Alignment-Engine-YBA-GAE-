import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import {
  Sparkles, Target, Eye, Type, Zap, CheckCircle, Upload, Image as ImageIcon,
  ArrowUpRight, BarChart3, Palette, BookOpen, Activity, RefreshCw, Cpu, X
} from 'lucide-react';
import {
  VASEvalResponseDTO, ClosedLoopResponseDTO, ThumbnailVisionResultDTO,
  Composite8FactorScoreDTO, ClosedLoopTelemetryResultDTO
} from '../../types';
import {
  evaluateVAS, evaluateDetailedVAS, getClosedLoopTelemetry,
  analyzeThumbnailImage, computeCompositeScore, syncClosedLoopTelemetry
} from '../../services/api';
import { CompositeSpiderChart } from './CompositeSpiderChart';

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

  // Vision Direct Upload
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<ThumbnailVisionResultDTO | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Composite & Detailed Results
  const [basicData, setBasicData] = useState<VASEvalResponseDTO | null>(null);
  const [detailedData, setDetailedData] = useState<DetailedAnalysis | null>(null);
  const [compositeData, setCompositeData] = useState<Composite8FactorScoreDTO | null>(null);

  // Closed Loop Telemetry State & Sync Modal
  const [closedLoopData, setClosedLoopData] = useState<ClosedLoopResponseDTO | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncCtr, setSyncCtr] = useState(8.5);
  const [syncRetention, setSyncRetention] = useState(68.0);
  const [syncViews, setSyncViews] = useState(15400);
  const [syncResult, setSyncResult] = useState<ClosedLoopTelemetryResultDTO | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'QUICK' | 'DETAILED' | 'COMPOSITE'>('QUICK');

  const fetchClosedLoop = async () => {
    try {
      const res = await getClosedLoopTelemetry();
      setClosedLoopData(res);
    } catch (err) {
      console.error('Failed to fetch closed-loop telemetry:', err);
    }
  };

  useEffect(() => {
    fetchClosedLoop();
  }, []);

  const handleThumbnailFileSelect = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(file);
    setThumbnailPreview(objectUrl);
    setAnalyzingImage(true);
    try {
      const result = await analyzeThumbnailImage(file);
      setVisionResult(result);
      setBrightness(result.brightness);
      setContrast(result.contrast);
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbnailFileSelect(e.dataTransfer.files[0]);
    }
  };

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

      if (activeView === 'COMPOSITE') {
        const compRes = await computeCompositeScore(payload);
        setCompositeData(compRes);
        const detailedRes = await evaluateDetailedVAS(payload);
        setDetailedData(detailedRes);
        setBasicData(null);
      } else if (activeView === 'DETAILED') {
        const res = await evaluateDetailedVAS(payload);
        setDetailedData(res);
        setBasicData(null);
        setCompositeData(null);
      } else {
        const res = await evaluateVAS(payload);
        setBasicData(res);
        setDetailedData(null);
        setCompositeData(null);
      }

      await fetchClosedLoop();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const res = await syncClosedLoopTelemetry({
        actual_ctr: Number(syncCtr),
        actual_retention_30s: Number(syncRetention),
        actual_views: Number(syncViews),
      });
      setSyncResult(res);
      await fetchClosedLoop();
    } catch (err) {
      console.error('Failed to sync closed-loop telemetry:', err);
    } finally {
      setSyncing(false);
    }
  };

  const data = detailedData || basicData;
  const vasColor = data
    ? data.overall_vas >= 75 ? 'text-emerald-400' :
      data.overall_vas >= 50 ? 'text-amber-400' : 'text-rose-400'
    : 'text-zinc-400';

  return (
    <Card className="rounded-[32px] backdrop-blur-xl bg-gradient-to-br from-violet-500/5 via-zinc-900/80 to-zinc-900/95 border border-violet-500/20 p-8 shadow-sm relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-2xl text-white">Pre-Publish Packaging Optimizer</h3>
            <p className="text-xs text-zinc-400">Closed-Loop VAS Engine with Direct Computer Vision & 8-Factor Spider Radar</p>
          </div>
        </div>

        {/* View Mode Toggle & Telemetry Trigger */}
        <div className="flex items-center gap-3">
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
            <button
              onClick={() => setActiveView('COMPOSITE')}
              className={`px-3 py-1.5 rounded-xl transition-all ${activeView === 'COMPOSITE' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              8-Factor Radar
            </button>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-black transition-all flex items-center gap-2"
          >
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* Form Inputs */}
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
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-zinc-700/60 bg-zinc-900/90 text-sm font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/60 transition-all resize-none"
          />
        </div>

        {/* Thumbnail Computer Vision Upload & Metrics */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-violet-400" /> Thumbnail Computer Vision Analyzer
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleThumbnailFileSelect(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl border-2 border-dashed border-zinc-700/60 hover:border-violet-500/50 bg-zinc-900/50 cursor-pointer transition-all flex flex-col md:flex-row items-center gap-4"
          >
            {thumbnailPreview ? (
              <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-zinc-700 flex-shrink-0">
                <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                {analyzingImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 flex-shrink-0">
                <Upload className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <div className="text-xs font-bold text-white mb-0.5">
                {thumbnailPreview ? 'Click or drop new thumbnail to re-analyze' : 'Drag & drop thumbnail image or click to upload'}
              </div>
              <p className="text-[11px] text-zinc-500">
                Supports JPG, PNG, WEBP. Extract real-time luminance, contrast, Laplacian sharpness, and color swatches.
              </p>
            </div>

            {visionResult && (
              <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-2 rounded-xl border border-zinc-700/50">
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold">Visual Impact</div>
                  <div className="text-xs font-black text-cyan-400">{visionResult.visual_impact_score.toFixed(1)}%</div>
                </div>
                <div className="w-px h-6 bg-zinc-700" />
                <div className="text-center">
                  <div className="text-[10px] text-zinc-500 font-semibold">Legibility</div>
                  <GradeBadge grade={visionResult.readability_grade} />
                </div>
              </div>
            )}
          </div>

          {/* Live Vision Badges */}
          {visionResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3 animate-fadeIn">
              <MiniStat label="Luminance" value={`${(visionResult.brightness * 100).toFixed(1)}%`} icon={<Eye className="w-3.5 h-3.5" />} />
              <MiniStat label="RMS Contrast" value={`${(visionResult.contrast * 100).toFixed(1)}%`} icon={<Target className="w-3.5 h-3.5" />} />
              <MiniStat label="Saturation" value={`${(visionResult.color_saturation * 100).toFixed(1)}%`} icon={<Palette className="w-3.5 h-3.5" />} />
              <MiniStat label="Sharpness" value={`${(visionResult.sharpness * 100).toFixed(1)}%`} icon={<Zap className="w-3.5 h-3.5" />} />

              {/* Dominant Color Swatches */}
              <div className="col-span-2 md:col-span-4 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-400">Dominant Palette:</span>
                <div className="flex items-center gap-2">
                  {visionResult.dominant_colors.map((hex, i) => (
                    <div key={i} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700/50">
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: hex }} />
                      <span className="text-[10px] font-mono text-zinc-300">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Range Sliders Fallback */}
        {!visionResult && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Manual Brightness ({brightness.toFixed(2)})
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
                <Target className="w-3.5 h-3.5" /> Manual Contrast ({contrast.toFixed(2)})
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
        )}

        <button
          onClick={handleEvaluate}
          disabled={loading || !title.trim() || !hookScript.trim()}
          className="w-full px-6 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Analyzing Packaging...' : activeView === 'COMPOSITE' ? 'Compute 8-Factor Radar' : activeView === 'DETAILED' ? 'Run Deep Analysis' : 'Evaluate Video Packaging'}
        </button>
      </div>

      {/* 8-Factor Composite Spider Chart */}
      {activeView === 'COMPOSITE' && compositeData && (
        <div className="mb-6 animate-fadeIn">
          <CompositeSpiderChart data={compositeData} />
        </div>
      )}

      {/* Results Section */}
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

          {/* Deep Analysis Panels */}
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
                </div>
              </div>
            </>
          )}

          {/* AI Recommendations */}
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
        </div>
      )}

      {/* Closed-Loop Auto-Tuning Engine Tracker */}
      {closedLoopData && (
        <div className="mt-8 p-6 rounded-2xl bg-zinc-900/90 border border-violet-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Closed-Loop Auto-Tuning Engine</h4>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
              closedLoopData.status === 'OPTIMAL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              closedLoopData.status === 'TUNING_ACTIVE' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {closedLoopData.status}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="Evaluations Tracked" value={`${closedLoopData.total_evaluations}`} icon={<BarChart3 className="w-4 h-4 text-indigo-400" />} />
            <MiniStat label="Prediction Accuracy" value={`${closedLoopData.accuracy_pct.toFixed(1)}%`} icon={<Target className="w-4 h-4 text-emerald-400" />} />
            <MiniStat label="Mean Abs Error (MAE)" value={`${closedLoopData.mean_absolute_error.toFixed(1)}`} icon={<Activity className="w-4 h-4 text-amber-400" />} />
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/40">
              <div className="text-xs text-zinc-500 font-semibold mb-1">Tuned Formula Weights</div>
              <div className="text-[11px] font-mono font-bold text-violet-300">
                Title: {(closedLoopData.tuned_weights.w1_title * 100).toFixed(0)}% | Thumb: {(closedLoopData.tuned_weights.w2_thumbnail * 100).toFixed(0)}% | Hook: {(closedLoopData.tuned_weights.w3_hook * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closed-Loop Telemetry Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-violet-500/30 rounded-[32px] max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-violet-400" />
                <h3 className="font-black text-lg text-white">Sync Post-Publish Video Metrics</h3>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} className="p-1 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSyncSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Actual CTR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={syncCtr}
                  onChange={(e) => setSyncCtr(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">30s Retention (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={syncRetention}
                  onChange={(e) => setSyncRetention(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Total Post-Publish Views</label>
                <input
                  type="number"
                  value={syncViews}
                  onChange={(e) => setSyncViews(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-violet-500"
                />
              </div>

              {syncResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Recalibrated Engine Successfully!
                  </div>
                  <div>{syncResult.message}</div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black flex items-center justify-center gap-2"
                >
                  {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Sync & Recalibrate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
};
