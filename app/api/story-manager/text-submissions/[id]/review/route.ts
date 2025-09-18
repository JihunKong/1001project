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
    if (!session || session.user.role !== UserRole.STORY_MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = params.id;
    const { action, feedback, metadata } = await request.json();

    // Validate action
    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get current submission
    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if user can perform this action on current status
    if (submission.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Submission is not in pending status' 
      }, { status: 400 });
    }

    // Determine new status based on action
    let newStatus: string;
    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        break;
      case 'reject':
        newStatus = 'ARCHIVED';
        break;
      case 'request_revision':
        newStatus = 'NEEDS_REVISION';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update submission status and add review notes
    const updatedSubmission = await prisma.textSubmission.update({
      where: { id: submissionId },
      data: {
        status: newStatus,
        reviewNotes: feedback || null,
        updatedAt: new Date()
      }
    });

    // Create workflow transition record
    await prisma.workflowTransition.create({
      data: {
        textSubmissionId: submissionId,
        fromStatus: submission.status,
        toStatus: newStatus,
        comment: feedback || null,
        performedById: session.user.id,
        performedBy: {
          connect: { id: session.user.id }
        }
      }
    });

    // TODO: Send notification to author about status change
    // This could be implemented later with email notifications

    return NextResponse.json({
      message: 'Review action completed successfully',
      submission: updatedSubmission,
      transition: {
        fromStatus: submission.status,
        toStatus: newStatus,
        performedBy: session.user.name,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error processing review action:', error);
    return NextResponse.json({ 
      error: 'Failed to process review action' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}