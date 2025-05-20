import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import SupportPage from './pages/SupportPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useScrollTop } from './hooks/useScrollTop';

// Import lazy-loaded dashboard pages
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const GroupsPage = React.lazy(() => import('./pages/dashboard/GroupsPage'));
const SubjectsPage = React.lazy(() => import('./pages/dashboard/SubjectsPage'));
const StatisticsPage = React.lazy(() => import('./pages/dashboard/StatisticsPage'));
const SettingsPage = React.lazy(() => import('./pages/dashboard/SettingsPage'));
const PlanPage = React.lazy(() => import('./pages/dashboard/PlanPage'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function ScrollToTop() {
  useScrollTop();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
              <Header />
              <main className="flex-grow">
                <React.Suspense fallback={
                  <div className="w-full h-[70vh] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    
                    {/* Protected routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/groups" element={
                      <ProtectedRoute>
                        <GroupsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/subjects" element={
                      <ProtectedRoute>
                        <SubjectsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/statistics" element={
                      <ProtectedRoute>
                        <StatisticsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/plan" element={
                      <ProtectedRoute>
                        <PlanPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* 404 page */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </React.Suspense>
              </main>
              <Footer />
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '8px',
                  background: 'var(--toaster-bg, #fff)',
                  color: 'var(--toaster-color, #333)',
                },
              }}
            />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;