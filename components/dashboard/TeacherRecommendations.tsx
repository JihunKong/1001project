'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Star,
  ChevronRight,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  readingLevel: string;
  category: string[];
  reason: string;
  teacherName: string;
  priority: 'high' | 'medium' | 'low';
  estimatedReadingTime?: number;
  rating?: number;
}

export default function TeacherRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/learn/recommendations');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRecommendations(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'a1':
      case 'a2':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
      case 'b1':
      case 'b2':
        return 'bg-blue-100 text-blue-700';
      case 'advanced':
      case 'c1':
      case 'c2':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Use actual recommendations from API, no fallback data
  const displayRecommendations = recommendations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Recommended by Your Teacher
            </h2>
          </div>
          <Link 
            href="/library/recommendations" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayRecommendations.slice(0, 4).map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
            >
              <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900 text-sm truncate pr-2">
                    {book.title}
                  </h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(book.priority)}`}>
                    {book.priority === 'high' ? '!' : book.priority === 'medium' ? '!!' : ''}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mt-0.5">by {book.author}</p>
                
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getLevelColor(book.readingLevel)}`}>
                    {book.readingLevel}
                  </span>
                  {book.estimatedReadingTime && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-0.5" />
                      {book.estimatedReadingTime} min
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                  "{book.reason}"
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    - {book.teacherName}
                  </span>
                  <Link
                    href={`/learn/read/${book.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                  >
                    Start Reading <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {displayRecommendations.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recommendations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your teacher will recommend books for you here
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}