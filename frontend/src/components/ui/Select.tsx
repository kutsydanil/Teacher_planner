import React, { SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';
import { FormError } from './FormError';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  className,
  label,
  error,
  options,
  id,
  containerClassName,
  leftIcon,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className={cn(
            "absolute inset-y-0 left-0 pl-3 flex items-center",
            error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
          )}>
            {leftIcon}
          </div>
        )}
        <select
          id={selectId}
          className={cn(
            'block w-full rounded-lg shadow-sm transition-colors duration-200 appearance-none',
            'text-sm py-2.5 px-4',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50 dark:bg-error-900/10'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
            'dark:text-white',
            leftIcon && 'pl-10',
            'pr-10',
            className
          )}
          aria-invalid={error ? "true" : "false"}
          {...props}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className={cn(
          "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none",
          error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
        )}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <FormError message={error || ''} />
    </div>
  );
};
