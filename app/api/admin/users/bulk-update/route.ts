import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeWithRLSBypass } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { sanitizeInput, logAuditEvent } from '@/lib/security/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds, newRole } = body;

    // Comprehensive input validation and sanitization
    if (!Array.isArray(userIds) || userIds.length === 0) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'INVALID_BULK_UPDATE_INPUT',
        resource: '/api/admin/users/bulk-update',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { error: 'Missing user IDs array' }
      });
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Limit bulk operations for security
    if (userIds.length > 100) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'EXCESSIVE_BULK_UPDATE',
        resource: '/api/admin/users/bulk-update',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { userCount: userIds.length }
      });
      return NextResponse.json(
        { error: 'Cannot update more than 100 users at once' },
        { status: 400 }
      );
    }

    // Sanitize and validate user IDs
    const sanitizedUserIds = userIds.map((id: string) => {
      if (typeof id !== 'string') {
        throw new Error('Invalid user ID format');
      }
      return sanitizeInput(id);
    }).filter(id => id.length > 0);

    if (sanitizedUserIds.length !== userIds.length) {
      await logAuditEvent({
        timestamp: new Date(),
        userId: session.user.id,
        action: 'INVALID_USER_IDS',
        resource: '/api/admin/users/bulk-update',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || '',
        success: false,
        metadata: { originalCount: userIds.length, validCount: sanitizedUserIds.length }
      });
      return NextResponse.json(
        { error: 'Invalid user ID format detected' },
        { status: 400 }
      );
    }

    // Validate role
    if (!newRole || typeof newRole !== 'string') {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    const sanitizedRole = sanitizeInput(newRole);
    if (!Object.values(UserRole).includes(sanitizedRole as UserRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    const { updatedUsers, errors } = await executeWithRLSBypass(async (client) => {
      // Get current admin count to prevent removing all admins (exclude deleted users)
      const adminCount = await client.user.count({
        where: { 
          role: 'ADMIN',
          deletedAt: null
        }
      });

      // Check if we're demoting admins and if it would leave no admins
      const targetUsers = await client.user.findMany({
        where: { 
          id: { in: sanitizedUserIds },
          deletedAt: null
        }
      });

      const adminsBeingDemoted = targetUsers.filter((user: any) => 
        user.role === 'ADMIN' && sanitizedRole !== 'ADMIN'
      );

      if (adminsBeingDemoted.length > 0 && (adminCount - adminsBeingDemoted.length) < 1) {
        throw new Error('Cannot demote all admin users. At least one admin must remain.');
      }

      // Prevent self-demotion from admin
      const selfDemotion = targetUsers.find((user: any) => 
        user.id === session.user.id && user.role === 'ADMIN' && sanitizedRole !== 'ADMIN'
      );

      if (selfDemotion) {
        throw new Error('Cannot demote your own admin role');
      }

      const updatedUsers = [];
      const errors = [];

      // Update users one by one to handle individual errors
      for (const userId of sanitizedUserIds) {
        try {
          const user = await client.user.findFirst({
            where: { 
              id: userId,
              deletedAt: null
            },
            include: { profile: true }
          });

          if (!user) {
            errors.push(`User ${userId} not found`);
            continue;
          }

          // Skip if role is already the same
          if (user.role === sanitizedRole) {
            continue;
          }

          // Update user role and increment tokenVersion for security
          const updatedUser = await client.user.update({
            where: { id: userId },
            data: { 
              role: sanitizedRole,
              tokenVersion: { increment: 1 }
            },
            include: {
              profile: true,
              subscription: true,
              _count: {
                select: {
                  stories: true,
                  orders: true
                }
              }
            }
          });

          // Log the role change in role_migrations table
          await client.roleMigration.create({
            data: {
              userId: userId,
              fromRole: user.role,
              toRole: sanitizedRole,
              migrationType: 'ADMIN_ASSIGNED',
              migrationReason: `Bulk role change by admin ${session.user.email}`,
              initiatedAt: new Date(),
              completedAt: new Date(),
              status: 'COMPLETED',
              notificationSent: false
            }
          });

          updatedUsers.push(updatedUser);
        } catch (error) {
          console.error(`Error updating user ${userId}:`, error);
          errors.push(`Failed to update user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { updatedUsers, errors };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedUsers.length} user(s)`,
      updatedCount: updatedUsers.length,
      totalRequested: sanitizedUserIds.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk user update error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to update users',
        success: false 
      },
      { status: 500 }
    );
  }
}