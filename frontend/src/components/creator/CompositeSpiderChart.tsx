import React, { useState } from 'react';
import { Composite8FactorScoreDTO, FactorScoreDTO } from '../../types';
import { Target, Info } from 'lucide-react';

interface CompositeSpiderChartProps {
  data?: Composite8FactorScoreDTO;
  factors?: FactorScoreDTO[];
  overallScore?: number;
  className?: string;
}

export const CompositeSpiderChart: React.FC<CompositeSpiderChartProps> = ({
  data,
  factors: propsFactors,
  overallScore: propsOverallScore,
  className = '',
}) => {
  const factors = data?.factors || propsFactors || [
    { factor_key: 'title_ctr_potential', factor_name: 'Title CTR Potential', score: 85, weight: 0.15, description: 'NLP curiosity & power word optimization' },
    { factor_key: 'thumbnail_visual_impact', factor_name: 'Thumbnail Visual Impact', score: 78, weight: 0.15, description: 'Luminance & contrast attraction score' },
    { factor_key: 'thumbnail_legibility', factor_name: 'Thumbnail Legibility', score: 90, weight: 0.10, description: 'Mobile screen text readability grade' },
    { factor_key: 'hook_pacing_retention', factor_name: 'Hook Script Pacing', score: 82, weight: 0.15, description: '30s speech pace (60-90 words)' },
    { factor_key: 'emotional_hook_intensity', factor_name: 'Emotional Intensity', score: 75, weight: 0.10, description: 'Emotional word density & CTA presence' },
    { factor_key: 'market_demand_index', factor_name: 'Market Demand Index', score: 88, weight: 0.12, description: 'Search volume & category topic demand' },
    { factor_key: 'competition_gap_advantage', factor_name: 'Competition Advantage', score: 79, weight: 0.11, description: 'Unsaturated content positioning' },
    { factor_key: 'trend_velocity_momentum', factor_name: 'Trend Velocity', score: 84, weight: 0.12, description: 'Search growth & trajectory momentum' },
  ];

  const overallScore = data?.composite_overall_score ?? propsOverallScore ?? (
    roundTo(factors.reduce((acc, f) => acc + f.score * f.weight, 0), 1)
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  const numAxes = factors.length;

  const getCoordinates = (index: number, score: number) => {
    const angle = (index * (2 * Math.PI)) / numAxes - Math.PI / 2;
    const r = (score / 100) * radius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, angle };
  };

  const getAxisEnd = (index: number) => {
    const angle = (index * (2 * Math.PI)) / numAxes - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = factors
    .map((f, idx) => {
      const { x, y } = getCoordinates(idx, f.score);
      return `${x},${y}`;
    })
    .join(' ');

  const gridRings = [0.25, 0.5, 0.75, 1.0];

  function roundTo(val: number, decimals: number) {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

  const activeFactor = hoveredIdx !== null ? factors[hoveredIdx] : null;

  return (
    <div className={`p-6 rounded-[32px] bg-zinc-900/90 border border-violet-500/20 backdrop-blur-xl shadow-xl space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-lg text-white">8-Factor Composite Spider Analysis</h4>
            <p className="text-xs text-zinc-400">Pre-publish packaging & market velocity radar</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overall Score</div>
          <div className="text-2xl font-black text-violet-400 tabular-nums">
            {overallScore.toFixed(1)}
            <span className="text-xs text-zinc-500 font-normal"> / 100</span>
          </div>
        </div>
      </div>

      {/* SVG Chart + Interactive Tooltip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Container */}
        <div className="lg:col-span-7 flex justify-center relative">
          <svg width={size} height={size} className="overflow-visible">
            <defs>
              <linearGradient id="spiderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
              </linearGradient>
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Background Glow */}
            <circle cx={cx} cy={cy} r={radius + 15} fill="url(#ringGlow)" />

            {/* Grid Rings */}
            {gridRings.map((scale, rIdx) => {
              const ringPoints = factors
                .map((_, fIdx) => {
                  const { x, y } = getCoordinates(fIdx, scale * 100);
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={rIdx}
                  points={ringPoints}
                  fill="none"
                  stroke="#3f3f46"
                  strokeWidth="1"
                  strokeDasharray={scale === 1.0 ? '0' : '3 3'}
                  opacity={0.6}
                />
              );
            })}

            {/* Axis Lines */}
            {factors.map((_, idx) => {
              const end = getAxisEnd(idx);
              return (
                <line
                  key={idx}
                  x1={cx}
                  y1={cy}
                  x2={end.x}
                  y2={end.y}
                  stroke="#3f3f46"
                  strokeWidth="1.2"
                  opacity={0.5}
                />
              );
            })}

            {/* Filled Radar Polygon */}
            <polygon
              points={polygonPoints}
              fill="url(#spiderGradient)"
              stroke="#8b5cf6"
              strokeWidth="2.5"
              className="transition-all duration-500 ease-out"
            />

            {/* Data Points & Axis Labels */}
            {factors.map((f, idx) => {
              const { x, y } = getCoordinates(idx, f.score);
              const labelPos = getCoordinates(idx, 122);
              const isHovered = hoveredIdx === idx;

              return (
                <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
                  {/* Outer Pulsing Ring on Hover */}
                  {isHovered && (
                    <circle cx={x} cy={y} r={10} fill="#8b5cf6" fillOpacity={0.3} className="animate-ping" />
                  )}

                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#a78bfa' : '#8b5cf6'}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all duration-200"
                  />

                  {/* Axis Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor={labelPos.x > cx + 10 ? 'start' : labelPos.x < cx - 10 ? 'end' : 'middle'}
                    dominantBaseline="middle"
                    className={`text-[10px] font-bold transition-colors duration-200 ${
                      isHovered ? 'fill-violet-300 font-black' : 'fill-zinc-400'
                    }`}
                  >
                    {f.factor_name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hover Tooltip / Detail Panel */}
        <div className="lg:col-span-5 space-y-3">
          {activeFactor ? (
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-violet-300 uppercase">{activeFactor.factor_name}</span>
                <span className="text-lg font-black text-white">{activeFactor.score.toFixed(1)}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{activeFactor.description}</p>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-violet-500/20">
                <span>Formula Weight</span>
                <span className="font-bold text-violet-400">{(activeFactor.weight * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-700/40 text-center space-y-2">
              <Info className="w-5 h-5 text-violet-400 mx-auto" />
              <div className="text-xs font-bold text-zinc-300">Interactive 8-Axis Radar</div>
              <p className="text-[11px] text-zinc-500">Hover over any data point on the chart to view deep sub-score analysis and weights.</p>
            </div>
          )}

          {/* Factor List */}
          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
            {factors.map((f, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-2 px-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  hoveredIdx === idx
                    ? 'bg-violet-500/20 border-violet-500/40 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: f.score >= 80 ? '#10b981' : f.score >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                  <span className="text-xs font-semibold text-zinc-200">{f.factor_name}</span>
                </div>
                <span className="text-xs font-black tabular-nums text-white">{f.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
