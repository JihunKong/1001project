import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TextSubmissionStatus, UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

// GET /api/content-admin/stats - Get content admin statistics
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a content admin or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const allowedRoles: UserRole[] = [UserRole.CONTENT_ADMIN, UserRole.ADMIN];
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get counts for different submission statuses
    const [
      awaitingApproval,
      approved,
      published,
      rejected,
      totalReviewed,
      thisWeekApprovals,
      totalSubmissions
    ] = await Promise.all([
      // Stories awaiting final approval from content admin
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.CONTENT_REVIEW
        }
      }),

      // Stories that have been approved by content admin (only published, not rejected)
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.PUBLISHED,
          contentAdminId: {
            not: null
          }
        }
      }),

      // Stories that have been published
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.PUBLISHED,
          publishedAt: {
            not: null
          }
        }
      }),

      // Stories that have been rejected by content admin
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.REJECTED,
          contentAdminId: {
            not: null
          }
        }
      }),

      // Total stories reviewed by content admin
      prisma.textSubmission.count({
        where: {
          contentAdminId: {
            not: null
          }
        }
      }),

      // Stories approved this week
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.PUBLISHED,
          publishedAt: {
            gte: startOfWeek
          }
        }
      }),

      // Total submissions that reached content admin stage
      prisma.textSubmission.count({
        where: {
          status: {
            in: [
              TextSubmissionStatus.CONTENT_REVIEW,
              TextSubmissionStatus.PUBLISHED,
              TextSubmissionStatus.REJECTED
            ]
          }
        }
      })
    ]);

    // Get additional metrics
    const [recentPublications, formatDistribution] = await Promise.all([
      // Recent publications count (last 7 days)
      prisma.textSubmission.count({
        where: {
          status: TextSubmissionStatus.PUBLISHED,
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Distribution by format decision
      prisma.textSubmission.groupBy({
        by: ['bookDecision'],
        where: {
          status: TextSubmissionStatus.PUBLISHED,
          bookDecision: {
            not: null
          }
        },
        _count: {
          bookDecision: true
        }
      })
    ]);

    const stats = {
      awaitingApproval,
      approved,
      published,
      rejected,
      totalReviewed,
      thisWeekApprovals,
      totalSubmissions,
      recentPublications,
      // Additional metrics
      approvalRate: approved > 0 ? Math.round((published / approved) * 100) : 0,
      reviewProgress: totalSubmissions > 0 ? Math.round((totalReviewed / totalSubmissions) * 100) : 0,
      // Format distribution of published stories
      formatDistribution: formatDistribution.reduce((acc, item) => {
        acc[item.bookDecision?.toLowerCase() || 'unknown'] = item._count.bookDecision;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json(stats);

  } catch (error) {
    logger.error('Error fetching content admin stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}