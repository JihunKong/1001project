import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch analytics data
    const [
      monthlyStoryViews,
      topPerformingStories,
      userGrowth,
      revenueAnalytics,
      languageDistribution,
      categoryDistribution
    ] = await Promise.all([
      // Monthly story views
      prisma.story.aggregate({
        where: {
          isPublished: true,
          createdAt: { gte: startOfMonth }
        },
        _sum: { viewCount: true },
        _avg: { viewCount: true }
      }),
      
      // Top performing stories
      prisma.story.findMany({
        take: 10,
        where: { isPublished: true },
        orderBy: { viewCount: 'desc' },
        select: {
          id: true,
          title: true,
          viewCount: true,
          likeCount: true,
          rating: true,
          language: true,
          authorName: true
        }
      }),
      
      // User growth over time
      prisma.user.groupBy({
        by: ['role'],
        where: {
          createdAt: { gte: ninetyDaysAgo }
        },
        _count: { id: true }
      }),
      
      // Revenue analytics
      prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: startOfMonth }
        },
        _sum: { total: true },
        _count: { id: true }
      }),
      
      // Language distribution
      prisma.story.groupBy({
        by: ['language'],
        where: { isPublished: true },
        _count: { id: true }
      }),
      
      // Category distribution
      prisma.$queryRaw`
        SELECT unnest(category) as category_name, COUNT(*) as count
        FROM stories 
        WHERE "isPublished" = true 
        GROUP BY category_name
        ORDER BY count DESC
        LIMIT 10
      `
    ]);

    const analytics = {
      overview: {
        totalStoryViews: monthlyStoryViews._sum.viewCount || 0,
        averageViewsPerStory: monthlyStoryViews._avg.viewCount || 0,
        monthlyRevenue: revenueAnalytics._sum.total || 0,
        monthlyOrders: revenueAnalytics._count || 0
      },
      topStories: topPerformingStories,
      userGrowth: userGrowth,
      languageDistribution: languageDistribution.map(item => ({
        language: item.language,
        count: item._count.id,
        percentage: 0 // Will be calculated client-side
      })),
      categoryDistribution: categoryDistribution,
      revenue: {
        monthly: revenueAnalytics._sum.total || 0,
        orderCount: revenueAnalytics._count || 0,
        averageOrderValue: revenueAnalytics._count > 0 
          ? Number(revenueAnalytics._sum.total) / revenueAnalytics._count 
          : 0
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}