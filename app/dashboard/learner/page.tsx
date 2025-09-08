'use client';

import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import LibrarySection from '@/components/dashboard/LibrarySection';
import AIBriefing from '@/components/dashboard/AIBriefing';
import TeacherAssignments from '@/components/dashboard/TeacherAssignments';
import TeacherRecommendations from '@/components/dashboard/TeacherRecommendations';

interface LearnerStats {
  user: {
    name: string;
    email: string;
    level: string;
  };
  stats: {
    storiesRead: number;
    currentlyReading: number;
    wordsLearned: number;
    timeSpent: number;
    currentStreak: number;
    points: number;
    quizzesCompleted: number;
    achievementsUnlocked: number;
  };
  recentActivity: Array<{
    bookId: string;
    bookTitle: string;
    progress: number;
    lastReadAt: string;
  }>;
}

export default function LearnerDashboard() {
  const { t } = useTranslation('common');
  const { data: session, status } = useSession();
  const [learnerData, setLearnerData] = useState<LearnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchLearnerStats();
    }
  }, [status]);

  const fetchLearnerStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/learner/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch learner statistics');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setLearnerData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching learner stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Default empty data structure for new users
  const defaultData = {
    user: {
      name: session?.user?.name || 'Learner',
      email: session?.user?.email || '',
      level: 'Beginner'
    },
    stats: {
      storiesRead: 0,
      currentlyReading: 0,
      wordsLearned: 0,
      timeSpent: 0,
      currentStreak: 0,
      points: 0,
      quizzesCompleted: 0,
      achievementsUnlocked: 0
    },
    recentActivity: []
  };
  
  const data = learnerData || defaultData;
  
  // Dynamic daily goals based on actual progress
  const dailyGoals = [
    { 
      id: 1, 
      title: 'Read 1 Story', 
      completed: data.stats.currentlyReading > 0 || data.stats.storiesRead > 0 
    },
    { 
      id: 2, 
      title: 'Learn 10 New Words', 
      completed: data.stats.wordsLearned >= 10 
    },
    { 
      id: 3, 
      title: 'Complete 1 Quiz', 
      completed: data.stats.quizzesCompleted > 0 
    }
  ];
  
  // Dynamic courses based on recent activity
  const currentCourses = data.recentActivity.slice(0, 3).map((activity, index) => ({
    id: activity.bookId,
    title: activity.bookTitle,
    progress: activity.progress,
    nextLesson: 'Continue Reading',
    image: '/api/placeholder/200/150'
  }));
  
  // If no recent activity, show placeholder courses
  if (currentCourses.length === 0) {
    currentCourses.push(
      {
        id: '1',
        title: 'Start Your First Story',
        progress: 0,
        nextLesson: 'Begin Learning',
        image: '/api/placeholder/200/150'
      }
    );
  }
  
  // Dynamic achievements based on actual unlocked achievements
  const achievements = [
    { 
      id: 1, 
      title: 'First Story', 
      icon: BookOpen, 
      unlocked: data.stats.storiesRead > 0 
    },
    { 
      id: 2, 
      title: '7 Day Streak', 
      icon: Calendar, 
      unlocked: data.stats.currentStreak >= 7 
    },
    { 
      id: 3, 
      title: 'Word Master', 
      icon: Trophy, 
      unlocked: data.stats.wordsLearned >= 100 
    },
    { 
      id: 4, 
      title: 'Global Explorer', 
      icon: Star, 
      unlocked: data.stats.storiesRead >= 10 
    }
  ];
  
  if (loading && status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.learner.title')}
          </h1>
          <p className="text-gray-600">
            Welcome back, {data.user.name}!
          </p>
        </motion.div>
        
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </motion.div>
        )}
        
        {/* AI Briefing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <AIBriefing dashboardType="learner" />
        </motion.div>

        {/* Teacher Interactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TeacherAssignments />
          <TeacherRecommendations />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">Level: {data.user.level}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{data.stats.storiesRead}</h3>
            <p className="text-gray-600 text-sm">Stories Completed</p>
            {data.stats.currentlyReading > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                +{data.stats.currentlyReading} in progress
              </p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{data.stats.wordsLearned}</h3>
            <p className="text-gray-600 text-sm">Words Learned</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {data.stats.currentStreak} days
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{data.stats.timeSpent}</h3>
            <p className="text-gray-600 text-sm">Minutes Read</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">
                {data.stats.points} pts
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {data.stats.achievementsUnlocked}
            </h3>
            <p className="text-gray-600 text-sm">Achievements</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {data.stats.currentlyReading > 0 ? 'Continue Reading' : 'Start Reading'}
                  </h2>
                  <Link 
                    href="/library" 
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {currentCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-16 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">Next: {course.nextLesson}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{course.progress}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Library Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <LibrarySection maxItems={3} />
            </motion.div>
          </div>

          {/* Right Column - Goals & Achievements */}
          <div className="space-y-6">
            {/* Daily Goals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h2>
              <div className="space-y-3">
                {dailyGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        goal.completed 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {goal.completed && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${
                        goal.completed ? 'text-gray-500 line-through' : 'text-gray-700'
                      }`}>
                        {goal.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Today's Progress</span>
                  <span className="text-sm font-medium text-blue-600">
                    {dailyGoals.filter(g => g.completed).length}/{dailyGoals.length} Complete
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.unlocked
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      } text-center`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                      <p className="text-xs font-medium text-gray-700">
                        {achievement.title}
                      </p>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/learn/achievements"
                className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Achievements
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}