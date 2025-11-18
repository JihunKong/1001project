'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, User, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import BookContentViewer from './BookContentViewer';
import ReadingChatbot from './ReadingChatbot';

interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authorName: string;
  coverImage: string | null;
  summary: string | null;
  content: string | null;
  contentType: string;
  language: string;
  ageRange: string | null;
  category: string[];
  tags: string[];
}

interface ReadingProgress {
  id: string;
  currentChapter: number;
  currentPage: number | null;
  currentPosition: string | null;
  percentComplete: number;
  totalReadingTime: number;
  lastReadAt: Date;
  startedAt: Date;
  completedAt: Date | null;
  isCompleted: boolean;
}

interface StudentReadingInterfaceProps {
  book: Book;
  userId: string;
  initialProgress: ReadingProgress;
}

export default function StudentReadingInterface({
  book,
  userId,
  initialProgress
}: StudentReadingInterfaceProps) {
  const [language, setLanguage] = useState('en');
  const [readingStartTime, setReadingStartTime] = useState(Date.now());

  useEffect(() => {
    // Get language from cookie
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(c => c.trim().startsWith('NEXT_LOCALE='));
    if (langCookie) {
      const lang = langCookie.split('=')[1];
      setLanguage(lang);
    }
  }, []);

  useEffect(() => {
    // Auto-save reading progress every 30 seconds
    const interval = setInterval(() => {
      saveProgress();
    }, 30000);

    // Save progress on page unload
    const handleBeforeUnload = () => {
      saveProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveProgress();
    };
  }, []);

  const saveProgress = async () => {
    try {
      const readingTime = Math.floor((Date.now() - readingStartTime) / 60000); // minutes

      await fetch('/api/reading-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book.id,
          readingTime,
          currentPosition: window.scrollY,
        }),
      });
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-reading-interface>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/learner"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <Clock className="w-4 h-4" />
                <span>
                  {Math.floor(initialProgress.totalReadingTime / 60)}h{' '}
                  {initialProgress.totalReadingTime % 60}m read
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-900">
                <BookOpen className="w-4 h-4" />
                <span>{Math.round(initialProgress.percentComplete)}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Two-Column Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left: Book Content (60%) */}
        <div className="w-[60%] overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Book Header */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex gap-6">
                {book.coverImage && (
                  <div className="relative w-32 h-48 flex-shrink-0">
                    <Image
                      src={book.coverImage}
                      alt={book.title}
                      fill
                      className="object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {book.title}
                  </h1>

                  {book.subtitle && (
                    <p className="text-xl text-gray-900 mb-3">{book.subtitle}</p>
                  )}

                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <User className="w-4 h-4" />
                    <span className="font-medium">by {book.authorName}</span>
                  </div>

                  {book.summary && (
                    <p className="text-sm text-gray-900 line-clamp-3">
                      {book.summary}
                    </p>
                  )}

                  {book.category.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {book.category.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                How to use this reading tool
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Select a word</strong> to see its definition and explanation</li>
                <li>• <strong>Ask questions</strong> in the chat sidebar about the story</li>
                <li>• Your progress is <strong>saved automatically</strong> every 30 seconds</li>
              </ul>
            </div>

            {/* Book Content */}
            {book.content ? (
              <BookContentViewer content={book.content} language={language} />
            ) : (
              <div className="text-center py-12 text-gray-700">
                <p>No content available for this book.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Chatbot (40%) */}
        <div className="w-[40%] border-l border-gray-200">
          <ReadingChatbot
            bookId={book.id}
            bookTitle={book.title}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}
