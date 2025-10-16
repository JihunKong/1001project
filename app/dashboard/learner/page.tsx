'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import {
  BookOpen,
  PlayCircle,
  Clock,
  Award,
  TrendingUp,
  Users,
  MessageCircle,
  Star
} from 'lucide-react';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';

interface ReadingProgress {
  id: string;
  bookId: string;
  book: {
    title: string;
    authorName: string;
    coverImage?: string;
    pageCount?: number;
  };
  percentComplete: number;
  currentPage?: number;
  lastReadAt: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  book: {
    title: string;
    authorName: string;
  };
  dueDate: string;
  status: string;
}

interface Stats {
  booksRead: number;
  totalReadingTime: number;
  currentStreak: number;
  averageRating: number;
  classRanking: number;
  totalClasses: number;
}

export default function LearnerDashboard() {
  const { data: session, status } = useSession();
  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a learner
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'LEARNER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      // These APIs would need to be implemented
      // For now, the API calls are not used - mock data is used instead
      await Promise.all([
        fetch('/api/learner/reading-progress'),
        fetch('/api/learner/assignments'),
        fetch('/api/learner/stats')
      ]);

      // For now, using mock data since APIs don't exist yet
      setReadingProgress([
        {
          id: '1',
          bookId: 'book1',
          book: { title: 'The Amazing Journey', authorName: 'Young Author', pageCount: 120 },
          percentComplete: 65,
          currentPage: 78,
          lastReadAt: new Date().toISOString()
        }
      ]);

      setAssignments([
        {
          id: '1',
          title: 'Read Chapter 5-7',
          description: 'Complete reading and answer discussion questions',
          book: { title: 'The Amazing Journey', authorName: 'Young Author' },
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        }
      ]);

      setStats({
        booksRead: 12,
        totalReadingTime: 1440, // minutes
        currentStreak: 7,
        averageRating: 4.2,
        classRanking: 3,
        totalClasses: 2
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'LEARNER') {
      fetchData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div data-role="learner" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soe-green-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-role="learner" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-soe-green-400 text-white rounded hover:bg-soe-green-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ScrollAnimatedContainer animationType="slideInLeft" className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Learning Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {session?.user?.name}! Keep reading and learning.
              </p>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="slideInRight" delay={200} className="w-full sm:w-auto">
              <button
                onClick={() => window.location.href = '/library'}
                className="w-full sm:w-auto min-h-[var(--min-touch-target)] bg-soe-green-400 hover:bg-soe-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400"
              >
                <BookOpen className="h-5 w-5" />
                Browse Library
              </button>
            </ScrollAnimatedContainer>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <ScrollAnimatedContainer animationType="slideUp" delay={300}>
              <div className="bg-white rounded-lg shadow p-3 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[100px] sm:min-h-auto">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-soe-green-400 mb-2 sm:mb-0" />
                  <div className="sm:ml-4 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Books Read</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.booksRead}</p>
                  </div>
                </div>
              </div>
            </ScrollAnimatedContainer>

            <ScrollAnimatedContainer animationType="slideUp" delay={400}>
              <div className="bg-white rounded-lg shadow p-3 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[100px] sm:min-h-auto">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-success-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Reading Time</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{Math.floor(stats.totalReadingTime / 60)}h</p>
                  </div>
                </div>
              </div>
            </ScrollAnimatedContainer>

            <ScrollAnimatedContainer animationType="slideUp" delay={500}>
              <div className="bg-white rounded-lg shadow p-3 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[100px] sm:min-h-auto">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-soe-green-400 mb-2 sm:mb-0" />
                  <div className="sm:ml-4 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Reading Streak</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
                  </div>
                </div>
              </div>
            </ScrollAnimatedContainer>

            <ScrollAnimatedContainer animationType="slideUp" delay={600}>
              <div className="bg-white rounded-lg shadow p-3 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[100px] sm:min-h-auto">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-warning-600 mb-2 sm:mb-0" />
                  <div className="sm:ml-4 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Class Rank</p>
                    <p className="text-base sm:text-lg font-bold text-gray-900">#{stats.classRanking}</p>
                  </div>
                </div>
              </div>
            </ScrollAnimatedContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Continue Reading */}
          <ScrollAnimatedContainer animationType="slideInLeft" delay={700}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Continue Reading</h2>
              </div>
            <div className="p-4 sm:p-6">
              {readingProgress.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No books in progress</p>
                  <p className="text-sm text-gray-400">Start reading a book assigned by your teacher</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {readingProgress.map((progress) => (
                    <div key={progress.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{progress.book.title}</h3>
                        <span className="text-sm text-gray-500">{progress.percentComplete}%</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">by {progress.book.authorName}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                          <div
                            className="bg-soe-green-400 h-2 rounded-full"
                            style={{ width: `${progress.percentComplete}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          Page {progress.currentPage} of {progress.book.pageCount}
                        </span>
                      </div>
                      <button className="w-full min-h-[var(--min-touch-target)] bg-soe-green-400 hover:bg-soe-green-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400">
                        <PlayCircle className="h-4 w-4" />
                        Continue Reading
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </ScrollAnimatedContainer>

          {/* Assignments */}
          <ScrollAnimatedContainer animationType="slideInRight" delay={800}>
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Upcoming Assignments</h2>
              </div>
            <div className="p-4 sm:p-6">
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments</p>
                  <p className="text-sm text-gray-400">Your teacher will assign reading tasks here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          assignment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{assignment.book.title}</p>
                      <p className="text-sm text-gray-500 mb-3">{assignment.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <button className="text-soe-green-400 hover:text-soe-green-600 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </ScrollAnimatedContainer>
        </div>

        {/* Quick Actions */}
        <ScrollAnimatedContainer animationType="slideUp" delay={900}>
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">Quick Actions</h2>
            </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <ScrollAnimatedContainer animationType="slideUp" delay={1000}>
                <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-soe-green-400 min-h-[var(--min-touch-target)]">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-soe-green-400 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Join Book Club</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Discuss books with classmates</p>
                  </div>
                </button>
              </ScrollAnimatedContainer>

              <ScrollAnimatedContainer animationType="slideUp" delay={1100}>
                <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-success-500 min-h-[var(--min-touch-target)]">
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success-600 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Ask AI Helper</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Get help with difficult words</p>
                  </div>
                </button>
              </ScrollAnimatedContainer>

              <ScrollAnimatedContainer animationType="slideUp" delay={1200}>
                <button className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 min-h-[var(--min-touch-target)]">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning-600 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Rate Books</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">Share your thoughts</p>
                  </div>
                </button>
              </ScrollAnimatedContainer>
            </div>
          </div>
        </div>
          </ScrollAnimatedContainer>
      </div>
    </div>
  );
}