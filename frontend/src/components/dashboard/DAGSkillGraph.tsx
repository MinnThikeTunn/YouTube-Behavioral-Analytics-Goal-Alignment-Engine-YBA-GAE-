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
    <div key={node.id} className={`${depth > 0 ? 'ml-3 sm:ml-6 border-l-2 border-indigo-500/20 dark:border-indigo-500/30 pl-4 my-2' : ''}`}>
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800/80 shadow-sm hover:border-indigo-500/30 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <span>{node.title}</span>
            {node.is_completed === 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Completed ✅
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            {node.progress_pct.toFixed(0)}% Complete
          </div>
        </div>
        {node.description && (
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
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
    <Card className="p-6 rounded-[32px] backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border border-slate-200/50 dark:border-zinc-800/50 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white">Hierarchical Sub-Goal Taxonomy</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">DAG Execution Graph & Mastery Roadmap</p>
        </div>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-slate-400 dark:text-zinc-500 animate-pulse">
            Loading taxonomy execution graph...
          </div>
        ) : nodes.length > 0 ? (
          <div className="space-y-4">{nodes.map(node => renderNode(node, 0))}</div>
        ) : (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
            No taxonomy graph generated for this goal yet.
          </div>
        )}
      </div>
    </Card>
  );
};
