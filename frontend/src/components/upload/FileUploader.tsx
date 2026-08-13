import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../common/Card';
import { GoalSelector } from './GoalSelector';
import { uploadWatchHistory } from '../../services/api';
import { UploadResponseDTO } from '../../types';

interface FileUploaderProps {
  onUploadSuccess: (response: UploadResponseDTO) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('Software Engineering');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.json')) {
        setFile(selected);
        setError(null);
      } else {
        setError('Please upload a valid JSON file (watch-history.json).');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.json')) {
        setFile(dropped);
        setError(null);
      } else {
        setError('Please upload a valid JSON file (watch-history.json).');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a watch-history.json file first.');
      return;
    }

    const effectiveGoal = selectedGoal === 'Custom' && customGoal.trim() ? customGoal.trim() : selectedGoal;
    if (!effectiveGoal) {
      setError('Please select or specify a target goal.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await uploadWatchHistory(file, effectiveGoal, userApiKey || undefined);
      onUploadSuccess(response);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload watch history file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto my-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-2xl tracking-tight text-slate-900 dark:text-white mb-1">
            YouTube Behavioral Analytics Engine
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Analyze historical Takeout exports or connect your real-time Chrome Extension telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUploadSuccess({ job_id: "stream_job_default", status: "PROCESSING", message: "Live extension mode", created_at: new Date().toISOString() })}
          className="px-5 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
        >

          <span>⚡ Launch Live Extension Dashboard</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-teal-500 bg-teal-500/5'
              : file
              ? 'border-teal-500/60 bg-teal-500/5 dark:bg-teal-500/10'
              : 'border-slate-300 dark:border-zinc-700/80 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-50/50 dark:bg-zinc-900/30'
          }`}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-500 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {file.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 text-sm">
                Drag & Drop watch-history.json here
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                or click to browse from your computer
              </span>
            </div>
          )}
        </div>

        <GoalSelector
          selectedGoal={selectedGoal}
          setSelectedGoal={setSelectedGoal}
          customGoal={customGoal}
          setCustomGoal={setCustomGoal}
          userApiKey={userApiKey}
          setUserApiKey={setUserApiKey}
        />

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-4 px-6 rounded-2xl bg-slate-900 dark:bg-teal-500 text-white dark:text-slate-950 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading & Initializing Job...</span>
            </>
          ) : (
            <span>Start Behavioral Analysis</span>
          )}
        </button>
      </form>
    </Card>
  );
};
