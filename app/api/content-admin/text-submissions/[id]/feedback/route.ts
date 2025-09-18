import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CONTENT_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = params.id;
    const { feedback, line } = await request.json();

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }

    // Verify submission exists
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Create feedback record
    const feedbackRecord = await prisma.submissionFeedback.create({
      data: {
        textSubmissionId: submissionId,
        content: feedback.trim(),
        lineNumber: line ? parseInt(line) : null,
        reviewerId: session.user.id,
        reviewer: {
          connect: { id: session.user.id }
        }
      },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Feedback added successfully',
      feedback: {
        id: feedbackRecord.id,
        content: feedbackRecord.content,
        lineNumber: feedbackRecord.lineNumber,
        createdAt: feedbackRecord.createdAt.toISOString(),
        reviewer: feedbackRecord.reviewer
      }
    });

  } catch (error) {
    console.error('Error adding feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to add feedback' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.CONTENT_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = params.id;

    const feedback = await prisma.submissionFeedback.findMany({
      where: { textSubmissionId: submissionId },
      include: {
        reviewer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      feedback: feedback.map(item => ({
        id: item.id,
        content: item.content,
        lineNumber: item.lineNumber,
        createdAt: item.createdAt.toISOString(),
        reviewer: item.reviewer
      }))
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feedback' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}