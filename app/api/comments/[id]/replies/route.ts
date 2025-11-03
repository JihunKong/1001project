import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: parentCommentId } = await params;

    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      include: {
        textSubmission: {
          include: {
            author: true
          }
        }
      }
    });

    if (!parentComment) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isAuthor = parentComment.textSubmission.authorId === session.user.id;
    const isStoryManager = userRole === 'STORY_MANAGER' || userRole === 'ADMIN';
    const isBookManager = userRole === 'BOOK_MANAGER' || userRole === 'ADMIN';
    const isContentAdmin = userRole === 'CONTENT_ADMIN' || userRole === 'ADMIN';

    if (!isAuthor && !isStoryManager && !isBookManager && !isContentAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    const reply = await prisma.comment.create({
      data: {
        textSubmissionId: parentComment.textSubmissionId,
        authorId: session.user.id,
        content,
        parentId: parentCommentId,
        status: parentComment.status
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({ reply }, { status: 201 });

  } catch (error) {
    logger.error('Error creating reply', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
