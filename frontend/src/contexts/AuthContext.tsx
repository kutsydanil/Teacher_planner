import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, AuthContextType } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Флаг для предотвращения параллельных вызовов getUser
  const isCheckingAuth = useRef(false);
  // Таймер для обновления токена
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Флаг монтирования компонента
  const isMounted = useRef(true);

  const checkAuth = async () => {
    if (isCheckingAuth.current) return; 
    isCheckingAuth.current = true;

    try {
      const response = await authApi.getUser();
      if (isMounted.current) setUser(response.data);
    } catch (error) {
      if (isMounted.current) setUser(null);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isCheckingAuth.current = false;
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    checkAuth();

    return () => {
      isMounted.current = false;
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, []);

  const startTokenRefresh = () => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    refreshIntervalRef.current = setInterval(async () => {
      try {
        await authApi.refreshToken();
      } catch (error) {
        handleAuthFailure();
      }
    }, 4 * 60 * 1000); // Обновлять каждые 4 минуты
  };

  const handleAuthFailure = () => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    setUser(null);
    window.location.href = '/login';
  };

  const login = async (code: string) => {
    try {
      setIsLoading(true);
      await authApi.googleLogin(code);
      const response = await authApi.getUser();
      setUser(response.data);
      startTokenRefresh();
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      toast.error('Logout failed');
    } finally {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
