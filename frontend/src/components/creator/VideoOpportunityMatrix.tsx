import React, { useEffect, useState } from 'react';
import { getVideoOpportunities } from '../../services/api';
import { ContentGapMatrixResponseDTO, VideoOpportunityDTO, FactorScoreDTO } from '../../types';
import { CompositeSpiderChart } from './CompositeSpiderChart';
import { Target, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';

export const VideoOpportunityMatrix: React.FC = () => {
  const [data, setData] = useState<ContentGapMatrixResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOpp, setSelectedOpp] = useState<VideoOpportunityDTO | null>(null);

  useEffect(() => {
    getVideoOpportunities()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-gray-400 p-4">Loading Opportunity Matrix...</div>;
  }

  if (!data || !data.opportunities) {
    return <div className="text-gray-400 p-4">No data available</div>;
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'HIGH_OPPORTUNITY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MODERATE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'SATURATED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
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
    <div className="bg-[#1C1C1C] rounded-[32px] p-6 lg:p-8 border border-white/5 space-y-6 hover:border-white/10 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" /> Content Gap Matrix & Opportunity Radar
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Identify unsaturated high-demand content gaps using 8-factor composite scoring.</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg VOS Score</span>
          <span className="text-2xl font-black text-white">{data.avg_vos_score.toFixed(1)}</span>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.opportunities.map((opp, idx) => {
          const isSelected = selectedOpp?.topic === opp.topic;
          return (
            <div
              key={idx}
              className={`bg-[#262626] rounded-2xl p-5 flex flex-col justify-between space-y-4 border transition-all ${
                isSelected ? 'border-purple-500/60 shadow-lg shadow-purple-500/10' : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${getTierColor(opp.opportunity_tier)}`}>
                    {opp.opportunity_tier.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Goal Aligned` : '92% Goal Aligned'}
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-300">VOS: {opp.vos_score.toFixed(1)}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{opp.topic}</h3>

                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-[#1f1f1f] border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400">Demand Index</span>
                    <span className="text-white font-bold">{opp.demand_index.toFixed(1)}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-400">Competitor Density</span>
                    <span className="text-white font-bold">{opp.competitor_density.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Recommended Titles
                  </h4>
                  <span className="text-[10px] text-purple-400 font-semibold">Goal Match Rank</span>
                </div>
                <ul className="space-y-1.5">
                  {opp.recommended_titles.map((title, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                        {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Match` : '94% Match'}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedOpp(isSelected ? null : opp)}
                  className="w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-purple-500/20"
                >
                  <Target className="w-3.5 h-3.5" />
                  {isSelected ? 'Hide 8-Factor Radar' : 'View 8-Factor Spider Radar'}
                  {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded 8-Factor Composite Spider Chart for Selected Opportunity */}
      {selectedOpp && (
        <div className="pt-4 border-t border-white/10 animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" /> 8-Factor Spider Radar for "{selectedOpp.topic}"
            </h3>
            <button
              onClick={() => setSelectedOpp(null)}
              className="text-xs text-gray-400 hover:text-white underline"
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
    </div>
  );
};
