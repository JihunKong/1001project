import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parentRelations = await prisma.parentChildRelation.findMany({
      where: {
        parentUserId: session.user.id,
        isActive: true,
        verified: true,
      },
    });

    const childIds = parentRelations.map((r) => r.childUserId);

    const children = await prisma.user.findMany({
      where: {
        id: { in: childIds },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            isMinor: true,
            parentalConsentStatus: true,
          },
        },
      },
    });

    const childrenWithRelation = children.map((child) => {
      const relation = parentRelations.find((r) => r.childUserId === child.id);
      return {
        id: child.id,
        name: child.name || `${child.profile?.firstName || ''} ${child.profile?.lastName || ''}`.trim() || 'Unknown',
        email: child.email,
        isMinor: child.profile?.isMinor,
        consentStatus: child.profile?.parentalConsentStatus,
        relationship: relation?.relationship,
        verifiedAt: relation?.verifiedAt,
      };
    });

    return NextResponse.json({
      children: childrenWithRelation,
      count: childrenWithRelation.length,
    });
  } catch (error) {
    logger.error('Error fetching parent children', error);
    return NextResponse.json(
      { error: 'Failed to fetch children' },
      { status: 500 }
    );
  }
}
