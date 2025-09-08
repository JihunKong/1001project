'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Brain,
  Globe,
  Award,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  author: string;
  level: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'challenge';
  estimatedReadTime: number;
  reason?: string;
  progress?: number;
  type: 'story' | 'book' | 'material';
}

export default function UnifiedLearnPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'recommended' | 'library' | 'assignments' | 'progress'>('recommended');
  const [recommendations, setRecommendations] = useState<Material[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    level: 'Intermediate',
    storiesRead: 0,
    wordsLearned: 0,
    timeSpent: 0,
    currentStreak: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?callbackUrl=/learn');
      return;
    }

    // Only allow students/learners to access this page
    const userRole = session.user?.role;
    if (userRole === 'TEACHER') {
      router.push('/teach');
      return;
    }
    
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch recommendations
      const recResponse = await fetch('/api/learn/recommendations');
      if (recResponse.ok) {
        const recData = await recResponse.json();
        setRecommendations(recData.recommendations || []);
      }
      
      // Fetch all materials
      const matResponse = await fetch('/api/education/materials');
      if (matResponse.ok) {
        const matData = await matResponse.json();
        setAllMaterials(matData.materials || []);
      }
      
      // Fetch user progress
      const progressResponse = await fetch('/api/learn/progress');
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserStats(progressData.stats || userStats);
      }
      
      // Fetch assignments (if student has a teacher)
      const assignResponse = await fetch('/api/learn/assignments');
      if (assignResponse.ok) {
        const assignData = await assignResponse.json();
        setAssignments(assignData.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials based on search and difficulty
  useEffect(() => {
    let filtered = [...allMaterials];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(material => 
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by difficulty
    if (selectedDifficulty && selectedDifficulty !== 'all') {
      filtered = filtered.filter(material => 
        material.difficulty === selectedDifficulty
      );
    }
    
    setFilteredMaterials(filtered);
  }, [searchQuery, selectedDifficulty, allMaterials]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'challenge': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with User Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome back, {session?.user?.name || 'Learner'}!
                </h1>
                <p className="text-gray-600">
                  Your personalized learning journey continues here
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-semibold">
                    Level: {userStats.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">{userStats.storiesRead}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Stories Read</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Brain className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">{userStats.wordsLearned}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Words Learned</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <Clock className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{Math.floor(userStats.timeSpent / 60)}h</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Time Spent</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">{userStats.currentStreak}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Day Streak</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="flex flex-wrap border-b">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'recommended'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span>For You</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('library')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>All Materials</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Target className="w-5 h-5 mr-2" />
                  <span>Assignments</span>
                  {assignments.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      {assignments.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'progress'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  <span>Progress</span>
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* For You Tab */}
                {activeTab === 'recommended' && (
                  <motion.div
                    key="for-you"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Recommended For You
                    </h2>
                    {recommendations.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recommendations.map((material) => (
                          <div key={material.id}>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-800 flex-1">
                                  {material.title}
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(material.difficulty)}`}>
                                  {material.difficulty}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                by {material.author}
                              </p>
                              {material.reason && (
                                <p className="text-xs text-blue-600 mb-2">
                                  ✨ {material.reason}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {material.estimatedReadTime} min
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {material.type}
                                </span>
                              </div>
                              {material.progress !== undefined && material.progress > 0 && (
                                <div className="mt-2 mb-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${material.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Link
                                  href={`/books/${material.id}/read`}
                                  className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Start Reading
                                </Link>
                                <Link
                                  href={`/library/books/${material.id}`}
                                  className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                  View in Library
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Loading your personalized recommendations...</p>
                        <p className="text-sm mt-2">We're finding the perfect books for your level!</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* All Materials Tab - Same interface as For You but with Search */}
                {activeTab === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        All Materials
                      </h2>
                      
                      {/* Search and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1 lg:w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Search by title, author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* Difficulty Filter */}
                        <select
                          value={selectedDifficulty}
                          onChange={(e) => setSelectedDifficulty(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="all">All Levels</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="challenge">Challenge</option>
                        </select>
                      </div>
                    </div>
                    
                    {filteredMaterials.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMaterials.map((material) => (
                          <div key={material.id}>
                            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-800 flex-1">
                                  {material.title}
                                </h3>
                                <span className={`px-2 py-1 text-xs rounded ${getDifficultyColor(material.difficulty)}`}>
                                  {material.difficulty}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                by {material.author}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {material.estimatedReadTime} min
                                </span>
                                <span className="flex items-center">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  {material.type}
                                </span>
                              </div>
                              {material.progress !== undefined && material.progress > 0 && (
                                <div className="mt-2 mb-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${material.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <Link
                                  href={`/books/${material.id}/read`}
                                  className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Start Reading
                                </Link>
                                <Link
                                  href={`/library/books/${material.id}`}
                                  className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                  View in Library
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>{searchQuery ? 'No books found matching your search.' : 'Loading materials...'}</p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <motion.div
                    key="assignments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Your Assignments
                    </h2>
                    {assignments.length > 0 ? (
                      <div className="space-y-3">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {assignment.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <Link
                                href={`/learn/assignment/${assignment.id}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Start
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No assignments yet.</p>
                        <p className="text-sm mt-2">Your teacher will assign work here.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Your Learning Progress
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Reading Progress</span>
                            <span className="text-sm text-gray-600">{userStats.storiesRead} stories</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-600 h-3 rounded-full"
                              style={{ width: `${Math.min((userStats.storiesRead / 100) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Vocabulary</span>
                            <span className="text-sm text-gray-600">{userStats.wordsLearned} words</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-purple-600 h-3 rounded-full"
                              style={{ width: `${Math.min((userStats.wordsLearned / 2000) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Daily Goal</span>
                            <span className="text-sm text-gray-600">{userStats.currentStreak} day streak</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-600 h-3 rounded-full"
                              style={{ width: `${Math.min((userStats.currentStreak / 30) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/library"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Browse Library</h3>
                  <p className="text-sm text-gray-600">Explore all available books</p>
                </div>
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
            </Link>
            <Link
              href="/learn/ai-tutor"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">AI Tutor</h3>
                  <p className="text-sm text-gray-600">Get help with vocabulary</p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </Link>
            <Link
              href="/learn/achievements"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Achievements</h3>
                  <p className="text-sm text-gray-600">View your badges</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}