import { notFound } from 'next/navigation';
import { EnhancedReadingPage } from '@/components/learn/EnhancedReadingPage';
import { ContentLoader, BookContent } from '@/lib/content-loader';

interface BookPageProps {
  params: {
    slug: string[];
  };
}

// Fetch book data from API
async function fetchBookData(bookId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/library/books/${bookId}`, {
      cache: 'no-store' // Always fetch fresh data
    });
    
    if (!response.ok) {
      console.error('Failed to fetch book:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.book : null;
  } catch (error) {
    console.error('Error fetching book data:', error);
    return null;
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  
  // slug[0] = bookId or book type
  // slug[1] = action (read, quiz, discuss, etc.)
  // slug[2+] = additional parameters
  
  if (!slug || slug.length === 0) {
    // Redirect to books list
    return notFound();
  }
  
  const bookId = slug[0];
  const action = slug[1] || 'read';
  
  // First try to fetch book data from database API
  const dbBook = await fetchBookData(bookId);
  
  // Then try to load file content using ContentLoader as fallback for content
  const loader = new ContentLoader(bookId);
  const fileContent = await loader.loadContent();
  const coverImage = await loader.getCoverImage();
  const thumbnails = await loader.getThumbnails();
  
  // If neither database book nor file content exists, return 404
  if (!dbBook && !fileContent) {
    return notFound();
  }
  
  // Combine database book data with file content
  const bookData = dbBook ? {
    id: dbBook.id,
    title: dbBook.title || 'Untitled Book',
    content: dbBook.content || fileContent?.content || '',
    format: dbBook.format || fileContent?.format || 'txt' as const,
    totalPages: dbBook.pageCount || fileContent?.metadata?.pageCount || 10,
    category: dbBook.category?.[0] || dbBook.genres?.[0] || fileContent?.metadata?.tags?.[0] || 'education',
    level: dbBook.readingLevel || dbBook.difficultyLevel || fileContent?.metadata?.level || 'B1',
    author: dbBook.authorName || fileContent?.metadata?.author || 'Unknown Author',
    coverImage: dbBook.coverImage || coverImage,
    thumbnails: thumbnails || []
  } : {
    // Fallback to file-based content if database book not found
    id: bookId,
    title: fileContent!.metadata?.title || 'Untitled Book',
    content: fileContent!.content,
    format: fileContent!.format,
    totalPages: fileContent!.metadata?.pageCount || 10,
    category: fileContent!.metadata?.tags?.[0] || 'education',
    level: fileContent!.metadata?.level || 'B1',
    author: fileContent!.metadata?.author || 'Unknown Author',
    coverImage,
    thumbnails
  };
  
  // Create proper BookContent object for components
  const bookContent: BookContent = {
    format: bookData.format,
    content: bookData.content,
    id: bookData.id,
    title: bookData.title,
    author: bookData.author,
    coverImage: bookData.coverImage,
    thumbnails: bookData.thumbnails,
    metadata: {
      title: bookData.title,
      author: bookData.author,
      level: bookData.level,
      tags: [bookData.category],
      pageCount: bookData.totalPages
    }
  };

  switch (action) {
    case 'read':
      return (
        <EnhancedReadingPage
          bookId={bookData.id}
          bookTitle={bookData.title}
          bookContent={bookData.content}
          totalPages={bookData.totalPages}
          userLevel={bookData.level}
        />
      );
    
    case 'quiz':
      // Quiz-only view
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <h1 className="text-2xl font-bold mb-4">Quiz for: {bookData.title}</h1>
          <p>Quiz feature coming soon...</p>
        </div>
      );
    
    case 'discuss':
      // Book club discussion view
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <h1 className="text-2xl font-bold mb-4">Discuss: {bookData.title}</h1>
          <p>Book club discussion feature coming soon...</p>
        </div>
      );
    
    case 'vocabulary':
      // Vocabulary list for this book
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <h1 className="text-2xl font-bold mb-4">Vocabulary from: {bookData.title}</h1>
          <p>Vocabulary review feature coming soon...</p>
        </div>
      );
    
    default:
      // Default to reading view
      return (
        <EnhancedReadingPage
          bookId={bookData.id}
          bookTitle={bookData.title}
          bookContent={bookData.content}
          totalPages={bookData.totalPages}
          userLevel={bookData.level}
        />
      );
  }
}

