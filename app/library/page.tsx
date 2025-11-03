'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import AnimatedBookCard from '@/components/ui/AnimatedBookCard';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';

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

export default function LibraryPage() {
  const { data: session } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      // Error handled silently - books will show empty state
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || book.language === selectedLanguage;
    const matchesDifficulty = selectedDifficulty === 'all' || book.difficultyLevel === selectedDifficulty;

    return matchesSearch && matchesLanguage && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <ScrollAnimatedContainer animationType="slideInLeft" duration={600}>
              <h1 className="text-3xl font-bold text-gray-900">Library</h1>
              <p className="mt-1 text-sm text-gray-500">
                Discover stories from children around the world
              </p>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="slideInRight" delay={200}>
              <div className="flex items-center gap-4">
                {!session && (
                  <Link
                    href="/login"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    Sign In to Read
                  </Link>
                )}
                {session && (
                  <Link
                    href="/dashboard"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    My Dashboard
                  </Link>
                )}
              </div>
            </ScrollAnimatedContainer>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <ScrollAnimatedContainer animationType="slideUp" delay={300}>
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ScrollAnimatedContainer animationType="slideUp" delay={400}>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Books
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                  placeholder="Search by title or author..."
                />
              </ScrollAnimatedContainer>

              <ScrollAnimatedContainer animationType="slideUp" delay={500}>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                >
                  <option value="all">All Languages</option>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Korean">Korean</option>
                </select>
              </ScrollAnimatedContainer>

              <ScrollAnimatedContainer animationType="slideUp" delay={600}>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
                >
                  <option value="all">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </ScrollAnimatedContainer>
            </div>
          </div>
        </ScrollAnimatedContainer>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <ScrollAnimatedContainer animationType="fadeIn" delay={700}>
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-500">Try adjusting your search filters</p>
            </div>
          </ScrollAnimatedContainer>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book, index) => (
              <AnimatedBookCard
                key={book.id}
                book={book}
                isAuthenticated={!!session}
                animationDelay={700 + (index * 100)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}