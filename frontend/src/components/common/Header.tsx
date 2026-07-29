import React from 'react';
import { Youtube, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-[#131415]/80 backdrop-blur-md px-6 py-4 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              YouTube Behavioral Analytics
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                AI Alignment
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Unsupervised Behavioral Proxies & Goal Predictor
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
