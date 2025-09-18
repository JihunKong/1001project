import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Validation schema for updating users
const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.enum(['CUSTOMER', 'LEARNER', 'TEACHER', 'INSTITUTION', 'VOLUNTEER', 'ADMIN']).optional(),
});

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            stories: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    // Validate input
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If updating email, check if new email is already taken by another user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
          deletedAt: null
        }
      });

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        );
      }
    }

    // Prevent demoting the last admin
    if (validatedData.role && validatedData.role !== 'ADMIN' && existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change role of the last admin user' },
          { status: 400 }
        );
      }
    }

    // Check if role is being changed to increment tokenVersion for security
    const updateData: any = { ...validatedData };
    let roleChanged = false;
    
    if (validatedData.role && validatedData.role !== existingUser.role) {
      // Role is being changed - increment tokenVersion to invalidate existing JWT tokens
      updateData.tokenVersion = { increment: 1 };
      roleChanged = true;
      console.log(`Admin ${session.user.email} changed role of ${existingUser.email} from ${existingUser.role} to ${validatedData.role}`);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            stories: true
          }
        }
      }
    });

    // Log role change in role_migrations table if role was changed
    if (roleChanged && validatedData.role) {
      await prisma.roleMigration.create({
        data: {
          userId: id,
          fromRole: existingUser.role,
          toRole: validatedData.role as any,
          migrationType: 'ADMIN_ASSIGNED',
          migrationReason: `Role change by admin ${session.user.email}`,
          initiatedAt: new Date(),
          completedAt: new Date(),
          status: 'COMPLETED',
          notificationSent: false
        }
      });
    }

    return NextResponse.json({
      message: roleChanged 
        ? 'User updated successfully. User will be logged out due to role change.' 
        : 'User updated successfully',
      user: updatedUser,
      sessionInvalidated: roleChanged
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting the last admin
    if (existingUser.role === UserRole.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin user' },
          { status: 400 }
        );
      }
    }

    // Prevent self-deletion
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Soft delete user by setting deletedAt
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // Anonymize email to prevent conflicts
        email: `deleted_${id}@deleted.local`
      }
    });

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUserId: deletedUser.id
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}