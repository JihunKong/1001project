'use client';

import { motion } from 'framer-motion';
import { BookOpen, Crown, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const SimplePDFThumbnail = dynamic(() => import('./SimplePDFThumbnail'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
    </div>
  )
});
import { resolveBookFiles } from '@/lib/book-files';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authorName: string;  // Changed from nested author object
  authorAge?: number;
  authorLocation?: string;
  language: string;
  category: string[];
  ageRange?: string;
  readingTime?: number;
  coverImage?: string;
  isPremium: boolean;
  isFeatured?: boolean;
  featured?: boolean;  // API returns 'featured' not 'isFeatured'
  rating?: number;
  accessLevel?: 'preview' | 'full';
  viewCount?: number;
  downloadCount?: number;
  pdfKey?: string;
  pdfFrontCover?: string;
  pdfBackCover?: string;
  pageLayout?: string;
  bookId?: string;
  fullPdf?: string;
  samplePdf?: string;
}

interface SimpleBookCardProps {
  book: Book;
}

export default function SimpleBookCard({ book }: SimpleBookCardProps) {
  // Resolve book files
  const bookFiles = resolveBookFiles(book.id || book.bookId || '');
  
  // Use the correct cover.pdf files first
  const pdfSource = bookFiles.frontCover || book.pdfFrontCover || book.pdfKey || book.fullPdf || book.samplePdf || bookFiles.main;
  
  // Debug log to check which source is being used
  if (process.env.NODE_ENV === 'development') {
    console.log('Book:', book.title, 'PDF Source:', pdfSource, {
      pdfKey: book.pdfKey,
      main: bookFiles.main,
      pdfFrontCover: book.pdfFrontCover,
      frontCover: bookFiles.frontCover
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Link href={`/library/books/${book.id}`}>
        <div className="relative overflow-hidden rounded-xl shadow-lg transition-all hover:shadow-xl">
          {/* Cover Image Container with Fixed Aspect Ratio */}
          <div className="relative bg-white aspect-[3/4]">
            {pdfSource ? (
              <SimplePDFThumbnail
                bookId={book.id || book.bookId || ''}
                title={book.title}
                pdfUrl={pdfSource}
                existingImage={book.coverImage}
                className="absolute inset-0 h-full w-full"
                alt={book.title}
              />
            ) : (
              <div className="absolute inset-0 h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                <BookOpen className="w-16 h-16 text-blue-300" />
              </div>
            )}

            {/* Gradient overlays for text readability */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/15 to-transparent"></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Premium Badge */}
          {book.isPremium && (
            <div className="absolute right-2 top-2 z-20">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/90 px-2.5 py-1 text-xs font-semibold text-black shadow-md">
                <Crown className="h-3 w-3" />
                Premium
              </span>
            </div>
          )}
          
          {/* Featured Badge */}
          {(book.featured || book.isFeatured) && (
            <div className="absolute left-2 top-2 z-20">
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                <Star className="h-3 w-3" />
                Featured
              </span>
            </div>
          )}
          
          {/* Title and Author */}
          <div className="absolute inset-x-0 bottom-2 z-20 px-3">
            <div className="line-clamp-1 text-sm font-semibold text-white drop-shadow">
              {book.title}
            </div>
            <div className="line-clamp-1 text-xs text-white/90">
              {book.authorName}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}