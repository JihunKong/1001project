'use client';

import { useState, useEffect, use } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { canEditBook } from '@/lib/validation/book-registration.schema';
import { BookRegistrationForm, BookFormInitialData } from '@/components/book-registration';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BookManagerBookEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [book, setBook] = useState<BookFormInitialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      redirect('/login');
      return;
    }

    if (!canEditBook(session.user.role)) {
      redirect('/dashboard');
      return;
    }

    fetchBook();
  }, [session, status, resolvedParams.id]);

  const fetchBook = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/books/${resolvedParams.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Book not found');
        } else {
          setError('Failed to load book');
        }
        return;
      }

      const data = await response.json();
      setBook({
        id: data.id,
        title: data.title,
        subtitle: data.subtitle,
        summary: data.summary,
        authorName: data.authorName,
        authorAlias: data.authorAlias,
        content: data.content,
        language: data.language,
        ageRange: data.ageRange,
        category: data.category,
        tags: data.tags,
        visibility: data.visibility,
        isPremium: data.isPremium,
        price: data.price,
        coverImage: data.coverImage,
      });
    } catch (err) {
      console.error('Error fetching book:', err);
      setError('Failed to load book');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/dashboard/book-manager/books');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-red-800">{error}</h3>
            <div className="mt-6">
              <Link
                href="/dashboard/book-manager/books"
                className="text-red-600 hover:text-red-800"
              >
                ← Back to Books
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/book-manager/books"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Books
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Book</h1>
          <p className="mt-2 text-gray-600">
            Update the book information below
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editing: {book.title}
          </div>
        </div>

        <BookRegistrationForm
          mode="edit"
          bookId={resolvedParams.id}
          initialData={book}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
