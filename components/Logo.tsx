import React from 'react';

export const Logo: React.FC<{className?: string}> = ({className}) => {
  return (
    <div className={`font-bold tracking-wider text-gray-800 dark:text-white ${className}`}>
      <span className="text-cyan-500 dark:text-cyan-400">AI</span>
      <span> Study Buddy</span>
    </div>
  );
};