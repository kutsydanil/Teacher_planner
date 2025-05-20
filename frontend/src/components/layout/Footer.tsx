import React from 'react';
import { Calendar, Mail, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">TeacherPlanner</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Streamline your teaching schedule, track class hours, and sync with Google Calendar.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a 
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Calendar
                </a>
              </li>
              <li>
                <Link 
                  to="/support"
                  className="text-base text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Contact</h3>
            <div className="mt-4 text-base text-gray-600 dark:text-gray-400">
              <div className="flex items-center mb-2">
                <Mail className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-500" />
                <a href="mailto:support@teacherplanner.com" className="hover:text-primary-600 dark:hover:text-primary-400">
                  support@teacherplanner.com
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-base text-gray-500 dark:text-gray-400">
            &copy; {currentYear} TeacherPlanner. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link 
              to="/privacy"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;