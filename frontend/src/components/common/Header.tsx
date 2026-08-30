import React from 'react';
import { Youtube, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#dbdbdb] dark:border-[#272727] bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md px-6 transition-colors flex items-center">
      <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e1002d] text-white flex items-center justify-center shadow-sm">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline text-base sm:text-lg font-bold tracking-tight text-[#0f0f0f] dark:text-[#f1f1f1] flex items-center gap-2">
              YouTube Behavioral Analytics
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ffcccc] text-[#8b0000] dark:bg-[#e1002d]/20 dark:text-[#ff9999] border border-[#e1002d]/20">
                AI Alignment
              </span>
            </h1>
            <p className="text-xs text-[#606060] dark:text-[#aaaaaa]">
              Unsupervised Behavioral Proxies & Goal Predictor Engine
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-full border border-[#dbdbdb] dark:border-[#3f3f3f] bg-[#f5f5f5] dark:bg-[#272727] text-[#0f0f0f] dark:text-[#f1f1f1] hover:bg-[#eeeeee] dark:hover:bg-[#383838] flex items-center justify-center transition-all duration-200"
          title="Toggle Dark/Light Mode"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-[#f1f1f1]" /> : <Moon className="w-4 h-4 text-[#0f0f0f]" />}
        </button>
      </div>
    </header>
  );
};

