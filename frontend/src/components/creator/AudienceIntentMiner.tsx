import React, { useState } from 'react';
import { mineVideoComments } from '../../services/api';
import { MinedCommentDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2 } from 'lucide-react';

export const AudienceIntentMiner: React.FC = () => {
  const [videoId, setVideoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<MinedCommentDTO[]>([]);

  const handleMine = async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const result = await mineVideoComments({ video_id: videoId, max_results: 50 });
      setComments(result.comments);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'REQUEST': return 'bg-blue-100 text-blue-800';
      case 'CONFUSION': return 'bg-yellow-100 text-yellow-800';
      case 'PRAISE': return 'bg-green-100 text-green-800';
      case 'DEBATE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="rounded-[32px] border-none shadow-lg overflow-hidden bg-white/70 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="font-black text-2xl tracking-tight text-gray-900">
          Audience Intent Miner
        </CardTitle>
        <p className="text-gray-500 text-sm">Analyze YouTube comments to extract intents.</p>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input 
            value={videoId} 
            onChange={(e) => setVideoId(e.target.value)} 
            placeholder="Enter YouTube Video ID"
            className="rounded-xl bg-gray-50/50 border-gray-200"
          />
          <Button 
            onClick={handleMine} 
            disabled={loading || !videoId}
            className="rounded-xl px-6 font-semibold"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Mine
          </Button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {comments.map(c => (
            <div key={c.comment_id} className="p-4 rounded-2xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-gray-800 text-sm">{c.author_name}</span>
                {c.intent_label && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getIntentColor(c.intent_label)}`}>
                    {c.intent_label}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.text_display }} />
            </div>
          ))}
          {comments.length === 0 && !loading && (
             <div className="text-center py-10 text-gray-400">No comments mined yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
