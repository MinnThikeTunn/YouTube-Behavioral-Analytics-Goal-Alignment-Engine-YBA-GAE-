import React, { useState } from 'react';
import { Composite8FactorScoreDTO, FactorScoreDTO } from '../../types';
import { Card } from '../common/Card';
import { Info, Shield } from 'lucide-react';

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

  function roundTo(val: number, decimals: number) {
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  }

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
  const activeFactor = hoveredIdx !== null ? factors[hoveredIdx] : null;

  const getGradeBadge = (scoreVal: number) => {
    if (scoreVal >= 80) return 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border-[#2ba640]/30';
    if (scoreVal >= 65) return 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border-[#3ea6ff]/30';
    return 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border-[#e1002d]/30';
  };

  const grade = overallScore >= 80 ? 'EXCELLENT' : overallScore >= 65 ? 'GOOD' : 'FAIR';

  return (
    <Card className={`rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md p-6 lg:p-8 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dbdbdb] dark:border-[#2e2e2e] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center border border-[#e1002d]/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">
              8-Factor Composite Spider Radar
            </h3>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
              Unsupervised Multi-Dimensional Evaluation Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right">
            <span className="text-xs text-[#606060] dark:text-[#aaaaaa] font-medium block">Weighted Composite Score</span>
            <span className="font-headline text-2xl font-bold text-[#0f0f0f] dark:text-white tracking-tight">
              {overallScore.toFixed(1)} <span className="text-xs text-[#606060] dark:text-[#aaaaaa] font-normal">/ 100</span>
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getGradeBadge(overallScore)}`}>
            {grade}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG Container */}
        <div className="lg:col-span-7 flex justify-center relative py-2">
          <svg width={size} height={size} className="overflow-visible">
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
                  stroke="currentColor"
                  className="text-[#dbdbdb] dark:text-[#383838]"
                  strokeWidth="1"
                  strokeDasharray={scale === 1.0 ? '0' : '3 3'}
                  opacity={0.8}
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
                  stroke="currentColor"
                  className="text-[#dbdbdb] dark:text-[#383838]"
                  strokeWidth="1.2"
                  opacity={0.7}
                />
              );
            })}

            {/* Filled Radar Polygon */}
            <polygon
              points={polygonPoints}
              fill="#e1002d"
              fillOpacity="0.2"
              stroke="#e1002d"
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
                    <circle cx={x} cy={y} r={10} fill="#e1002d" fillOpacity="0.3" className="animate-ping" />
                  )}

                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#ff4d6d' : '#e1002d'}
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
                    className={`text-[10px] font-semibold transition-colors duration-200 ${
                      isHovered ? 'fill-[#e1002d] font-bold' : 'fill-[#606060] dark:fill-[#aaaaaa]'
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
            <div className="p-4 rounded-xl bg-[#b3e5fc]/20 dark:bg-[#01579b]/15 border border-[#3ea6ff]/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#01579b] dark:text-[#81d4fa] uppercase">{activeFactor.factor_name}</span>
                <span className="font-headline text-lg font-bold text-[#0f0f0f] dark:text-white">{activeFactor.score.toFixed(1)}</span>
              </div>
              <p className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] leading-relaxed">{activeFactor.description}</p>
              <div className="flex items-center justify-between text-[10px] text-[#606060] dark:text-[#aaaaaa] pt-1 border-t border-[#3ea6ff]/20">
                <span>Formula Weight</span>
                <span className="font-semibold text-[#01579b] dark:text-[#81d4fa]">{(activeFactor.weight * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] text-center space-y-2">
              <Info className="w-5 h-5 text-[#e1002d] mx-auto" />
              <div className="text-xs font-semibold text-[#0f0f0f] dark:text-white">Interactive 8-Axis Radar</div>
              <p className="text-[11px] text-[#606060] dark:text-[#aaaaaa]">Hover over any data point on the chart to view deep sub-score analysis and weights.</p>
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
                    ? 'bg-[#ffcccc]/40 dark:bg-[#e1002d]/20 border-[#e1002d]/40 text-[#0f0f0f] dark:text-white'
                    : 'bg-[#f9f9f9] dark:bg-[#272727] border-[#dbdbdb] dark:border-[#2e2e2e] text-[#606060] dark:text-[#aaaaaa] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: f.score >= 80 ? '#2ba640' : f.score >= 60 ? '#3ea6ff' : '#e1002d'
                    }}
                  />
                  <span className="text-xs font-medium text-[#0f0f0f] dark:text-[#f1f1f1]">{f.factor_name}</span>
                </div>
                <span className="font-headline text-xs font-bold tabular-nums text-[#0f0f0f] dark:text-white">{f.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CompositeSpiderChart;

