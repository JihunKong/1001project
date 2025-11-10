import { NextRequest, NextResponse } from 'next/server';
import { DigestService } from '@/lib/notifications/DigestService';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron request attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const digestService = new DigestService();
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    let dailyResult = { sent: 0, failed: 0 };
    let weeklyResult = { sent: 0, failed: 0 };

    if (hour === 9) {
      try {
        dailyResult = await digestService.sendDailyDigests();
        logger.info('Daily digests sent', dailyResult);
      } catch (error) {
        logger.error('Error sending daily digests', error);
      }

      if (dayOfWeek === 1) {
        try {
          weeklyResult = await digestService.sendWeeklyDigests();
          logger.info('Weekly digests sent', weeklyResult);
        } catch (error) {
          logger.error('Error sending weekly digests', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        daily: dailyResult,
        weekly: weeklyResult,
      },
    });
  } catch (error) {
    logger.error('Cron job failed', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
