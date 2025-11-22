'use client';

import Link from 'next/link';
import { BookOpen, Star, Clock } from 'lucide-react';
import AnimatedImage from './AnimatedImage';
import ScrollAnimatedContainer from './ScrollAnimatedContainer';

interface Book {
  id: string;
  title: string;
  authorName: string;
  description?: string;
  coverImage?: string;
  language: string;
  difficultyLevel: string;
  ageGroup: string;
  pageCount?: number;
  averageRating: number;
  ratingCount: number;
}

interface AnimatedBookCardProps {
  book: Book;
  isAuthenticated: boolean;
  animationDelay?: number;
  linkHref?: string;
}

export default function AnimatedBookCard({
  book,
  isAuthenticated,
  animationDelay = 0,
  linkHref
}: AnimatedBookCardProps) {
  const href = linkHref || `/books/${book.id}`;

  return (
    <ScrollAnimatedContainer
      animationType="slideUp"
      delay={animationDelay}
      duration={600}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-w-3 aspect-h-4 bg-gray-200 relative overflow-hidden">
        {book.coverImage ? (
          <AnimatedImage
            src={book.coverImage}
            alt={book.title}
            className="w-full h-48"
            animationType="scaleIn"
            delay={animationDelay + 200}
            duration={800}
          />
        ) : (
          <ScrollAnimatedContainer
            animationType="fadeIn"
            delay={animationDelay + 200}
            className="flex items-center justify-center h-48 bg-gradient-to-br from-blue-100 to-purple-100"
          >
            <BookOpen className="h-12 w-12 text-gray-400" />
          </ScrollAnimatedContainer>
        )}
      </div>

      <ScrollAnimatedContainer
        animationType="slideUp"
        delay={animationDelay + 400}
        className="p-4"
      >
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {book.authorName}</p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{book.language}</span>
          <span>{book.difficultyLevel}</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm text-gray-600">
              {book.averageRating.toFixed(1)} ({book.ratingCount})
            </span>
          </div>
          {book.pageCount && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {book.pageCount}p
            </div>
          )}
        </div>

        <Link
          href={href}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md text-center block transition-colors transform hover:scale-105 duration-200"
        >
          {isAuthenticated ? 'Read Now' : 'Sign In to Read'}
        </Link>
      </ScrollAnimatedContainer>
    </ScrollAnimatedContainer>
  );
}