import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const language = searchParams.get('language');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause for filtering
    const where: any = {
      // Only get books that have text content (not just PDFs)
      OR: [
        { content: { not: null } },
        { 
          primaryTextId: { not: null },
          // Also include books created from published text submissions
          TextSubmission: {
            status: 'PUBLISHED'
          }
        }
      ],
      // Exclude books that are only PDFs without text content
      NOT: {
        content: null,
        primaryTextId: null
      }
    };

    // Apply filters
    if (language && language !== 'all') {
      where.language = language;
    }

    if (category && category !== 'all') {
      where.category = {
        has: category
      };
    }

    // Map difficulty to reading level
    if (difficulty && difficulty !== 'all') {
      const readingLevelMap: { [key: string]: string[] } = {
        'beginner': ['Grade 1-3', 'Grade 1-5', 'Elementary', 'Beginner'],
        'intermediate': ['Grade 4-6', 'Grade 6-8', 'Middle School', 'Intermediate'],
        'advanced': ['Grade 7-9', 'Grade 9-12', 'High School', 'Advanced', 'College Level']
      };
      
      if (readingLevelMap[difficulty]) {
        where.readingLevel = {
          in: readingLevelMap[difficulty]
        };
      }
    }

    const books = await prisma.book.findMany({
      where,
      select: {
        id: true,
        title: true,
        subtitle: true,
        summary: true,
        content: true,
        authorName: true,
        authorAge: true,
        authorLocation: true,
        language: true,
        readingLevel: true,
        category: true,
        tags: true,
        pageCount: true,
        wordCount: true,
        estimatedReadingTime: true,
        primaryTextId: true,
        createdAt: true,
        updatedAt: true,
        TextSubmission: {
          select: {
            contentMd: true,
            summary: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Transform books into text stories format
    const textStories = books.map(book => {
      // Use content from book or from linked text submission
      const content = book.content || book.TextSubmission?.contentMd || '';
      const summary = book.summary || book.TextSubmission?.summary || '';
      
      // Calculate word count if not available
      let wordCount = book.wordCount;
      if (!wordCount && content) {
        wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      }
      
      // Calculate estimated reading time if not available
      let estimatedReadingTime = book.estimatedReadingTime;
      if (!estimatedReadingTime && wordCount) {
        // Average reading speed: 200 words per minute
        estimatedReadingTime = Math.ceil(wordCount / 200);
      }

      // Determine difficulty based on reading level
      let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
      if (book.readingLevel) {
        const level = book.readingLevel.toLowerCase();
        if (level.includes('grade 1') || level.includes('grade 2') || level.includes('grade 3') || 
            level.includes('elementary') || level.includes('beginner')) {
          difficulty = 'beginner';
        } else if (level.includes('grade 7') || level.includes('grade 8') || level.includes('grade 9') ||
                   level.includes('high') || level.includes('advanced') || level.includes('college')) {
          difficulty = 'advanced';
        }
      }

      return {
        id: book.id,
        title: book.title,
        authorName: book.authorName,
        authorAge: book.authorAge,
        authorLocation: book.authorLocation,
        language: book.language,
        readingLevel: book.readingLevel,
        category: book.category || [],
        tags: book.tags || [],
        content: content,
        summary: summary,
        estimatedReadingTime: estimatedReadingTime || 5,
        wordCount: wordCount || 0,
        difficulty
      };
    }).filter(story => story.content && story.content.length > 100); // Only include stories with substantial content

    return NextResponse.json({
      stories: textStories,
      total: textStories.length
    });

  } catch (error) {
    console.error('Error fetching text stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}