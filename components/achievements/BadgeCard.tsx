'use client';

import { useState } from 'react';
import {
  Trophy,
  BookOpen,
  GraduationCap,
  Flame,
  Star,
  Target,
  Award,
  Sparkles,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { AchievementCategory } from '@prisma/client';

interface BadgeCardProps {
  achievement: {
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
  };
}

const categoryIcons: Record<AchievementCategory, typeof Trophy> = {
  WRITING: Sparkles,
  READING: BookOpen,
  COMMUNITY: Award,
  MILESTONE: Trophy,
  TEACHING: GraduationCap,
  LEARNING: Target,
};

const categoryColors: Record<AchievementCategory, string> = {
  WRITING: 'from-purple-500 to-pink-500',
  READING: 'from-blue-500 to-cyan-500',
  COMMUNITY: 'from-green-500 to-emerald-500',
  MILESTONE: 'from-yellow-500 to-orange-500',
  TEACHING: 'from-indigo-500 to-purple-500',
  LEARNING: 'from-teal-500 to-green-500',
};

const achievementNames: Record<string, string> = {
  first_book: 'First Steps',
  bookworm_5: 'Bookworm',
  avid_reader_10: 'Avid Reader',
  bibliophile_25: 'Bibliophile',
  master_reader_50: 'Master Reader',
  streak_3: 'Getting Started',
  streak_7: 'Week Warrior',
  streak_14: 'Dedicated Reader',
  streak_30: 'Reading Champion',
  streak_100: 'Reading Legend',
  first_word: 'Word Collector',
  vocab_10: 'Vocabulary Builder',
  vocab_50: 'Word Expert',
  vocab_100: 'Lexicon Master',
  mastery_5: 'Quick Learner',
  mastery_25: 'Word Wizard',
  first_quiz: 'Quiz Starter',
  quiz_5: 'Quiz Enthusiast',
  quiz_10: 'Quiz Master',
  perfect_quiz: 'Perfect Score',
  perfect_5: 'Perfectionist',
};

const achievementDescs: Record<string, string> = {
  first_book: 'Complete your first book',
  bookworm_5: 'Read 5 books',
  avid_reader_10: 'Read 10 books',
  bibliophile_25: 'Read 25 books',
  master_reader_50: 'Read 50 books',
  streak_3: 'Maintain a 3-day reading streak',
  streak_7: 'Maintain a 7-day reading streak',
  streak_14: 'Maintain a 14-day reading streak',
  streak_30: 'Maintain a 30-day reading streak',
  streak_100: 'Maintain a 100-day reading streak',
  first_word: 'Save your first vocabulary word',
  vocab_10: 'Save 10 vocabulary words',
  vocab_50: 'Save 50 vocabulary words',
  vocab_100: 'Save 100 vocabulary words',
  mastery_5: 'Master 5 vocabulary words',
  mastery_25: 'Master 25 vocabulary words',
  first_quiz: 'Pass your first quiz',
  quiz_5: 'Pass 5 quizzes',
  quiz_10: 'Pass 10 quizzes',
  perfect_quiz: 'Get a perfect score on a quiz',
  perfect_5: 'Get 5 perfect quiz scores',
};

export default function BadgeCard({ achievement }: BadgeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const IconComponent = categoryIcons[achievement.category] || Trophy;
  const gradientColor = categoryColors[achievement.category];

  const displayName = achievementNames[achievement.key] || achievement.nameKey;
  const displayDesc = achievementDescs[achievement.key] || achievement.descKey;

  const progressPercent = achievement.progress
    ? Math.min((achievement.progress.current / achievement.progress.target) * 100, 100)
    : 0;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer ${
        achievement.isUnlocked
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg hover:shadow-xl'
          : 'border-gray-200 bg-gray-50 opacity-75 hover:opacity-100'
      }`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {achievement.isUnlocked && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle2 className="w-6 h-6 text-green-500 fill-white" />
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            achievement.isUnlocked
              ? `bg-gradient-to-br ${gradientColor}`
              : 'bg-gray-300'
          }`}
        >
          {achievement.isUnlocked ? (
            <IconComponent className="w-8 h-8 text-white" />
          ) : (
            <Lock className="w-8 h-8 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold truncate ${
                achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {displayName}
            </h3>
            {achievement.points > 0 && (
              <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" />
                {achievement.points}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{displayDesc}</p>

          {!achievement.isUnlocked && achievement.progress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>
                  {achievement.progress.current} / {achievement.progress.target}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${gradientColor} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {achievement.isUnlocked && achievement.earnedAt && (
            <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Earned {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Category</div>
            <div className="font-medium capitalize">
              {achievement.category.toLowerCase().replace('_', ' ')}
            </div>
            <div className="text-gray-500">Status</div>
            <div
              className={`font-medium ${
                achievement.isUnlocked ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {achievement.isUnlocked ? 'Unlocked' : 'Locked'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
