'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  Trophy, 
  Clock, 
  TrendingUp,
  Calendar,
  Star,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DemoLearnerDashboard() {
  const { t } = useTranslation('common');
  
  // Demo data - clearly marked as sample data
  const demoData = {
    name: 'Demo User',
    level: 'Intermediate',
    storiesRead: 42,
    wordsLearned: 1250,
    timeSpent: 720, // minutes
    currentStreak: 7,
    points: 3420
  };
  
  const dailyGoals = [
    { id: 1, title: 'Read 1 Story', completed: true },
    { id: 2, title: 'Learn 10 New Words', completed: false },
    { id: 3, title: 'Complete 1 Quiz', completed: false }
  ];
  
  const currentCourses = [
    {
      id: 1,
      title: 'Adventures Around the World',
      progress: 65,
      nextLesson: 'The Amazon Rainforest',
      image: '/api/placeholder/200/150'
    },
    {
      id: 2,
      title: 'Cultural Stories',
      progress: 40,
      nextLesson: 'Festivals of India',
      image: '/api/placeholder/200/150'
    },
    {
      id: 3,
      title: 'Science & Discovery',
      progress: 80,
      nextLesson: 'The Solar System',
      image: '/api/placeholder/200/150'
    }
  ];
  
  const achievements = [
    { id: 1, title: 'First Story', icon: BookOpen, unlocked: true },
    { id: 2, title: '7 Day Streak', icon: Calendar, unlocked: true },
    { id: 3, title: 'Word Master', icon: Trophy, unlocked: false },
    { id: 4, title: 'Global Explorer', icon: Star, unlocked: false }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Demo Mode - This is a preview with sample data
              </span>
            </div>
            <Link 
              href="/signup"
              className="bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              Sign Up for Full Access
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.learner.title')} (Demo)
          </h1>
          <p className="text-gray-600">Welcome to the demo dashboard!</p>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.storiesRead}</span>
            </div>
            <p className="text-gray-600">{t('dashboard.learner.storiesRead')}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.wordsLearned}</span>
            </div>
            <p className="text-gray-600">{t('dashboard.learner.wordsLearned')}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{Math.floor(demoData.timeSpent / 60)}h</span>
            </div>
            <p className="text-gray-600">{t('dashboard.learner.timeSpent')}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.currentStreak}</span>
            </div>
            <p className="text-gray-600">Day Streak</p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Goals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('dashboard.learner.dailyGoals')} (Sample)
              </h2>
              <div className="space-y-3">
                {dailyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      goal.completed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <span className={`${goal.completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                      {goal.title}
                    </span>
                    <div className={`w-6 h-6 rounded-full ${
                      goal.completed ? 'bg-green-500' : 'bg-gray-300'
                    } flex items-center justify-center`}>
                      {goal.completed && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Sign up to track your real progress!
                </p>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('dashboard.learner.achievements')} (Sample)
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex flex-col items-center p-3 rounded-lg ${
                      achievement.unlocked ? 'bg-yellow-50' : 'bg-gray-50 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`w-8 h-8 mb-1 ${
                      achievement.unlocked ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <span className={`text-xs text-center ${
                      achievement.unlocked ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Current Courses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('dashboard.learner.courses')} (Sample)
                </h2>
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Unlock All Courses
                </Link>
              </div>
              <div className="space-y-4">
                {currentCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                      Demo Content
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">Next: {course.nextLesson}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-grow bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{course.progress}%</span>
                        </div>
                      </div>
                      <button
                        className="p-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                        disabled
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}