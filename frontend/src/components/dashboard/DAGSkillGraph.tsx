import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { Network } from 'lucide-react';

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
    fetch(`http://localhost:8000/api/v1/taxonomy/${jobId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.nodes) {
          setNodes(data.nodes);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div className="text-sm text-slate-500">Loading taxonomy...</div>;

  const renderNode = (node: DAGNodeDTO) => (
    <div key={node.id} className="ml-6 border-l-2 border-slate-200 dark:border-zinc-800 pl-4 py-2">
      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
        {node.title} {node.is_completed === 1 && '✅'}
      </div>
      <div className="text-xs text-slate-500">{node.progress_pct.toFixed(0)}% Complete</div>
      {node.children && node.children.map(renderNode)}
    </div>
  );

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <Network className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">Hierarchical Sub-Goal Taxonomy</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">DAG Execution Graph</p>
        </div>
      </div>
      <div className="mt-4">
        {nodes.map(renderNode)}
        {nodes.length === 0 && <div className="text-sm text-slate-500">No taxonomy generated for this goal yet.</div>}
      </div>
    </Card>
  );
};
