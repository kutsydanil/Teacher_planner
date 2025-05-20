import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const LoadingCard: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6">
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" className="mb-4" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};