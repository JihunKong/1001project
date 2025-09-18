import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueClassCode } from '@/lib/classCode';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Input validation schema for creating classes
const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1).max(50),
  gradeLevel: z.string().min(1).max(20),
  maxStudents: z.number().min(1).max(100).default(30),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// GET: Retrieve teacher's classes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers can access this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    const teacherId = session.user.id;

    // Get all classes for this teacher
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
            lessons: true,
            bookAssignments: true,
          }
        },
        enrollments: {
          select: {
            id: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            },
            status: true,
            progress: true,
            enrolledAt: true,
          },
          where: {
            status: 'ACTIVE',
          },
          orderBy: {
            enrolledAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format the response with additional computed fields
    const formattedClasses = classes.map(cls => ({
      ...cls,
      formattedCode: `${cls.code.slice(0, 3)}-${cls.code.slice(3)}`,
      isActive: cls.isActive && new Date() < cls.endDate,
      daysRemaining: Math.max(0, Math.ceil((cls.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      enrollmentCount: cls._count.enrollments,
      hasAvailableSpots: cls._count.enrollments < cls.maxStudents,
    }));

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
      count: formattedClasses.length,
    });

  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    );
  }
}

// POST: Create a new class
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission to create classes
    if (!userHasPermission(session, PERMISSIONS.CLASS_CREATE)) {
      return NextResponse.json(
        { error: 'You do not have permission to create classes' },
        { status: 403 }
      );
    }

    // Only teachers can create classes through this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can create classes through this endpoint' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = createClassSchema.parse(body);

    // Generate unique class code
    const code = await generateUniqueClassCode();

    // Set default dates if not provided
    const startDate = validatedData.startDate 
      ? new Date(validatedData.startDate) 
      : new Date();
    
    const endDate = validatedData.endDate 
      ? new Date(validatedData.endDate) 
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

    // Validate date logic
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        code,
        name: validatedData.name,
        description: validatedData.description,
        teacherId: session.user.id,
        subject: validatedData.subject,
        gradeLevel: validatedData.gradeLevel,
        maxStudents: validatedData.maxStudents,
        startDate,
        endDate,
        isActive: true,
        schedule: {},
        settings: {
          allowLateJoin: true,
          requireApproval: false,
          showProgress: true,
          allowSelfEnrollment: true,
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CLASS_CREATED',
        details: {
          classId: newClass.id,
          className: newClass.name,
          classCode: code,
        },
      }
    });

    return NextResponse.json({
      success: true,
      message: `Class "${validatedData.name}" created successfully`,
      class: {
        ...newClass,
        formattedCode: `${code.slice(0, 3)}-${code.slice(3)}`,
        isActive: true,
        daysRemaining: Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        enrollmentCount: 0,
        hasAvailableSpots: true,
      }
    });

  } catch (error) {
    console.error('Error creating class:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}