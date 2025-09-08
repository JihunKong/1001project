import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Try to fetch actual books from database first
    try {
      const books = await prisma.book.findMany({
        where: { 
          isPublished: true
        },
        select: {
          id: true,
          title: true,
          authorName: true,
          category: true,
          tags: true,
          readingLevel: true,
          summary: true,
          viewCount: true,
          rating: true,
          pageCount: true
        },
        orderBy: [
          { rating: 'desc' },
          { viewCount: 'desc' }
        ],
        take: 12
      });

      if (books.length > 0) {
        // Transform books to recommendation format
        const recommendations = books.map((book, index) => ({
          id: book.id,
          title: book.title,
          author: book.authorName,
          reason: generateReason(book, index),
          score: 0.9 - (index * 0.05),
          type: 'book' as const,
          difficulty: mapReadingLevel(book.readingLevel),
          estimatedReadTime: Math.ceil((book.pageCount || 20) * 1.5), // rough estimate
          category: Array.isArray(book.category) ? book.category : (book.category ? [book.category] : ['General']),
          tags: book.tags || []
        }));

        return NextResponse.json({
          success: true,
          recommendations,
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.log('Database query failed, using defaults:', dbError);
    }

    // Return empty if no books in database
    return NextResponse.json({
      success: true,
      recommendations: [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // Return empty on error
    return NextResponse.json({
      success: true,
      recommendations: [],
      timestamp: new Date().toISOString()
    });
  }
}

function mapReadingLevel(level?: string | null): 'easy' | 'medium' | 'hard' | 'challenge' {
  if (!level) return 'easy';
  const lowerLevel = level.toLowerCase();
  if (lowerLevel.includes('begin') || lowerLevel.includes('easy')) return 'easy';
  if (lowerLevel.includes('adv') || lowerLevel.includes('hard')) return 'hard';
  if (lowerLevel.includes('challenge') || lowerLevel.includes('expert')) return 'challenge';
  return 'medium';
}

function generateReason(book: any, index: number): string {
  const reasons = [
    'Recommended for you',
    'Popular with readers',
    'Highly rated',
    'Great for beginners',
    'Easy to understand',
    'Fun and engaging',
    'Learn new vocabulary',
    'Interesting story',
    'Quick read',
    'Educational content',
    'Adventure awaits',
    'Discover something new'
  ];
  
  // Generate reason based on book properties
  if (book.rating && book.rating >= 4.5) {
    return `★ ${book.rating.toFixed(1)} rating • ${reasons[2]}`;
  }
  if (book.viewCount && book.viewCount > 100) {
    return `${book.viewCount} readers • ${reasons[1]}`;
  }
  if (book.readingLevel?.toLowerCase().includes('begin')) {
    return `${reasons[3]} • ${reasons[4]}`;
  }
  
  return `${reasons[index % reasons.length]} • ${reasons[(index + 5) % reasons.length]}`;
}