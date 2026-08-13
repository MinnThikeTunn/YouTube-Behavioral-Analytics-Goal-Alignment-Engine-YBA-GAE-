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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <Card className="w-full max-w-lg bg-white dark:bg-[#1a1b1e] rounded-[32px] border border-slate-200/80 dark:border-zinc-800 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800/80 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white">
              Manage Target Watching Goal
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Updates your real-time vector alignment score & Focus Shield filtering.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-2.5">
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
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-500' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold">{goal.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-500" />}
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
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-xs font-medium transition-all"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/15 text-[11px] text-slate-600 dark:text-zinc-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <span>
              Your goal is encoded via <strong>sentence-transformers (all-MiniLM-L6-v2)</strong> into a 384-dimensional vector space.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
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
