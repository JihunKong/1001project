import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, BookClubDiscussion } from '@/types/learning';

// GET /api/learn/bookclub/discussions - Get discussions for a book
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      prisma.bookClubPost.findMany({
        where: { 
          club: { bookId },
          parentId: null // Top-level posts are discussions
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bookClubPost.count({ where: { 
        club: { bookId },
        parentId: null 
      } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        discussions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

// POST /api/learn/bookclub/discussions - Create a new discussion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { bookId, title, content, tags } = await request.json();

    if (!bookId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Book ID, title, and content are required' },
        { status: 400 }
      );
    }

    // Find or create a book club for this book
    let bookClub = await prisma.bookClub.findFirst({
      where: { bookId }
    });
    
    if (!bookClub) {
      bookClub = await prisma.bookClub.create({
        data: {
          bookId,
          creatorId: session.user.id,
          name: `${title} Discussion`,
          isActive: true,
          isPublic: true,
        }
      });
    }

    const discussion = await prisma.bookClubPost.create({
      data: {
        userId: session.user.id,
        clubId: bookClub.id,
        content: `# ${title}\n\n${content}`,
        likes: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: true,
      },
    });

    // Update user stats
    const userStats = await prisma.userStats.findUnique({
      where: { userId: session.user.id },
    });

    if (userStats) {
      await prisma.userStats.update({
        where: { userId: session.user.id },
        data: {
          xp: userStats.xp + 25, // 25 XP for starting a discussion
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: discussion,
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}