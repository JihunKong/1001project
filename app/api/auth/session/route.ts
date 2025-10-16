import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Cache for role-specific data (1 minute cache)
const roleDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Optimized role-specific data fetcher
async function getRoleSpecificData(role: string, userId: string, subscription: any) {
  try {
    switch (role) {
      case 'TEACHER':
        const classCount = await prisma.class.count({
          where: { teacherId: userId }
        });
        return {
          classCount,
          canCreateClasses: subscription?.canCreateClasses || false
        };

      case 'LEARNER':
        const enrollmentCount = await prisma.classEnrollment.count({
          where: { studentId: userId }
        });
        return { enrollmentCount };

      case 'WRITER':
        // Use a single query with include instead of two separate queries
        const volunteerData = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            volunteerSubmissions: { select: { id: true } },
            volunteerProfile: {
              select: {
                verificationStatus: true,
                totalHours: true,
                rating: true,
              }
            }
          }
        });

        return {
          submissionCount: volunteerData?.volunteerSubmissions?.length || 0,
          verificationStatus: volunteerData?.volunteerProfile?.verificationStatus || 'PENDING',
          totalHours: volunteerData?.volunteerProfile?.totalHours || 0,
          rating: volunteerData?.volunteerProfile?.rating || 5.0,
        };

      case 'ADMIN':
        // Use parallel queries for admin stats
        const [totalUsers, totalBooks, totalClasses] = await Promise.all([
          prisma.user.count(),
          prisma.book.count(),
          prisma.class.count()
        ]);

        return {
          totalUsers,
          totalBooks,
          totalClasses,
          hasFullAccess: true
        };

      default:
        return {};
    }
  } catch (error) {
    logger.error('Error fetching role-specific data', error);
    return {};
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Get session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        expires: null
      });
    }

    // Get additional user details from database
    const userDetails = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            organization: true,
            timezone: true,
            language: true,
          }
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            maxStudents: true,
            canAccessPremium: true,
            canDownloadPDF: true,
            canCreateClasses: true,
          }
        }
      }
    });

    if (!userDetails) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        expires: null,
        error: 'User not found in database'
      }, { status: 404 });
    }

    // Get cached role-specific information
    const cacheKey = `${userDetails.role}-${userDetails.id}`;
    const cachedData = roleDataCache.get(cacheKey);
    let roleSpecificData = {};

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      roleSpecificData = cachedData.data;
    } else {
      // Fetch role-specific data with optimized queries
      roleSpecificData = await getRoleSpecificData(userDetails.role, userDetails.id, userDetails.subscription);

      // Cache the result
      roleDataCache.set(cacheKey, {
        data: roleSpecificData,
        timestamp: Date.now()
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name,
        role: userDetails.role,
        emailVerified: userDetails.emailVerified,
        createdAt: userDetails.createdAt,
        profile: userDetails.profile,
        subscription: userDetails.subscription,
        roleSpecific: roleSpecificData
      },
      expires: session.expires
    });

  } catch (error) {
    logger.error('Error fetching session information', error);

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        expires: null,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST method for session refresh/validation
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        valid: false,
        message: 'No active session found'
      }, { status: 401 });
    }

    // Validate that user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        role: true,
        deletedAt: true, // Check if user was soft deleted
      }
    });

    if (!user || user.deletedAt) {
      return NextResponse.json({
        valid: false,
        message: 'User account no longer exists'
      }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      message: 'Session is valid',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      }
    });

  } catch (error) {
    logger.error('Error validating session', error);

    return NextResponse.json({
      valid: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// Method not allowed for other HTTP methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}