'use client';

import { useState, useEffect } from 'react';

interface Book {
  id: string
  title: string
  author: {
    name: string
  }
  isPremium: boolean
}

interface BooksResponse {
  books: Book[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
  }
}

export default function LibraryTest() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        console.log('Fetching books...');
        const response = await fetch('/api/library/books?page=1&limit=12');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data: BooksResponse = await response.json();
        console.log('Books data:', data);
        
        setBooks(data.books || []);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  console.log('Render - Books count:', books.length, 'Loading:', loading, 'Error:', error);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Library Test</h1>
        
        <div className="mb-4">
          <p>Books: {books.length} | Loading: {loading ? 'Yes' : 'No'} | Error: {error || 'None'}</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading books...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>Error: {error}</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8">
            <p>No books found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <div key={book.id} className="p-4 border rounded-lg bg-white">
                <h3 className="font-bold">{book.title}</h3>
                <p className="text-gray-600">By {book.author?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-500">
                  {book.isPremium ? 'Premium' : 'Free'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}