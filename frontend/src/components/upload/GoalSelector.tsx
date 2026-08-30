import React from 'react';
import { Target, Key } from 'lucide-react';

interface GoalSelectorProps {
  selectedGoal: string;
  setSelectedGoal: (goal: string) => void;
  customGoal: string;
  setCustomGoal: (val: string) => void;
  userApiKey: string;
  setUserApiKey: (key: string) => void;
}

const PRESET_GOALS = [
  'Software Engineering',
  'Data Science & AI',
  'Fitness & Health',
  'Business & Startups',
  'Philosophy & Psychology',
  'Language Learning',
  'Custom',
];

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  selectedGoal,
  setSelectedGoal,
  customGoal,
  setCustomGoal,
  userApiKey,
  setUserApiKey,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#0f0f0f] dark:text-white mb-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#e1002d]" />
          <span>Select or Define Your Focus Goal</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_GOALS.map((goal) => {
            const isSelected = selectedGoal === goal;
            return (
              <button
                key={goal}
                type="button"
                onClick={() => setSelectedGoal(goal)}
                className={`py-2 px-3.5 rounded-full text-xs transition-all text-center ${
                  isSelected
                    ? 'bg-[#e1002d] text-white font-semibold shadow-sm'
                    : 'border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#aaaaaa] hover:bg-[#eeeeee] dark:hover:bg-[#383838]'
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </div>

      {selectedGoal === 'Custom' && (
        <div className="animate-fadeIn">
          <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1">
            Custom Goal Description
          </label>
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="e.g. Master Rust async programming and distributed systems"
            className="w-full px-4 py-2.5 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-xs text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#606060] dark:text-[#aaaaaa] mb-1 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-[#e1002d]" />
          <span>YouTube Data API Key (Optional — for metadata enrichment)</span>
        </label>
        <input
          type="password"
          value={userApiKey}
          onChange={(e) => setUserApiKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-4 py-2.5 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-xs text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 font-mono"
        />
        <p className="text-[11px] text-[#606060] dark:text-[#aaaaaa] mt-1">
          If omitted, the server uses cached embeddings and mock enrichment for unrecognized videos.
        </p>
      </div>
    </div>
  );
};

export default GoalSelector;
