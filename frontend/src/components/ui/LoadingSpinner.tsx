import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent text-primary-500',
        sizeClasses[size]
      )} />
      <div className="absolute inset-0 rounded-full bg-gradient-radial from-transparent to-white/5 dark:to-black/5 pointer-events-none" />
    </div>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {message && (
          <p className="text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
};