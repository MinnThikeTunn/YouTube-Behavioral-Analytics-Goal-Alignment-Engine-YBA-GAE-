import React, { useState } from 'react';
import { Target, X, Code, Database, HeartPulse, Sparkles, Check } from 'lucide-react';
import { Card } from '../common/Card';

interface GoalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: string;
  onSaveGoal: (newGoal: string) => Promise<void> | void;
}

const PREDEFINED_GOALS = [
  { id: 'Software Engineering', label: 'Software Engineering & System Architecture', icon: Code },
  { id: 'Data Science', label: 'Data Science, Machine Learning & AI', icon: Database },
  { id: 'Health & Fitness', label: 'Health, Nutrition & High Performance', icon: HeartPulse },
];

export const GoalEditModal: React.FC<GoalEditModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  onSaveGoal,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentGoal);
  const [customGoalText, setCustomGoalText] = useState<string>(currentGoal);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const finalGoal = customGoalText.trim() || selectedPreset || 'Software Engineering';
    setSaving(true);
    try {
      // Save locally to localStorage so extension can pick it up if local storage is queried
      localStorage.setItem('yba_user_goal', finalGoal);
      await onSaveGoal(finalGoal);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#dbdbdb] dark:border-[#272727] p-6 lg:p-8 shadow-yt-lg relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-[#606060] hover:text-[#0f0f0f] dark:text-[#aaaaaa] dark:hover:text-white bg-[#f5f5f5] dark:bg-[#272727] border border-[#dbdbdb] dark:border-[#3f3f3f] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#ffcccc]/60 dark:bg-[#e1002d]/20 border border-[#e1002d]/30 flex items-center justify-center text-[#e1002d]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-headline text-xl font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1]">
              Manage Target Watching Goal
            </h2>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5">
              Updates your real-time vector alignment score & Focus Shield filtering.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#606060] dark:text-[#aaaaaa] mb-2">
              Select Preset Learning Domain
            </label>
            <div className="space-y-2">
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
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-[#e1002d] bg-[#ffcccc]/30 dark:bg-[#e1002d]/15 text-[#e1002d] dark:text-[#ff9999] font-medium shadow-yt-sm'
                        : 'border-[#dbdbdb] dark:border-[#2e2e2e] bg-[#f9f9f9] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#f1f1f1] hover:border-[#9b9b9b] dark:hover:border-[#3f3f3f]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#e1002d]' : 'text-[#606060] dark:text-[#aaaaaa]'}`} />
                      <span className="text-xs font-medium">{goal.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#e1002d]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#606060] dark:text-[#aaaaaa] mb-1.5">
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
              className="w-full px-4 py-2.5 rounded-xl border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-[#0f0f0f] dark:text-white placeholder-[#606060] dark:placeholder-[#aaaaaa] focus:outline-none focus:border-[#e1002d] focus:ring-2 focus:ring-[#e1002d]/20 text-xs font-normal transition-all"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#b3e5fc]/20 dark:bg-[#01579b]/20 border border-[#3ea6ff]/30 text-[11px] text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3ea6ff] flex-shrink-0" />
            <span>
              Your goal is encoded via <strong>sentence-transformers (all-MiniLM-L6-v2)</strong> into a 384-dimensional vector space.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-full border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#eeeeee] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-[#e8e8e8] dark:hover:bg-[#383838] text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-6 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] text-white text-xs font-medium transition-colors duration-200 shadow-yt-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                'Recalculating Scores...'
              ) : success ? (
                <>
                  <Check className="w-4 h-4" /> Goal Updated!
                </>
              ) : (
                'Save & Apply Goal'
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GoalEditModal;

