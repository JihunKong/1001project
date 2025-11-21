import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createUserSchema,
  listUsersQuerySchema,
  type CreateUserData,
  type ListUsersQuery
} from '@/lib/validation/user-management.schema';

// GET /api/admin/users - List users with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryResult = listUsersQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.errors },
        { status: 400 }
      );
    }

    const query: ListUsersQuery = queryResult.data;
    const skip = (query.page - 1) * query.limit;

    // Build where clause
    const where: any = {};

    // Filter by search (name or email)
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (query.role) {
      where.role = query.role;
    }

    // Filter by status (active/deleted)
    if (query.status === 'deleted') {
      where.deletedAt = { not: null };
    } else if (query.status === 'active') {
      where.deletedAt = null;
    } else {
      // Default: show only active users
      where.deletedAt = null;
    }

    // Execute queries in parallel
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
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
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
      }
    });

  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();

    // Validate request data
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data: CreateUserData = validationResult.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Create user with profile in transaction
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        password: hashedPassword,
        profile: data.profile ? {
          create: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            bio: data.profile.bio,
            organization: data.profile.organization,
            phone: data.profile.phone,
            location: data.profile.location,
          }
        } : undefined
      },
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

    return NextResponse.json(
      { user: newUser, message: 'User created successfully' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
