import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/notifications/bulk-update - Bulk update notifications
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, read } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'read must be a boolean value' },
        { status: 400 }
      );
    }

    // Limit to 100 notifications per bulk operation
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Cannot update more than 100 notifications at once' },
        { status: 400 }
      );
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id // Ensure user can only update their own notifications
      },
      data: {
        read,
        readAt: read ? new Date() : null
      }
    });

    return NextResponse.json({
      message: `Updated ${result.count} notifications`,
      updatedCount: result.count
    });

  } catch (error) {
    logger.error('Error bulk updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}