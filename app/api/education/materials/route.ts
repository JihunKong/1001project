import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch real books from database
    const books = await prisma.book.findMany({
      where: {
        isPublished: true
      },
      select: {
        id: true,
        title: true,
        authorName: true,
        summary: true,
        readingLevel: true,
        category: true,
        tags: true,
        pageCount: true,
        language: true,
        coverImage: true,
        isPremium: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to 50 books for performance
    });

    // Transform books to match the Material interface expected by the frontend
    const materials = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.authorName,
      level: book.readingLevel || 'intermediate',
      category: Array.isArray(book.category) ? book.category[0] : book.category || 'General',
      difficulty: mapReadingLevelToDifficulty(book.readingLevel),
      estimatedReadTime: book.pageCount ? Math.ceil(book.pageCount * 2) : 15, // Estimate 2 minutes per page
      type: 'book' as const,
      progress: 0, // Will be populated with actual progress if needed
      topics: book.tags || [],
      language: book.language,
      coverImage: book.coverImage,
      isPremium: book.isPremium
    }));

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
  }
}

// Helper function to map reading levels to difficulty
function mapReadingLevelToDifficulty(level: string | null): 'easy' | 'medium' | 'hard' | 'challenge' {
  if (!level) return 'medium';
  
  const lowerLevel = level.toLowerCase();
  if (lowerLevel.includes('beginner') || lowerLevel.includes('easy')) return 'easy';
  if (lowerLevel.includes('intermediate') || lowerLevel.includes('medium')) return 'medium';
  if (lowerLevel.includes('advanced') || lowerLevel.includes('hard')) return 'hard';
  if (lowerLevel.includes('challenge') || lowerLevel.includes('expert')) return 'challenge';
  
  return 'medium';
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is teacher or admin
    if (session.user?.role !== 'TEACHER' && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, content, level, category, topics } = body;

    // Validate required fields
    if (!title || !content || !level) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new book in database
    const newBook = await prisma.book.create({
      data: {
        title,
        authorName: author || 'Unknown',
        content,
        readingLevel: level,
        category: Array.isArray(category) ? category : [category || 'General'],
        tags: topics || [],
        language: 'en',
        isPublished: true,
        isPremium: false,
        pageCount: Math.ceil(content.split(' ').length / 250), // Estimate page count (250 words per page)
        createdBy: session.user.id
      }
    });

    // Transform to match Material interface
    const material = {
      id: newBook.id,
      title: newBook.title,
      author: newBook.authorName,
      content: newBook.content,
      level: newBook.readingLevel || 'intermediate',
      category: Array.isArray(newBook.category) ? newBook.category[0] : newBook.category || 'General',
      topics: newBook.tags || [],
      vocabulary: [], // Will be extracted later
      questions: [] // Will be generated later
    };

    return NextResponse.json({ message: 'Material added successfully', material });
  } catch (error) {
    console.error('Error adding material:', error);
    return NextResponse.json({ error: 'Failed to add material' }, { status: 500 });
  }
}