'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Calendar, Search, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Class {
  id: string;
  name: string;
  code: string;
  enrollmentCount: number;
}

interface Book {
  id: string;
  title: string;
  authorName: string;
  coverImage?: string;
}

interface AssignReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classes: Class[];
  preSelectedClassId?: string;
}

export default function AssignReadingModal({
  isOpen,
  onClose,
  onSuccess,
  classes,
  preSelectedClassId,
}: AssignReadingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBooks, setLoadingBooks] = useState(false);

  const [formData, setFormData] = useState({
    bookId: '',
    classId: preSelectedClassId || '',
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    assignmentType: 'READING' as const,
    requirements: {
      readFullBook: true,
      submitReview: false,
      writeResponse: false,
      minimumWords: 0,
      discussionParticipation: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchBooks();
      if (preSelectedClassId) {
        setFormData(prev => ({ ...prev, classId: preSelectedClassId }));
      }
    }
  }, [isOpen, preSelectedClassId]);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch('/api/books?isPublished=true&limit=50');
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/books/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to assign book');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign book');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bookId: '',
      classId: preSelectedClassId || '',
      title: '',
      description: '',
      dueDate: '',
      points: 100,
      assignmentType: 'READING',
      requirements: {
        readFullBook: true,
        submitReview: false,
        writeResponse: false,
        minimumWords: 0,
        discussionParticipation: false,
      },
    });
    setSearchQuery('');
    setError(null);
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBook = books.find((b) => b.id === formData.bookId);
  const selectedClass = classes.find((c) => c.id === formData.classId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-soe-green-500" />
            {t('dashboard.teacher.assignReading')}
          </h2>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.teacher.modal.selectClass')} *
            </label>
            <select
              required
              value={formData.classId}
              onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
            >
              <option value="">{t('dashboard.teacher.modal.selectClassPlaceholder')}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code}) - {cls.enrollmentCount} {t('dashboard.teacher.myClasses.students')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.teacher.modal.selectBook')} *
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.teacher.modal.searchBooks')}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
              />
            </div>
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {loadingBooks ? (
                <div className="p-4 text-center text-gray-500">
                  {t('dashboard.common.loading')}
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {t('dashboard.teacher.modal.noBooks')}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bookId: book.id }))}
                      className={`w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors ${
                        formData.bookId === book.id ? 'bg-soe-green-50 border-l-4 border-soe-green-500' : ''
                      }`}
                    >
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{book.title}</p>
                        <p className="text-sm text-gray-500 truncate">by {book.authorName}</p>
                      </div>
                      {formData.bookId === book.id && (
                        <CheckCircle className="h-5 w-5 text-soe-green-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedBook && (
            <div className="bg-soe-green-50 border border-soe-green-200 rounded-lg p-4">
              <p className="text-sm text-soe-green-700">
                {t('dashboard.teacher.modal.selectedBook')}: <strong>{selectedBook.title}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.teacher.modal.assignmentTitle')} *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
                placeholder={t('dashboard.teacher.modal.titlePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('dashboard.teacher.modal.dueDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard.teacher.modal.assignmentDescription')} *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
              rows={3}
              placeholder={t('dashboard.teacher.modal.descriptionPlaceholder')}
              minLength={10}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.teacher.modal.points')}
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 100 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('dashboard.teacher.modal.assignmentType')}
              </label>
              <select
                value={formData.assignmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, assignmentType: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-soe-green-500 focus:border-soe-green-500"
              >
                <option value="READING">Reading</option>
                <option value="QUIZ">Quiz</option>
                <option value="WRITING">Writing</option>
                <option value="PROJECT">Project</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard.teacher.modal.requirements')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requirements.readFullBook}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, readFullBook: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                />
                <span className="text-sm text-gray-700">{t('dashboard.teacher.modal.readFullBook')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requirements.submitReview}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, submitReview: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                />
                <span className="text-sm text-gray-700">{t('dashboard.teacher.modal.submitReview')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requirements.discussionParticipation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    requirements: { ...prev.requirements, discussionParticipation: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-soe-green-500 focus:ring-soe-green-500"
                />
                <span className="text-sm text-gray-700">{t('dashboard.teacher.modal.discussionParticipation')}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { onClose(); resetForm(); }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.bookId || !formData.classId}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-soe-green-400 to-soe-green-500 hover:from-soe-green-500 hover:to-soe-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('common.saving') : t('dashboard.teacher.modal.assignBook')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
