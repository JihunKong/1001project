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

    // Get notification preferences from database
    const existingPrefs = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id }
    });

    const notificationPrefs: any = existingPrefs ? {
      statusChanges: existingPrefs.statusChanges,
      feedback: existingPrefs.feedback,
      deadlines: existingPrefs.deadlines,
      achievements: existingPrefs.achievements,
      reviewAssignments: existingPrefs.reviewAssignments,
      digestFrequency: existingPrefs.digestFrequency
    } : {};

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
      await prisma.notificationPreferences.upsert({
        where: { userId: session.user.id },
        update: {
          ...extendedPrefs,
          updatedAt: new Date()
        },
        create: {
          userId: session.user.id,
          emailNotifications: emailNotifications ?? true,
          pushNotifications: pushNotifications ?? true,
          statusChanges: extendedPrefs.statusChanges ?? true,
          feedback: extendedPrefs.feedback ?? true,
          deadlines: extendedPrefs.deadlines ?? true,
          achievements: extendedPrefs.achievements ?? true,
          reviewAssignments: extendedPrefs.reviewAssignments ?? false,
          digestFrequency: extendedPrefs.digestFrequency ?? 'weekly'
        }
      });
    }

    // Return updated preferences
    const updatedProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        emailNotifications: true,
        pushNotifications: true
      }
    });

    const updatedNotificationPrefs = await prisma.notificationPreferences.findUnique({
      where: { userId: session.user.id }
    });

    const updatedExtendedPrefs: any = updatedNotificationPrefs ? {
      statusChanges: updatedNotificationPrefs.statusChanges,
      feedback: updatedNotificationPrefs.feedback,
      deadlines: updatedNotificationPrefs.deadlines,
      achievements: updatedNotificationPrefs.achievements,
      reviewAssignments: updatedNotificationPrefs.reviewAssignments,
      digestFrequency: updatedNotificationPrefs.digestFrequency
    } : {};

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