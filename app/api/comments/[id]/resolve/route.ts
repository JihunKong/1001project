import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        textSubmission: true,
        replies: true
      }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isAuthor = comment.authorId === session.user.id;
    const isSubmissionAuthor = comment.textSubmission.authorId === session.user.id;
    const isReviewer = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'].includes(userRole);

    if (!isAuthor && !isSubmissionAuthor && !isReviewer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { isResolved } = body;

    const status = isResolved ? 'RESOLVED' : 'OPEN';

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        status,
        isResolved,
        resolvedAt: isResolved ? new Date() : null,
        resolvedBy: isResolved ? session.user.id : null
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

    if (comment.replies.length > 0) {
      await prisma.comment.updateMany({
        where: {
          parentId: commentId
        },
        data: {
          status
        }
      });
    }

    return NextResponse.json({ comment: updatedComment }, { status: 200 });

  } catch (error) {
    logger.error('Error resolving comment', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
