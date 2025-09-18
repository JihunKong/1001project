import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Default easy-level books for beginners
const DEFAULT_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    reason: 'Perfect for beginners • Timeless classic',
    score: 0.95,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 15,
    category: ['Fiction', 'Adventure'],
    tags: ['classic', 'friendship', 'adventure'],
    coverImage: '/books/little-prince/cover.png',
    progress: 0
  },
  {
    id: 'rec-2',
    title: 'Charlotte\'s Web',
    author: 'E.B. White',
    reason: 'Easy vocabulary • Heartwarming story',
    score: 0.92,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 20,
    category: ['Fiction', 'Animals'],
    tags: ['friendship', 'animals', 'farm'],
    coverImage: '/books/charlottes-web/cover.png',
    progress: 0
  },
  {
    id: 'rec-3',
    title: 'The Cat in the Hat',
    author: 'Dr. Seuss',
    reason: 'Simple words • Fun rhymes',
    score: 0.90,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 8,
    category: ['Children', 'Poetry'],
    tags: ['rhymes', 'fun', 'easy'],
    coverImage: '/books/cat-in-hat/cover.png',
    progress: 0
  },
  {
    id: 'rec-4',
    title: 'Green Eggs and Ham',
    author: 'Dr. Seuss',
    reason: 'Only 50 different words • Great for beginners',
    score: 0.88,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 5,
    category: ['Children', 'Food'],
    tags: ['simple', 'food', 'repetition'],
    coverImage: '/books/green-eggs/cover.png',
    progress: 0
  },
  {
    id: 'rec-5',
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    reason: 'Learn days & numbers • Colorful illustrations',
    score: 0.87,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 6,
    category: ['Children', 'Education'],
    tags: ['counting', 'days', 'nature'],
    coverImage: '/books/hungry-caterpillar/cover.png',
    progress: 0
  },
  {
    id: 'rec-6',
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    reason: 'Adventure story • Simple language',
    score: 0.85,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 10,
    category: ['Adventure', 'Fantasy'],
    tags: ['imagination', 'adventure', 'monsters'],
    coverImage: '/books/wild-things/cover.png',
    progress: 0
  },
  {
    id: 'rec-7',
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    reason: 'Calming bedtime story • Repetitive patterns',
    score: 0.83,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 4,
    category: ['Bedtime', 'Children'],
    tags: ['bedtime', 'calm', 'routine'],
    coverImage: '/books/goodnight-moon/cover.png',
    progress: 0
  },
  {
    id: 'rec-8',
    title: 'The Rainbow Fish',
    author: 'Marcus Pfister',
    reason: 'Learn about sharing • Beautiful illustrations',
    score: 0.82,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 7,
    category: ['Children', 'Moral'],
    tags: ['sharing', 'friendship', 'ocean'],
    coverImage: '/books/rainbow-fish/cover.png',
    progress: 0
  },
  {
    id: 'rec-9',
    title: 'Brown Bear, Brown Bear',
    author: 'Bill Martin Jr.',
    reason: 'Learn colors & animals • Repetitive structure',
    score: 0.80,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 5,
    category: ['Education', 'Animals'],
    tags: ['colors', 'animals', 'patterns'],
    coverImage: '/books/brown-bear/cover.png',
    progress: 0
  },
  {
    id: 'rec-10',
    title: 'Curious George',
    author: 'H.A. Rey',
    reason: 'Fun adventures • Easy to follow',
    score: 0.78,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 12,
    category: ['Adventure', 'Animals'],
    tags: ['monkey', 'curiosity', 'adventure'],
    coverImage: '/books/curious-george/cover.png',
    progress: 0
  },
  {
    id: 'rec-11',
    title: 'If You Give a Mouse a Cookie',
    author: 'Laura Numeroff',
    reason: 'Cause and effect • Circular story',
    score: 0.76,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 8,
    category: ['Children', 'Humor'],
    tags: ['humor', 'sequence', 'mouse'],
    coverImage: '/books/mouse-cookie/cover.png',
    progress: 0
  },
  {
    id: 'rec-12',
    title: 'The Giving Tree',
    author: 'Shel Silverstein',
    reason: 'Simple but profound • Life lessons',
    score: 0.75,
    type: 'story' as const,
    difficulty: 'easy' as const,
    estimatedReadTime: 10,
    category: ['Children', 'Philosophy'],
    tags: ['giving', 'life', 'tree'],
    coverImage: '/books/giving-tree/cover.png',
    progress: 0
  }
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Allow both authenticated and unauthenticated users
    // to see recommendations (for demo purposes)
    
    // Return default recommendations
    // In production, this would be personalized based on user history
    return NextResponse.json({
      success: true,
      recommendations: DEFAULT_RECOMMENDATIONS,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating simple recommendations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Return minimal recommendations even on error
        recommendations: DEFAULT_RECOMMENDATIONS.slice(0, 3)
      },
      { status: 500 }
    );
  }
}