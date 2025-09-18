'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Trophy,
  Star,
  TrendingUp,
  BookOpen,
  Brain,
  Target,
  Award,
  Clock,
  Flame,
  Calendar,
  BarChart3,
  Lock,
  CheckCircle
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { getAchievements } from '@/lib/api/learning-api';
import type { Achievement } from '@/types/learning';

interface UserProfileProps {
  userId?: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [totalAchievements, setTotalAchievements] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'progress'>('stats');
  
  const { userStats, learningProgress } = useLearningStore();

  useEffect(() => {
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    setIsLoading(true);
    try {
      const response = await getAchievements();
      if (response.success && response.data) {
        setAchievements(response.data.achievements);
        setTotalAchievements(response.data.totalAchievements);
        setUnlockedCount(response.data.totalUnlocked);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const calculateProgress = (xp: number) => {
    return (xp % 1000) / 10; // Progress to next level as percentage
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!userStats) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No user data available</p>
      </div>
    );
  }

  const level = calculateLevel(userStats.totalXp);
  const progress = calculateProgress(userStats.totalXp);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Learning Profile</h2>
              <p className="text-blue-100 mt-1">Level {level} Learner</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userStats.totalXp.toLocaleString()}</div>
            <div className="text-blue-100">Total XP</div>
          </div>
        </div>
        
        {/* Level Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Level {level}</span>
            <span>{Math.round(progress)}% to Level {level + 1}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        {(['stats', 'achievements', 'progress'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{userStats.streak}</span>
            </div>
            <p className="text-sm text-gray-600">Day Streak</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{userStats.booksCompleted}</span>
            </div>
            <p className="text-sm text-gray-600">Books Read</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{userStats.wordsLearned}</span>
            </div>
            <p className="text-sm text-gray-600">Words Learned</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{userStats.averageQuizScore}%</span>
            </div>
            <p className="text-sm text-gray-600">Quiz Average</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-indigo-500" />
              <span className="text-2xl font-bold text-gray-900">
                {formatTime(userStats.totalReadingTime)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Reading Time</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{unlockedCount}</span>
            </div>
            <p className="text-sm text-gray-600">Achievements</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-cyan-500" />
              <span className="text-2xl font-bold text-gray-900">{userStats.quizzesTaken}</span>
            </div>
            <p className="text-sm text-gray-600">Quizzes Taken</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-8 h-8 text-pink-500" />
              <span className="text-2xl font-bold text-gray-900">
                {new Date(userStats.lastActive).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600">Last Active</p>
          </motion.div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div>
          {/* Achievement Progress */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Achievements Progress
              </span>
              <span className="text-sm font-bold text-purple-600">
                {unlockedCount}/{totalAchievements}
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalAchievements) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              />
            </div>
          </div>
          
          {/* Achievements Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'bg-white border-blue-200 shadow-md cursor-pointer'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  {!achievement.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">
                      {achievement.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {achievement.description}
                    </p>
                    
                    {achievement.unlocked ? (
                      <div className="mt-2 text-xs text-green-600 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Unlocked
                      </div>
                    ) : achievement.progress !== undefined ? (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {Math.round(achievement.progress)}%
                        </span>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Learning Activity
            </h3>
            
            {learningProgress.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No recent activity. Start reading to track your progress!
              </p>
            ) : (
              <div className="space-y-3">
                {learningProgress.slice(0, 5).map((progress, index) => (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">Book Progress</p>
                        <p className="text-sm text-gray-600">
                          {progress.pagesRead}/{progress.totalPages} pages
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Math.round((progress.pagesRead / progress.totalPages) * 100)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(progress.readingTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Weekly Stats */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              This Week's Progress
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">7</p>
                <p className="text-sm text-gray-600">Days Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-sm text-gray-600">Chapters Read</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">45</p>
                <p className="text-sm text-gray-600">New Words</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}