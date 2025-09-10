import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateUniqueClassCode } from '@/lib/classCode';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

// Input validation schema
const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1).max(50),
  gradeLevel: z.string().min(1).max(20),
  maxStudents: z.number().min(1).max(100).default(30),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permission
    if (!userHasPermission(session, PERMISSIONS.CLASS_CREATE)) {
      return NextResponse.json(
        { error: 'You do not have permission to create classes' },
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
        entity: 'CLASS',
        entityId: newClass.id,
        metadata: {
          className: newClass.name,
          classCode: code,
        },
      }
    });

    return NextResponse.json({
      success: true,
      class: {
        ...newClass,
        formattedCode: `${code.slice(0, 3)}-${code.slice(3)}`, // Format for display
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