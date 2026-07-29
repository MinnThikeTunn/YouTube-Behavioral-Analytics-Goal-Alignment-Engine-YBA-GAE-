import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-[32px] border border-slate-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#1c1d1f]/90 backdrop-blur-md shadow-sm p-6 lg:p-8 transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
};
