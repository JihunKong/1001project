import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: {
          in: ['WRITER', 'ACHIEVEMENT']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    const activities = notifications.map((notification) => {
      const metadata = notification.data as Record<string, any> | null;

      const activityType = notification.type === 'WRITER' && metadata?.feedback
        ? 'COMMENT'
        : notification.type === 'WRITER' && metadata?.newStatus
        ? 'STATUS_CHANGE'
        : 'ACHIEVEMENT';

      return {
        id: notification.id,
        type: activityType,
        createdAt: notification.createdAt.toISOString(),
        author: metadata?.reviewerName ? {
          id: metadata.reviewerId || 'unknown',
          name: metadata.reviewerName,
          image: metadata.reviewerImage || null
        } : null,
        content: metadata?.feedback || notification.message,
        submissionId: metadata?.submissionId || null,
        submissionTitle: metadata?.submissionTitle || null,
        oldStatus: metadata?.oldStatus || null,
        newStatus: metadata?.newStatus || null,
        achievementName: metadata?.achievementName || null
      };
    });

    return NextResponse.json(
      { activities },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
