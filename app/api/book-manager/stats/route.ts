import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TextSubmissionStatus, UserRole } from '@prisma/client';

// GET /api/book-manager/stats - Get book manager statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a book manager, content admin, or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const allowedRoles: UserRole[] = [UserRole.BOOK_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get counts for different submission statuses and book decisions
    const [
      awaitingDecision,
      formatReview,
      bookFormat,
      textFormat,
      collectionFormat,
      totalDecisions,
      totalSubmissions
    ] = await Promise.all([
      // Stories approved by story managers awaiting format decision
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.STORY_APPROVED
        }
      }),

      // Stories currently in format review by book managers
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.FORMAT_REVIEW
        }
      }),

      // Stories decided for book format
      prisma.textSubmission.count({
        where: {
          bookDecision: 'BOOK'
        }
      }),

      // Stories decided for text format
      prisma.textSubmission.count({
        where: {
          bookDecision: 'TEXT'
        }
      }),

      // Stories decided for collection format
      prisma.textSubmission.count({
        where: {
          bookDecision: 'COLLECTION'
        }
      }),

      // Total decisions made (any book decision)
      prisma.textSubmission.count({
        where: {
          bookDecision: {
            not: null
          }
        }
      }),

      // Total submissions that reached book manager stage
      prisma.textSubmission.count({
        where: {
          status: {
            in: [
              TextSubmissionStatus.STORY_APPROVED,
              TextSubmissionStatus.FORMAT_REVIEW,
              TextSubmissionStatus.CONTENT_REVIEW,
              TextSubmissionStatus.PUBLISHED
            ]
          }
        }
      })
    ]);

    const stats = {
      awaitingDecision,
      formatReview,
      bookFormat,
      textFormat,
      collectionFormat,
      totalDecisions,
      totalSubmissions,
      // Additional metrics
      decisionProgress: totalSubmissions > 0 ? Math.round((totalDecisions / totalSubmissions) * 100) : 0,
      // Breakdown of format decisions
      formatDistribution: {
        book: bookFormat,
        text: textFormat,
        collection: collectionFormat
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching book manager stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}