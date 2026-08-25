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
      <Card className="rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] p-8 lg:p-10 shadow-yt-sm relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#ffcccc]/60 dark:bg-[#e1002d]/20 border border-[#e1002d]/30 flex items-center justify-center text-[#e1002d] shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-headline text-2xl lg:text-3xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1]">
              Configure Your Target Watching Goal
            </h2>
            <p className="text-xs lg:text-sm text-[#606060] dark:text-[#aaaaaa] mt-1">
              Set your target learning domain to enable real-time vector alignment scoring and Focus Shield interventions.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#606060] dark:text-[#aaaaaa] mb-3">
              Select Preset Learning Domain
            </label>
            <div className="space-y-2.5">
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
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-[#e1002d] bg-[#ffcccc]/30 dark:bg-[#e1002d]/15 text-[#e1002d] dark:text-[#ff9999] font-medium shadow-yt-sm'
                        : 'border-[#dbdbdb] dark:border-[#2e2e2e] bg-[#f9f9f9] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#f1f1f1] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-[#e1002d]' : 'text-[#606060] dark:text-[#aaaaaa]'}`} />
                      <span className="text-sm font-medium">{goal.label}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#e1002d]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#606060] dark:text-[#aaaaaa] mb-2">
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
              className="w-full px-4 py-3 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 text-sm font-normal transition-all"
            />
          </div>

          <div className="p-4 rounded-xl bg-[#b3e5fc]/20 dark:bg-[#01579b]/20 border border-[#3ea6ff]/30 text-xs text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#3ea6ff] flex-shrink-0" />
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
              className="w-full h-12 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] text-white text-sm font-medium transition-colors duration-200 shadow-yt-sm flex items-center justify-center gap-2 disabled:opacity-50"
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

