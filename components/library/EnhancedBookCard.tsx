'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Crown, Lock, Star, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import SimplePDFThumbnail from '@/components/library/SimplePDFThumbnail';
import { resolveBookFiles } from '@/lib/book-files';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: {
    name: string;
    age?: number;
    location?: string;
  };
  language: string;
  category: string[];
  ageRange?: string;
  readingTime?: number;
  coverImage?: string;
  isPremium: boolean;
  isFeatured: boolean;
  rating?: number;
  accessLevel: 'preview' | 'full';
  stats: {
    readers: number;
    bookmarks: number;
  };
  pdfKey?: string;
  pdfFrontCover?: string;
  pdfBackCover?: string;
  pageLayout?: string;
  bookId?: string;
}

interface EnhancedBookCardProps {
  book: Book;
}

export default function EnhancedBookCard({ book }: EnhancedBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Resolve book files based on the new system
  const bookFiles = resolveBookFiles(book.id || book.bookId || '');

  return (
    <motion.div
      className="group relative h-96 w-64 mx-auto perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      {/* Book Container with 3D Transform */}
      <motion.div
        className="relative h-full w-full transform-style-preserve-3d cursor-pointer"
        animate={{
          rotateY: isFlipped ? 180 : 0,
          rotateX: isHovered ? -5 : 0,
          rotateZ: isHovered ? 2 : 0,
        }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Cover */}
        <div className="absolute inset-0 backface-hidden">
          <div className="relative h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Book Spine Effect */}
            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-gray-300 to-gray-500 shadow-inner"></div>
            
            {/* Cover Image */}
            <div className="relative ml-3 mr-2 mt-2 mb-8 h-[calc(100%-60px)] bg-white rounded-sm overflow-hidden shadow-md">
              {(book.pdfFrontCover || book.pdfKey || bookFiles.frontCover || bookFiles.main) ? (
                <SimplePDFThumbnail
                  bookId={book.id || book.bookId || ''}
                  title={book.title}
                  pdfUrl={book.pdfKey || bookFiles.main || undefined}
                  existingImage={book.pdfFrontCover || book.coverImage}
                  className="w-full h-full object-cover"
                  alt={book.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                  <BookOpen className="w-16 h-16 text-blue-300" />
                </div>
              )}
              
              
              {/* Premium Badge - floating overlay */}
              {book.isPremium && (
                <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                  <Crown className="w-3 h-3" />
                  Premium
                </div>
              )}
              
              {/* Featured Badge - floating overlay */}
              {book.isFeatured && (
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3" />
                  Featured
                </div>
              )}
              
              {/* Title and Author on Cover */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <h3 className="text-sm font-bold leading-tight mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs opacity-90">
                  {book.author.name}
                </p>
              </div>
            </div>
            
            {/* 3D Shadow Effect */}
            <div className="absolute -right-1 top-1 w-1 h-full bg-gradient-to-b from-gray-400 to-gray-600 transform skew-y-1 opacity-50"></div>
            <div className="absolute -bottom-1 left-1 w-full h-1 bg-gradient-to-r from-gray-400 to-gray-600 transform skew-x-1 opacity-50"></div>
          </div>
        </div>

        {/* Back Cover (Details) */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="relative h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-xl border border-gray-200 p-4">
            {/* Book Spine Effect */}
            <div className="absolute right-0 top-0 w-2 h-full bg-gradient-to-b from-gray-300 to-gray-500 shadow-inner"></div>
            
            <div className="h-full flex flex-col justify-between mr-2">
              {/* Title and Details */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {book.title}
                </h4>
                {book.subtitle && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {book.subtitle}
                  </p>
                )}
                
                {/* Author Info */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">{book.author.name}</p>
                  {book.author.age && (
                    <p className="text-xs text-gray-500">Age {book.author.age}</p>
                  )}
                  {book.author.location && (
                    <p className="text-xs text-gray-500">{book.author.location}</p>
                  )}
                </div>
                
                {/* Categories */}
                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {book.category.slice(0, 2).map((cat, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Stats and Actions */}
              <div>
                {/* Reading Stats */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{book.readingTime || 15} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{book.stats.readers} readers</span>
                  </div>
                </div>
                
                {/* Rating */}
                {book.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= (book.rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">{Number(book.rating || 0).toFixed(1)}</span>
                  </div>
                )}
                
                {/* Read Button */}
                <Link href={`/library/stories/${book.id}`}>
                  <motion.button
                    className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                      book.accessLevel === 'full'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center gap-1'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {book.accessLevel === 'full' ? (
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        Read Now
                      </div>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Preview
                      </>
                    )}
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Hover Instructions */}
      <motion.div
        className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        Click to flip • Click title to read
      </motion.div>
    </motion.div>
  );
}