import React, { useState } from 'react';
import { Target, Code, Database, HeartPulse, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';

interface GoalSetupPageProps {
  currentGoal: string;
  onSaveGoal: (newGoal: string) => Promise<void> | void;
}

const PREDEFINED_GOALS = [
  { id: 'Software Engineering', label: 'Software Engineering & System Architecture', icon: Code },
  { id: 'Data Science', label: 'Data Science, Machine Learning & AI', icon: Database },
  { id: 'Health & Fitness', label: 'Health, Nutrition & High Performance', icon: HeartPulse },
];

export const GoalSetupPage: React.FC<GoalSetupPageProps> = ({
  currentGoal,
  onSaveGoal,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentGoal || 'Software Engineering');
  const [customGoalText, setCustomGoalText] = useState<string>(currentGoal || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSave = async () => {
    const finalGoal = customGoalText.trim() || selectedPreset || 'Software Engineering';
    setSaving(true);
    try {
      localStorage.setItem('yba_user_goal', finalGoal);
      await onSaveGoal(finalGoal);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-fadeIn">
      <Card className="bg-white dark:bg-[#1a1b1e] rounded-[32px] border border-slate-200/80 dark:border-zinc-800 p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shadow-sm">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-black text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white">
              Configure Your Target Watching Goal
            </h2>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Set your target learning domain to enable real-time vector alignment scoring and Focus Shield interventions.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Select Preset Learning Domain
            </label>
            <div className="space-y-3">
              {PREDEFINED_GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedPreset === goal.id || customGoalText === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(goal.id);
                      setCustomGoalText(goal.id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold shadow-md'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-500' : 'text-slate-400'}`} />
                      <span className="text-sm font-semibold">{goal.label}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-teal-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2">
              Or Enter Custom Video Watching Goal
            </label>
            <input
              type="text"
              value={customGoalText}
              onChange={(e) => {
                setCustomGoalText(e.target.value);
                setSelectedPreset('Custom');
              }}
              placeholder="e.g., Master React, Web Performance, Distributed Systems..."
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-sm font-medium transition-all"
            />
          </div>

          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/15 text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0" />
            <span>
              Your goal will be encoded into a 384-dimensional vector space using <strong>sentence-transformers (all-MiniLM-L6-v2)</strong> to compute real-time goal alignment.
            </span>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                'Saving Goal & Initializing Dashboard...'
              ) : success ? (
                <>
                  <Check className="w-5 h-5" /> Goal Saved! Redirecting...
                </>
              ) : (
                <>
                  Save Goal & Continue <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GoalSetupPage;
