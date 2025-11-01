import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications/NotificationService';
import { NotificationType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: submissionId } = await params;

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isAuthor = submission.authorId === session.user.id;
    const isStoryManager = userRole === 'STORY_MANAGER' || userRole === 'ADMIN';
    const isBookManager = userRole === 'BOOK_MANAGER' || userRole === 'ADMIN';
    const isContentAdmin = userRole === 'CONTENT_ADMIN' || userRole === 'ADMIN';

    if (!isAuthor && !isStoryManager && !isBookManager && !isContentAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        textSubmissionId: submissionId,
        parentId: null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ comments }, { status: 200 });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: submissionId } = await params;

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        title: true,
        authorId: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const userRole = session.user.role;
    const isStoryManager = userRole === 'STORY_MANAGER' || userRole === 'ADMIN';
    const isBookManager = userRole === 'BOOK_MANAGER' || userRole === 'ADMIN';
    const isContentAdmin = userRole === 'CONTENT_ADMIN' || userRole === 'ADMIN';

    if (!isStoryManager && !isBookManager && !isContentAdmin) {
      return NextResponse.json({ error: 'Only reviewers can add comments' }, { status: 403 });
    }

    const body = await request.json();
    const { content, highlightedText, startOffset, endOffset } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        textSubmissionId: submissionId,
        authorId: session.user.id,
        content,
        highlightedText,
        startOffset: startOffset !== undefined ? startOffset : null,
        endOffset: endOffset !== undefined ? endOffset : null,
        status: 'OPEN'
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

    try {
      const notificationService = new NotificationService();
      await notificationService.createNotification(
        submission.authorId,
        NotificationType.WRITER,
        'New Feedback on Your Story',
        `${session.user.name || 'Reviewer'} left feedback on "${submission.title}"`,
        {
          submissionId: submission.id,
          submissionTitle: submission.title,
          reviewerName: session.user.name || 'Unknown Reviewer',
          feedback: content.substring(0, 100),
          commentId: comment.id
        }
      );
    } catch (notificationError) {
      console.error('Failed to create notification for comment:', notificationError);
    }

    return NextResponse.json({ comment }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
