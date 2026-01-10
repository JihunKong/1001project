import { NextRequest, NextResponse } from 'next/server';
import { DataRetentionService } from '@/lib/data-retention';

const retentionService = new DataRetentionService();

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hardDeleteCount = await retentionService.executeHardDeletesForExpiredRecoveryPeriod();

    return NextResponse.json({
      success: true,
      message: 'Hard delete cron job completed',
      hardDeletedUsers: hardDeleteCount,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Hard delete cron job error:', error);
    return NextResponse.json(
      {
        error: 'Hard delete cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
