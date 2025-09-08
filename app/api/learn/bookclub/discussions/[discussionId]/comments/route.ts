import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse, BookClubComment } from '@/types/learning';

// POST /api/learn/bookclub/discussions/[discussionId]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { content, parentId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Check if discussion exists
    const discussion = await prisma.bookClubDiscussion.findUnique({
      where: { id: params.discussionId },
    });

    if (!discussion) {
      return NextResponse.json(
        { success: false, error: 'Discussion not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.bookClubComment.create({
      data: {
        userId: session.user.id,
        discussionId: params.discussionId,
        content,
        parentId: parentId || null,
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
          totalXp: userStats.totalXp + 10, // 10 XP for commenting
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: comment,
    } as ApiResponse<BookClubComment>);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// GET /api/learn/bookclub/discussions/[discussionId]/comments - Get comments
export async function GET(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const comments = await prisma.bookClubComment.findMany({
      where: { discussionId: params.discussionId },
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
      orderBy: { createdAt: 'asc' },
    });

    // Build comment tree
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return NextResponse.json({
      success: true,
      data: rootComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}