'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter,
  Grid3X3,
  LibraryIcon,
  Crown,
  Users,
  ArrowRight,
  Eye,
  Clock,
  Star
} from 'lucide-react';
import Link from 'next/link';
import SimplePDFThumbnail from '@/components/library/SimplePDFThumbnail';

interface DemoBook {
  id: string;
  title: string;
  authorName: string;
  authorAge: number;
  authorLocation: string;
  summary: string;
  coverImage?: string;
  pdfKey: string;
  pageCount: number;
  language: string;
  ageRange: string;
  category: string;
  rating: number;
  isPremium: boolean;
  estimatedReadTime: number;
}

// Real books for demo - using the first 3 free books (Neema series)
const demoBooks: DemoBook[] = [
  {
    id: 'neema-01',
    title: 'Neema Part 1',
    authorName: 'Emma Grace',
    authorAge: 12,
    authorLocation: 'Uganda',
    summary: 'A powerful story of hope and resilience following a young girl\'s journey through challenges and triumph.',
    coverImage: '/books/neema-01/cover.png',
    pdfKey: '/api/pdf/books/neema-01/main.pdf',
    pageCount: 24,
    language: 'en',
    ageRange: '6-12',
    category: 'Drama',
    rating: 4.8,
    isPremium: false,
    estimatedReadTime: 12
  },
  {
    id: 'neema-02',
    title: 'Neema Part 2',
    authorName: 'Emma Grace',
    authorAge: 12,
    authorLocation: 'Uganda',
    summary: 'A powerful story of hope and resilience following a young girl\'s journey through challenges and triumph.',
    coverImage: '/books/neema-02/cover.png',
    pdfKey: '/api/pdf/books/neema-02/main.pdf',
    pageCount: 24,
    language: 'en',
    ageRange: '6-12',
    category: 'Drama',
    rating: 4.6,
    isPremium: false,
    estimatedReadTime: 12
  },
  {
    id: 'neema-03',
    title: 'Neema Part 3',
    authorName: 'Emma Grace',
    authorAge: 12,
    authorLocation: 'Uganda',
    summary: 'A powerful story of hope and resilience following a young girl\'s journey through challenges and triumph.',
    coverImage: '/books/neema-03/cover.png',
    pdfKey: '/api/pdf/books/neema-03/main.pdf',
    pageCount: 24,
    language: 'en',
    ageRange: '6-12',
    category: 'Drama',
    rating: 4.7,
    isPremium: false,
    estimatedReadTime: 12
  }
];

export default function DemoLibrary() {
  const [books] = useState<DemoBook[]>(demoBooks);
  const [viewMode, setViewMode] = useState<'cards' | 'bookshelf'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-yellow-400 text-black py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span>🎭 Demo Library</span>
            </div>
            <span>|</span>
            <span>Experience real books from our collection!</span>
            <Link 
              href="/signup"
              className="ml-4 px-4 py-1 bg-black text-yellow-400 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              Sign Up →
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                <span className="gradient-text">Demo Digital Library</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Experience stories from children around the world
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">Free Trial Available</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">{books.length} Sample Books</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, author, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('bookshelf')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  viewMode === 'bookshelf'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LibraryIcon className="w-4 h-4" />
                Bookshelf
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Demo Books ({filteredBooks.length})
              </h2>
              <p className="text-gray-600">
                Preview books that are available for purchase
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span>Premium</span>
                </div>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                {/* Book Cover */}
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  {book.isPremium && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium">
                        <Crown className="w-3 h-3" />
                        <span>Premium</span>
                      </div>
                    </div>
                  )}
                  
                  <SimplePDFThumbnail
                    pdfUrl={book.pdfKey}
                    bookId={book.id}
                    title={book.title}
                    existingImage={book.coverImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={book.title}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <div className="flex items-center gap-1 text-yellow-500 ml-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm text-gray-600">{book.rating}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p className="font-medium">{book.authorName} (Age {book.authorAge})</p>
                    <p>{book.authorLocation}</p>
                  </div>

                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {book.summary}
                  </p>

                  {/* Book Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-3">
                      <span>{book.pageCount} pages</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {book.estimatedReadTime} min
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                      {book.category}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/demo/library/books/${book.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <BookOpen className="w-4 h-4" />
                      Try It
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Did you find a book you like?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Sign up to discover more books. Stories from children around the world are waiting for you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
                >
                  <Users className="w-5 h-5" />
                  Sign Up
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
                >
                  <BookOpen className="w-5 h-5" />
                  Browse Books
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}