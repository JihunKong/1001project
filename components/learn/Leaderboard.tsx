'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown,
  TrendingUp,
  User,
  Star,
  Flame,
  BookOpen,
  Target,
  Award
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning-store';
import { getLeaderboard } from '@/lib/api/learning-api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  totalXp: number;
  level: number;
  streak: number;
  badges: string[];
  booksCompleted: number;
  wordsLearned: number;
  quizzesTaken: number;
  averageQuizScore: number;
}

interface LeaderboardProps {
  period?: 'all' | 'monthly' | 'weekly';
}

export function Leaderboard({ period: initialPeriod = 'all' }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [period, setPeriod] = useState(initialPeriod);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  
  const { userStats } = useLearningStore();

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await getLeaderboard(period, 10);
      if (response.success && response.data) {
        setLeaderboard(response.data.leaderboard);
        setCurrentUserRank(response.data.currentUserRank);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300';
    return 'bg-white border-gray-200';
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Trophy className="w-10 h-10 text-yellow-500" />
          <h2 className="text-3xl font-bold text-gray-900">Leaderboard</h2>
        </div>
        <p className="text-gray-600">
          Compete with learners worldwide and climb the ranks!
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          {(['all', 'monthly', 'weekly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'all' ? 'All Time' : p === 'monthly' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Rank */}
      {currentUserRank && userStats && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                #{currentUserRank}
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Rank</p>
                <p className="text-xl font-bold text-gray-900">
                  Level {userStats.level} • {formatXP(userStats.totalXp)} XP
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <Flame className="w-5 h-5 text-orange-500 mx-auto" />
                <span className="text-gray-600">{userStats.streak} day</span>
              </div>
              <div className="text-center">
                <BookOpen className="w-5 h-5 text-green-500 mx-auto" />
                <span className="text-gray-600">{userStats.booksCompleted}</span>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 text-purple-500 mx-auto" />
                <span className="text-gray-600">{userStats.averageQuizScore}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all cursor-pointer ${
                getRankColor(entry.rank)
              }`}
              onClick={() => setSelectedUser(entry)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    {entry.user.image ? (
                      <img
                        src={entry.user.image}
                        alt={entry.user.name || ''}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(entry.user.name || entry.user.email || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.user.name || 'Anonymous Learner'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Level {entry.level} • {formatXP(entry.totalXp)} XP
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-800">{entry.streak}</span>
                    </div>
                    <span className="text-xs text-gray-500">Streak</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-gray-800">{entry.booksCompleted}</span>
                    </div>
                    <span className="text-xs text-gray-500">Books</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-gray-800">{entry.wordsLearned}</span>
                    </div>
                    <span className="text-xs text-gray-500">Words</span>
                  </div>
                </div>
              </div>
              
              {/* Badges */}
              {entry.badges && entry.badges.length > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-gray-400" />
                  <div className="flex space-x-1">
                    {entry.badges.slice(0, 5).map((badge, i) => (
                      <span key={i} className="text-lg">{badge}</span>
                    ))}
                    {entry.badges.length > 5 && (
                      <span className="text-sm text-gray-500">+{entry.badges.length - 5}</span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {selectedUser.user.image ? (
                  <img
                    src={selectedUser.user.image}
                    alt={selectedUser.user.name || ''}
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                    {(selectedUser.user.name || selectedUser.user.email || '?')[0].toUpperCase()}
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedUser.user.name || 'Anonymous Learner'}
                </h3>
                <p className="text-gray-600 mb-4">
                  Rank #{selectedUser.rank} • Level {selectedUser.level}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatXP(selectedUser.totalXp)}
                    </p>
                    <p className="text-sm text-gray-600">Total XP</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-orange-500">
                      {selectedUser.streak}
                    </p>
                    <p className="text-sm text-gray-600">Day Streak</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-500">
                      {selectedUser.booksCompleted}
                    </p>
                    <p className="text-sm text-gray-600">Books Read</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-500">
                      {selectedUser.wordsLearned}
                    </p>
                    <p className="text-sm text-gray-600">Words Learned</p>
                  </div>
                </div>
                
                {selectedUser.badges && selectedUser.badges.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Achievements</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedUser.badges.map((badge, i) => (
                        <span key={i} className="text-2xl">{badge}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}