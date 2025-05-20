import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="flex items-center mt-1 text-error-600 dark:text-error-400 text-sm">
      <AlertCircle className="h-4 w-4 mr-1" />
      <span>{message}</span>
    </div>
  );
};