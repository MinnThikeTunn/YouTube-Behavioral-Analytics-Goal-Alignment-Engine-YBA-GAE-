import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Network } from 'lucide-react';
import { getTaxonomyGraph } from '../../services/api';

interface DAGNodeDTO {
  id: number;
  job_id: string;
  parent_id: number | null;
  title: string;
  description: string | null;
  is_completed: number;
  progress_pct: number;
  created_at: string;
  children: DAGNodeDTO[];
}

interface DAGSkillGraphProps {
  jobId: string;
}

export const DAGSkillGraph: React.FC<DAGSkillGraphProps> = ({ jobId }) => {
  const [nodes, setNodes] = useState<DAGNodeDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    getTaxonomyGraph(jobId)
      .then(data => {
        if (data && data.nodes) {
          setNodes(data.nodes);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  const renderNode = (node: DAGNodeDTO, depth = 0) => (
    <div key={node.id} className={`${depth > 0 ? 'ml-3 sm:ml-6 border-l-2 border-[#dbdbdb] dark:border-[#3f3f3f] pl-4 my-2' : ''}`}>
      <div className="p-3.5 rounded-xl bg-[#f9f9f9] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#2e2e2e] shadow-sm hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f] transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-headline font-bold text-sm text-[#0f0f0f] dark:text-white flex items-center gap-2">
            <span>{node.title}</span>
            {node.is_completed === 1 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20]/60 dark:text-[#a5d6a7] border border-[#2ba640]/30">
                Completed ✅
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-[#01579b] dark:text-[#81d4fa] shrink-0 bg-[#b3e5fc]/50 dark:bg-[#01579b]/40 px-2.5 py-0.5 rounded-full border border-[#3ea6ff]/30">
            {node.progress_pct.toFixed(0)}% Complete
          </div>
        </div>
        {node.description && (
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-1.5 leading-relaxed">
            {node.description}
          </p>
        )}
      </div>

      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="p-6 lg:p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#b3e5fc]/40 dark:bg-[#01579b]/20 text-[#01579b] dark:text-[#81d4fa] flex items-center justify-center border border-[#3ea6ff]/30">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-headline text-xl font-bold text-[#0f0f0f] dark:text-white">Hierarchical Sub-Goal Taxonomy</h3>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">DAG Execution Graph & Mastery Roadmap</p>
        </div>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-[#606060] dark:text-[#aaaaaa] animate-pulse">
            Loading taxonomy execution graph...
          </div>
        ) : nodes.length > 0 ? (
          <div className="space-y-3">{nodes.map(node => renderNode(node, 0))}</div>
        ) : (
          <div className="text-center py-8 text-sm text-[#606060] dark:text-[#aaaaaa] bg-[#f9f9f9] dark:bg-[#272727] rounded-xl border border-dashed border-[#dbdbdb] dark:border-[#3f3f3f]">
            No taxonomy graph generated for this goal yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default DAGSkillGraph;

