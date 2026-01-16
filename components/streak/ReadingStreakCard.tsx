'use client';

import { useState, useEffect } from 'react';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';

interface ReadingStreakData {
  currentStreak: number;
  longestStreak: number;
  totalReadDays: number;
  lastReadDate: string | null;
  readAlreadyToday: boolean;
}

export default function ReadingStreakCard() {
  const [streakData, setStreakData] = useState<ReadingStreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch('/api/reading-streak');
        if (res.ok) {
          const data = await res.json();
          setStreakData(data);
        }
      } catch (error) {
        console.error('Error fetching reading streak:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-8 bg-white/20 rounded w-1/2 mb-4"></div>
        <div className="h-16 bg-white/20 rounded mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
      </div>
    );
  }

  if (!streakData) {
    return null;
  }

  const getStreakMessage = () => {
    if (streakData.currentStreak === 0) {
      return 'Start reading to begin your streak!';
    }
    if (streakData.readAlreadyToday) {
      return "Great job! You've read today!";
    }
    return 'Read today to keep your streak going!';
  };

  const getFlameColor = () => {
    if (streakData.currentStreak >= 30) return 'text-purple-300';
    if (streakData.currentStreak >= 14) return 'text-yellow-300';
    if (streakData.currentStreak >= 7) return 'text-orange-300';
    return 'text-orange-200';
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Reading Streak</h3>
        <div className={`p-2 bg-white/20 rounded-full ${streakData.readAlreadyToday ? 'animate-pulse' : ''}`}>
          <Flame className={`w-6 h-6 ${getFlameColor()}`} />
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Flame className={`w-10 h-10 ${getFlameColor()} ${streakData.currentStreak > 0 ? 'animate-bounce' : ''}`} />
          <span className="text-5xl font-bold">{streakData.currentStreak}</span>
        </div>
        <p className="text-orange-100 text-sm">{streakData.currentStreak === 1 ? 'day' : 'days'} in a row</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-xl font-bold">{streakData.longestStreak}</span>
          </div>
          <p className="text-xs text-orange-100">Best Streak</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-blue-300" />
            <span className="text-xl font-bold">{streakData.totalReadDays}</span>
          </div>
          <p className="text-xs text-orange-100">Total Days</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-3">
        <TrendingUp className="w-5 h-5 text-green-300" />
        <p className="text-sm">{getStreakMessage()}</p>
      </div>

      {streakData.currentStreak > 0 && (
        <div className="mt-4">
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 7 }, (_, i) => {
              const dayIndex = 6 - i;
              const isActive = dayIndex < streakData.currentStreak;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isActive
                      ? 'bg-white text-orange-600'
                      : 'bg-white/20 text-white/50'
                  }`}
                >
                  {isActive ? <Flame className="w-4 h-4" /> : null}
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-orange-100 mt-2">Last 7 days</p>
        </div>
      )}
    </div>
  );
}
