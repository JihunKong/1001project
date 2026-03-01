import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        ranking: 0,
        totalStudents: 0,
        score: 0,
        className: null,
        classId: null,
        breakdown: {
          booksRead: 0,
          readingTime: 0,
          assignmentsCompleted: 0,
        },
      });
    }

    const firstEnrollment = enrollments[0];
    const classId = firstEnrollment.classId;
    const className = firstEnrollment.class.name;

    const classStudents = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      select: {
        studentId: true,
      },
    });

    const studentIds = classStudents.map((s) => s.studentId);

    const [progressStats, completedBooks, submissionStats] = await Promise.all([
      prisma.readingProgress.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds } },
        _sum: { totalReadingTime: true },
      }),
      prisma.readingProgress.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds }, isCompleted: true },
        _count: { id: true },
      }),
      prisma.submission.groupBy({
        by: ['studentId'],
        where: { studentId: { in: studentIds }, status: 'GRADED' },
        _count: { id: true },
      }),
    ]);

    const readingTimeMap = new Map(
      progressStats.map((p) => [p.userId, p._sum.totalReadingTime || 0])
    );
    const booksReadMap = new Map(
      completedBooks.map((b) => [b.userId, b._count.id])
    );
    const assignmentsMap = new Map(
      submissionStats.map((s) => [s.studentId, s._count.id])
    );

    const studentStats = studentIds.map((studentId) => {
      const booksRead = booksReadMap.get(studentId) || 0;
      const totalReadingTime = readingTimeMap.get(studentId) || 0;
      const completedAssignments = assignmentsMap.get(studentId) || 0;

      const score =
        booksRead * 10 +
        Math.floor(totalReadingTime / 60) * 5 +
        completedAssignments * 15;

      return {
        studentId,
        booksRead,
        readingTime: totalReadingTime,
        assignmentsCompleted: completedAssignments,
        score,
      };
    });

    studentStats.sort((a, b) => b.score - a.score);

    const userRank = studentStats.findIndex(
      (s) => s.studentId === session.user.id
    );
    const userStats = studentStats.find((s) => s.studentId === session.user.id);

    return NextResponse.json({
      classId,
      className,
      ranking: userRank !== -1 ? userRank + 1 : 0,
      totalStudents: studentStats.length,
      score: userStats?.score || 0,
      breakdown: {
        booksRead: userStats?.booksRead || 0,
        readingTime: userStats?.readingTime || 0,
        assignmentsCompleted: userStats?.assignmentsCompleted || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching class ranking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class ranking' },
      { status: 500 }
    );
  }
}
