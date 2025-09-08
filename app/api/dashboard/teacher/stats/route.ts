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
      select: {
        name: true,
        email: true,
        role: true,
      }
    });

    if (user?.role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Teacher access required' },
        { status: 403 }
      );
    }

    const teacherId = session.user.id;

    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        assignments: true
      }
    });

    // Calculate statistics
    const totalStudents = classes.reduce((sum, cls) => sum + cls.enrollments.length, 0);
    const activeClasses = classes.filter(cls => cls.isActive).length;
    const totalAssignments = classes.reduce((sum, cls) => sum + cls.assignments.length, 0);

    // Get assignments with submission status
    const assignments = await prisma.assignment.findMany({
      where: {
        class: {
          teacherId
        }
      },
      include: {
        submissions: true
      }
    });

    const assignmentsGraded = assignments.filter(a => 
      a.submissions.some(s => s.grade !== null)
    ).length;
    
    const pendingAssignments = assignments.filter(a => 
      a.submissions.some(s => s.grade === null && s.submittedAt !== null)
    ).length;

    // Calculate average student progress
    const allStudentIds = classes.flatMap(cls => 
      cls.enrollments.map(e => e.studentId)
    );

    const studentProgress = await prisma.readingProgress.findMany({
      where: {
        userId: { in: allStudentIds }
      }
    });

    const averageProgress = allStudentIds.length > 0
      ? Math.round(
          studentProgress.reduce((sum, p) => sum + p.percentComplete, 0) / 
          Math.max(studentProgress.length, 1)
        )
      : 0;

    // Get recent student activity
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        userId: { in: allStudentIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Transform classes data
    const classesData = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      students: cls.enrollments.length,
      averageProgress: cls.enrollments.length > 0 
        ? Math.round(
            studentProgress
              .filter(p => cls.enrollments.some(e => e.studentId === p.userId))
              .reduce((sum, p) => sum + p.percentComplete, 0) / 
            Math.max(cls.enrollments.length, 1)
          )
        : 0,
      pendingTasks: cls.assignments.filter(a => 
        new Date(a.dueDate) > new Date()
      ).length
    }));

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user.name || 'Teacher',
          email: user.email
        },
        stats: {
          totalStudents,
          activeClasses,
          assignmentsGraded,
          pendingAssignments,
          averageProgress,
          totalAssignments
        },
        classes: classesData,
        recentActivity: recentActivities.map(activity => ({
          id: activity.id,
          studentName: activity.user.name || activity.user.email,
          action: activity.action,
          details: activity.details,
          timestamp: activity.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}