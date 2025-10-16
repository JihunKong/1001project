import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  statusChanges: boolean;
  feedback: boolean;
  deadlines: boolean;
  achievements: boolean;
  reviewAssignments: boolean;
  digestFrequency: 'never' | 'daily' | 'weekly';
}

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current preferences from profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        emailNotifications: true,
        pushNotifications: true
      }
    });

    // Get extended preferences from user metadata (stored in JSON field)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true
      }
    });

    // Get notification preferences from a dedicated table if exists, otherwise defaults
    let notificationPrefs: any = {};
    try {
      const existingPrefs = await prisma.$queryRaw`
        SELECT preferences FROM notification_preferences WHERE user_id = ${session.user.id}
      ` as any[];
      if (existingPrefs && Array.isArray(existingPrefs) && existingPrefs.length > 0) {
        notificationPrefs = existingPrefs[0].preferences || {};
      }
    } catch (error) {
      logger.info('Notification preferences table not found, using defaults');
    }

    const preferences: NotificationPreferences = {
      emailNotifications: profile?.emailNotifications ?? true,
      pushNotifications: profile?.pushNotifications ?? true,
      statusChanges: notificationPrefs.statusChanges ?? true,
      feedback: notificationPrefs.feedback ?? true,
      deadlines: notificationPrefs.deadlines ?? true,
      achievements: notificationPrefs.achievements ?? true,
      reviewAssignments: notificationPrefs.reviewAssignments ?? (
        user?.role && ['STORY_MANAGER', 'BOOK_MANAGER', 'CONTENT_ADMIN'].includes(user.role)
      ),
      digestFrequency: notificationPrefs.digestFrequency ?? 'weekly'
    };

    return NextResponse.json({ preferences });

  } catch (error) {
    logger.error('Error fetching notification preferences', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailNotifications,
      pushNotifications,
      statusChanges,
      feedback,
      deadlines,
      achievements,
      reviewAssignments,
      digestFrequency
    } = body;

    // Validate digest frequency
    if (digestFrequency && !['never', 'daily', 'weekly'].includes(digestFrequency)) {
      return NextResponse.json(
        { error: 'Invalid digest frequency. Must be: never, daily, or weekly' },
        { status: 400 }
      );
    }

    // Update profile preferences (basic settings)
    if (emailNotifications !== undefined || pushNotifications !== undefined) {
      await prisma.profile.upsert({
        where: { userId: session.user.id },
        update: {
          ...(emailNotifications !== undefined && { emailNotifications }),
          ...(pushNotifications !== undefined && { pushNotifications })
        },
        create: {
          userId: session.user.id,
          emailNotifications: emailNotifications ?? true,
          pushNotifications: pushNotifications ?? true
        }
      });
    }

    // Store extended preferences in a dedicated table
    const extendedPrefs = {
      statusChanges,
      feedback,
      deadlines,
      achievements,
      reviewAssignments,
      digestFrequency
    };

    // Remove undefined values
    Object.keys(extendedPrefs).forEach(key =>
      (extendedPrefs as any)[key] === undefined && delete (extendedPrefs as any)[key]
    );

    if (Object.keys(extendedPrefs).length > 0) {
      try {
        // Try to update existing preferences
        await prisma.$executeRaw`
          INSERT INTO notification_preferences (user_id, preferences, updated_at)
          VALUES (${session.user.id}, ${JSON.stringify(extendedPrefs)}, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET preferences = ${JSON.stringify(extendedPrefs)}, updated_at = NOW()
        `;
      } catch (error) {
        // If table doesn't exist, create it first
        if ((error as any)?.code === '42P01') { // relation does not exist
          await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS notification_preferences (
              id SERIAL PRIMARY KEY,
              user_id TEXT UNIQUE NOT NULL,
              preferences JSONB NOT NULL DEFAULT '{}',
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `;

          // Retry the insert
          await prisma.$executeRaw`
            INSERT INTO notification_preferences (user_id, preferences, updated_at)
            VALUES (${session.user.id}, ${JSON.stringify(extendedPrefs)}, NOW())
          `;
        } else {
          throw error;
        }
      }
    }

    // Return updated preferences
    const updatedProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        emailNotifications: true,
        pushNotifications: true
      }
    });

    let updatedExtendedPrefs: any = {};
    try {
      const result = await prisma.$queryRaw`
        SELECT preferences FROM notification_preferences WHERE user_id = ${session.user.id}
      ` as any[];
      if (result && Array.isArray(result) && result.length > 0) {
        updatedExtendedPrefs = result[0].preferences || {};
      }
    } catch (error) {
      logger.error('Error fetching updated preferences', error);
    }

    const preferences: NotificationPreferences = {
      emailNotifications: updatedProfile?.emailNotifications ?? true,
      pushNotifications: updatedProfile?.pushNotifications ?? true,
      statusChanges: updatedExtendedPrefs.statusChanges ?? true,
      feedback: updatedExtendedPrefs.feedback ?? true,
      deadlines: updatedExtendedPrefs.deadlines ?? true,
      achievements: updatedExtendedPrefs.achievements ?? true,
      reviewAssignments: updatedExtendedPrefs.reviewAssignments ?? false,
      digestFrequency: updatedExtendedPrefs.digestFrequency ?? 'weekly'
    };

    return NextResponse.json({
      preferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    logger.error('Error updating notification preferences', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}