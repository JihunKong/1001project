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

    const studentStats = await Promise.all(
      studentIds.map(async (studentId) => {
        const readingProgress = await prisma.readingProgress.findMany({
          where: { userId: studentId },
        });

        const booksRead = readingProgress.filter((p) => p.isCompleted).length;
        const totalReadingTime = readingProgress.reduce(
          (sum, p) => sum + (p.totalReadingTime || 0),
          0
        );

        const completedAssignments = await prisma.submission.count({
          where: {
            studentId,
            status: 'GRADED',
          },
        });

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
      })
    );

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
