import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import {
  Sparkles, Target, Eye, Type, Zap, CheckCircle, Upload, Image as ImageIcon,
  ArrowUpRight, BarChart3, Palette, BookOpen, Activity, RefreshCw, Cpu, X
} from 'lucide-react';
import {
  VASEvalResponseDTO, ClosedLoopResponseDTO, ThumbnailVisionResultDTO,
  Composite8FactorScoreDTO, ClosedLoopTelemetryResultDTO,
  ABPackagingVariantDTO, ABPackagingMatrixResponseDTO, HookScriptOptionDTO
} from '../../types';
import {
  evaluateVAS, evaluateDetailedVAS, getClosedLoopTelemetry,
  analyzeThumbnailImage, computeCompositeScore, syncClosedLoopTelemetry,
  evaluateABPackaging, generateHookScripts
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
      <span className="text-xs font-medium text-[#606060] dark:text-[#aaaaaa]">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{score.toFixed(1)}</span>
    </div>
    <div className="w-full h-2 rounded-full bg-[#eeeeee] dark:bg-[#272727] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.min(100, score)}%`,
          background: score >= 75 ? '#2ba640' :
                     score >= 50 ? '#3ea6ff' :
                     '#e1002d'
        }}
      />
    </div>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-3 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] flex items-center gap-3">
    <div className="p-2 rounded-lg bg-[#eeeeee] dark:bg-[#383838] text-[#e1002d]">{icon}</div>
    <div>
      <div className="text-xs text-[#606060] dark:text-[#aaaaaa] font-medium">{label}</div>
      <div className="font-headline text-sm font-bold text-[#0f0f0f] dark:text-white">{value}</div>
    </div>
  </div>
);

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    EXCELLENT: 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border-[#2ba640]/30',
    GOOD: 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30',
    FAIR: 'bg-[#ffcccc]/70 text-[#8b0000] dark:bg-[#8b0000]/40 dark:text-[#ff9999] border-[#e1002d]/30',
    POOR: 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border-[#e1002d]/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${colors[grade] || colors.FAIR}`}>
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

  // AI Hook Generator State
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [hookOptions, setHookOptions] = useState<HookScriptOptionDTO[]>([]);

  // Multi-Variant A/B Simulator State
  const [abVariants, setAbVariants] = useState<ABPackagingVariantDTO[]>([
    {
      variant_id: 'var_a',
      variant_label: 'Variant A (Tutorial / Action)',
      title: 'How to Build Fast Distributed AI Microservices in 2026',
      hook_script: 'Most developers struggle with distributed microservices for months, but here is the exact framework to scale effortlessly.',
      thumbnail_brightness: 0.65,
      thumbnail_contrast: 0.75
    },
    {
      variant_id: 'var_b',
      variant_label: 'Variant B (Curiosity / Warning)',
      title: 'Why 90% of Backend Engineers Fail System Design Scale',
      hook_script: 'Stop designing architectures the old way. This single bottleneck is ruining your performance before launch.',
      thumbnail_brightness: 0.55,
      thumbnail_contrast: 0.60
    }
  ]);
  const [abMatrixResult, setAbMatrixResult] = useState<ABPackagingMatrixResponseDTO | null>(null);
  const [evaluatingAB, setEvaluatingAB] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'QUICK' | 'DETAILED' | 'COMPOSITE' | 'AB_MATRIX'>('QUICK');

  const handleGenerateHooks = async () => {
    if (!title.trim()) return;
    setGeneratingHooks(true);
    try {
      const res = await generateHookScripts({ title: title.trim() });
      setHookOptions(res.hooks || []);
    } catch (err) {
      console.error('Failed to generate hook scripts:', err);
    } finally {
      setGeneratingHooks(false);
    }
  };

  const handleRunABMatrix = async () => {
    if (abVariants.length === 0) return;
    setEvaluatingAB(true);
    try {
      const res = await evaluateABPackaging({ variants: abVariants });
      setAbMatrixResult(res);
    } catch (err) {
      console.error('A/B evaluation error:', err);
    } finally {
      setEvaluatingAB(false);
    }
  };


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
    ? data.overall_vas >= 75 ? 'text-[#2ba640]' :
      data.overall_vas >= 50 ? 'text-[#3ea6ff]' : 'text-[#e1002d]'
    : 'text-[#606060]';

  return (
    <Card className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl p-6 lg:p-10 shadow-xl relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight">Pre-Publish Packaging Optimizer</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Closed-Loop VAS Engine with Computer Vision & 8-Factor Spider Radar</p>
          </div>
        </div>

        {/* View Mode Toggle & Telemetry Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 flex text-xs font-semibold shadow-xs">
            <button
              onClick={() => setActiveView('QUICK')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${activeView === 'QUICK' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              Quick Score
            </button>
            <button
              onClick={() => setActiveView('DETAILED')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${activeView === 'DETAILED' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              Deep Analysis
            </button>
            <button
              onClick={() => setActiveView('COMPOSITE')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${activeView === 'COMPOSITE' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              8-Factor Radar
            </button>
            <button
              onClick={() => setActiveView('AB_MATRIX')}
              className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${activeView === 'AB_MATRIX' ? 'bg-emerald-500 text-white shadow-xs font-bold' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              A/B Matrix
            </button>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="h-9 px-3.5 rounded-full bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* Form Inputs (Single-Item Modes vs Multi-Variant A/B Matrix) */}
      {activeView !== 'AB_MATRIX' ? (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" /> Video Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to Deploy Sub-12ms FastAPI Models in Production"
              className="w-full px-4 py-2.5 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-sm text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#e1002d]" /> Opening 30s Hook Script
              </label>
              <button
                type="button"
                onClick={handleGenerateHooks}
                disabled={generatingHooks || !title.trim()}
                className="px-3 py-1 rounded-full bg-[#ffcccc]/50 hover:bg-[#ffcccc] dark:bg-[#e1002d]/20 dark:hover:bg-[#e1002d]/30 border border-[#e1002d]/30 text-[#8b0000] dark:text-[#ff9999] text-[11px] font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-[#e1002d]" />
                <span>{generatingHooks ? 'Drafting...' : '✨ Generate 30s Hook Options'}</span>
              </button>
            </div>

            {/* AI Hook Script Drawer */}
            {hookOptions.length > 0 && (
              <div className="mb-3 p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-2">
                <div className="text-[11px] font-semibold text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center justify-between">
                  <span>Select a high-retention AI hook:</span>
                  <button
                    type="button"
                    onClick={() => setHookOptions([])}
                    className="text-[#606060] hover:text-[#0f0f0f] dark:text-[#aaaaaa] dark:hover:text-white text-[10px]"
                  >
                    ✕ Close
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {hookOptions.map((hk, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setHookScript(hk.script_text);
                        setHookOptions([]);
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-[#1f1f1f] hover:border-[#e1002d] border border-[#dbdbdb] dark:border-[#3f3f3f] cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-[#e1002d]">{hk.hook_style}</span>
                          <span className="text-[10px] font-semibold text-[#2ba640]">{hk.estimated_retention_pct}% Ret</span>
                        </div>
                        <p className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] line-clamp-3 leading-relaxed">"{hk.script_text}"</p>
                      </div>
                      <span className="text-[10px] text-[#606060] dark:text-[#aaaaaa] mt-2 font-medium">Click to apply ➔</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={hookScript}
              onChange={(e) => setHookScript(e.target.value)}
              placeholder="Write the opening 30 seconds of your video script here (aim for 60-90 words)..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-sm text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 transition-all resize-none"
            />
          </div>

          {/* Thumbnail Computer Vision Upload & Metrics */}
          <div>
            <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#e1002d]" /> Thumbnail Computer Vision Analyzer
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
              className="p-4 rounded-xl border-2 border-dashed border-[#dbdbdb] dark:border-[#3f3f3f] hover:border-[#e1002d] bg-[#f9f9f9] dark:bg-[#272727] cursor-pointer transition-all flex flex-col md:flex-row items-center gap-4"
            >
              {thumbnailPreview ? (
                <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-[#dbdbdb] dark:border-[#3f3f3f] flex-shrink-0">
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  {analyzingImage && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 text-center md:text-left">
                <div className="text-xs font-bold text-[#0f0f0f] dark:text-white mb-0.5">
                  {thumbnailPreview ? 'Click or drop new thumbnail to re-analyze' : 'Drag & drop thumbnail image or click to upload'}
                </div>
                <p className="text-[11px] text-[#606060] dark:text-[#aaaaaa]">
                  Supports JPG, PNG, WEBP. Extract real-time luminance, contrast, Laplacian sharpness, and color swatches.
                </p>
              </div>

              {visionResult && (
                <div className="flex items-center gap-2 bg-white dark:bg-[#1f1f1f] px-3 py-2 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f]">
                  <div className="text-center">
                    <div className="text-[10px] text-[#606060] dark:text-[#aaaaaa] font-semibold">Visual Impact</div>
                    <div className="text-xs font-bold text-[#3ea6ff]">{visionResult.visual_impact_score.toFixed(1)}%</div>
                  </div>
                  <div className="w-px h-6 bg-[#dbdbdb] dark:bg-[#3f3f3f]" />
                  <div className="text-center">
                    <div className="text-[10px] text-[#606060] dark:text-[#aaaaaa] font-semibold">Legibility</div>
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
                <div className="col-span-2 md:col-span-4 p-2.5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#606060] dark:text-[#aaaaaa]">Dominant Palette:</span>
                  <div className="flex items-center gap-2">
                    {visionResult.dominant_colors.map((hex, i) => (
                      <div key={i} className="flex items-center gap-1 bg-white dark:bg-[#1f1f1f] px-2 py-1 rounded-md border border-[#dbdbdb] dark:border-[#3f3f3f]">
                        <div className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20" style={{ backgroundColor: hex }} />
                        <span className="text-[10px] font-mono text-[#0f0f0f] dark:text-[#f1f1f1]">{hex}</span>
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
                <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Manual Brightness ({brightness.toFixed(2)})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full accent-[#e1002d]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1.5 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Manual Contrast ({contrast.toFixed(2)})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full accent-[#e1002d]"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleEvaluate}
            disabled={loading || !title.trim() || !hookScript.trim()}
            className="w-full h-11 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] disabled:opacity-40 text-white text-sm font-medium transition-colors shadow-yt-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Analyzing Packaging...' : activeView === 'COMPOSITE' ? 'Compute 8-Factor Radar' : activeView === 'DETAILED' ? 'Run Deep Analysis' : 'Evaluate Video Packaging'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {/* Multi-Variant A/B Simulator Input Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa]">Packaging Variants ({abVariants.length}/3)</span>
              {abVariants.length < 3 && (
                <button
                  type="button"
                  onClick={() => setAbVariants([...abVariants, {
                    variant_id: `var_${Date.now()}`,
                    variant_label: `Variant ${String.fromCharCode(65 + abVariants.length)} (Experimental)`,
                    title: '',
                    hook_script: '',
                    thumbnail_brightness: 0.60,
                    thumbnail_contrast: 0.65
                  }])}
                  className="h-8 px-3 rounded-full bg-[#eeeeee] dark:bg-[#272727] hover:bg-[#e8e8e8] dark:hover:bg-[#383838] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1] text-xs font-medium transition-all"
                >
                  + Add Variant
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {abVariants.map((variant, idx) => (
                <div key={variant.variant_id} className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#8b0000] dark:text-[#ff9999] font-bold text-xs">
                      {variant.variant_label}
                    </span>
                    {abVariants.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setAbVariants(abVariants.filter(v => v.variant_id !== variant.variant_id))}
                        className="text-[#606060] hover:text-[#e1002d] text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">Candidate Title</label>
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => {
                        const updated = [...abVariants];
                        updated[idx].title = e.target.value;
                        setAbVariants(updated);
                      }}
                      placeholder="Title variant..."
                      className="w-full px-3 py-2 rounded-lg border border-[#dbdbdb] dark:border-[#3f3f3f] bg-white dark:bg-[#1f1f1f] text-xs text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">Opening 30s Hook</label>
                    <textarea
                      value={variant.hook_script}
                      onChange={(e) => {
                        const updated = [...abVariants];
                        updated[idx].hook_script = e.target.value;
                        setAbVariants(updated);
                      }}
                      placeholder="Hook script..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-[#dbdbdb] dark:border-[#3f3f3f] bg-white dark:bg-[#1f1f1f] text-xs text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[#606060] dark:text-[#aaaaaa]">
                    <div>
                      <span>Bright: {(variant.thumbnail_brightness || 0.6).toFixed(2)}</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={variant.thumbnail_brightness || 0.6}
                        onChange={(e) => {
                          const updated = [...abVariants];
                          updated[idx].thumbnail_brightness = parseFloat(e.target.value);
                          setAbVariants(updated);
                        }}
                        className="w-full accent-[#e1002d] h-1.5"
                      />
                    </div>
                    <div>
                      <span>Contrast: {(variant.thumbnail_contrast || 0.7).toFixed(2)}</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={variant.thumbnail_contrast || 0.7}
                        onChange={(e) => {
                          const updated = [...abVariants];
                          updated[idx].thumbnail_contrast = parseFloat(e.target.value);
                          setAbVariants(updated);
                        }}
                        className="w-full accent-[#e1002d] h-1.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunABMatrix}
            disabled={evaluatingAB || abVariants.some(v => !v.title.trim() || !v.hook_script.trim())}
            className="w-full h-11 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] disabled:opacity-40 text-white text-sm font-medium transition-colors shadow-yt-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {evaluatingAB ? 'Simulating A/B Matrix...' : '⚡ Run Multi-Variant A/B Simulator'}
          </button>
        </div>
      )}

      {/* A/B Matrix Simulation Results */}
      {activeView === 'AB_MATRIX' && abMatrixResult && (
        <div className="space-y-6 animate-fadeIn mb-6">
          {/* Winner Callout Banner */}
          <div className="p-6 rounded-xl bg-[#c8e6c9]/20 dark:bg-[#1b5e20]/20 border border-[#2ba640]/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20] dark:text-[#a5d6a7] font-bold text-xs border border-[#2ba640]/30">
                  🏆 Winning Variant Found
                </span>
                <span className="text-xs text-[#606060] dark:text-[#aaaaaa] font-medium">Predicted Winner</span>
              </div>
              <p className="text-sm text-[#0f0f0f] dark:text-[#f1f1f1] font-semibold">{abMatrixResult.comparison_summary}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-[#606060] dark:text-[#aaaaaa] font-semibold">Winning VAS Score</div>
              <div className="text-4xl font-headline font-bold text-[#2ba640] tabular-nums">
                {abMatrixResult.best_overall_vas.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Side-by-Side Variant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {abMatrixResult.variants.map((v, i) => (
              <div
                key={v.variant_id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  v.is_winner
                    ? 'bg-[#c8e6c9]/10 dark:bg-[#1b5e20]/15 border-[#2ba640]/40 shadow-sm'
                    : 'bg-[#f9f9f9] dark:bg-[#272727] border-[#dbdbdb] dark:border-[#2e2e2e]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-xs text-[#0f0f0f] dark:text-[#f1f1f1]">{v.variant_label}</span>
                    {v.is_winner ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20] dark:text-[#a5d6a7] text-[10px] font-bold uppercase">
                        Winner #1
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#eeeeee] dark:bg-[#383838] text-[#606060] dark:text-[#aaaaaa] text-[10px] font-semibold">
                        Rank #{i + 1}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-[#0f0f0f] dark:text-white line-clamp-2 mb-2">"{v.title}"</h4>

                  <div className="text-3xl font-headline font-bold text-[#0f0f0f] dark:text-white mb-3 tabular-nums">
                    {v.overall_vas.toFixed(1)} <span className="text-xs text-[#606060] dark:text-[#aaaaaa] font-normal">VAS</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <ScoreBar label="Title NLP" score={v.title_score} color="text-[#3ea6ff]" />
                    <ScoreBar label="Thumbnail Pop" score={v.thumbnail_score} color="text-[#3ea6ff]" />
                    <ScoreBar label="30s Retention" score={v.hook_score} color="text-[#2ba640]" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[11px] text-[#0f0f0f] dark:text-[#f1f1f1] mb-3">
                    <span className="font-bold text-[#e1002d]">Driver: </span>
                    {v.key_advantage}
                  </div>
                </div>

                {v.predicted_ctr_uplift_pct > 0 && (
                  <div className="text-right text-[11px] font-semibold text-[#2ba640]">
                    +{v.predicted_ctr_uplift_pct}% Est. CTR Lift
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="text-center p-6 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e]">
            <div className="text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-2">Overall Viewer Attraction Score</div>
            <div className={`text-6xl font-display font-bold ${vasColor} tabular-nums`}>
              {data.overall_vas.toFixed(1)}
            </div>
            <div className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1">out of 100.0</div>
          </div>

          {/* Sub-Score Breakdown */}
          <div className="p-5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-4">
            <div className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider">Score Breakdown</div>
            <ScoreBar label="Title Quality" score={data.title_score} color="text-[#3ea6ff]" />
            <ScoreBar label="Thumbnail Vision" score={data.thumbnail_score} color="text-[#3ea6ff]" />
            <ScoreBar label="Hook Script Retention" score={data.hook_score} color="text-[#2ba640]" />
          </div>

          {/* Deep Analysis Panels */}
          {detailedData && (
            <>
              {/* Thumbnail Vision Diagnostics */}
              <div className="p-5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-4">
                <div className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#e1002d]" /> Thumbnail Vision Diagnostics
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
                  <div className="p-3 rounded-xl bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#3f3f3f] flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#eeeeee] dark:bg-[#383838] text-[#e1002d]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-[#606060] dark:text-[#aaaaaa] font-medium">Text Legibility</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0f0f0f] dark:text-white">{detailedData.thumbnail_analysis.legibility_score.toFixed(1)}%</span>
                        <GradeBadge grade={detailedData.thumbnail_analysis.readability_grade} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title Pattern Analysis */}
              <div className="p-5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-4">
                <div className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#e1002d]" /> Title Pattern Analysis
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <MiniStat label="Characters" value={`${detailedData.title_analysis.char_count}`} icon={<Type className="w-4 h-4" />} />
                  <MiniStat label="Curiosity Words" value={`${detailedData.title_analysis.curiosity_word_count}`} icon={<Sparkles className="w-4 h-4" />} />
                  <MiniStat label="Power Words" value={`${detailedData.title_analysis.power_word_count}`} icon={<Zap className="w-4 h-4" />} />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#606060] dark:text-[#aaaaaa]">
                  {detailedData.title_analysis.has_number && (
                    <span className="px-2 py-0.5 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] font-semibold">✓ Number</span>
                  )}
                  {detailedData.title_analysis.has_question && (
                    <span className="px-2 py-0.5 rounded-full bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] font-semibold">✓ Question</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* AI Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="p-5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-3">
              <div className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#e1002d]" /> AI Recommendations
              </div>
              {data.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#0f0f0f] dark:text-[#f1f1f1]">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#e1002d] flex-shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Closed-Loop Auto-Tuning Engine Tracker */}
      {closedLoopData && (
        <div className="mt-8 p-6 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#e1002d]" />
              <h4 className="text-xs font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider">Closed-Loop Auto-Tuning Engine</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
              closedLoopData.status === 'OPTIMAL' ? 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border-[#2ba640]/30' :
              closedLoopData.status === 'TUNING_ACTIVE' ? 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30' :
              'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border-[#e1002d]/30'
            }`}>
              {closedLoopData.status}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat label="Evaluations Tracked" value={`${closedLoopData.total_evaluations}`} icon={<BarChart3 className="w-4 h-4 text-[#3ea6ff]" />} />
            <MiniStat label="Prediction Accuracy" value={`${closedLoopData.accuracy_pct.toFixed(1)}%`} icon={<Target className="w-4 h-4 text-[#2ba640]" />} />
            <MiniStat label="Mean Abs Error (MAE)" value={`${closedLoopData.mean_absolute_error.toFixed(1)}`} icon={<Activity className="w-4 h-4 text-[#e1002d]" />} />
            <div className="p-3 rounded-xl bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#3f3f3f]">
              <div className="text-xs text-[#606060] dark:text-[#aaaaaa] font-semibold mb-1">Tuned Formula Weights</div>
              <div className="text-[11px] font-mono font-semibold text-[#0f0f0f] dark:text-[#f1f1f1]">
                Title: {(closedLoopData.tuned_weights.w1_title * 100).toFixed(0)}% | Thumb: {(closedLoopData.tuned_weights.w2_thumbnail * 100).toFixed(0)}% | Hook: {(closedLoopData.tuned_weights.w3_hook * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closed-Loop Telemetry Sync Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#272727] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-yt-lg relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#dbdbdb] dark:border-[#2e2e2e]">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-[#e1002d]" />
                <h3 className="font-headline font-bold text-lg text-[#0f0f0f] dark:text-white">Sync Post-Publish Video Metrics</h3>
              </div>
              <button onClick={() => setIsSyncModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#606060] hover:text-[#0f0f0f] dark:text-[#aaaaaa] dark:hover:text-white bg-[#f5f5f5] dark:bg-[#272727]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSyncSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">Actual CTR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={syncCtr}
                  onChange={(e) => setSyncCtr(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-white text-sm focus:outline-none focus:border-[#e1002d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">30s Retention (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={syncRetention}
                  onChange={(e) => setSyncRetention(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-white text-sm focus:outline-none focus:border-[#e1002d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">Total Post-Publish Views</label>
                <input
                  type="number"
                  value={syncViews}
                  onChange={(e) => setSyncViews(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-white text-sm focus:outline-none focus:border-[#e1002d]"
                />
              </div>

              {syncResult && (
                <div className="p-3 rounded-xl bg-[#c8e6c9]/30 border border-[#2ba640]/30 text-xs text-[#1b5e20] dark:text-[#a5d6a7] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Recalibrated Engine Successfully!
                  </div>
                  <div>{syncResult.message}</div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="flex-1 h-10 rounded-full bg-[#eeeeee] dark:bg-[#272727] hover:bg-[#e8e8e8] dark:hover:bg-[#383838] border border-[#dbdbdb] dark:border-[#3f3f3f] text-[#0f0f0f] dark:text-[#f1f1f1] text-xs font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="flex-1 h-10 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-yt-sm"
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

export default PackagingOptimizer;

