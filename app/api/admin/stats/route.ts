import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { logger } from '@/lib/logger';

// GET /api/admin/stats - Get comprehensive system statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d'; // '7d', '30d', '90d', '1y', 'all'
    const detailed = searchParams.get('detailed') === 'true';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date('2020-01-01'); // All time
    }

    // Execute all stat queries in parallel for performance
    const [
      // User statistics
      totalUsers,
      newUsers,
      usersByRole,
      activeUsers,
      verifiedUsers,

      // Content statistics
      totalBooks,
      publishedBooks,
      newBooks,
      booksByLanguage,
      booksByCategory,
      totalVolunteerSubmissions,
      submissionsByStatus,

      // Educational statistics
      totalClasses,
      activeClasses,
      newClasses,
      totalEnrollments,
      activeEnrollments,
      totalAssignments,

      // Reading statistics
      totalReadingProgress,
      completedBooks,
      averageProgress,

      // System health
      recentNotifications,
      recentActivity,

    ] = await Promise.all([
      // User queries
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      prisma.user.count({
        where: {
          OR: [
            { sessions: { some: { expires: { gte: now } } } },
            { updatedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
          ]
        }
      }),
      prisma.user.count({
        where: { emailVerified: { not: null } }
      }),

      // Content queries
      prisma.book.count(),
      prisma.book.count({
        where: { isPublished: true }
      }),
      prisma.book.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.book.groupBy({
        by: ['language'],
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
        take: 10
      }),
      prisma.book.findMany({
        select: { category: true },
        where: { isPublished: true }
      }).then(books => {
        const categoryCount: Record<string, number> = {};
        books.forEach(book => {
          book.category.forEach(cat => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        });
        return Object.entries(categoryCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
      }),
      prisma.volunteerSubmission.count(),
      prisma.volunteerSubmission.groupBy({
        by: ['status'],
        _count: { status: true }
      }),

      // Educational queries
      prisma.class.count(),
      prisma.class.count({
        where: {
          isActive: true,
          endDate: { gte: now }
        }
      }),
      prisma.class.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.classEnrollment.count(),
      prisma.classEnrollment.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.assignment.count(),

      // Reading queries
      prisma.readingProgress.count(),
      prisma.readingProgress.count({
        where: { isCompleted: true }
      }),
      prisma.readingProgress.aggregate({
        _avg: { percentComplete: true }
      }),

      // System health queries
      prisma.notification.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.activityLog.count({
        where: { createdAt: { gte: startDate } }
      }),
    ]);

    // Calculate additional metrics
    const userGrowthRate = totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0;
    const bookCompletionRate = totalReadingProgress > 0 ?
      Math.round((completedBooks / totalReadingProgress) * 100) : 0;
    const enrollmentRate = totalClasses > 0 ?
      Math.round(totalEnrollments / totalClasses) : 0;

    // Format user roles
    const roleStats = Object.fromEntries(
      usersByRole.map(role => [role.role, role._count.role])
    );

    // Format submission status
    const submissionStats = Object.fromEntries(
      submissionsByStatus.map(status => [status.status, status._count.status])
    );

    // Basic stats response
    const stats = {
      overview: {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          verified: verifiedUsers,
          growthRate: userGrowthRate,
          byRole: roleStats,
        },
        content: {
          totalBooks,
          publishedBooks,
          newBooks,
          bookCompletionRate,
          submissions: {
            total: totalVolunteerSubmissions,
            byStatus: submissionStats,
          }
        },
        education: {
          totalClasses,
          activeClasses,
          newClasses,
          totalEnrollments,
          activeEnrollments,
          enrollmentRate,
          totalAssignments,
        },
        reading: {
          totalProgress: totalReadingProgress,
          completedBooks,
          averageProgress: Math.round(averageProgress._avg.percentComplete || 0),
          completionRate: bookCompletionRate,
        },
        activity: {
          recentNotifications,
          recentActivity,
          timeframe,
        }
      },
      generated: now.toISOString(),
      timeframe,
    };

    // Add detailed breakdowns if requested
    if (detailed) {
      const [
        // Detailed user analytics
        userCreationTrend,
        topActiveUsers,

        // Detailed content analytics
        topBooks,
        contentEngagement,

        // Detailed educational analytics
        topClasses,
        assignmentStats,

        // System performance
        errorLogs,
        slowQueries,

      ] = await Promise.all([
        // User trend analysis (last 30 days)
        getDailyUserCreations(30),

        // Top active users (by reading time)
        prisma.readingProgress.groupBy({
          by: ['userId'],
          _sum: { totalReadingTime: true },
          orderBy: { _sum: { totalReadingTime: 'desc' } },
          take: 10,
        }).then(async (results) => {
          const userIds = results.map(r => r.userId);
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true, role: true }
          });
          return results.map(r => ({
            user: users.find(u => u.id === r.userId),
            totalReadingTime: r._sum.totalReadingTime || 0,
          }));
        }),

        // Top performing books
        prisma.book.findMany({
          where: { isPublished: true },
          orderBy: { viewCount: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            authorName: true,
            viewCount: true,
            downloadCount: true,
            rating: true,
            _count: {
              select: {
                readingProgress: true,
                reviews: true,
              }
            }
          }
        }),

        // Content engagement metrics
        getContentEngagementMetrics(),

        // Top performing classes
        prisma.class.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            subject: true,
            teacher: { select: { name: true } },
            _count: {
              select: {
                enrollments: {
                  where: { status: 'ACTIVE' }
                },
                assignments: true,
              }
            }
          }
        }),

        // Assignment completion statistics
        getAssignmentCompletionStats(),

        // System health indicators
        getRecentErrors(),
        getSystemPerformanceMetrics(),
      ]);

      (stats as any).detailed = {
        users: {
          creationTrend: userCreationTrend,
          topActive: topActiveUsers,
        },
        content: {
          topBooks,
          engagement: contentEngagement,
          languageDistribution: booksByLanguage,
          categoryDistribution: booksByCategory,
        },
        education: {
          topClasses,
          assignmentStats,
        },
        system: {
          errors: errorLogs,
          performance: slowQueries,
        }
      };
    }

    return NextResponse.json(stats);

  } catch (error) {
    logger.error('Error fetching admin statistics', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get daily user creation trend
async function getDailyUserCreations(days: number) {
  const results = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    results.push({
      date: startOfDay.toISOString().split('T')[0],
      count,
    });
  }

  return results;
}

// Helper function to get content engagement metrics
async function getContentEngagementMetrics() {
  const [
    avgReadingTime,
    avgCompletionRate,
    topCategories,
  ] = await Promise.all([
    prisma.readingProgress.aggregate({
      _avg: { totalReadingTime: true }
    }),
    prisma.readingProgress.aggregate({
      _avg: { percentComplete: true }
    }),
    prisma.book.findMany({
      where: { isPublished: true },
      select: { category: true, viewCount: true }
    }).then(books => {
      const categoryViews: Record<string, number> = {};
      books.forEach(book => {
        book.category.forEach(cat => {
          categoryViews[cat] = (categoryViews[cat] || 0) + book.viewCount;
        });
      });
      return Object.entries(categoryViews)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    }),
  ]);

  return {
    averageReadingTime: Math.round(avgReadingTime._avg.totalReadingTime || 0),
    averageCompletionRate: Math.round(avgCompletionRate._avg.percentComplete || 0),
    topCategories,
  };
}

// Helper function to get assignment completion statistics
async function getAssignmentCompletionStats() {
  const assignments = await prisma.assignment.findMany({
    select: {
      id: true,
      type: true,
      _count: {
        select: {
          submissions: true,
        }
      },
      submissions: {
        select: {
          status: true,
          grade: true,
        }
      }
    }
  });

  const stats = {
    byType: {} as Record<string, any>,
    overall: {
      totalAssignments: assignments.length,
      totalSubmissions: assignments.reduce((sum, a) => sum + a._count.submissions, 0),
      averageCompletionRate: 0,
    }
  };

  // Calculate stats by assignment type
  assignments.forEach(assignment => {
    const type = assignment.type;
    if (!stats.byType[type]) {
      stats.byType[type] = {
        count: 0,
        submissions: 0,
        completed: 0,
        graded: 0,
      };
    }

    stats.byType[type].count++;
    stats.byType[type].submissions += assignment._count.submissions;
    stats.byType[type].completed += assignment.submissions.filter(s =>
      s.status === 'SUBMITTED' || s.status === 'GRADED'
    ).length;
    stats.byType[type].graded += assignment.submissions.filter(s =>
      s.status === 'GRADED'
    ).length;
  });

  return stats;
}

// Helper function to get recent errors (mock implementation)
async function getRecentErrors() {
  // In a real implementation, this would query error logs
  return {
    count: 0,
    severity: 'low',
    lastError: null,
  };
}

// Helper function to get system performance metrics (mock implementation)
async function getSystemPerformanceMetrics() {
  // In a real implementation, this would query performance logs
  return {
    averageResponseTime: 120, // ms
    databaseConnections: 5,
    memoryUsage: 65, // percentage
    cpuUsage: 25, // percentage
  };
}