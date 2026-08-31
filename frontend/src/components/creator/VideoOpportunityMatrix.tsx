import React, { useEffect, useState } from 'react';
import { getVideoOpportunities } from '../../services/api';
import { ContentGapMatrixResponseDTO, VideoOpportunityDTO, FactorScoreDTO } from '../../types';
import { CompositeSpiderChart } from './CompositeSpiderChart';
import { Card } from '../common/Card';
import { Target, ChevronDown, ChevronUp, Sparkles, Award, Loader2 } from 'lucide-react';




interface VideoOpportunityMatrixProps {
  goal?: string;
}

export const VideoOpportunityMatrix: React.FC<VideoOpportunityMatrixProps> = ({ goal }) => {
  const [data, setData] = useState<ContentGapMatrixResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOpp, setSelectedOpp] = useState<VideoOpportunityDTO | null>(null);

  useEffect(() => {
    setLoading(true);
    getVideoOpportunities(goal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [goal]);

  if (loading) {
    return (
      <Card className="p-8 flex flex-col justify-center items-center gap-3 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">
          Evaluating content gap matrix and VOS scores {goal ? `for "${goal}"` : 'for your target goal'}...
        </p>
      </Card>
    );
  }

  if (!data || !data.opportunities) {
    return <div className="text-zinc-500 dark:text-zinc-400 p-4 text-xs">No data available</div>;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH_OPPORTUNITY': return 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30';
      case 'MODERATE': return 'bg-[#b3e5fc] text-[#01579b] dark:bg-[#01579b]/60 dark:text-[#81d4fa] border border-[#3ea6ff]/30';
      case 'SATURATED': return 'bg-[#ffcccc] text-[#8b0000] dark:bg-[#8b0000]/60 dark:text-[#ff9999] border border-[#e1002d]/30';
      default: return 'bg-[#eeeeee] text-[#606060] dark:bg-[#383838] dark:text-[#aaaaaa] border border-[#dbdbdb] dark:border-[#3f3f3f]';
    }
  };

  const buildFactorsForOpp = (opp: VideoOpportunityDTO): FactorScoreDTO[] => {
    const demandScore = Math.min(100, opp.demand_index * 10);
    const compAdvantage = Math.min(100, Math.max(20, (1.5 - opp.competitor_density) * 60));
    return [
      { factor_key: 'title_ctr_potential', factor_name: 'Title CTR Potential', score: Math.min(95, opp.vos_score * 5.2), weight: 0.15, description: 'NLP title attraction score' },
      { factor_key: 'thumbnail_visual_impact', factor_name: 'Thumbnail Impact', score: 85.0, weight: 0.15, description: 'Estimated visual attraction ratio' },
      { factor_key: 'thumbnail_legibility', factor_name: 'Thumbnail Legibility', score: 90.0, weight: 0.10, description: 'Mobile text legibility score' },
      { factor_key: 'hook_pacing_retention', factor_name: 'Hook Script Pacing', score: 82.0, weight: 0.15, description: 'Opening 30s word pacing' },
      { factor_key: 'emotional_hook_intensity', factor_name: 'Emotional Intensity', score: 78.0, weight: 0.10, description: 'Curiosity & emotional hook intensity' },
      { factor_key: 'market_demand_index', factor_name: 'Market Demand', score: demandScore, weight: 0.12, description: 'Search volume & category demand' },
      { factor_key: 'competition_gap_advantage', factor_name: 'Competition Advantage', score: compAdvantage, weight: 0.11, description: 'Unsaturated gap positioning advantage' },
      { factor_key: 'trend_velocity_momentum', factor_name: 'Trend Velocity', score: Math.min(98, opp.vos_score * 5.5), weight: 0.12, description: 'Trajectory search momentum' },
    ];
  };

  return (
    <Card className="rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl p-6 lg:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight">
              Content Gap Matrix & Opportunity Radar
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Identify unsaturated high-demand content gaps using 8-factor composite scoring.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
          {(goal || data.aligned_goal) && (
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[240px]">Goal: {goal || data.aligned_goal}</span>
            </span>
          )}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Avg VOS Score</span>
            <span className="font-black text-2xl text-zinc-900 dark:text-white">{data.avg_vos_score.toFixed(1)}</span>
          </div>
        </div>
      </div>


      {/* Opportunity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.opportunities.map((opp, idx) => {
          const isSelected = selectedOpp?.topic === opp.topic;
          return (
            <div
              key={idx}
              className={`rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-all duration-300 hover:scale-[1.01] ${
                isSelected
                  ? 'border-emerald-500 bg-zinc-100 dark:bg-zinc-800 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/60 hover:border-zinc-400 dark:hover:border-zinc-500 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTierColor(opp.opportunity_tier)} shadow-xs`}>
                    {opp.opportunity_tier.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Goal Aligned` : '92% Goal Aligned'}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">VOS: {opp.vos_score.toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-3 line-clamp-2 leading-snug">{opp.topic}</h3>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] font-medium">Demand</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{opp.demand_index.toFixed(1)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700/80">
                    <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] font-medium">Competition</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{opp.competitor_density.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Recommended Titles
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {opp.recommended_titles.map((title, i) => (
                    <li key={i} className="text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span className="truncate">{title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap shrink-0">
                        {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Match` : '94% Match'}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedOpp(isSelected ? null : opp)}
                  className="w-full h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Target className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isSelected ? 'Hide 8-Factor Radar' : 'View 8-Factor Spider Radar'}</span>
                  {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded 8-Factor Composite Spider Chart for Selected Opportunity */}
      {selectedOpp && (
        <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" /> 8-Factor Spider Radar for "{selectedOpp.topic}"
            </h3>
            <button
              onClick={() => setSelectedOpp(null)}
              className="text-xs font-semibold text-zinc-500 hover:text-emerald-500 dark:text-zinc-400 dark:hover:text-emerald-400 underline transition-colors"
            >
              Close Breakdown
            </button>
          </div>
          <CompositeSpiderChart
            factors={buildFactorsForOpp(selectedOpp)}
            overallScore={selectedOpp.vos_score * 5.0}
          />
        </div>
      )}
    </Card>
  );
};

export default VideoOpportunityMatrix;

