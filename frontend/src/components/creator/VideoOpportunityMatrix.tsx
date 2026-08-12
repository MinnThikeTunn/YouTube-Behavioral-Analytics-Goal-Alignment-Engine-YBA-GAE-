import React, { useEffect, useState } from 'react';
import { getVideoOpportunities } from '../../services/api';
import { ContentGapMatrixResponseDTO, VideoOpportunityDTO } from '../../types';

export const VideoOpportunityMatrix: React.FC = () => {
  const [data, setData] = useState<ContentGapMatrixResponseDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getVideoOpportunities().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(err => {
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
    switch(tier) {
      case 'HIGH_OPPORTUNITY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MODERATE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'SATURATED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <div className="bg-[#1C1C1C] rounded-[32px] p-6 border border-white/5 space-y-6 hover:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight">Content Gap Matrix & Video Opportunity Score (VOS)</h2>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg VOS Score</span>
          <span className="text-2xl font-black text-white">{data.avg_vos_score.toFixed(1)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.opportunities.map((opp, idx) => (
          <div key={idx} className="bg-[#262626] rounded-2xl p-4 flex flex-col space-y-4 border border-white/5">
            <div>
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold border mb-2 ${getTierColor(opp.opportunity_tier)}`}>
                {opp.opportunity_tier.replace('_', ' ')}
              </div>
              <h3 className="text-lg font-bold text-white">{opp.topic}</h3>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400">Demand</span>
                <span className="text-white font-semibold">{opp.demand_index.toFixed(1)}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-400">Competition</span>
                <span className="text-white font-semibold">{opp.competitor_density.toFixed(1)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10">
              <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Recommended Titles</h4>
              <ul className="space-y-1">
                {opp.recommended_titles.map((title, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
