import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assignmentId } = await params;

    const assignment = await prisma.bookAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          select: {
            id: true,
            teacherId: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: { studentId: true },
            },
          },
        },
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const isTeacher = assignment.class.teacherId === session.user.id;
    const isStudent = assignment.class.enrollments.some(
      e => e.studentId === session.user.id
    );

    if (!isTeacher && !isStudent && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const comments = await prisma.assignmentComment.findMany({
      where: { assignmentId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      comments,
      assignment: {
        id: assignment.id,
        bookTitle: assignment.book.title,
        dueDate: assignment.dueDate,
        instructions: assignment.instructions,
      },
    });
  } catch (error) {
    console.error('Error fetching assignment comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only teachers can post comments' },
        { status: 403 }
      );
    }

    const { id: assignmentId } = await params;
    const body = await request.json();

    const validation = commentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const assignment = await prisma.bookAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          select: {
            id: true,
            teacherId: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.class.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only comment on your own class assignments' },
        { status: 403 }
      );
    }

    const comment = await prisma.assignmentComment.create({
      data: {
        assignmentId,
        teacherId: session.user.id,
        content: validation.data.content,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignment comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assignmentId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const comment = await prisma.assignmentComment.findUnique({
      where: { id: commentId },
      include: {
        assignment: {
          select: {
            id: true,
            class: {
              select: {
                teacherId: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.assignmentId !== assignmentId) {
      return NextResponse.json({ error: 'Comment does not belong to this assignment' }, { status: 400 });
    }

    const isOwner = comment.teacherId === session.user.id;
    const isClassTeacher = comment.assignment.class.teacherId === session.user.id;

    if (!isOwner && !isClassTeacher && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.assignmentComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
