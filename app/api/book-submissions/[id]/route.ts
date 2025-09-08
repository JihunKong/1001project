import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { BookSubmissionStatus } from '@prisma/client';
import path from 'path';
import { promises as fs } from 'fs';

// GET: Get a specific submission
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submission = await prisma.bookSubmission.findUnique({
      where: { id: params.id },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true, email: true }
        },
        coordinator: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        },
        publishedBook: true
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}

// PATCH: Update submission status (review, approve, reject)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = await req.json();
    const { action, notes, rejectionReason } = data;

    const submission = await prisma.bookSubmission.findUnique({
      where: { id: params.id }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'submit_for_review':
        if (submission.submittedById !== user.id) {
          return NextResponse.json({ error: 'Only submitter can submit for review' }, { status: 403 });
        }
        updateData.status = 'PENDING_REVIEW';
        break;

      case 'review':
        if (user.role !== 'VOLUNTEER' && user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        if (submission.submittedById === user.id) {
          return NextResponse.json({ error: 'Cannot review your own submission' }, { status: 403 });
        }
        updateData.status = 'REVIEWED';
        updateData.reviewedById = user.id;
        updateData.reviewedAt = new Date();
        updateData.reviewNotes = notes;
        break;

      case 'request_coordinator':
        if (submission.status !== 'REVIEWED') {
          return NextResponse.json({ error: 'Submission must be reviewed first' }, { status: 400 });
        }
        updateData.status = 'PENDING_COORDINATOR';
        break;

      case 'approve_coordinator':
        if (user.role !== 'VOLUNTEER' && user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        updateData.status = 'APPROVED_COORDINATOR';
        updateData.coordinatorId = user.id;
        updateData.coordinatorApprovedAt = new Date();
        updateData.coordinatorNotes = notes;
        break;

      case 'request_admin':
        if (submission.status !== 'APPROVED_COORDINATOR') {
          return NextResponse.json({ error: 'Requires coordinator approval first' }, { status: 400 });
        }
        updateData.status = 'PENDING_ADMIN';
        break;

      case 'approve_admin':
        if (user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Only admins can give final approval' }, { status: 403 });
        }
        updateData.status = 'PUBLISHED';
        updateData.adminId = user.id;
        updateData.adminApprovedAt = new Date();
        updateData.adminNotes = notes;
        updateData.publishedAt = new Date();
        
        // Create the book entry
        await publishBook(submission);
        break;

      case 'reject':
        updateData.status = 'REJECTED';
        updateData.rejectionReason = rejectionReason;
        if (submission.status === 'PENDING_REVIEW' || submission.status === 'REVIEWED') {
          updateData.reviewedById = user.id;
          updateData.reviewedAt = new Date();
        } else if (submission.status === 'PENDING_COORDINATOR') {
          updateData.coordinatorId = user.id;
          updateData.coordinatorApprovedAt = new Date();
        } else if (submission.status === 'PENDING_ADMIN') {
          updateData.adminId = user.id;
          updateData.adminApprovedAt = new Date();
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedSubmission = await prisma.bookSubmission.update({
      where: { id: params.id },
      data: updateData,
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true, email: true }
        },
        coordinator: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
}

// Helper function to publish book
async function publishBook(submission: any) {
  try {
    // Create book directory
    const bookId = submission.id.replace('clh', 'book');
    const bookDir = path.join(process.cwd(), 'public', 'books', bookId);
    await fs.mkdir(bookDir, { recursive: true });

    // Copy submission files to book directory
    const submissionDir = path.join(process.cwd(), 'public', 'books', 'submissions', submission.filePath);
    
    // Determine the content file name based on format
    let contentFileName = 'main.pdf';
    switch (submission.format) {
      case 'md':
        contentFileName = 'content.md';
        break;
      case 'html':
        contentFileName = 'content.html';
        break;
      case 'txt':
        contentFileName = 'content.txt';
        break;
    }

    // Copy main content file
    const sourceFile = path.join(submissionDir, submission.filePath);
    const destFile = path.join(bookDir, contentFileName);
    
    try {
      await fs.copyFile(sourceFile, destFile);
    } catch (err) {
      console.log('File copy skipped:', err);
    }

    // Copy cover image if exists
    if (submission.coverImagePath) {
      const sourceCover = path.join(submissionDir, submission.coverImagePath);
      const destCover = path.join(bookDir, 'cover.jpg');
      try {
        await fs.copyFile(sourceCover, destCover);
      } catch (err) {
        console.log('Cover copy skipped:', err);
      }
    }

    // Create metadata.json
    const metadata = {
      title: submission.title,
      author: submission.authorName,
      level: submission.readingLevel,
      tags: submission.tags,
      pageCount: submission.pageCount,
      language: submission.language,
      ageRange: submission.ageRange,
      categories: submission.categories
    };
    
    await fs.writeFile(
      path.join(bookDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Create book entry in database
    const book = await prisma.book.create({
      data: {
        title: submission.title,
        authorName: submission.authorName,
        authorAge: submission.authorAge,
        authorLocation: submission.authorLocation,
        summary: submission.summary,
        language: submission.language,
        ageRange: submission.ageRange,
        readingLevel: submission.readingLevel,
        category: submission.categories,
        tags: submission.tags,
        pageCount: submission.pageCount,
        isPublished: true,
        publishedAt: new Date(),
        visibility: 'PUBLIC',
        isPremium: false,
        coverImage: submission.coverImagePath ? `/books/${bookId}/cover.jpg` : null,
        pdfKey: submission.format === 'pdf' ? `/books/${bookId}/main.pdf` : null,
        content: submission.format !== 'pdf' ? 'See file content' : null
      }
    });

    // Link submission to published book
    await prisma.bookSubmission.update({
      where: { id: submission.id },
      data: { publishedBookId: book.id }
    });

    return book;
  } catch (error) {
    console.error('Error publishing book:', error);
    throw error;
  }
}

// DELETE: Delete a submission (only drafts)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const submission = await prisma.bookSubmission.findUnique({
      where: { id: params.id }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Only allow deletion of drafts by the submitter or admin
    if (submission.status !== 'DRAFT' && submission.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Can only delete draft or rejected submissions' },
        { status: 400 }
      );
    }

    if (submission.submittedById !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await prisma.bookSubmission.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    );
  }
}