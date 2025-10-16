import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TextSubmissionStatus, UserRole } from '@prisma/client';

// GET /api/story-manager/stats - Get story manager statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a story manager, content admin, or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const allowedRoles: UserRole[] = [UserRole.STORY_MANAGER, UserRole.CONTENT_ADMIN, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get counts for different submission statuses
    const [
      pendingReview,
      reviewInProgress,
      approved,
      needsRevision,
      totalReviewed,
      totalSubmissions
    ] = await Promise.all([
      // Pending review (new submissions)
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.PENDING
        }
      }),

      // Currently in review by story managers
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.STORY_REVIEW
        }
      }),

      // Approved by story managers
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.STORY_APPROVED
        }
      }),

      // Needs revision based on story manager feedback
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.NEEDS_REVISION
        }
      }),

      // Total reviewed (approved + rejected + needs revision)
      prisma.textSubmission.count({
        where: {
          status: {
            in: [
              TextSubmissionStatus.STORY_APPROVED,
              TextSubmissionStatus.REJECTED,
              TextSubmissionStatus.NEEDS_REVISION,
              TextSubmissionStatus.PUBLISHED
            ]
          }
        }
      }),

      // Total submissions
      prisma.textSubmission.count()
    ]);

    const stats = {
      pendingReview,
      reviewInProgress,
      approved,
      needsRevision,
      totalReviewed,
      totalSubmissions,
      // Additional metrics
      reviewProgress: totalSubmissions > 0 ? Math.round((totalReviewed / totalSubmissions) * 100) : 0
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching story manager stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}