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
        error: 'Submission is not ready for final approval' 
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
        if (metadata?.scheduled) {
          newStatus = 'SCHEDULED';
          updateData.scheduledPublishDate = metadata.publishDate || null;
        } else {
          newStatus = 'PUBLISHED';
          updateData.publishedAt = new Date();
        }
        break;
      case 'request_revision':
        newStatus = 'NEEDS_REVISION';
        break;
      case 'reject':
        newStatus = 'ARCHIVED';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action for content admin' }, { status: 400 });
    }

    updateData.status = newStatus;

    // Update submission
    const updatedSubmission = await prisma.textSubmission.update({
      where: { id: submissionId },
      data: updateData
    });

    // Create workflow transition record
    const transitionComment = metadata?.scheduled 
      ? `${feedback || ''} Scheduled for: ${metadata.publishDate || 'TBD'}`.trim()
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

    // If published, create book record for library
    if (newStatus === 'PUBLISHED') {
      await createBookFromSubmission(submission, updatedSubmission);
    }

    // TODO: Send notification to author about final decision
    // TODO: If published, trigger AI enhancement pipeline
    // This could be implemented later with email notifications and queue systems

    return NextResponse.json({
      message: 'Final approval completed successfully',
      submission: updatedSubmission,
      transition: {
        fromStatus: submission.status,
        toStatus: newStatus,
        performedBy: session.user.name,
        timestamp: new Date(),
        published: newStatus === 'PUBLISHED',
        scheduled: newStatus === 'SCHEDULED'
      }
    });

  } catch (error) {
    console.error('Error processing final approval:', error);
    return NextResponse.json({ 
      error: 'Failed to process final approval' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function createBookFromSubmission(originalSubmission: any, updatedSubmission: any) {
  try {
    // Create book record in library
    const book = await prisma.book.create({
      data: {
        title: originalSubmission.title,
        subtitle: null,
        authorName: originalSubmission.author.name,
        authorAge: null, // Could be extracted from author profile
        authorLocation: null, // Could be extracted from author profile
        summary: originalSubmission.summary,
        content: originalSubmission.contentMd,
        language: originalSubmission.language,
        readingLevel: originalSubmission.ageRange || 'All Ages',
        category: originalSubmission.category,
        tags: originalSubmission.tags,
        format: 'TEXT', // Since it's from text submission
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        primaryTextId: originalSubmission.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Link the submission to the created book
    await prisma.textSubmission.update({
      where: { id: originalSubmission.id },
      data: {
        publishedBookId: book.id
      }
    });

    console.log(`Created book ${book.id} from text submission ${originalSubmission.id}`);
  } catch (error) {
    console.error('Error creating book from submission:', error);
    // Don't throw here - the approval should still succeed even if book creation fails
  }
}