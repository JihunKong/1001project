'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Eye, 
  Heart, 
  Globe,
  Users,
  BarChart3
} from 'lucide-react';

interface BookData {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  content?: string;
  contentType: string;
  authorName: string;
  country?: string;
  language: string;
  ageRange?: string;
  readingTime?: number;
  readingLevel?: string;
  educationalCategories?: string[];
  difficultyScore?: number;
  viewCount: number;
  likeCount: number;
  rating?: number;
  coverImage?: string;
  pdfKey?: string;
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBook() {
      try {
        const response = await fetch(`/api/books/${bookId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Book not found');
          } else if (response.status === 403) {
            setError('You do not have permission to view this book');
          } else {
            setError('Failed to load book');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setBook(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Failed to load book');
        setLoading(false);
      }
    }

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const getDifficultyLabel = (score?: number): string => {
    if (!score) return 'Unknown';
    if (score < 33) return 'Easy';
    if (score < 66) return 'Medium';
    return 'Hard';
  };

  const getDifficultyColor = (score?: number): string => {
    if (!score) return 'text-gray-500';
    if (score < 33) return 'text-green-600';
    if (score < 66) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Book not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            The book you're looking for could not be loaded.
          </p>
          <Link
            href="/dashboard/writer/library"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Book Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
          {book.subtitle && (
            <p className="text-xl text-gray-600 mb-4">{book.subtitle}</p>
          )}
          
          <div className="flex items-center gap-2 text-gray-700 mb-4">
            <span className="font-medium">by {book.authorName}</span>
            {book.country && (
              <>
                <span className="text-gray-400">•</span>
                <span>{book.country}</span>
              </>
            )}
          </div>

          {book.summary && (
            <p className="text-gray-700 leading-relaxed mb-6">{book.summary}</p>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200">
            {book.ageRange && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{book.ageRange} years</span>
              </div>
            )}
            {book.readingTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{book.readingTime} min</span>
              </div>
            )}
            {book.difficultyScore !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className={getDifficultyColor(book.difficultyScore)}>
                  {getDifficultyLabel(book.difficultyScore)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">{book.language.toUpperCase()}</span>
            </div>
          </div>

          {/* Categories */}
          {book.educationalCategories && book.educationalCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {book.educationalCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                >
                  {category}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{book.viewCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{book.likeCount.toLocaleString()} likes</span>
            </div>
          </div>
        </div>

        {/* Book Content */}
        {book.contentType === 'TEXT' && book.content && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div
              className="prose prose-lg max-w-none text-gray-900"
              dangerouslySetInnerHTML={{ __html: book.content.replace(/\n/g, '<br />') }}
            />
          </div>
        )}

        {book.contentType === 'PDF' && (book.pdfKey || book.coverImage) && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <iframe
              src={book.pdfKey || book.coverImage}
              className="w-full"
              style={{ height: '800px', border: 'none' }}
              title={`PDF viewer for ${book.title}`}
            />
          </div>
        )}

        {!book.content && !book.pdfKey && !book.coverImage && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <p className="text-center text-gray-600">
              Content not available for this book.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
