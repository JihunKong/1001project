import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseClassCode, isValidClassCode } from '@/lib/classCode';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Input validation schema
const joinClassSchema = z.object({
  code: z.string().min(6).max(7), // 6 chars or with dash (ABC-123)
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

    // Check permission to join classes
    if (!userHasPermission(session, PERMISSIONS.CLASS_JOIN)) {
      return NextResponse.json(
        { error: 'You do not have permission to join classes' },
        { status: 403 }
      );
    }

    // Only students can join classes through this endpoint
    if (session.user.role !== UserRole.LEARNER) {
      return NextResponse.json(
        { error: 'Only students can join classes through this endpoint' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = joinClassSchema.parse(body);
    
    // Parse the class code (remove dash if present and convert to uppercase)
    const code = parseClassCode(validatedData.code);
    
    // Validate code format
    if (!isValidClassCode(code)) {
      return NextResponse.json(
        { error: 'Invalid class code format. Please enter a 6-character code (e.g., ABC123 or ABC-123)' },
        { status: 400 }
      );
    }

    // Find class by code
    const classRecord = await prisma.class.findUnique({
      where: { code },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        school: {
          select: {
            id: true,
            name: true,
          }
        },
        enrollments: {
          select: {
            studentId: true,
            status: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
          }
        }
      }
    });

    if (!classRecord) {
      return NextResponse.json(
        { error: 'Class not found. Please check the code and try again.' },
        { status: 404 }
      );
    }

    // Check if class is active
    if (!classRecord.isActive) {
      return NextResponse.json(
        { error: 'This class is no longer accepting new students.' },
        { status: 400 }
      );
    }

    // Check if class has ended
    if (new Date() > classRecord.endDate) {
      return NextResponse.json(
        { error: 'This class has ended and is no longer accepting new students.' },
        { status: 400 }
      );
    }

    // Check if class hasn't started yet and late join is not allowed
    const settings = classRecord.settings as { allowLateJoin?: boolean; requireApproval?: boolean };
    if (new Date() > classRecord.startDate && !settings?.allowLateJoin) {
      return NextResponse.json(
        { error: 'This class has started and late joining is not allowed.' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classRecord.id,
          studentId: session.user.id,
        }
      }
    });

    if (existingEnrollment) {
      // Check enrollment status
      if (existingEnrollment.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'You are already enrolled in this class.' },
          { status: 400 }
        );
      } else if (existingEnrollment.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Your enrollment request is pending approval.' },
          { status: 400 }
        );
      } else if (existingEnrollment.status === 'DROPPED') {
        // Allow re-enrollment if previously dropped
        await prisma.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ACTIVE',
            progress: 0,
            attendance: 100,
            enrolledAt: new Date(),
          }
        });

        return NextResponse.json({
          success: true,
          message: `Successfully re-enrolled in "${classRecord.name}"`,
          class: {
            id: classRecord.id,
            name: classRecord.name,
            subject: classRecord.subject,
            gradeLevel: classRecord.gradeLevel,
            teacher: classRecord.teacher,
            formattedCode: `${code.slice(0, 3)}-${code.slice(3)}`,
          }
        });
      }
    }

    // Check capacity (only count active enrollments)
    const activeEnrollmentCount = classRecord.enrollments.filter(
      enrollment => enrollment.status === 'ACTIVE'
    ).length;

    if (activeEnrollmentCount >= classRecord.maxStudents) {
      return NextResponse.json(
        { error: 'This class is full. Please contact the teacher for more information.' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: classRecord.id,
        studentId: session.user.id,
        status: settings?.requireApproval ? 'PENDING' : 'ACTIVE',
        progress: 0,
        attendance: 100,
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        }
      }
    });

    // Create notification for teacher
    await prisma.notification.create({
      data: {
        userId: classRecord.teacherId,
        type: 'STUDENT_JOINED',
        title: enrollment.status === 'PENDING' ? 'New Enrollment Request' : 'New Student Enrolled',
        message: enrollment.status === 'PENDING'
          ? `${session.user.name || session.user.email} has requested to join your class "${classRecord.name}"`
          : `${session.user.name || session.user.email} has joined your class "${classRecord.name}"`,
        data: {
          classId: classRecord.id,
          studentId: session.user.id,
          studentName: session.user.name || session.user.email,
          enrollmentStatus: enrollment.status,
        },
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: enrollment.status === 'PENDING' ? 'CLASS_JOIN_REQUESTED' : 'CLASS_JOINED',
        details: {
          classId: classRecord.id,
          className: classRecord.name,
          teacherName: classRecord.teacher.name,
          enrollmentStatus: enrollment.status,
        },
      }
    });

    const responseMessage = enrollment.status === 'PENDING'
      ? `Your request to join "${classRecord.name}" has been sent to the teacher for approval.`
      : `Successfully joined "${classRecord.name}"!`;

    return NextResponse.json({
      success: true,
      message: responseMessage,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        class: {
          id: classRecord.id,
          name: classRecord.name,
          subject: classRecord.subject,
          gradeLevel: classRecord.gradeLevel,
          description: classRecord.description,
          teacher: classRecord.teacher,
          school: classRecord.school,
          startDate: classRecord.startDate,
          endDate: classRecord.endDate,
          formattedCode: `${code.slice(0, 3)}-${code.slice(3)}`,
          settings: classRecord.settings,
        }
      }
    });

  } catch (error) {
    console.error('Error joining class:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to join class. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Get student's enrolled classes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only students can access this endpoint
    if (session.user.role !== UserRole.LEARNER) {
      return NextResponse.json(
        { error: 'Only students can access this endpoint' },
        { status: 403 }
      );
    }

    const studentId = session.user.id;

    // Get all classes the student is enrolled in
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId,
      },
      include: {
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            },
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
            bookAssignments: {
              select: {
                id: true,
                bookId: true,
                dueDate: true,
                isRequired: true,
              },
              take: 3,
              orderBy: {
                assignedAt: 'desc'
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Format the response
    const formattedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      status: enrollment.status,
      progress: enrollment.progress,
      attendance: enrollment.attendance,
      enrolledAt: enrollment.enrolledAt,
      class: {
        ...enrollment.class,
        formattedCode: `${enrollment.class.code.slice(0, 3)}-${enrollment.class.code.slice(3)}`,
        isActive: enrollment.class.isActive && new Date() < enrollment.class.endDate,
        daysRemaining: Math.max(0, Math.ceil((enrollment.class.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        enrollmentCount: enrollment.class._count.enrollments,
      }
    }));

    return NextResponse.json({
      success: true,
      enrollments: formattedEnrollments,
      count: formattedEnrollments.length,
    });

  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch enrolled classes' },
      { status: 500 }
    );
  }
}