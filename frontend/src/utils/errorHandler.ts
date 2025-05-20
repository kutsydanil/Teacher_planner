import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const ERROR_CACHE = {
  lastErrorTime: 0,
  lastErrorMessage: '',
  MIN_ERROR_INTERVAL: 5000
};

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function shouldShowError(message: string): boolean {
  const now = Date.now();
  if (
    message === ERROR_CACHE.lastErrorMessage &&
    now - ERROR_CACHE.lastErrorTime < ERROR_CACHE.MIN_ERROR_INTERVAL
  ) {
    return false;
  }
  ERROR_CACHE.lastErrorTime = now;
  ERROR_CACHE.lastErrorMessage = message;
  return true;
}

export function handleError(error: unknown): AppError {

  if (error instanceof AppError) {
    return error;
  }

  let message = '';
  let status: number | undefined;
  let code: string | undefined;
  let data: any;

  if (error instanceof AxiosError) {
    status = error.response?.status;
    data = error.response?.data;
    
    if (!error.response && error.request) {
      if (error.message === 'Network Error') {
        message = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        message = 'Unable to reach the server. Please try again later.';
      }
    } else if (error.response) {
      switch (status) {
        case 401:
          message = 'Your session has expired. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 422:
          message = 'Invalid data provided. Please check your input.';
          break;
        case 429:
          message = 'Too many requests. Please try again in a few minutes.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'The server is currently unavailable. Please try again later.';
          break;
        default:
          message = error.response.data?.message || 'An unexpected error occurred.';
      }
    } else {
      message = 'An unexpected error occurred. Please try again.';
    }

    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    data = { stack: error.stack };
  } else {
    message = 'An unknown error occurred';
  }

  if (shouldShowError(message)) {
    toast.error(message);
  }

  return new AppError(message, code, status, data);
}

let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 5000;
const HEALTH_CHECK_TIMEOUT = 3000;

export function isOffline(): boolean {
  return !navigator.onLine;
}

export async function checkNetworkConnection(): Promise<boolean> {
  const now = Date.now();
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return navigator.onLine;
  }

  lastConnectionCheck = now;
  
  if (!navigator.onLine) {
    return false;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/health/`, { 
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT)
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}