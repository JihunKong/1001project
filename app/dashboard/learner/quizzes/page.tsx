'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Trophy, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface QuizBook {
  id: string;
  title: string;
  coverImage?: string;
  quiz?: {
    id: string;
    title: string;
    passingScore: number;
    timeLimit?: number;
  };
  userStats?: {
    attemptCount: number;
    bestScore: number | null;
    passed: boolean;
  };
}

export default function QuizzesPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<QuizBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    passedCount: 0,
    passRate: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'LEARNER') {
      redirect('/dashboard');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, attemptsRes] = await Promise.all([
          fetch('/api/book-assignments'),
          fetch('/api/quizzes/attempts'),
        ]);

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json();
          const assignedBooks = assignmentsData.assignments || [];

          const booksWithQuizzes = await Promise.all(
            assignedBooks.map(async (assignment: { bookId: string; bookTitle: string; coverImage?: string }) => {
              try {
                const quizRes = await fetch(`/api/quizzes/${assignment.bookId}`);
                if (quizRes.ok) {
                  const quizData = await quizRes.json();
                  return {
                    id: assignment.bookId,
                    title: assignment.bookTitle,
                    coverImage: assignment.coverImage,
                    quiz: quizData.quiz,
                    userStats: quizData.userStats,
                  };
                }
              } catch {
                // Quiz not found for this book
              }
              return {
                id: assignment.bookId,
                title: assignment.bookTitle,
                coverImage: assignment.coverImage,
                quiz: null,
                userStats: null,
              };
            })
          );

          setBooks(booksWithQuizzes.filter((b: QuizBook) => b.quiz !== null));
        }

        if (attemptsRes.ok) {
          const attemptsData = await attemptsRes.json();
          setOverallStats(attemptsData.stats);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/dashboard/learner'}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.learner.quizzes.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('dashboard.learner.quizzes.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.quizzes.stats.totalAttempts')}</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalAttempts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.quizzes.stats.averageScore')}</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.averageScore}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.quizzes.stats.passed')}</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.passedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.quizzes.stats.passRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.passRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{t('dashboard.learner.quizzes.availableQuizzes')}</h2>
          </div>
          <div className="p-6">
            {books.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('dashboard.learner.quizzes.noQuizzes')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('dashboard.learner.quizzes.noQuizzesDesc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map((book) => (
                  <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
                        {book.quiz && (
                          <p className="text-sm text-gray-500 mt-1">
                            {t('dashboard.learner.quizzes.passingScore', { score: book.quiz.passingScore })}
                          </p>
                        )}
                        {book.userStats && book.userStats.attemptCount > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {book.userStats.passed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                <CheckCircle className="h-3 w-3" />
                                {t('dashboard.learner.quizzes.passed')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                <XCircle className="h-3 w-3" />
                                {t('dashboard.learner.quizzes.notPassed')}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {t('dashboard.learner.quizzes.bestScore', { score: book.userStats.bestScore })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = `/dashboard/learner/quiz/${book.id}`}
                      className="w-full mt-4 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      {book.userStats && book.userStats.attemptCount > 0
                        ? t('dashboard.learner.quizzes.retakeQuiz')
                        : t('dashboard.learner.quizzes.startQuiz')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
