'use client';

import { useEffect, useState } from 'react';
import { X, Trophy, Star, Sparkles } from 'lucide-react';
import { AchievementCategory } from '@prisma/client';

interface Achievement {
  id: string;
  key: string;
  nameKey: string;
  descKey: string;
  category: AchievementCategory;
  points: number;
}

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
}

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

export default function AchievementNotification({
  achievements,
  onClose,
}: AchievementNotificationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const current = achievements[currentIndex];
  if (!current) return null;

  const displayName = achievementNames[current.key] || current.nameKey;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 pt-8 pb-12 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-white animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${12 + Math.random() * 12}px`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative">
            <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Achievement Unlocked!
            </h2>
            <p className="text-white/90">
              {achievements.length > 1
                ? `${currentIndex + 1} of ${achievements.length}`
                : 'Congratulations!'}
            </p>
          </div>
        </div>

        <div className="p-6 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center mb-4 -mt-14 border-4 border-white shadow-lg">
            <Trophy className="w-10 h-10 text-yellow-600" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{displayName}</h3>

          {current.points > 0 && (
            <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              +{current.points} points
            </div>
          )}

          <p className="text-gray-600 mb-6">
            {current.category === 'READING' && 'Keep reading to earn more badges!'}
            {current.category === 'LEARNING' && 'Your learning journey continues!'}
            {current.category === 'MILESTONE' && "You've reached a milestone!"}
            {current.category === 'WRITING' && 'Your creativity is blossoming!'}
            {current.category === 'COMMUNITY' && 'Thank you for being part of our community!'}
            {current.category === 'TEACHING' && 'Your teaching makes a difference!'}
          </p>

          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
          >
            {currentIndex < achievements.length - 1 ? 'Next Badge' : 'Awesome!'}
          </button>
        </div>
      </div>
    </div>
  );
}
