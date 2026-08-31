import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-[28px] lg:rounded-[32px] border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 lg:p-8 ${className}`}>
      {children}
    </div>
  );
};

