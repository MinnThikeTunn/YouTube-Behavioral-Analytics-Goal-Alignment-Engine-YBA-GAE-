import React from 'react';
import { Target, Code, HeartPulse, Database, Key } from 'lucide-react';

interface GoalSelectorProps {
  selectedGoal: string;
  setSelectedGoal: (goal: string) => void;
  customGoal: string;
  setCustomGoal: (val: string) => void;
  userApiKey: string;
  setUserApiKey: (val: string) => void;
}

const PREDEFINED_GOALS = [
  { id: 'Software Engineering', label: 'Software Engineering', icon: Code },
  { id: 'Data Science', label: 'Data Science & AI', icon: Database },
  { id: 'Health & Fitness', label: 'Health & Fitness', icon: HeartPulse },
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
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-500" />
          Select Your Target Goal
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PREDEFINED_GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setSelectedGoal(goal.id);
                  setCustomGoal('');
                }}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 ${
                  isSelected
                    ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-500' : 'text-slate-400'}`} />
                <span className="text-sm">{goal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
          Or Enter a Custom Goal
        </label>
        <input
          type="text"
          value={customGoal}
          onChange={(e) => {
            setCustomGoal(e.target.value);
            setSelectedGoal('Custom');
          }}
          placeholder="e.g. Master React & Web Performance, Digital Marketing..."
          className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-sm transition-all"
        />
      </div>

      <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60">
        <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1.5 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-slate-400" />
          Optional: YouTube Data API v3 Key (Bypasses shared server quota)
        </label>
        <input
          type="password"
          value={userApiKey}
          onChange={(e) => setUserApiKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-xs transition-all"
        />
      </div>
    </div>
  );
};
