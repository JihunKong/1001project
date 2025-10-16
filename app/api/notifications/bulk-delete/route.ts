import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/notifications/bulk-delete - Bulk delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Limit to 100 notifications per bulk operation
    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Cannot delete more than 100 notifications at once' },
        { status: 400 }
      );
    }

    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId: session.user.id // Ensure user can only delete their own notifications
      }
    });

    return NextResponse.json({
      message: `Deleted ${result.count} notifications`,
      deletedCount: result.count
    });

  } catch (error) {
    logger.error('Error bulk deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}