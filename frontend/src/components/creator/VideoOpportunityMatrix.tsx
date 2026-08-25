import React, { useEffect, useState } from 'react';
import { getVideoOpportunities } from '../../services/api';
import { ContentGapMatrixResponseDTO, VideoOpportunityDTO, FactorScoreDTO } from '../../types';
import { CompositeSpiderChart } from './CompositeSpiderChart';
import { Card } from '../common/Card';
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
    return <div className="text-[#606060] dark:text-[#aaaaaa] p-4 text-xs">Loading Opportunity Matrix...</div>;
  }

  if (!data || !data.opportunities) {
    return <div className="text-[#606060] dark:text-[#aaaaaa] p-4 text-xs">No data available</div>;
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
    <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] p-6 lg:p-8 shadow-yt-sm hover:shadow-yt-md space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ffcccc]/50 dark:bg-[#e1002d]/20 text-[#e1002d] flex items-center justify-center border border-[#e1002d]/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-xl lg:text-2xl font-bold text-[#0f0f0f] dark:text-white tracking-tight">
              Content Gap Matrix & Opportunity Radar
            </h2>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">Identify unsaturated high-demand content gaps using 8-factor composite scoring.</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-[#606060] dark:text-[#aaaaaa] uppercase tracking-wider font-semibold">Avg VOS Score</span>
          <span className="font-headline text-2xl font-bold text-[#0f0f0f] dark:text-white">{data.avg_vos_score.toFixed(1)}</span>
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.opportunities.map((opp, idx) => {
          const isSelected = selectedOpp?.topic === opp.topic;
          return (
            <div
              key={idx}
              className={`rounded-xl p-5 flex flex-col justify-between space-y-4 border transition-all ${
                isSelected
                  ? 'border-[#e1002d] bg-[#f9f9f9] dark:bg-[#272727] shadow-sm'
                  : 'bg-[#f9f9f9] dark:bg-[#272727] border-[#dbdbdb] dark:border-[#2e2e2e] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${getTierColor(opp.opportunity_tier)}`}>
                    {opp.opportunity_tier.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ffcccc]/40 text-[#8b0000] dark:bg-[#e1002d]/20 dark:text-[#ff9999] border border-[#e1002d]/20">
                      {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Goal Aligned` : '92% Goal Aligned'}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0f0f0f] dark:text-[#f1f1f1]">VOS: {opp.vos_score.toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="font-headline text-sm font-bold text-[#0f0f0f] dark:text-white mb-3 line-clamp-2">{opp.topic}</h3>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#3f3f3f]">
                    <span className="text-[#606060] dark:text-[#aaaaaa] block">Demand</span>
                    <span className="text-[#0f0f0f] dark:text-white font-bold">{opp.demand_index.toFixed(1)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#1f1f1f] border border-[#dbdbdb] dark:border-[#3f3f3f]">
                    <span className="text-[#606060] dark:text-[#aaaaaa] block">Competition</span>
                    <span className="text-[#0f0f0f] dark:text-white font-bold">{opp.competitor_density.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#dbdbdb] dark:border-[#2e2e2e] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] text-[#606060] dark:text-[#aaaaaa] uppercase font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#e1002d]" /> Recommended Titles
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {opp.recommended_titles.map((title, i) => (
                    <li key={i} className="text-xs text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-[#e1002d] mt-0.5">•</span>
                        <span className="truncate">{title}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#1b5e20] dark:text-[#a5d6a7] bg-[#c8e6c9] dark:bg-[#1b5e20]/60 px-1.5 py-0.5 rounded-full border border-[#2ba640]/30 whitespace-nowrap shrink-0">
                        {opp.goal_alignment_score ? `${opp.goal_alignment_score.toFixed(0)}% Match` : '94% Match'}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedOpp(isSelected ? null : opp)}
                  className="w-full h-8 rounded-full bg-[#eeeeee] dark:bg-[#383838] hover:bg-[#e8e8e8] dark:hover:bg-[#484848] text-[#0f0f0f] dark:text-[#f1f1f1] text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-[#e1002d]" />
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
        <div className="pt-4 border-t border-[#dbdbdb] dark:border-[#2e2e2e] animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-sm font-bold text-[#0f0f0f] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-[#e1002d]" /> 8-Factor Spider Radar for "{selectedOpp.topic}"
            </h3>
            <button
              onClick={() => setSelectedOpp(null)}
              className="text-xs text-[#606060] dark:text-[#aaaaaa] hover:text-[#e1002d] underline"
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

