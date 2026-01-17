import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface StudentProgressData {
  id: string;
  name: string;
  booksAssigned: number;
  booksCompleted: number;
  averageProgress: number;
  lastActivity: string;
  readingStreak: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const teacherId = session.user.id;

    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        bookAssignments: true,
      },
    });

    const studentIds = classes.flatMap(c =>
      c.enrollments.map(e => e.studentId)
    );
    const uniqueStudentIds = [...new Set(studentIds)];

    if (uniqueStudentIds.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: { in: uniqueStudentIds },
      },
      select: {
        userId: true,
        bookId: true,
        percentComplete: true,
        isCompleted: true,
        lastReadAt: true,
      },
      orderBy: {
        lastReadAt: 'desc',
      },
    });

    const progressByStudent = new Map<string, {
      totalBooks: number;
      completedBooks: number;
      totalProgress: number;
      lastActivity: Date | null;
      recentDays: Set<string>;
    }>();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const progress of readingProgress) {
      let studentData = progressByStudent.get(progress.userId);
      if (!studentData) {
        studentData = {
          totalBooks: 0,
          completedBooks: 0,
          totalProgress: 0,
          lastActivity: null,
          recentDays: new Set(),
        };
        progressByStudent.set(progress.userId, studentData);
      }

      studentData.totalBooks++;
      studentData.totalProgress += progress.percentComplete;
      if (progress.isCompleted) {
        studentData.completedBooks++;
      }
      if (!studentData.lastActivity || progress.lastReadAt > studentData.lastActivity) {
        studentData.lastActivity = progress.lastReadAt;
      }

      if (progress.lastReadAt >= sevenDaysAgo) {
        const dayKey = progress.lastReadAt.toISOString().split('T')[0];
        studentData.recentDays.add(dayKey);
      }
    }

    const totalAssignmentsPerStudent = new Map<string, number>();
    for (const cls of classes) {
      const assignmentCount = cls.bookAssignments.length;
      for (const enrollment of cls.enrollments) {
        const current = totalAssignmentsPerStudent.get(enrollment.studentId) || 0;
        totalAssignmentsPerStudent.set(enrollment.studentId, current + assignmentCount);
      }
    }

    const studentsData: StudentProgressData[] = [];
    const studentMap = new Map<string, { id: string; name: string | null; email: string }>();

    for (const cls of classes) {
      for (const enrollment of cls.enrollments) {
        if (!studentMap.has(enrollment.studentId)) {
          studentMap.set(enrollment.studentId, enrollment.student);
        }
      }
    }

    for (const [studentId, student] of studentMap) {
      const progressData = progressByStudent.get(studentId);
      const booksAssigned = totalAssignmentsPerStudent.get(studentId) || 0;

      studentsData.push({
        id: student.id,
        name: student.name || student.email || 'Unknown Student',
        booksAssigned,
        booksCompleted: progressData?.completedBooks || 0,
        averageProgress: progressData && progressData.totalBooks > 0
          ? Math.round(progressData.totalProgress / progressData.totalBooks)
          : 0,
        lastActivity: progressData?.lastActivity?.toISOString() || new Date().toISOString(),
        readingStreak: progressData?.recentDays.size || 0,
      });
    }

    studentsData.sort((a, b) => {
      const dateA = new Date(a.lastActivity).getTime();
      const dateB = new Date(b.lastActivity).getTime();
      return dateB - dateA;
    });

    const recentStudents = studentsData.slice(0, 10);

    return NextResponse.json({ students: recentStudents });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student progress' },
      { status: 500 }
    );
  }
}
