import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    // Get teacher's classes with student counts
    const classes = await prisma.class.findMany({
      where: { teacherId: session.user.id },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const classesData = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      subject: cls.subject,
      gradeLevel: cls.gradeLevel,
      studentCount: cls._count.enrollments,
      maxStudents: cls.maxStudents,
      isActive: cls.isActive,
      createdAt: cls.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        classes: classesData
      }
    });

  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch classes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, subject, gradeLevel, maxStudents, code } = body;

    // Validate required fields
    if (!name || !subject || !gradeLevel) {
      return NextResponse.json(
        { error: 'Name, subject, and grade level are required' },
        { status: 400 }
      );
    }

    // Check if class code is unique
    if (code) {
      const existingClass = await prisma.class.findUnique({
        where: { code }
      });

      if (existingClass) {
        return NextResponse.json(
          { error: 'Class code already exists' },
          { status: 400 }
        );
      }
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        subject,
        gradeLevel,
        code: code || generateClassCode(),
        maxStudents: maxStudents || 30,
        teacherId: session.user.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        schedule: {},
        settings: {}
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    const classData = {
      id: newClass.id,
      name: newClass.name,
      code: newClass.code,
      description: newClass.description,
      subject: newClass.subject,
      gradeLevel: newClass.gradeLevel,
      studentCount: newClass._count.enrollments,
      maxStudents: newClass.maxStudents,
      isActive: newClass.isActive,
      createdAt: newClass.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        class: classData
      }
    });

  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create class',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}