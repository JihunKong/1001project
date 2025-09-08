import { notFound } from 'next/navigation';
import { EnhancedReadingPage } from '@/components/learn/EnhancedReadingPage';
import { ContentLoader } from '@/lib/content-loader';

interface BookPageProps {
  params: {
    slug: string[];
  };
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
  
  // Load book content using ContentLoader
  const loader = new ContentLoader(bookId);
  const bookContent = await loader.loadContent();
  const coverImage = await loader.getCoverImage();
  const thumbnails = await loader.getThumbnails();
  
  // If content not found, use sample data as fallback
  const bookData = bookContent ? {
    id: bookId,
    title: bookContent.metadata?.title || 'Untitled Book',
    content: bookContent.content,
    format: bookContent.format,
    totalPages: bookContent.metadata?.pageCount || 10,
    category: bookContent.metadata?.tags?.[0] || 'education',
    level: bookContent.metadata?.level || 'B1',
    author: bookContent.metadata?.author || 'Unknown Author',
    coverImage,
    thumbnails
  } : {
    id: bookId,
    title: 'Sample Book Title',
    content: `This is the content of the book. It contains multiple paragraphs with various vocabulary words that will be highlighted based on the student's level.
    
    The learning system uses artificial intelligence to identify difficult words and provide definitions. Students can click on highlighted words to see their meanings and add them to their personal vocabulary list.
    
    As students progress through the book, their reading progress is tracked automatically. They earn XP points for completing pages, learning new words, and taking quizzes.
    
    The book club feature allows students to discuss the content with their classmates and teacher. This collaborative learning environment helps improve comprehension and critical thinking skills.
    
    After completing each chapter, students can take a quiz to test their understanding. The AI generates questions based on the content they've read, ensuring relevant and appropriate assessment.
    
    The gamification system includes achievements, leaderboards, and streaks to keep students motivated. They can see their progress compared to other learners and earn badges for various accomplishments.
    
    This integrated learning approach combines reading, vocabulary building, comprehension testing, and social interaction to create a comprehensive ESL learning experience.`,
    format: 'txt' as const,
    totalPages: 10,
    category: 'education',
    level: 'B1',
    author: 'Sample Author',
    coverImage: null,
    thumbnails: []
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

