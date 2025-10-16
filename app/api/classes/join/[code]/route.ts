import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

// POST /api/classes/join/[code] - Student joins class with code
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a learner (students)
    if (session.user.role !== UserRole.LEARNER) {
      return NextResponse.json(
        { error: 'Only students can join classes' },
        { status: 403 }
      );
    }

    // Validate class code format
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid class code format' },
        { status: 400 }
      );
    }

    // Find class by code
    const classData = await prisma.class.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        subject: true,
        gradeLevel: true,
        teacherId: true,
        startDate: true,
        endDate: true,
        maxStudents: true,
        isActive: true,
        settings: true,
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
            studentId: true,
          }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found. Please check the class code.' },
        { status: 404 }
      );
    }

    // Check if class is active
    if (!classData.isActive) {
      return NextResponse.json(
        { error: 'This class is currently inactive and not accepting enrollments' },
        { status: 400 }
      );
    }

    // Check if class has ended
    if (classData.endDate < new Date()) {
      return NextResponse.json(
        { error: 'This class has already ended' },
        { status: 400 }
      );
    }

    // Check if self-enrollment is allowed
    const settings = classData.settings as any;
    if (!settings?.allowSelfEnroll) {
      return NextResponse.json(
        { error: 'Self-enrollment is not allowed for this class. Please contact your teacher.' },
        { status: 403 }
      );
    }

    // Check if class is full
    const currentEnrollmentCount = classData._count.enrollments;
    if (currentEnrollmentCount >= classData.maxStudents) {
      return NextResponse.json(
        { error: 'This class is full and cannot accept more students' },
        { status: 400 }
      );
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: classData.id,
          studentId: session.user.id,
        }
      },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'You are already enrolled in this class' },
          { status: 409 }
        );
      } else if (existingEnrollment.status === 'DROPPED') {
        // Re-enroll student
        const updatedEnrollment = await prisma.classEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'ACTIVE',
            enrolledAt: new Date(),
          },
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            class: {
              select: {
                id: true,
                code: true,
                name: true,
                subject: true,
                gradeLevel: true,
                teacher: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        });

        return NextResponse.json({
          message: 'Successfully re-enrolled in class',
          enrollment: updatedEnrollment
        });
      }
    }

    // Create enrollment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create enrollment
      const enrollment = await tx.classEnrollment.create({
        data: {
          classId: classData.id,
          studentId: session.user.id,
          status: settings?.requireApproval ? 'SUSPENDED' : 'ACTIVE',
        },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          class: {
            select: {
              id: true,
              code: true,
              name: true,
              subject: true,
              gradeLevel: true,
              teacher: {
                select: {
                  name: true,
                }
              }
            }
          }
        }
      });

      // Create notification for teacher
      await tx.notification.create({
        data: {
          userId: classData.teacherId,
          type: 'CLASS',
          title: 'New Student Enrollment',
          message: `${session.user.name || session.user.email} has joined your class "${classData.name}"`,
          data: {
            classId: classData.id,
            studentId: session.user.id,
            enrollmentId: enrollment.id,
            requiresApproval: settings?.requireApproval || false,
          }
        }
      });

      // Create notification for student
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: 'CLASS',
          title: settings?.requireApproval ? 'Enrollment Pending Approval' : 'Successfully Enrolled',
          message: settings?.requireApproval
            ? `Your enrollment in "${classData.name}" is pending teacher approval`
            : `You have successfully enrolled in "${classData.name}" taught by ${classData.teacher.name}`,
          data: {
            classId: classData.id,
            teacherId: classData.teacherId,
            enrollmentId: enrollment.id,
          }
        }
      });

      return enrollment;
    });

    return NextResponse.json({
      message: settings?.requireApproval
        ? 'Enrollment request submitted. Please wait for teacher approval.'
        : 'Successfully enrolled in class',
      enrollment: result,
      requiresApproval: settings?.requireApproval || false
    }, { status: 201 });

  } catch (error) {
    logger.error('Error joining class', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'You are already enrolled in this class' },
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

// GET /api/classes/join/[code] - Get class information for joining
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    // Check authentication (optional for preview)
    const session = await getServerSession(authOptions);

    // Validate class code format
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid class code format' },
        { status: 400 }
      );
    }

    // Find class by code
    const classData = await prisma.class.findUnique({
      where: { code: code.toUpperCase() },
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
        settings: true,
        teacher: {
          select: {
            name: true,
            profile: {
              select: {
                organization: true,
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found. Please check the class code.' },
        { status: 404 }
      );
    }

    // Check enrollment status if user is authenticated
    let enrollmentStatus = null;
    if (session?.user && session.user.role === UserRole.LEARNER) {
      const existingEnrollment = await prisma.classEnrollment.findUnique({
        where: {
          classId_studentId: {
            classId: classData.id,
            studentId: session.user.id,
          }
        },
        select: {
          status: true,
          enrolledAt: true,
        }
      });

      enrollmentStatus = existingEnrollment?.status || null;
    }

    // Calculate availability
    const currentEnrollments = classData._count.enrollments;
    const availableSlots = classData.maxStudents - currentEnrollments;
    const isFull = availableSlots <= 0;
    const hasEnded = classData.endDate < new Date();
    const isInactive = !classData.isActive;

    // Determine if enrollment is possible
    const settings = classData.settings as any;
    const canEnroll = !isFull && !hasEnded && !isInactive &&
                     settings?.allowSelfEnroll &&
                     (!session?.user || session.user.role === UserRole.LEARNER) &&
                     enrollmentStatus !== 'ACTIVE';

    return NextResponse.json({
      class: {
        id: classData.id,
        code: classData.code,
        name: classData.name,
        description: classData.description,
        subject: classData.subject,
        gradeLevel: classData.gradeLevel,
        startDate: classData.startDate,
        endDate: classData.endDate,
        teacher: classData.teacher,
      },
      enrollment: {
        currentCount: currentEnrollments,
        maxStudents: classData.maxStudents,
        availableSlots,
        isFull,
        hasEnded,
        isInactive,
        canEnroll,
        requiresApproval: settings?.requireApproval || false,
        allowSelfEnroll: settings?.allowSelfEnroll || false,
        userStatus: enrollmentStatus,
      }
    });

  } catch (error) {
    logger.error('Error fetching class information', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}