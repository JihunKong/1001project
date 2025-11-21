import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  updateUserSchema,
  type UpdateUserData
} from '@/lib/validation/user-management.schema';

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - must be ADMIN
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Fetch user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            bio: true,
            organization: true,
            phone: true,
            location: true,
          }
        },
        _count: {
          select: {
            sessions: true,
            submissions: true,
            enrollments: true,
            teachingClasses: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - must be ADMIN
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Prevent admins from demoting themselves
    if (userId === session.user.id) {
      const body = await request.json();
      if (body.role && body.role !== UserRole.ADMIN) {
        return NextResponse.json(
          { error: 'Cannot demote yourself from ADMIN role' },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data: UpdateUserData = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If email is being changed, check it's not already in use
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Update user and profile in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          name: data.name,
          role: data.role as UserRole | undefined,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      // Update profile if provided
      if (data.profile) {
        await tx.profile.upsert({
          where: { userId },
          create: {
            userId,
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            bio: data.profile.bio,
            organization: data.profile.organization,
            phone: data.profile.phone,
            location: data.profile.location,
          },
          update: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            bio: data.profile.bio,
            organization: data.profile.organization,
            phone: data.profile.phone,
            location: data.profile.location,
          }
        });
      }

      // Fetch complete user with profile
      return await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              organization: true,
              phone: true,
              location: true,
            }
          }
        }
      });
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Soft delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - must be ADMIN
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Prevent admins from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete yourself' },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete - set deletedAt timestamp
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletionRequestId: `deleted-by-admin-${session.user.id}-${Date.now()}`
      }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
