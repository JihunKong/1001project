import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { accessAuditService } from '@/lib/audit/access-log';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      );
    }

    const parentRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentUserId: session.user.id,
        childUserId: childId,
        isActive: true,
        verified: true,
      },
    });

    if (!parentRelation) {
      return NextResponse.json(
        { error: 'You do not have access to this child\'s records' },
        { status: 403 }
      );
    }

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined;

    const [childProfile, readingProgress, quizAttempts, classEnrollments, accessLogs] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: childId },
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                isMinor: true,
                parentalConsentStatus: true,
                parentalConsentDate: true,
                language: true,
                onboardingCompleted: true,
              },
            },
          },
        }),
        prisma.readingProgress.findMany({
          where: { userId: childId },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                authorName: true,
                coverImage: true,
              },
            },
          },
          orderBy: { lastReadAt: 'desc' },
          take: 20,
        }),
        prisma.quizAttempt.findMany({
          where: { userId: childId },
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                book: {
                  select: { title: true },
                },
              },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 20,
        }),
        prisma.classEnrollment.findMany({
          where: { studentId: childId },
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                subject: true,
                gradeLevel: true,
                teacher: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        }),
        prisma.accessAuditLog.findMany({
          where: { userId: childId },
          orderBy: { timestamp: 'desc' },
          take: 50,
          select: {
            id: true,
            entityType: true,
            action: true,
            accessedByRole: true,
            purpose: true,
            timestamp: true,
          },
        }),
      ]);

    if (!childProfile) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    await accessAuditService.logAccess({
      userId: childId,
      entityType: 'User',
      entityId: childId,
      action: 'READ',
      accessedBy: session.user.id,
      accessedByRole: 'PARENT',
      purpose: 'Parent viewing child educational records (FERPA)',
      ipAddress,
    });

    const response = {
      child: {
        id: childProfile.id,
        name: childProfile.name,
        email: childProfile.email,
        profile: childProfile.profile,
        createdAt: childProfile.createdAt,
      },
      educationalRecords: {
        readingProgress: readingProgress.map((p) => ({
          id: p.id,
          book: p.book,
          currentChapter: p.currentChapter,
          percentComplete: p.percentComplete,
          totalReadingTime: p.totalReadingTime,
          lastReadAt: p.lastReadAt,
          isCompleted: p.isCompleted,
        })),
        quizAttempts: quizAttempts.map((a) => ({
          id: a.id,
          quiz: a.quiz,
          score: a.score,
          passed: a.passed,
          timeSpent: a.timeSpent,
          completedAt: a.completedAt,
        })),
        classEnrollments: classEnrollments.map((e) => ({
          id: e.id,
          class: e.class,
          status: e.status,
          grade: e.grade,
          progress: e.progress,
          enrolledAt: e.enrolledAt,
        })),
      },
      accessHistory: {
        recentAccesses: accessLogs,
        message:
          'This shows who has accessed your child\'s educational records',
      },
      ferpaNotice: {
        message:
          'Under FERPA, you have the right to inspect and review your child\'s education records, request amendments to records you believe are inaccurate, and consent to disclosures of personally identifiable information.',
        requestAmendmentUrl: '/api/parent/amendment-request',
      },
    };

    logger.info('Parent accessed child records', {
      parentId: session.user.id,
      childId,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error fetching child records', error);
    return NextResponse.json(
      { error: 'Failed to fetch child records' },
      { status: 500 }
    );
  }
}
