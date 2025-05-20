import { AxiosError } from 'axios';

export function parseApiValidationError(error: unknown): Record<string, string> {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;
    const data = axiosError.response?.data;
    if (data && typeof data === 'object') {
      const result: Record<string, string> = {};
      for (const key in data) {
        if (Array.isArray(data[key])) {
          result[key] = data[key][0];
        } else if (typeof data[key] === 'string') {
          result[key] = data[key];
        }
      }
      return result;
    }
  }
  return {};
}
