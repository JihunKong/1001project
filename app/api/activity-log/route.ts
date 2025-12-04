import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MANAGER_ROLES = ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN', 'ADMIN'];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!MANAGER_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const days = parseInt(searchParams.get('days') || '7');

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const activities = await prisma.workflowHistory.findMany({
      where: {
        createdAt: {
          gte: dateThreshold
        }
      },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        textSubmission: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        volunteerSubmission: {
          select: {
            id: true,
            title: true,
            volunteer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const formattedActivities = activities.map(activity => {
      const submission = activity.textSubmission || activity.volunteerSubmission;
      const submissionType = activity.textSubmission ? 'text' : 'volunteer';

      return {
        id: activity.id,
        fromStatus: activity.fromStatus,
        toStatus: activity.toStatus,
        comment: activity.comment,
        createdAt: activity.createdAt.toISOString(),
        performedBy: {
          id: activity.performedBy.id,
          name: activity.performedBy.name,
          email: activity.performedBy.email,
          role: activity.performedBy.role
        },
        submission: submission ? {
          id: submission.id,
          title: submission.title,
          type: submissionType,
          authorName: 'author' in submission
            ? submission.author?.name
            : 'volunteer' in submission
              ? submission.volunteer?.name
              : null
        } : null
      };
    });

    return NextResponse.json({
      activities: formattedActivities,
      count: formattedActivities.length
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    );
  }
}
