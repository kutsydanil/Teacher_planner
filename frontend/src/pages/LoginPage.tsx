import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '../components/ui/Button';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => (location.state as LocationState)?.from?.pathname || '/dashboard', [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    scope: 'openid email profile https://www.googleapis.com/auth/calendar',
    onSuccess: async (tokenResponse) => {
      try {
        await login(tokenResponse.code);
      } catch {
        setError('Failed to sign in. Please try again.');
      }
    },
    onError: (error) => {
      console.error('Google login failed', error);
      setError('Google login failed. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to TeacherPlanner
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Plan your teaching schedule, track hours, and sync with Google Calendar
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 p-4 text-sm text-red-800 bg-red-50 dark:text-red-400 dark:bg-red-900/50 rounded-lg"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sign in with your Google account to continue
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-500 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
              leftIcon={<Mail className="h-5 w-5 text-red-500" />}
              onClick={() => googleLogin()}
              isLoading={isLoading}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              Sign in with Google
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Using Google Calendar API
              </span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{' '}
              <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
