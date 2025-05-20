import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export const LoadingRow: React.FC = () => {
  return (
    <tr className="animate-pulse">
      <td colSpan={100} className="px-6 py-4">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </td>
    </tr>
  );
};