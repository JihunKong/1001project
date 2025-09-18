import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Validation schema for creating/updating users
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['LEARNER', 'VOLUNTEER', 'TEACHER', 'ADMIN', 'INSTITUTION']),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      deletedAt: null // Only show non-deleted users
    };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role && role !== 'ALL') {
      whereClause.role = role as UserRole;
    }

    // Get users with related data
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);

    // Check if user with email already exists (excluding deleted users)
    const existingUser = await prisma.user.findFirst({
      where: { 
        email: validatedData.email,
        deletedAt: null
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role as UserRole,
        emailVerified: new Date(), // Admin-created users are auto-verified
      },
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

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: newUser 
      },
      { status: 201 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}