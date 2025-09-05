import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface DashboardStats {
  totalStories: number;
  totalUsers: number;
  totalVolunteers: number;
  monthlyRevenue: number;
  activeUsers: number;
  recentActivity: Array<{
    id: string;
    type: 'story_submitted' | 'user_joined' | 'translation_completed' | 'volunteer_joined';
    description: string;
    timestamp: Date;
  }>;
}

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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch real database statistics
    const [
      totalStories,
      totalUsers,
      totalVolunteers,
      activeUsersCount,
      monthlyOrders,
      monthlyDonations,
      recentStories,
      recentUsers
    ] = await Promise.all([
      // Total published stories
      prisma.story.count({
        where: { isPublished: true }
      }),
      
      // Total users
      prisma.user.count(),
      
      // Total volunteers (users with VOLUNTEER role)
      prisma.user.count({
        where: { role: UserRole.VOLUNTEER }
      }),
      
      // Active users in last 30 days (users who logged in recently)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      // Monthly orders revenue
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          status: 'DELIVERED'
        },
        _sum: {
          total: true
        }
      }),
      
      // Monthly donations - skip for now since Donation table structure needs review
      Promise.resolve({ _sum: { amount: null } }), // Placeholder until donation system is implemented
      
      // Recent stories for activity feed
      prisma.story.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: { select: { name: true } }
        }
      }),
      
      // Recent users for activity feed
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    // Calculate monthly revenue
    const ordersRevenue = monthlyOrders._sum.total ? Number(monthlyOrders._sum.total) : 0;
    const donationsRevenue = monthlyDonations._sum.amount ? Number(monthlyDonations._sum.amount) : 0;
    const monthlyRevenue = ordersRevenue + donationsRevenue;

    // Create activity feed
    const recentActivity = [
      ...recentStories.map(story => ({
        id: `story-${story.id}`,
        type: 'story_submitted' as const,
        description: `New story "${story.title}" by ${story.author.name}`,
        timestamp: story.createdAt
      })),
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: user.role === UserRole.VOLUNTEER ? 'volunteer_joined' as const : 'user_joined' as const,
        description: user.role === UserRole.VOLUNTEER 
          ? `New volunteer ${user.name || 'Anonymous'} joined` 
          : `New user ${user.name || 'Anonymous'} joined`,
        timestamp: user.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    const stats: DashboardStats = {
      totalStories,
      totalUsers,
      totalVolunteers,
      monthlyRevenue,
      activeUsers: activeUsersCount,
      recentActivity
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}