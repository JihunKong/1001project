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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const timeFrame = searchParams.get('timeFrame') || 'month';
    const classId = searchParams.get('classId') || 'all';

    // Calculate date range based on timeFrame
    const now = new Date();
    let startDate: Date;
    
    switch (timeFrame) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get teacher's classes (filtered if specific class selected)
    const classFilter = classId === 'all' 
      ? { teacherId: session.user.id }
      : { id: classId, teacherId: session.user.id };

    const classes = await prisma.class.findMany({
      where: classFilter,
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                readingLevel: true
              }
            }
          }
        }
      }
    });

    const allStudentIds = classes.flatMap(c => c.enrollments.map(e => e.student.id));

    if (allStudentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          studentKPIs: [],
          classKPIs: [],
          overallKPI: {
            totalStudents: 0,
            totalActiveStudents: 0,
            overallAvgStreak: 0,
            overallAvgSession: 0,
            overallAvgProgression: 0,
            trendData: []
          }
        }
      });
    }

    // Get reading progress data within timeframe
    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: { in: allStudentIds },
        lastReadAt: { gte: startDate }
      },
      orderBy: { lastReadAt: 'desc' }
    });

    // Get all reading progress for streak calculation
    const allReadingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: { in: allStudentIds }
      },
      orderBy: { lastReadAt: 'desc' }
    });

    // Calculate student KPIs
    const studentKPIs = [];
    
    for (const cls of classes) {
      for (const enrollment of cls.enrollments) {
        const student = enrollment.student;
        const studentProgressData = allReadingProgress.filter(p => p.userId === student.id);
        const recentProgressData = readingProgress.filter(p => p.userId === student.id);

        // Calculate reading streak (연속 읽기일)
        const readingStreak = calculateReadingStreak(studentProgressData);

        // Calculate average session length (평균 세션 길이)
        const avgSessionLength = recentProgressData.length > 0
          ? recentProgressData.reduce((sum, p) => sum + p.totalReadingTime, 0) / recentProgressData.length
          : 0;

        // Calculate difficulty progression (난이도 변화) 
        const difficultyProgression = calculateDifficultyProgression(studentProgressData, student.readingLevel);

        // Get completed books count
        const booksCompleted = studentProgressData.filter(p => p.isCompleted).length;

        // Generate weekly progress data
        const weeklyProgress = generateWeeklyProgress(recentProgressData, startDate);

        studentKPIs.push({
          studentId: student.id,
          studentName: student.name || 'Student',
          className: cls.name,
          readingStreak,
          avgSessionLength: Math.round(avgSessionLength),
          difficultyProgression: Math.round(difficultyProgression),
          lastActive: studentProgressData[0]?.lastReadAt?.toISOString() || new Date().toISOString(),
          booksCompleted,
          currentLevel: student.readingLevel || 'BEGINNER',
          weeklyProgress
        });
      }
    }

    // Calculate class KPIs
    const classKPIs = classes.map(cls => {
      const classStudents = cls.enrollments.map(e => e.student.id);
      const classStudentKPIs = studentKPIs.filter(s => classStudents.includes(s.studentId));
      
      const avgReadingStreak = classStudentKPIs.length > 0
        ? classStudentKPIs.reduce((sum, s) => sum + s.readingStreak, 0) / classStudentKPIs.length
        : 0;

      const avgSessionLength = classStudentKPIs.length > 0
        ? classStudentKPIs.reduce((sum, s) => sum + s.avgSessionLength, 0) / classStudentKPIs.length
        : 0;

      const avgDifficultyProgression = classStudentKPIs.length > 0
        ? classStudentKPIs.reduce((sum, s) => sum + s.difficultyProgression, 0) / classStudentKPIs.length
        : 0;

      // Get top performers
      const topPerformers = classStudentKPIs
        .sort((a, b) => b.readingStreak - a.readingStreak)
        .slice(0, 3)
        .map(s => ({
          name: s.studentName,
          metric: 'Streak',
          value: s.readingStreak
        }));

      return {
        classId: cls.id,
        className: cls.name,
        studentCount: cls.enrollments.length,
        avgReadingStreak,
        avgSessionLength,
        avgDifficultyProgression,
        activeStudents: classStudentKPIs.filter(s => 
          new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        topPerformers
      };
    });

    // Calculate overall KPIs
    const overallAvgStreak = studentKPIs.length > 0
      ? studentKPIs.reduce((sum, s) => sum + s.readingStreak, 0) / studentKPIs.length
      : 0;

    const overallAvgSession = studentKPIs.length > 0
      ? studentKPIs.reduce((sum, s) => sum + s.avgSessionLength, 0) / studentKPIs.length
      : 0;

    const overallAvgProgression = studentKPIs.length > 0
      ? studentKPIs.reduce((sum, s) => sum + s.difficultyProgression, 0) / studentKPIs.length
      : 0;

    const totalActiveStudents = studentKPIs.filter(s => 
      new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Generate trend data (weekly averages)
    const trendData = generateTrendData(studentKPIs, startDate);

    const overallKPI = {
      totalStudents: allStudentIds.length,
      totalActiveStudents,
      overallAvgStreak,
      overallAvgSession,
      overallAvgProgression,
      trendData
    };

    return NextResponse.json({
      success: true,
      data: {
        studentKPIs,
        classKPIs,
        overallKPI
      }
    });

  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch KPI data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate reading streak
function calculateReadingStreak(progressData: any[]): number {
  if (progressData.length === 0) return 0;
  
  const readingDates = progressData
    .map(p => {
      const date = new Date(p.lastReadAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
    .sort((a, b) => b - a); // Sort descending

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  for (let i = 0; i < readingDates.length; i++) {
    const expectedDate = todayTime - (i * 24 * 60 * 60 * 1000);
    
    if (readingDates[i] === expectedDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Helper function to calculate difficulty progression
function calculateDifficultyProgression(progressData: any[], currentLevel: string): number {
  if (progressData.length === 0) return 0;

  const levelScores = {
    'BEGINNER': 1,
    'INTERMEDIATE': 2,
    'ADVANCED': 3
  };

  const currentScore = levelScores[currentLevel as keyof typeof levelScores] || 1;
  const completedBooks = progressData.filter(p => p.isCompleted).length;
  const totalProgress = progressData.reduce((sum, p) => sum + p.percentComplete, 0);
  
  // Calculate progression based on completion rate and level advancement
  const baseProgression = completedBooks * 20; // 20 points per completed book
  const progressionBonus = (totalProgress / progressData.length) / 2; // Up to 50 points for high completion rate
  const levelBonus = currentScore * 10; // Level bonus
  
  return Math.min(100, baseProgression + progressionBonus + levelBonus);
}

// Helper function to generate weekly progress data
function generateWeeklyProgress(progressData: any[], startDate: Date): any[] {
  const weeks = [];
  const weeksToGenerate = 4; // Last 4 weeks
  
  for (let i = 0; i < weeksToGenerate; i++) {
    const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
    const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const weekProgress = progressData.filter(p => {
      const progressDate = new Date(p.lastReadAt);
      return progressDate >= weekStart && progressDate < weekEnd;
    });
    
    const readingDays = new Set(
      weekProgress.map(p => new Date(p.lastReadAt).toDateString())
    ).size;
    
    const avgSession = weekProgress.length > 0
      ? weekProgress.reduce((sum, p) => sum + p.totalReadingTime, 0) / weekProgress.length
      : 0;
    
    const progressPoints = weekProgress.reduce((sum, p) => sum + (p.percentComplete / 10), 0);
    
    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      readingDays,
      avgSession: Math.round(avgSession),
      progressPoints: Math.round(progressPoints)
    });
  }
  
  return weeks;
}

// Helper function to generate trend data
function generateTrendData(studentKPIs: any[], startDate: Date): any[] {
  const weeks = [];
  const weeksToGenerate = 4;
  
  for (let i = 0; i < weeksToGenerate; i++) {
    const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
    
    // For trend data, we'll use current values as approximation
    // In a real implementation, you'd store historical data
    weeks.push({
      week: weekStart.toISOString().split('T')[0],
      avgStreak: studentKPIs.length > 0 
        ? studentKPIs.reduce((sum, s) => sum + s.readingStreak, 0) / studentKPIs.length 
        : 0,
      avgSession: studentKPIs.length > 0
        ? studentKPIs.reduce((sum, s) => sum + s.avgSessionLength, 0) / studentKPIs.length
        : 0,
      avgProgression: studentKPIs.length > 0
        ? studentKPIs.reduce((sum, s) => sum + s.difficultyProgression, 0) / studentKPIs.length
        : 0
    });
  }
  
  return weeks;
}