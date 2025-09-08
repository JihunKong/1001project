'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Star, 
  Award,
  Target,
  Zap,
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Medal,
  Crown,
  Sparkles,
  Lock,
  Check,
  ArrowLeft,
  Shield,
  Gem,
  Heart,
  Globe,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'reading' | 'vocabulary' | 'streak' | 'quiz' | 'special';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  badge?: string;
}

interface UserStats {
  totalPoints: number;
  level: number;
  rank: string;
  unlockedCount: number;
  totalAchievements: number;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPoints: 1250,
    level: 5,
    rank: 'Knowledge Seeker',
    unlockedCount: 12,
    totalAchievements: 30
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role === 'TEACHER') {
      router.push('/learn');
    }
  }, [session, status, router]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    // Simulated achievements data
    const mockAchievements: Achievement[] = [
      // Reading Achievements
      {
        id: '1',
        title: 'First Steps',
        description: 'Read your first story',
        icon: BookOpen,
        category: 'reading',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: new Date('2024-01-15'),
        points: 10,
        rarity: 'common'
      },
      {
        id: '2',
        title: 'Bookworm',
        description: 'Read 10 stories',
        icon: BookOpen,
        category: 'reading',
        progress: 7,
        maxProgress: 10,
        unlocked: false,
        points: 50,
        rarity: 'common'
      },
      {
        id: '3',
        title: 'Literature Master',
        description: 'Read 50 stories',
        icon: Crown,
        category: 'reading',
        progress: 7,
        maxProgress: 50,
        unlocked: false,
        points: 200,
        rarity: 'epic'
      },
      
      // Vocabulary Achievements
      {
        id: '4',
        title: 'Word Collector',
        description: 'Learn 50 new words',
        icon: Brain,
        category: 'vocabulary',
        progress: 50,
        maxProgress: 50,
        unlocked: true,
        unlockedAt: new Date('2024-02-01'),
        points: 30,
        rarity: 'common'
      },
      {
        id: '5',
        title: 'Vocabulary Expert',
        description: 'Learn 200 new words',
        icon: Gem,
        category: 'vocabulary',
        progress: 150,
        maxProgress: 200,
        unlocked: false,
        points: 100,
        rarity: 'rare'
      },
      {
        id: '6',
        title: 'Dictionary Master',
        description: 'Learn 1000 new words',
        icon: Shield,
        category: 'vocabulary',
        progress: 150,
        maxProgress: 1000,
        unlocked: false,
        points: 500,
        rarity: 'legendary'
      },
      
      // Streak Achievements
      {
        id: '7',
        title: 'Getting Started',
        description: 'Maintain a 3-day streak',
        icon: Flame,
        category: 'streak',
        progress: 3,
        maxProgress: 3,
        unlocked: true,
        unlockedAt: new Date('2024-01-20'),
        points: 20,
        rarity: 'common'
      },
      {
        id: '8',
        title: 'Dedicated Learner',
        description: 'Maintain a 7-day streak',
        icon: TrendingUp,
        category: 'streak',
        progress: 5,
        maxProgress: 7,
        unlocked: false,
        points: 50,
        rarity: 'common'
      },
      {
        id: '9',
        title: 'Unstoppable',
        description: 'Maintain a 30-day streak',
        icon: Zap,
        category: 'streak',
        progress: 5,
        maxProgress: 30,
        unlocked: false,
        points: 200,
        rarity: 'epic'
      },
      
      // Quiz Achievements
      {
        id: '10',
        title: 'Quiz Starter',
        description: 'Complete your first quiz',
        icon: Target,
        category: 'quiz',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: new Date('2024-01-18'),
        points: 15,
        rarity: 'common'
      },
      {
        id: '11',
        title: 'Perfect Score',
        description: 'Get 100% on a quiz',
        icon: Star,
        category: 'quiz',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: new Date('2024-01-25'),
        points: 40,
        rarity: 'rare'
      },
      {
        id: '12',
        title: 'Quiz Champion',
        description: 'Complete 50 quizzes',
        icon: Trophy,
        category: 'quiz',
        progress: 23,
        maxProgress: 50,
        unlocked: false,
        points: 150,
        rarity: 'rare'
      },
      
      // Special Achievements
      {
        id: '13',
        title: 'Early Bird',
        description: 'Study before 7 AM',
        icon: Clock,
        category: 'special',
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: new Date('2024-01-10'),
        points: 25,
        rarity: 'rare'
      },
      {
        id: '14',
        title: 'Night Owl',
        description: 'Study after 10 PM',
        icon: Medal,
        category: 'special',
        progress: 0,
        maxProgress: 1,
        unlocked: false,
        points: 25,
        rarity: 'rare'
      },
      {
        id: '15',
        title: 'Global Learner',
        description: 'Read stories from 5 different countries',
        icon: Globe,
        category: 'special',
        progress: 3,
        maxProgress: 5,
        unlocked: false,
        points: 75,
        rarity: 'epic'
      }
    ];

    setAchievements(mockAchievements);
    setLoading(false);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-300';
    }
  };

  const categories = [
    { id: 'all', label: 'All', icon: Award },
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'vocabulary', label: 'Vocabulary', icon: Brain },
    { id: 'streak', label: 'Streaks', icon: Flame },
    { id: 'quiz', label: 'Quizzes', icon: Target },
    { id: 'special', label: 'Special', icon: Sparkles }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getLevelProgress = () => {
    const currentLevelPoints = userStats.level * 200;
    const nextLevelPoints = (userStats.level + 1) * 200;
    const progress = ((userStats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/learn"
              className="inline-flex items-center text-purple-600 hover:text-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Learning
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Achievements</h1>
              <p className="text-lg text-gray-600 mb-4">{userStats.rank}</p>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="bg-purple-50 rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold text-purple-600">{userStats.totalPoints}</span>
                  <span className="text-sm text-gray-600 ml-1">points</span>
                </div>
                <div className="bg-blue-50 rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold text-blue-600">Level {userStats.level}</span>
                </div>
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <span className="text-2xl font-bold text-green-600">{userStats.unlockedCount}/{userStats.totalAchievements}</span>
                  <span className="text-sm text-gray-600 ml-1">unlocked</span>
                </div>
              </div>
              
              {/* Level Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Level {userStats.level}</span>
                  <span>Level {userStats.level + 1}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getLevelProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-4 mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg shadow-lg p-6 border-2 ${
                  achievement.unlocked ? getRarityBorder(achievement.rarity) : 'border-gray-200'
                } ${!achievement.unlocked ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    achievement.unlocked 
                      ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                      : 'bg-gray-200'
                  }`}>
                    {achievement.unlocked ? (
                      <achievement.icon className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-bold text-gray-700">+{achievement.points}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        achievement.unlocked 
                          ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}`
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Unlocked Date */}
                {achievement.unlocked && achievement.unlockedAt && (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Unlocked</span>
                    <span>{achievement.unlockedAt.toLocaleDateString()}</span>
                  </div>
                )}

                {/* Rarity Badge */}
                <div className="mt-3 flex justify-end">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    achievement.rarity === 'common' ? 'bg-gray-100 text-gray-600' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-600' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No achievements in this category yet.</p>
            <p className="text-sm text-gray-400 mt-2">Keep learning to unlock more!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}