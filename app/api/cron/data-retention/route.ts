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
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.CRON_API, 'cron:data-retention');
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

  if (process.env.DATA_RETENTION_ENABLED !== 'true') {
    return NextResponse.json({
      success: false,
      message: 'Data retention is disabled. Set DATA_RETENTION_ENABLED=true to enable.',
    });
  }

  try {
    const results = await retentionService.runAllCleanupTasks();

    return NextResponse.json({
      success: true,
      message: 'Data retention cron job completed',
      results,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Data retention cron job error:', error);
    return NextResponse.json(
      {
        error: 'Data retention cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await checkRateLimit(request, RATE_LIMITS.CRON_API, 'cron:data-retention-post');
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
    const body = await request.json();
    const { task } = body;

    let result: number;
    let taskName: string;

    switch (task) {
      case 'verification_tokens':
        result = await retentionService.cleanupExpiredVerificationTokens();
        taskName = 'Expired verification tokens cleanup';
        break;
      case 'activity_logs':
        result = await retentionService.cleanupOldActivityLogs(body.daysOld || 90);
        taskName = 'Old activity logs cleanup';
        break;
      case 'notifications':
        result = await retentionService.cleanupOldNotifications(body.daysOld || 180);
        taskName = 'Old notifications cleanup';
        break;
      case 'sessions':
        result = await retentionService.cleanupExpiredSessions();
        taskName = 'Expired sessions cleanup';
        break;
      case 'hard_deletes':
        result = await retentionService.executeHardDeletesForExpiredRecoveryPeriod();
        taskName = 'Hard deletes execution';
        break;
      case 'expired_exports':
        result = await retentionService.cleanupExpiredDataExports();
        taskName = 'Expired data exports cleanup';
        break;
      case 'inactive_users':
        result = await retentionService.notifyInactiveUsers(body.daysInactive || 365);
        taskName = 'Inactive user notifications';
        break;
      default:
        return NextResponse.json({ error: 'Invalid task specified' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      task: taskName,
      recordsProcessed: result,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Data retention task error:', error);
    return NextResponse.json(
      {
        error: 'Data retention task failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
