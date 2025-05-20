import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { FormError } from './FormError';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, leftIcon, rightIcon, id, containerClassName, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute inset-y-0 left-0 pl-3 flex items-center',
                error ? 'text-error-500' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg shadow-sm transition-colors duration-200',
              'text-sm py-2 px-4',
              // Убираем стандартную чёрную обводку браузера и задаём фирменный цвет ring
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50 dark:bg-error-900/10'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
              'dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center',
                error ? 'text-error-500' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
        <FormError message={error || ''} />
      </div>
    );
  }
);

Input.displayName = 'Input';
