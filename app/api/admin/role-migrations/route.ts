import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeWithRLSBypass } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { migrations, total } = await executeWithRLSBypass(async (client) => {
      const whereClause: any = {};
      
      if (userId) {
        whereClause.userId = userId;
      }

      const [migrations, total] = await Promise.all([
        client.roleMigration.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          },
          orderBy: {
            initiatedAt: 'desc'
          },
          skip: offset,
          take: limit
        }),
        client.roleMigration.count({
          where: whereClause
        })
      ]);

      return { migrations, total };
    });

    return NextResponse.json({
      success: true,
      migrations: migrations.map((migration: any) => ({
        id: migration.id,
        userId: migration.userId,
        user: migration.user,
        fromRole: migration.fromRole,
        toRole: migration.toRole,
        migrationType: migration.migrationType,
        migrationReason: migration.migrationReason,
        status: migration.status,
        initiatedAt: migration.initiatedAt,
        completedAt: migration.completedAt,
        notificationSent: migration.notificationSent,
        userAcknowledged: migration.userAcknowledged,
        satisfactionRating: migration.satisfactionRating,
        feedbackProvided: migration.feedbackProvided
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Role migrations fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch role migrations',
        success: false 
      },
      { status: 500 }
    );
  }
}