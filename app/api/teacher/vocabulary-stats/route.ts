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

    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teacherClasses = await prisma.class.findMany({
      where: { teacherId: session.user.id },
      select: { id: true },
    });

    const classIds = teacherClasses.map(c => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({
        students: [],
        summary: {
          totalStudents: 0,
          totalWords: 0,
          avgWordsPerStudent: 0,
          avgMasteryLevel: 0,
          topLearners: [],
        },
      });
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId: { in: classIds },
        status: 'ACTIVE',
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const studentIds = [...new Set(enrollments.map(e => e.studentId))];

    if (studentIds.length === 0) {
      return NextResponse.json({
        students: [],
        summary: {
          totalStudents: 0,
          totalWords: 0,
          avgWordsPerStudent: 0,
          avgMasteryLevel: 0,
          topLearners: [],
        },
      });
    }

    const [vocabularyStats, masteredWords, recentActivity] = await Promise.all([
      prisma.vocabularyWord.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds } },
        _count: { id: true },
        _avg: { masteryLevel: true },
      }),
      prisma.vocabularyWord.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
          masteryLevel: { gte: 4 },
        },
        _count: { id: true },
      }),
      prisma.vocabularyWord.groupBy({
        by: ['userId'],
        where: {
          userId: { in: studentIds },
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),
    ]);

    const masteredMap = new Map(masteredWords.map(m => [m.userId, m._count.id]));
    const recentMap = new Map(recentActivity.map(r => [r.userId, r._count.id]));

    const studentMap = new Map(enrollments.map(e => [e.studentId, e.student]));

    const students = vocabularyStats.map(stat => {
      const student = studentMap.get(stat.userId);
      return {
        id: stat.userId,
        name: student?.name || 'Unknown',
        email: student?.email || '',
        totalWords: stat._count.id,
        avgMasteryLevel: Math.round((stat._avg.masteryLevel || 0) * 10) / 10,
        masteredWords: masteredMap.get(stat.userId) || 0,
        wordsThisWeek: recentMap.get(stat.userId) || 0,
      };
    });

    students.sort((a, b) => b.totalWords - a.totalWords);

    const totalWords = students.reduce((sum, s) => sum + s.totalWords, 0);
    const totalMastery = students.reduce((sum, s) => sum + s.avgMasteryLevel, 0);

    const summary = {
      totalStudents: studentIds.length,
      totalWords,
      avgWordsPerStudent: studentIds.length > 0 ? Math.round(totalWords / studentIds.length) : 0,
      avgMasteryLevel: students.length > 0 ? Math.round((totalMastery / students.length) * 10) / 10 : 0,
      topLearners: students.slice(0, 5).map(s => ({
        id: s.id,
        name: s.name,
        totalWords: s.totalWords,
        masteredWords: s.masteredWords,
      })),
    };

    return NextResponse.json({
      students,
      summary,
    });
  } catch (error) {
    console.error('Error fetching vocabulary stats:', error);
    return NextResponse.json({ error: 'Failed to fetch vocabulary stats' }, { status: 500 });
  }
}
