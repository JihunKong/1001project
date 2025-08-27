'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { BookOpen, Crown, Lock, Star } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const SimplePDFThumbnail = dynamic(() => import('./SimplePDFThumbnail'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
    </div>
  )
});

interface Book {
  id: string;
  title: string;
  author: {
    name: string;
  };
  isPremium: boolean;
  isFeatured: boolean;
  category: string[];
  coverImage?: string;
  accessLevel: 'preview' | 'full';
  pdfKey?: string;
  fullPdf?: string;
  samplePdf?: string;
  bookId?: string;
}

interface BookshelfViewProps {
  books: Book[];
}

const BookSpine = ({ book, index }: { book: Book; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Generate consistent colors based on book category
  const getSpineColor = (category: string[]) => {
    const colors = [
      'from-red-400 to-red-600',
      'from-blue-400 to-blue-600', 
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-yellow-400 to-yellow-600',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-orange-400 to-orange-600',
    ];
    
    const categoryHash = category[0]?.charCodeAt(0) || 0;
    return colors[categoryHash % colors.length];
  };

  // Vary book heights for realism
  const heightVariants = ['h-64', 'h-72', 'h-68', 'h-60', 'h-56'];
  const widthVariants = ['w-8', 'w-10', 'w-12'];
  
  const height = heightVariants[index % heightVariants.length];
  const width = widthVariants[index % widthVariants.length];
  const spineColor = getSpineColor(book.category);

  return (
    <motion.div
      className={`${height} ${width} relative cursor-pointer group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        rotateY: 5,
        zIndex: 10 
      }}
      transition={{ duration: 0.3 }}
      style={{
        transformOrigin: 'bottom center',
        perspective: '1000px',
      }}
    >
      {/* Book Spine */}
      <div className={`h-full w-full bg-gradient-to-b ${spineColor} rounded-sm shadow-lg border-r-2 border-black/20 relative overflow-hidden`}>
        {/* Spine Highlight */}
        <div className="absolute left-0 top-0 w-1 h-full bg-white/30"></div>
        
        {/* Book Title - Vertical Text */}
        <div className="absolute inset-0 flex flex-col justify-center items-center p-1">
          <div className="transform -rotate-90 whitespace-nowrap">
            <div className="text-white text-xs font-bold leading-tight max-w-48 overflow-hidden text-ellipsis drop-shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              {book.title.substring(0, 20)}
            </div>
            <div className="text-white/90 text-xs mt-1 drop-shadow-md" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              {book.author.name.split(' ')[0]}
            </div>
          </div>
        </div>
        
        {/* Premium Indicator */}
        {book.isPremium && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <Crown className="w-3 h-3 text-yellow-300" />
          </div>
        )}
        
        {/* Featured Indicator */}
        {book.isFeatured && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <Star className="w-3 h-3 text-yellow-300 fill-current" />
          </div>
        )}
        
        {/* Book Bottom Edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20 rounded-b-sm"></div>
      </div>
      
      {/* Hover Card */}
      <motion.div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-20"
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          y: isHovered ? 0 : 10,
          scale: isHovered ? 1 : 0.9 
        }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        {/* Arrow pointing down */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
        
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            <SimplePDFThumbnail
              bookId={book.id || book.bookId || ''}
              title={book.title}
              pdfUrl={book.pdfKey || book.fullPdf || book.samplePdf}
              existingImage={book.coverImage}
              className="w-full h-full"
              alt={book.title}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-bold text-gray-800 text-sm line-clamp-2">
                {book.title}
              </h4>
              <p className="text-xs text-gray-600">by {book.author.name}</p>
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {book.category.slice(0, 2).map((cat, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {cat}
                </span>
              ))}
            </div>
            
            {/* Action Button */}
            <Link href={`/library/books/${book.id}`}>
              <motion.button
                className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                  book.accessLevel === 'full'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {book.accessLevel === 'full' ? (
                  <>
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Read Now
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 inline mr-2" />
                    Preview
                  </>
                )}
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function BookshelfView({ books }: BookshelfViewProps) {
  // Group books into shelves with even distribution
  const maxBooksPerShelf = 8;
  const shelves = [];
  
  // Calculate optimal shelf distribution
  const totalBooks = books.length;
  const numberOfShelves = Math.ceil(totalBooks / maxBooksPerShelf);
  const booksPerShelf = Math.floor(totalBooks / numberOfShelves);
  const extraBooks = totalBooks % numberOfShelves;
  
  let bookIndex = 0;
  
  for (let shelfIndex = 0; shelfIndex < numberOfShelves; shelfIndex++) {
    // Distribute extra books evenly across first shelves
    const currentShelfSize = booksPerShelf + (shelfIndex < extraBooks ? 1 : 0);
    const shelfBooks = books.slice(bookIndex, bookIndex + currentShelfSize);
    
    if (shelfBooks.length > 0) {
      shelves.push(shelfBooks);
      bookIndex += currentShelfSize;
    }
  }

  return (
    <div className="space-y-8 py-8">
      {shelves.map((shelfBooks, shelfIndex) => (
        <motion.div
          key={shelfIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shelfIndex * 0.1 }}
          className="relative"
        >
          {/* Shelf */}
          <div className="relative">
            {/* Shelf Surface */}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-100 to-amber-200 border border-amber-300 rounded-sm shadow-md"></div>
            
            {/* Shelf Support */}
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-b from-amber-200 to-amber-300 rounded-sm"></div>
            
            {/* Books on Shelf */}
            <div className="flex items-end justify-start gap-1 pl-4 pr-4 pb-4 relative z-10">
              {shelfBooks.map((book, bookIndex) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  index={bookIndex + shelfIndex * 10}
                />
              ))}
              
              {/* Bookend */}
              <div className="w-3 h-48 bg-gradient-to-b from-gray-600 to-gray-800 rounded-sm shadow-lg ml-2 flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-r from-transparent to-white/10 rounded-sm"></div>
              </div>
            </div>
          </div>
          
          {/* Shelf Label */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            <span className="text-xs font-medium text-gray-600">
              Shelf {shelfIndex + 1}
            </span>
          </div>
        </motion.div>
      ))}
      
      {/* Empty Shelf if we have space */}
      {books.length % 8 !== 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: shelves.length * 0.1 }}
          className="relative opacity-50"
        >
          <div className="relative">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-100 to-amber-200 border border-amber-300 rounded-sm shadow-md"></div>
            <div className="absolute -bottom-1 left-0 right-0 h-2 bg-gradient-to-b from-amber-200 to-amber-300 rounded-sm"></div>
            <div className="h-64 flex items-end justify-start pl-4 pr-4 pb-4">
              <div className="text-gray-400 text-sm italic">More books coming soon...</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}