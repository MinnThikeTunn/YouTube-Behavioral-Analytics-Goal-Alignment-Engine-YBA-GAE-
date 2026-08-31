import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Network, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getTaxonomyGraph, rebuildTaxonomyGraph } from '../../services/api';

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
  const [regenerating, setRegenerating] = useState(false);

  const fetchGraph = () => {
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
  };

  useEffect(() => {
    fetchGraph();
  }, [jobId]);

  const handleRegenerate = async () => {
    if (!jobId || regenerating) return;
    setRegenerating(true);
    try {
      const data = await rebuildTaxonomyGraph(jobId);
      if (data && data.nodes) {
        setNodes(data.nodes);
      }
    } catch (err) {
      console.error('Failed to regenerate taxonomy graph:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const renderNode = (node: DAGNodeDTO, depth = 0) => {
    const isRoot = depth === 0;
    const isPhase = depth === 1;

    return (
      <div
        key={node.id}
        className={`${
          isRoot
            ? ''
            : isPhase
            ? 'ml-3 sm:ml-6 border-l-2 border-emerald-500/40 dark:border-emerald-500/30 pl-4 my-2.5'
            : 'ml-3 sm:ml-6 border-l-2 border-zinc-200 dark:border-zinc-700/80 pl-3.5 my-2'
        }`}
      >
        <div
          className={`transition-all duration-200 ${
            isRoot
              ? 'p-4 lg:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/90 dark:border-zinc-700/80 shadow-xs'
              : isPhase
              ? 'p-4 rounded-xl bg-white dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 shadow-2xs hover:border-emerald-500/40'
              : 'p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-700/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-headline tracking-tight ${
                  isRoot
                    ? 'font-black text-base lg:text-lg text-zinc-900 dark:text-white'
                    : isPhase
                    ? 'font-bold text-sm lg:text-base text-zinc-800 dark:text-zinc-100'
                    : 'font-semibold text-xs lg:text-sm text-zinc-700 dark:text-zinc-200'
                }`}
              >
                {node.title}
              </span>
            </div>

            {node.is_completed === 1 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
          </div>

          {node.description && (
            <p
              className={`mt-1 leading-relaxed ${
                isRoot
                  ? 'text-xs text-zinc-600 dark:text-zinc-400'
                  : 'text-xs text-zinc-500 dark:text-zinc-400'
              }`}
            >
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
  };

  return (
    <Card className="rounded-[28px] lg:rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 backdrop-blur-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm flex-shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xl lg:text-2xl text-zinc-900 dark:text-white tracking-tight">
              Hierarchical Sub-Goal Taxonomy
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              DAG Execution Graph & Mastery Roadmap
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Synthesized
          </span>

          <button
            onClick={handleRegenerate}
            disabled={regenerating || loading}
            className="h-8 px-3 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Regenerate roadmap with Gemini LLM"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{regenerating ? 'Generating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
            Synthesizing hierarchical curriculum roadmap...
          </div>
        ) : nodes.length > 0 ? (
          <div className="space-y-3">{nodes.map(node => renderNode(node, 0))}</div>
        ) : (
          <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
            No taxonomy graph generated for this goal yet.
          </div>
        )}
      </div>
    </Card>
  );
};

export default DAGSkillGraph;

