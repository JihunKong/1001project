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
    if (!session || session.user.role !== UserRole.BOOK_MANAGER) {
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
    if (submission.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Submission is not ready for format decision' 
      }, { status: 400 });
    }

    // Determine new status based on action and metadata
    let newStatus: string;
    let updateData: any = {
      reviewNotes: feedback || null,
      updatedAt: new Date()
    };

    switch (action) {
      case 'approve':
        // Keep status as APPROVED but add publication format metadata
        newStatus = 'APPROVED';
        if (metadata?.publicationFormat) {
          updateData.publicationFormat = metadata.publicationFormat;
        }
        break;
      case 'request_revision':
        newStatus = 'NEEDS_REVISION';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action for book manager' }, { status: 400 });
    }

    updateData.status = newStatus;

    // Update submission
    const updatedSubmission = await prisma.textSubmission.update({
      where: { id: submissionId },
      data: updateData
    });

    // Create workflow transition record
    const transitionComment = metadata?.publicationFormat 
      ? `${feedback || ''} Format: ${metadata.publicationFormat}`.trim()
      : feedback || null;

    await prisma.workflowTransition.create({
      data: {
        textSubmissionId: submissionId,
        fromStatus: submission.status,
        toStatus: newStatus,
        comment: transitionComment,
        performedById: session.user.id,
        performedBy: {
          connect: { id: session.user.id }
        }
      }
    });

    // TODO: Send notification to author and content admin about format decision
    // This could be implemented later with email notifications

    return NextResponse.json({
      message: 'Format decision completed successfully',
      submission: updatedSubmission,
      transition: {
        fromStatus: submission.status,
        toStatus: newStatus,
        performedBy: session.user.name,
        timestamp: new Date(),
        formatDecision: metadata?.publicationFormat || null
      }
    });

  } catch (error) {
    console.error('Error processing format decision:', error);
    return NextResponse.json({ 
      error: 'Failed to process format decision' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}