import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { calculateStats } from '@/lib/profile-stats';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role as UserRole;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { cachedStats: true, statsUpdatedAt: true }
    });

    const now = new Date();
    const shouldRefreshCache = !profile?.statsUpdatedAt ||
      (now.getTime() - profile.statsUpdatedAt.getTime() > CACHE_DURATION_MS);

    if (!shouldRefreshCache && profile?.cachedStats) {
      return NextResponse.json(profile.cachedStats, { status: 200 });
    }

    const stats = await calculateStats(userId, userRole);

    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        cachedStats: stats,
        statsUpdatedAt: now
      },
      update: {
        cachedStats: stats,
        statsUpdatedAt: now
      }
    });

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('[Profile Stats API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
