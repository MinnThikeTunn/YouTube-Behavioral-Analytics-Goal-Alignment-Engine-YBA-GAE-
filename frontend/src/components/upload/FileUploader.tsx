import React, { useState } from 'react';
import { UploadCloud, FileCheck, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';
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
      if (selected.name.endsWith('.json') || selected.name.endsWith('.zip')) {
        setFile(selected);
        setError(null);
      } else {
        setError('Please upload a valid JSON or ZIP archive.');
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.json') || dropped.name.endsWith('.zip')) {
        setFile(dropped);
        setError(null);
      } else {
        setError('Please upload a valid JSON or ZIP archive.');
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
    <Card className="max-w-3xl mx-auto my-8 p-6 lg:p-8 rounded-2xl border border-[#dbdbdb] dark:border-[#272727] bg-white dark:bg-[#1f1f1f] shadow-yt-sm hover:shadow-yt-md">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-[#0f0f0f] dark:text-white mb-1">
            YouTube Behavioral Analytics Engine
          </h2>
          <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
            Analyze historical Takeout exports or connect your real-time Chrome Extension telemetry.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onUploadSuccess({ job_id: "stream_job_default", status: "PROCESSING", message: "Live extension mode", created_at: new Date().toISOString() })}
          className="h-9 px-4 rounded-full bg-[#e1002d] hover:bg-[#cc0026] text-white font-medium text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap self-start md:self-auto"
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
          onClick={() => document.getElementById('file-input')?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-[#e1002d] bg-[#ffcccc]/20 dark:bg-[#e1002d]/10'
              : file
              ? 'border-[#2ba640] bg-[#c8e6c9]/20 dark:bg-[#1b5e20]/15'
              : 'border-[#dbdbdb] dark:border-[#3f3f3f] hover:border-[#e1002d] bg-[#f9f9f9] dark:bg-[#1f1f1f]'
          }`}
        >
          <input
            id="file-input"
            type="file"
            accept=".json,.zip"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isDragOver
                  ? 'bg-[#e1002d] text-white shadow-lg'
                  : file
                  ? 'bg-[#c8e6c9] text-[#1b5e20] dark:bg-[#1b5e20] dark:text-[#a5d6a7] border border-[#2ba640]/30'
                  : 'bg-[#eeeeee] dark:bg-[#272727] text-[#e1002d] border border-[#dbdbdb] dark:border-[#3f3f3f]'
              }`}
            >
              {file ? (
                <FileCheck className="w-6 h-6" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="font-headline text-base font-bold text-[#0f0f0f] dark:text-white tracking-tight">
                {file ? file.name : 'Upload Google Takeout Watch History'}
              </h3>
              <p className="text-xs text-[#606060] dark:text-[#aaaaaa] mt-0.5 max-w-sm mx-auto">
                {file
                  ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to analyze`
                  : 'Drag and drop your watch-history.json or Takeout .zip archive here, or click to browse.'}
              </p>
            </div>

            {!file && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#606060] dark:text-[#aaaaaa] bg-[#eeeeee] dark:bg-[#272727] px-3 py-1 rounded-full border border-[#dbdbdb] dark:border-[#3f3f3f] mt-1">
                <Sparkles className="w-3 h-3 text-[#e1002d]" />
                <span>Direct ZIP extraction & fast streaming JSON parser</span>
              </div>
            )}
          </div>
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
          <div className="p-3.5 rounded-xl bg-[#ffcccc]/40 border border-[#e1002d]/30 text-[#8b0000] dark:bg-[#8b0000]/20 dark:text-[#ff9999] text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#e1002d]" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full h-12 rounded-full bg-[#e1002d] hover:bg-[#cc0026] active:bg-[#b30000] disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-medium transition-colors duration-200 shadow-yt-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading & Initializing Job...</span>
            </>
          ) : (
            <>
              <span>Start Behavioral Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </Card>
  );
};

export default FileUploader;

