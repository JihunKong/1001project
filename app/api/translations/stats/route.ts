import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { TranslationStatus } from '@prisma/client';

const ADMIN_ROLES = ['ADMIN', 'CONTENT_ADMIN'];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalTranslations,
      publishedCount,
      inProgressCount,
      reviewCount,
      approvedCount,
      rejectedCount,
      aiGeneratedCount,
      humanReviewedCount,
      translationsByLanguage,
      totalBooks,
      booksWithTranslations
    ] = await Promise.all([
      prisma.translation.count(),
      prisma.translation.count({ where: { status: TranslationStatus.PUBLISHED } }),
      prisma.translation.count({ where: { status: TranslationStatus.IN_PROGRESS } }),
      prisma.translation.count({ where: { status: TranslationStatus.REVIEW } }),
      prisma.translation.count({ where: { status: TranslationStatus.APPROVED } }),
      prisma.translation.count({ where: { status: TranslationStatus.REJECTED } }),
      prisma.translation.count({ where: { isAIGenerated: true } }),
      prisma.translation.count({ where: { humanReviewed: true } }),
      prisma.translation.groupBy({
        by: ['toLanguage'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.book.count({ where: { isPublished: true } }),
      prisma.book.count({
        where: {
          isPublished: true,
          translations: { some: {} }
        }
      })
    ]);

    const languageStats = translationsByLanguage.map(item => ({
      language: item.toLanguage,
      count: item._count.id
    }));

    return NextResponse.json({
      stats: {
        total: totalTranslations,
        byStatus: {
          published: publishedCount,
          inProgress: inProgressCount,
          review: reviewCount,
          approved: approvedCount,
          rejected: rejectedCount
        },
        aiGenerated: aiGeneratedCount,
        humanReviewed: humanReviewedCount,
        byLanguage: languageStats,
        coverage: {
          totalBooks,
          booksWithTranslations,
          percentage: totalBooks > 0
            ? Math.round((booksWithTranslations / totalBooks) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching translation stats', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
