import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode }) => {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#dbdbdb] dark:border-[#272727] bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-md px-6 transition-colors flex items-center">
      <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f0f0f] dark:bg-[#1f1f1f] border border-[#272727] dark:border-[#383838] flex items-center justify-center shadow-sm">
            <svg
              className="w-7 h-7 transition-transform duration-200 hover:scale-105"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="YouTube Behavioral Analytics Logo"
            >
              {/* White Rectangle */}
              <path
                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
                fill="#ffffff"
              />
              {/* Red Triangle */}
              <path
                d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                fill="#e1002d"
              />
            </svg>
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

