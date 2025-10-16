import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for class creation
const CreateClassSchema = z.object({
  name: z.string()
    .min(1, 'Class name is required')
    .max(100, 'Class name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional(),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(50, 'Subject must be less than 50 characters')
    .trim(),
  gradeLevel: z.string()
    .min(1, 'Grade level is required')
    .max(20, 'Grade level must be less than 20 characters')
    .trim(),
  startDate: z.string()
    .datetime('Invalid start date format'),
  endDate: z.string()
    .datetime('Invalid end date format'),
  maxStudents: z.number()
    .min(1, 'Maximum students must be at least 1')
    .max(100, 'Maximum students must be less than 100')
    .default(30),
  schedule: z.object({
    days: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    timezone: z.string().default('UTC'),
  }),
  settings: z.object({
    allowSelfEnroll: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    showProgress: z.boolean().default(true),
    allowDiscussion: z.boolean().default(true),
  }).optional(),
});

// Generate a unique 6-character class code
function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/classes - List classes for teacher
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status'); // 'active', 'inactive'
    const search = searchParams.get('search') || '';

    // Build where clause
    const where: any = {};

    // Teachers can only see their own classes, admins see all
    if (session.user.role === UserRole.TEACHER) {
      where.teacherId = session.user.id;
    }

    // Apply filters
    if (status === 'active') {
      where.isActive = true;
      where.endDate = { gte: new Date() };
    } else if (status === 'inactive') {
      where.OR = [
        { isActive: false },
        { endDate: { lt: new Date() } }
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { gradeLevel: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get classes with enrollment counts
    const [classes, totalCount] = await Promise.all([
      prisma.class.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          subject: true,
          gradeLevel: true,
          startDate: true,
          endDate: true,
          maxStudents: true,
          isActive: true,
          schedule: true,
          settings: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              student: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          assignments: {
            select: {
              id: true,
              title: true,
              dueDate: true,
            }
          },
          _count: {
            select: {
              enrollments: {
                where: { status: 'ACTIVE' }
              },
              assignments: true,
            }
          }
        }
      }),
      prisma.class.count({ where })
    ]);

    // Enhance classes with additional statistics
    const enhancedClasses = classes.map(classItem => {
      const currentDate = new Date();
      const isActiveSchedule = classItem.isActive && classItem.endDate >= currentDate;

      return {
        ...classItem,
        status: isActiveSchedule ? 'active' : 'inactive',
        enrollmentCount: classItem._count.enrollments,
        assignmentCount: classItem._count.assignments,
        availableSlots: classItem.maxStudents - classItem._count.enrollments,
        students: classItem.enrollments.map(e => e.student),
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      classes: enhancedClasses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    logger.error('Error fetching classes', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/classes - Create new class
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a teacher or admin
    if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if teacher can create classes (subscription limits)
    if (session.user.role === UserRole.TEACHER) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: {
          canCreateClasses: true,
          plan: true,
        }
      });

      if (!subscription?.canCreateClasses) {
        return NextResponse.json(
          { error: 'Your subscription plan does not allow creating classes' },
          { status: 403 }
        );
      }

      // Check class creation limits based on plan
      const currentClassCount = await prisma.class.count({
        where: {
          teacherId: session.user.id,
          isActive: true,
        }
      });

      const limits = {
        FREE: 1,
        BASIC: 5,
        PREMIUM: 20,
        ENTERPRISE: 100,
      };

      const limit = limits[subscription.plan as keyof typeof limits] || 0;
      if (currentClassCount >= limit) {
        return NextResponse.json(
          { error: `You have reached the maximum number of classes for your ${subscription.plan} plan (${limit})` },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = CreateClassSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Validate date logic
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    // Generate unique class code
    let classCode: string;
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      classCode = generateClassCode();
      const existing = await prisma.class.findUnique({
        where: { code: classCode! }
      });
      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Unable to generate unique class code. Please try again.' },
        { status: 500 }
      );
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        code: classCode!,
        name: validatedData.name,
        description: validatedData.description || null,
        teacherId: session.user.id,
        subject: validatedData.subject,
        gradeLevel: validatedData.gradeLevel,
        startDate: startDate,
        endDate: endDate,
        maxStudents: validatedData.maxStudents,
        schedule: validatedData.schedule,
        settings: validatedData.settings || {
          allowSelfEnroll: true,
          requireApproval: false,
          showProgress: true,
          allowDiscussion: true,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        subject: true,
        gradeLevel: true,
        startDate: true,
        endDate: true,
        maxStudents: true,
        isActive: true,
        schedule: true,
        settings: true,
        createdAt: true,
        teacher: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Class created successfully',
      class: newClass
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creating class', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Class code already exists. Please try again.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}