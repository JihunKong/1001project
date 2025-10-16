import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, EnrollmentStatus } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for enrollment status updates
const UpdateEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  action: z.enum(['approve', 'suspend', 'drop', 'activate'])
    .refine(val => ['approve', 'suspend', 'drop', 'activate'].includes(val), {
      message: 'Invalid action'
    }),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

// GET /api/classes/[id]/students - List students in class
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find class and verify access
    const classData = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        teacherId: true,
        isActive: true,
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if user has access to view students
    const hasAccess = session.user.role === UserRole.ADMIN ||
                     (session.user.role === UserRole.TEACHER && classData.teacherId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view students in this class' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as EnrollmentStatus | null;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Build where clause for enrollments
    const where: any = {
      classId: id,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get enrollments with student details and progress
    const [enrollments, totalCount] = await Promise.all([
      prisma.classEnrollment.findMany({
        where,
        orderBy: [
          { status: 'asc' },
          { enrolledAt: 'desc' }
        ],
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          grade: true,
          attendance: true,
          progress: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  organization: true,
                  language: true,
                }
              }
            }
          }
        }
      }),
      prisma.classEnrollment.count({ where })
    ]);

    // Get assignment statistics for each student
    const studentIds = enrollments.map(e => e.student.id);
    const assignmentStats = await prisma.assignment.findMany({
      where: { classId: id },
      select: {
        id: true,
        submissions: {
          where: { studentId: { in: studentIds } },
          select: {
            studentId: true,
            status: true,
            grade: true,
            submittedAt: true,
          }
        }
      }
    });

    // Calculate statistics for each student
    const studentsWithStats = enrollments.map(enrollment => {
      const studentSubmissions = assignmentStats.flatMap(a =>
        a.submissions.filter(s => s.studentId === enrollment.student.id)
      );

      const totalAssignments = assignmentStats.length;
      const submittedAssignments = studentSubmissions.filter(s =>
        s.status === 'SUBMITTED' || s.status === 'GRADED'
      ).length;
      const gradedAssignments = studentSubmissions.filter(s =>
        s.status === 'GRADED'
      ).length;

      const grades = studentSubmissions
        .filter(s => s.grade !== null)
        .map(s => s.grade as number);

      const averageGrade = grades.length > 0 ?
        grades.reduce((sum, grade) => sum + grade, 0) / grades.length : null;

      return {
        ...enrollment,
        student: {
          ...enrollment.student,
          displayName: enrollment.student.name ||
                      `${enrollment.student.profile?.firstName || ''} ${enrollment.student.profile?.lastName || ''}`.trim() ||
                      enrollment.student.email,
        },
        statistics: {
          totalAssignments,
          submittedAssignments,
          gradedAssignments,
          pendingAssignments: totalAssignments - submittedAssignments,
          averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
          completionRate: totalAssignments > 0 ?
            Math.round((submittedAssignments / totalAssignments) * 100) : 0,
        }
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate summary statistics
    const summaryStats = {
      total: totalCount,
      active: enrollments.filter(e => e.status === 'ACTIVE').length,
      pending: enrollments.filter(e => e.status === 'SUSPENDED').length,
      dropped: enrollments.filter(e => e.status === 'DROPPED').length,
      completed: enrollments.filter(e => e.status === 'COMPLETED').length,
    };

    return NextResponse.json({
      class: {
        id: classData.id,
        name: classData.name,
        code: classData.code,
      },
      students: studentsWithStats,
      summary: summaryStats,
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
    logger.error('Error fetching class students', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/classes/[id]/students - Update student enrollment status
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find class and verify access
    const classData = await prisma.class.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        teacherId: true,
        isActive: true,
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to manage students
    const hasPermission = session.user.role === UserRole.ADMIN ||
                         (session.user.role === UserRole.TEACHER && classData.teacherId === session.user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to manage students in this class' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = UpdateEnrollmentSchema.parse(body);
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

    // Find enrollment
    const enrollment = await prisma.classEnrollment.findUnique({
      where: {
        classId_studentId: {
          classId: id,
          studentId: validatedData.studentId,
        }
      },
      select: {
        id: true,
        status: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Student enrollment not found' },
        { status: 404 }
      );
    }

    // Determine new status based on action
    let newStatus: EnrollmentStatus;
    let notificationTitle: string;
    let notificationMessage: string;

    switch (validatedData.action) {
      case 'approve':
        if (enrollment.status !== 'SUSPENDED') {
          return NextResponse.json(
            { error: 'Can only approve pending enrollments' },
            { status: 400 }
          );
        }
        newStatus = 'ACTIVE';
        notificationTitle = 'Enrollment Approved';
        notificationMessage = `Your enrollment in "${classData.name}" has been approved`;
        break;

      case 'suspend':
        if (enrollment.status === 'DROPPED') {
          return NextResponse.json(
            { error: 'Cannot suspend a dropped student' },
            { status: 400 }
          );
        }
        newStatus = 'SUSPENDED';
        notificationTitle = 'Enrollment Suspended';
        notificationMessage = `Your enrollment in "${classData.name}" has been suspended`;
        break;

      case 'drop':
        newStatus = 'DROPPED';
        notificationTitle = 'Removed from Class';
        notificationMessage = `You have been removed from "${classData.name}"`;
        break;

      case 'activate':
        if (enrollment.status === 'DROPPED') {
          return NextResponse.json(
            { error: 'Cannot reactivate a dropped student. They must re-enroll.' },
            { status: 400 }
          );
        }
        newStatus = 'ACTIVE';
        notificationTitle = 'Enrollment Activated';
        notificationMessage = `Your enrollment in "${classData.name}" has been activated`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update enrollment status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update enrollment
      const updatedEnrollment = await tx.classEnrollment.update({
        where: { id: enrollment.id },
        data: { status: newStatus },
        select: {
          id: true,
          status: true,
          enrolledAt: true,
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      // Create notification for student
      await tx.notification.create({
        data: {
          userId: validatedData.studentId,
          type: 'CLASS',
          title: notificationTitle,
          message: validatedData.reason ?
            `${notificationMessage}. Reason: ${validatedData.reason}` :
            notificationMessage,
          data: {
            classId: id,
            enrollmentId: enrollment.id,
            action: validatedData.action,
            reason: validatedData.reason,
          }
        }
      });

      return updatedEnrollment;
    });

    return NextResponse.json({
      message: `Student enrollment ${validatedData.action}d successfully`,
      enrollment: result
    });

  } catch (error) {
    logger.error('Error updating student enrollment', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}