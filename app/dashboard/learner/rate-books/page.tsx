'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, Star, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Book {
  id: string;
  title: string;
  coverImage?: string;
  authorName: string;
  rating?: number;
  userRating?: number;
  userReview?: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
  };
}

interface RatingModalProps {
  book: Book;
  onClose: () => void;
  onSave: (rating: number, title?: string, comment?: string) => void;
}

function RatingModal({ book, onClose, onSave }: RatingModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(book.userReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState(book.userReview?.title || '');
  const [comment, setComment] = useState(book.userReview?.comment || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSaving(true);
    await onSave(rating, title || undefined, comment || undefined);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.learner.rateBooks.rateTitle')}</h3>
        <p className="text-gray-600 mb-4">{book.title}</p>

        <div className="flex justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.learner.rateBooks.reviewTitle')} ({t('dashboard.common.optional')})
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('dashboard.learner.rateBooks.titlePlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.learner.rateBooks.review')} ({t('dashboard.common.optional')})
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('dashboard.learner.rateBooks.commentPlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('dashboard.common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || saving}
            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            {saving ? t('dashboard.common.saving') : t('dashboard.common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RateBooksPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

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
    const fetchBooks = async () => {
      try {
        const res = await fetch('/api/book-assignments');
        if (res.ok) {
          const data = await res.json();
          const assignedBooks = data.assignments || [];

          const booksWithRatings = await Promise.all(
            assignedBooks.map(async (a: { bookId: string; bookTitle: string; coverImage?: string; authorName: string }) => {
              try {
                const ratingRes = await fetch(`/api/books/${a.bookId}/rate`);
                if (ratingRes.ok) {
                  const ratingData = await ratingRes.json();
                  return {
                    id: a.bookId,
                    title: a.bookTitle,
                    coverImage: a.coverImage,
                    authorName: a.authorName,
                    rating: ratingData.book?.averageRating,
                    userReview: ratingData.userReview,
                  };
                }
              } catch {
                // Rating fetch failed
              }
              return {
                id: a.bookId,
                title: a.bookTitle,
                coverImage: a.coverImage,
                authorName: a.authorName,
              };
            })
          );

          setBooks(booksWithRatings);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchBooks();
    }
  }, [session]);

  const handleSaveRating = async (rating: number, title?: string, comment?: string) => {
    if (!selectedBook) return;

    try {
      const res = await fetch(`/api/books/${selectedBook.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, comment }),
      });

      if (res.ok) {
        const data = await res.json();
        setBooks((prev) =>
          prev.map((b) =>
            b.id === selectedBook.id
              ? { ...b, userReview: data.review, rating: data.book.averageRating }
              : b
          )
        );
        setSelectedBook(null);
      }
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.common.loading')}</p>
        </div>
      </div>
    );
  }

  const ratedBooks = books.filter((b) => b.userReview);
  const unratedBooks = books.filter((b) => !b.userReview);

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('dashboard.learner.rateBooks.title')}</h1>
              <p className="mt-1 text-sm text-gray-500">{t('dashboard.learner.rateBooks.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.rateBooks.totalBooks')}</p>
                <p className="text-2xl font-bold text-gray-900">{books.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.rateBooks.rated')}</p>
                <p className="text-2xl font-bold text-gray-900">{ratedBooks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 col-span-2">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500">{t('dashboard.learner.rateBooks.pending')}</p>
                <p className="text-2xl font-bold text-gray-900">{unratedBooks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {unratedBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.learner.rateBooks.toRate')}</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unratedBooks.map((book) => (
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
                        <p className="text-sm text-gray-500 truncate">{book.authorName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Star className="h-4 w-4" />
                      {t('dashboard.learner.rateBooks.rateButton')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {ratedBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">{t('dashboard.learner.rateBooks.yourRatings')}</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ratedBooks.map((book) => (
                  <div key={book.id} className="border border-gray-200 rounded-lg p-4">
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
                        <p className="text-sm text-gray-500 truncate">{book.authorName}</p>
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (book.userReview?.rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full mt-4 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('dashboard.learner.rateBooks.editRating')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {books.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('dashboard.learner.rateBooks.noBooks')}</p>
            <p className="text-sm text-gray-400 mt-2">{t('dashboard.learner.rateBooks.noBooksDesc')}</p>
          </div>
        )}
      </div>

      {selectedBook && (
        <RatingModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onSave={handleSaveRating}
        />
      )}
    </div>
  );
}
