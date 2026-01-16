'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  BookOpen,
  Flame,
  Brain,
  Target,
  Star,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AchievementCategory } from '@prisma/client';
import BadgeCard from '@/components/achievements/BadgeCard';
import AchievementNotification from '@/components/achievements/AchievementNotification';

interface Achievement {
  id: string;
  key: string;
  nameKey: string;
  descKey: string;
  iconUrl?: string | null;
  category: AchievementCategory;
  points: number;
  isUnlocked: boolean;
  earnedAt?: string | null;
  progress?: {
    current: number;
    target: number;
  } | null;
}

interface Stats {
  booksRead: number;
  vocabularyCount: number;
  quizzesPassed: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
}

interface Summary {
  total: number;
  unlocked: number;
  locked: number;
}

const categoryFilters = [
  { key: 'all', label: 'All', icon: Trophy },
  { key: 'READING', label: 'Reading', icon: BookOpen },
  { key: 'LEARNING', label: 'Learning', icon: Brain },
  { key: 'MILESTONE', label: 'Milestones', icon: Target },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/achievements?check=true');

      if (!res.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await res.json();

      if (data.newAchievements && data.newAchievements.length > 0) {
        setNewAchievements(data.newAchievements);
        const refreshRes = await fetch('/api/achievements');
        const refreshData = await refreshRes.json();
        setAchievements(refreshData.achievements);
        setStats(refreshData.stats);
        setSummary(refreshData.summary);
      } else {
        setAchievements(data.achievements);
        setStats(data.stats);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedFirst = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchAchievements()}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {newAchievements.length > 0 && (
        <AchievementNotification
          achievements={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}

      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/dashboard/learner"
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Achievements</h1>
              <p className="text-white/80">Track your progress and earn badges</p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.booksRead}</span>
                </div>
                <p className="text-sm text-white/80">Books Read</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.currentStreak}</span>
                </div>
                <p className="text-sm text-white/80">Day Streak</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.vocabularyCount}</span>
                </div>
                <p className="text-sm text-white/80">Words Learned</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5" />
                  <span className="text-2xl font-bold">{stats.totalPoints}</span>
                </div>
                <p className="text-sm text-white/80">Total Points</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {summary && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Badges Collected</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary.unlocked} / {summary.total}
                  </p>
                </div>
              </div>
              <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{
                    width: `${(summary.unlocked / summary.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {categoryFilters.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? 'bg-yellow-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-yellow-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {unlockedFirst.map((achievement) => (
            <BadgeCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
