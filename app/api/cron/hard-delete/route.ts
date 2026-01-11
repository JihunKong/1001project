import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { DataRetentionService } from '@/lib/data-retention';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const retentionService = new DataRetentionService();

function verifySecretTimingSafe(providedSecret: string | undefined, expectedSecret: string | undefined): boolean {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function GET(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.CRON_API, 'cron:hard-delete');
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429, headers: { 'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString() } }
    );
  }

  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!verifySecretTimingSafe(cronSecret, process.env.CRON_SECRET)) {
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
