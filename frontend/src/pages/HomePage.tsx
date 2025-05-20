import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BarChart2, Users, Book, ArrowRight, Check, Clock, Shield, Award, Sparkles, Zap, Heart } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Smart Scheduling",
      description: "Create and manage your teaching schedule with intelligent conflict detection and Google Calendar integration."
    },
    {
      icon: <BarChart2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Comprehensive Analytics",
      description: "Get insights into your teaching hours, remaining classes, and workload distribution with visual reports."
    },
    {
      icon: <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Group Management",
      description: "Organize your students into groups with custom color-coding and track progress for each class."
    },
    {
      icon: <Book className="h-6 w-6 text-primary-600 dark:text-primary-400" />,
      title: "Subject Planning",
      description: "Plan your curriculum with detailed hour allocation for lectures, labs, and practice sessions."
    }
  ];

  const advancedFeatures = [
    {
      icon: <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />,
      title: "Real-time Synchronization",
      description: "Changes to your schedule are instantly synchronized with Google Calendar."
    },
    {
      icon: <Shield className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />,
      title: "Secure Data",
      description: "Your teaching data is protected with enterprise-grade security and regular backups."
    },
    {
      icon: <Award className="h-8 w-8 text-accent-600 dark:text-accent-400" />,
      title: "Professional Reports",
      description: "Generate detailed Excel reports for administrative purposes with just a few clicks."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-success-600 dark:text-success-400" />,
      title: "Smart Insights",
      description: "Get intelligent suggestions for optimizing your teaching schedule and workload."
    },
    {
      icon: <Zap className="h-8 w-8 text-warning-600 dark:text-warning-400" />,
      title: "Quick Actions",
      description: "Streamline common tasks with shortcuts and bulk operations for efficient planning."
    },
    {
      icon: <Heart className="h-8 w-8 text-error-600 dark:text-error-400" />,
      title: "Educator-Focused",
      description: "Designed specifically for teachers, with features that matter most to educators."
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Interactive Planning for <span className="text-primary-600 dark:text-primary-400">Educators</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Streamline your teaching schedule, track class hours, and sync with Google Calendar to optimize your educational workflow.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="w-full sm:w-auto">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <div className="relative">
                <div className="w-full h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="h-14 bg-primary-600 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="mx-auto text-white font-medium">Teacher Dashboard</div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div
                          key={i}
                          className={`text-center text-xs py-2 rounded-md ${
                            i === 15
                              ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                              : i === 16 || i === 18 || i === 22
                              ? 'bg-secondary-100 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300'
                              : i === 17 || i === 23 || i === 24
                              ? 'bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300'
                              : ''
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-md border-l-4 border-primary-600">
                        <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Computer Science Lecture</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">10:00 AM - 11:30 AM • Room 305</p>
                      </div>
                      <div className="p-2 bg-secondary-100 dark:bg-secondary-900/20 rounded-md border-l-4 border-secondary-600">
                        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Mathematics Lab</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">1:00 PM - 2:30 PM • Lab 205</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-accent-500 rounded-lg shadow-lg transform rotate-12 z-0"></div>
                <div className="absolute -top-5 -left-5 w-16 h-16 bg-primary-500 rounded-lg shadow-lg transform -rotate-12 z-0"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              About TeacherPlanner
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              We're passionate about making teachers' lives easier through smart technology
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-primary-50 dark:bg-primary-900/10 p-6 rounded-lg border border-primary-100 dark:border-primary-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Our Mission</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  To empower educators with intuitive tools that simplify planning, enhance organization, and maximize teaching effectiveness.
                </p>
              </div>
              
              <div className="bg-secondary-50 dark:bg-secondary-900/10 p-6 rounded-lg border border-secondary-100 dark:border-secondary-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-secondary-300 dark:hover:border-secondary-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Our Vision</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  To become the leading platform for educational planning and analytics, helping teachers focus more on what matters most - teaching.
                </p>
              </div>
              
              <div className="bg-accent-50 dark:bg-accent-900/10 p-6 rounded-lg border border-accent-100 dark:border-accent-800 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-accent-300 dark:hover:border-accent-600">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Our Values</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center transform transition-transform duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-accent-600 dark:text-accent-400 mr-2" />
                    Innovation in Education
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-accent-600 dark:text-accent-400 mr-2" />
                    User-Centric Design
                  </li>
                  <li className="flex items-center transform transition-transform duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-accent-600 dark:text-accent-400 mr-2" />
                    Continuous Improvement
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
              <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 bg-primary-100 dark:bg-primary-900/20 rounded-lg p-4 flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                    <Calendar className="h-12 w-12 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <div className="flex-1 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg p-4 flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                    <Users className="h-12 w-12 text-secondary-600 dark:text-secondary-400 transition-transform duration-300 group-hover:-rotate-12" />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex-1 bg-accent-100 dark:bg-accent-900/20 rounded-lg p-4 flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                    <BarChart2 className="h-12 w-12 text-accent-600 dark:text-accent-400 transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <div className="flex-1 bg-success-100 dark:bg-success-900/20 rounded-lg p-4 flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                    <Book className="h-12 w-12 text-success-600 dark:text-success-400 transition-transform duration-300 group-hover:-rotate-12" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary-200 dark:bg-primary-800 rounded-lg transform rotate-12 transition-transform duration-300 group-hover:rotate-45"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary-200 dark:bg-secondary-800 rounded-lg transform -rotate-12 transition-transform duration-300 group-hover:-rotate-45"></div>
              <div className="absolute inset-0 bg-gradient-radial from-transparent to-white/5 dark:to-black/5 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Supercharge Your Teaching Workflow
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
              Designed specifically for educators to streamline planning and reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-transform duration-300 hover:transform hover:scale-105"
              >
                <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3 w-fit mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Advanced Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
              Powerful tools designed to enhance your teaching experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature) => (
              <div key={feature.title} className="relative group overflow-hidden rounded-lg min-h-[200px]">
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg transition-opacity duration-300 opacity-80 md:group-hover:opacity-100 will-change-opacity"
                  style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                ></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-lg p-8 transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 h-full flex flex-col">
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white ml-3">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 flex-grow">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Why Educators Love Us
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400">
              Benefits that make a real difference in your daily teaching routine.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">Time Saving</h3>
              <ul className="space-y-3">
                {['Automated scheduling', 'Quick event creation', 'Bulk actions for multiple classes'].map((item, i) => (
                  <li key={i} className="flex items-start transform transition-all duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-success-500 mr-2 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="group bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-secondary-200 dark:hover:border-secondary-800 transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 transition-colors duration-300">Organization</h3>
              <ul className="space-y-3">
                {['Color-coded groups and subjects', 'Centralized schedule management', 'Custom categories and filters'].map((item, i) => (
                  <li key={i} className="flex items-start transform transition-all duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-success-500 mr-2 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="group bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-800 transform hover:-translate-y-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors duration-300">Reporting</h3>
              <ul className="space-y-3">
                {['Excel export for administrative reports', 'Visual analytics and charts', 'Comprehensive teaching hour tracking'].map((item, i) => (
                  <li key={i} className="flex items-start transform transition-all duration-300 hover:translate-x-2">
                    <Check className="h-5 w-5 text-success-500 mr-2 mt-0.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 dark:bg-primary-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to transform your teaching experience?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-xl text-primary-100">
              Join educators who are streamlining their workflow and focusing more on what matters: teaching.
            </p>
            <div className="mt-8">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary-600 hover:bg-gray-100 focus:ring-white"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button 
                    size="lg" 
                    className="bg-white text-primary-600 hover:bg-gray-100 focus:ring-white"
                  >
                    Get Started Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;