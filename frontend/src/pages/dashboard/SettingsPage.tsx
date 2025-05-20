import React from 'react';
import { LogOut, Moon, Sun, User, Mail, Calendar, Shield, ChevronRight, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 mb-8">
            Settings
          </h1>
          
          {/* User Profile */}
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary-500" />
              User Profile
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
              <div className="relative group">
                <img
                  src={user?.picture}
                  alt={user?.name}
                  className="h-16 w-16 rounded-full object-cover mb-4 sm:mb-0 sm:mr-6 ring-2 ring-white dark:ring-gray-800 shadow-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-transparent to-black/10 pointer-events-none"></div>
              </div>
              
              <div>
                <h3 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                  {user?.name}
                </h3>
                <div className="flex items-center mt-1 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Profile information is managed by your Google account. To update your profile, please visit your Google account settings.
              </p>
              
              <Button 
                variant="danger" 
                leftIcon={<LogOut className="h-5 w-5" />}
                onClick={handleLogout}
                className="bg-gradient-to-r from-error-600 to-error-500 hover:from-error-700 hover:to-error-600"
              >
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Display Settings */}
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8 transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/5 dark:hover:shadow-secondary-500/10 hover:border-secondary-300 dark:hover:border-secondary-600">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Appearance
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                  )}
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Dark Theme</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Switch between light and dark mode
                    </p>
                  </div>
                </div>
                
                <Button
                  className={`${
                    theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                  role="switch"
                  aria-checked={theme === 'dark'}
                  onClick={toggleTheme}
                >
                  <span
                    aria-hidden="true"
                    className={`${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  ></span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Calendar Integration */}
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-8 transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/5 dark:hover:shadow-accent-500/10 hover:border-accent-300 dark:hover:border-accent-600">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-accent-500" />
              Google Calendar Integration
            </h2>
            
            <div className="bg-success-50 dark:bg-success-900/10 backdrop-blur-sm border border-success-200 dark:border-success-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-success-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-success-800 dark:text-success-300">Connected</h3>
                  <p className="text-sm text-success-700 dark:text-success-400 mt-1">
                    Your Google Calendar is currently connected and syncing properly.
                  </p>
                </div>
              </div>
            </div>
          
          </div>
          
          {/* Data Management */}
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-success-500/5 dark:hover:shadow-success-500/10 hover:border-success-300 dark:hover:border-success-600">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center">
              <Database className="h-5 w-5 mr-2 text-success-500" />
              Data Management
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group cursor-pointer hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                onClick={() => navigate('/statistics')}
              >
                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3 transition-transform group-hover:translate-x-1" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">View Statistics</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Access detailed analytics and reports
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;