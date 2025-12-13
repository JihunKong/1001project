'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye, Heart, Star, BookOpen, Globe, Users } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  authorName: string;
  country?: string;
  coverImage?: string;
  language: string;
  ageRange?: string;
  readingTime?: number;
  readingLevel?: string;
  category: string[];
  educationalCategories?: string[];
  difficultyScore?: number;
  viewCount: number;
  likeCount: number;
  rating?: number;
  isPublished: boolean;
  isPremium: boolean;
  featured: boolean;
  contentType?: string;
  isFavorited?: boolean;
}

interface BookListViewProps {
  books: Book[];
  getLinkHref?: (book: Book) => string;
  onFavoriteToggle?: (bookId: string, isFavorited: boolean) => void;
}

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

export default function BookListView({ books, getLinkHref, onFavoriteToggle }: BookListViewProps) {
  const getHref = (book: Book) => {
    if (getLinkHref) {
      return getLinkHref(book);
    }
    return `/books/${book.id}`;
  };

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <Link
          key={book.id}
          href={getHref(book)}
          className="flex bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 group"
        >
          {/* Book Cover */}
          <div className="flex-shrink-0 w-32 h-44 relative rounded-md overflow-hidden bg-gray-100">
            {book.coverImage ? (
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {/* Favorite Button */}
            <div className="absolute top-2 left-2 z-10">
              <FavoriteButton
                bookId={book.id}
                isFavorited={book.isFavorited || false}
                onToggle={(newState) => onFavoriteToggle?.(book.id, newState)}
                size="sm"
              />
            </div>
            {book.isPremium && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Premium
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 ml-4 flex flex-col justify-between">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="text-sm text-gray-900 mt-0.5 line-clamp-1">{book.subtitle}</p>
              )}
              <p className="text-sm text-gray-900 mt-1">
                by <span className="font-medium">{book.authorName}</span>
                {book.country && (
                  <span className="text-gray-700"> • {book.country}</span>
                )}
              </p>
              {book.summary && (
                <p className="text-sm text-gray-900 mt-2 line-clamp-2">{book.summary}</p>
              )}
            </div>

            {/* Tags and Categories */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {book.educationalCategories?.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Metadata */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
              {book.ageRange && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{book.ageRange} years</span>
                </div>
              )}
              {book.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{book.readingTime} min</span>
                </div>
              )}
              {book.difficultyScore !== undefined && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className={getDifficultyColor(book.difficultyScore)}>
                    {getDifficultyLabel(book.difficultyScore)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>{book.language.toUpperCase()}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{book.viewCount.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                <span>{book.likeCount.toLocaleString()} likes</span>
              </div>
              {book.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
