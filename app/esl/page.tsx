'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Search, 
  Filter,
  Clock,
  User,
  Globe,
  Star,
  Play,
  ArrowRight,
  GraduationCap,
  Languages,
  MessageSquare,
  Award
} from 'lucide-react';

interface TextStory {
  id: string;
  title: string;
  authorName: string;
  authorAge?: number;
  authorLocation?: string;
  language: string;
  readingLevel?: string;
  category: string[];
  tags: string[];
  content: string;
  summary?: string;
  estimatedReadingTime: number;
  wordCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface FilterOptions {
  language: string;
  difficulty: string;
  category: string;
  readingTime: string;
}

export default function ESLStoriesPage() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<TextStory[]>([]);
  const [filteredStories, setFilteredStories] = useState<TextStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    language: 'all',
    difficulty: 'all',
    category: 'all',
    readingTime: 'all'
  });

  useEffect(() => {
    fetchTextStories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stories, searchTerm, filters]);

  const fetchTextStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/esl/text-stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching text stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = stories;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(story => 
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Difficulty filter
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(story => story.difficulty === filters.difficulty);
    }

    // Language filter
    if (filters.language !== 'all') {
      filtered = filtered.filter(story => story.language === filters.language);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(story => story.category.includes(filters.category));
    }

    // Reading time filter
    if (filters.readingTime !== 'all') {
      const maxTime = parseInt(filters.readingTime);
      filtered = filtered.filter(story => story.estimatedReadingTime <= maxTime);
    }

    setFilteredStories(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ESL stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Languages className="w-8 h-8 text-blue-600" />
                ESL Text Stories
              </h1>
              <p className="text-gray-600 mt-2">
                Learn English through engaging stories with interactive features
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                <span className="font-medium">{filteredStories.length}</span> stories available
              </div>
              {session && (
                <Link
                  href="/programs/esl"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  ESL Program
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stories, authors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={filters.readingTime}
                onChange={(e) => setFilters(prev => ({ ...prev, readingTime: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Any Length</option>
                <option value="5">Under 5 min</option>
                <option value="10">Under 10 min</option>
                <option value="20">Under 20 min</option>
              </select>

              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-600">
              {searchTerm || Object.values(filters).some(f => f !== 'all') 
                ? 'Try adjusting your search or filters'
                : 'Check back later for new stories'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {story.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4" />
                        <span>{story.authorName}</span>
                        {story.authorAge && <span>({story.authorAge})</span>}
                      </div>
                      {story.authorLocation && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{story.authorLocation}</span>
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(story.difficulty)}`}>
                      {story.difficulty.charAt(0).toUpperCase() + story.difficulty.slice(1)}
                    </div>
                  </div>

                  {/* Summary */}
                  {story.summary && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {story.summary}
                    </p>
                  )}

                  {/* Tags */}
                  {story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {story.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {story.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                          +{story.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{story.estimatedReadingTime} min read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{story.wordCount} words</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/esl/story/${story.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Reading
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Educational Features Callout */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Enhanced Learning Features
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              Each story comes with interactive features to enhance your English learning experience
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Word Explanations</h3>
                <p className="text-blue-100 text-sm">
                  Click any word for instant definitions and pronunciation
                </p>
              </div>
              <div className="text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Difficulty Adjustment</h3>
                <p className="text-blue-100 text-sm">
                  Adapt text complexity to match your reading level
                </p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">AI Learning Assistant</h3>
                <p className="text-blue-100 text-sm">
                  Get help with comprehension and vocabulary questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}