import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { FormError } from './FormError';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, containerClassName, rows = 4, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            ref={ref}
            rows={rows}
            className={cn(
              'block w-full rounded-lg shadow-sm transition-colors duration-200 resize-y',
              // Убираем стандартную черную обводку браузера и задаём фирменный цвет ring
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500 bg-error-50 dark:bg-error-900/10'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
              'dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'min-h-[80px] py-2 px-3',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${textareaId}-error` : undefined}
            {...props}
          />
        </div>
        <FormError message={error || ''} />
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
