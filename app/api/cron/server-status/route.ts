import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { isEmailServiceConfigured } from '@/lib/auth-demo';
import { logger } from '@/lib/logger';

const REPORT_RECIPIENT = 'info@seedsofempowerment.org';

interface HealthMetrics {
  database: { status: 'ok' | 'error'; latencyMs: number; error?: string };
  redis: { configured: boolean };
  memory: { heapUsedMB: number; heapTotalMB: number; rssMB: number; usagePercent: number };
  uptime: { seconds: number; formatted: string };
}

interface UserMetrics {
  totalUsers: number;
  newSignups24h: number;
  emailVerified24h: number;
  verificationRate: number;
  roleDistribution: Record<string, number>;
}

interface ContentMetrics {
  totalBooks: number;
  newSubmissions24h: number;
  activeSessions: number;
}

interface AIMetrics {
  openaiConfigured: boolean;
  openaiStatus: 'ok' | 'error' | 'not_configured';
  openaiError?: string;
}

interface EmailMetrics {
  configured: boolean;
}

interface StatusReport {
  generatedAt: string;
  health: HealthMetrics;
  users: UserMetrics;
  content: ContentMetrics;
  ai: AIMetrics;
  email: EmailMetrics;
}

async function collectHealthMetrics(): Promise<HealthMetrics> {
  let dbStatus: HealthMetrics['database'] = { status: 'error', latencyMs: 0 };
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    dbStatus = { status: 'error', latencyMs: 0, error: err instanceof Error ? err.message : String(err) };
  }

  const mem = process.memoryUsage();
  const uptimeSec = process.uptime();
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);

  return {
    database: dbStatus,
    redis: { configured: !!process.env.REDIS_URL },
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      usagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
    },
    uptime: { seconds: Math.round(uptimeSec), formatted: `${hours}h ${minutes}m` },
  };
}

async function collectUserMetrics(): Promise<UserMetrics> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalUsers, newSignups24h, emailVerified24h, roleGroups] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { emailVerified: { gte: since } } }),
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
  ]);

  const roleDistribution: Record<string, number> = {};
  for (const group of roleGroups) {
    roleDistribution[group.role] = group._count.role;
  }

  return {
    totalUsers,
    newSignups24h,
    emailVerified24h,
    verificationRate: newSignups24h > 0 ? Math.round((emailVerified24h / newSignups24h) * 100) : 0,
    roleDistribution,
  };
}

async function collectContentMetrics(): Promise<ContentMetrics> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  const [totalBooks, newSubmissions24h, activeSessions] = await Promise.all([
    prisma.book.count(),
    prisma.textSubmission.count({ where: { createdAt: { gte: since } } }),
    prisma.session.count({ where: { expires: { gt: now } } }),
  ]);

  return { totalBooks, newSubmissions24h, activeSessions };
}

async function collectAIMetrics(): Promise<AIMetrics> {
  const openaiConfigured = !!process.env.OPENAI_API_KEY;
  if (!openaiConfigured) {
    return { openaiConfigured: false, openaiStatus: 'not_configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      return { openaiConfigured: true, openaiStatus: 'ok' };
    }
    return { openaiConfigured: true, openaiStatus: 'error', openaiError: `HTTP ${response.status}` };
  } catch (err) {
    return { openaiConfigured: true, openaiStatus: 'error', openaiError: err instanceof Error ? err.message : String(err) };
  }
}

function statusBadge(status: 'ok' | 'error' | 'not_configured' | boolean): string {
  if (status === true || status === 'ok') {
    return '<span style="background:#22c55e;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">OK</span>';
  }
  if (status === 'not_configured') {
    return '<span style="background:#eab308;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">NOT CONFIGURED</span>';
  }
  return '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;">ERROR</span>';
}

function buildReportHTML(report: StatusReport): string {
  const { health, users, content, ai, email } = report;

  const roleRows = Object.entries(users.roleDistribution)
    .sort(([, a], [, b]) => b - a)
    .map(([role, count]) => `<tr><td style="padding:4px 12px;border-bottom:1px solid #e5e7eb;">${role}</td><td style="padding:4px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${count}</td></tr>`)
    .join('');

  const memoryColor = health.memory.usagePercent > 85 ? '#ef4444' : health.memory.usagePercent > 70 ? '#eab308' : '#22c55e';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f3f4f6;">
  <div style="max-width:640px;margin:0 auto;padding:20px;">
    <div style="background:#1e293b;color:#fff;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:22px;">1001 Stories - Daily Status Report</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${report.generatedAt} (UTC)</p>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b;border-bottom:2px solid #3b82f6;padding-bottom:8px;">Server Health</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;">Database</td><td style="text-align:right;">${statusBadge(health.database.status)} <span style="color:#6b7280;font-size:12px;">${health.database.latencyMs}ms</span></td></tr>
        ${health.database.error ? `<tr><td colspan="2" style="padding:2px 0 6px 12px;color:#ef4444;font-size:12px;">${health.database.error}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280;">Redis</td><td style="text-align:right;">${statusBadge(health.redis.configured)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Memory Usage</td><td style="text-align:right;"><span style="color:${memoryColor};font-weight:600;">${health.memory.usagePercent}%</span> <span style="color:#6b7280;font-size:12px;">(${health.memory.heapUsedMB}/${health.memory.heapTotalMB} MB)</span></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">RSS Memory</td><td style="text-align:right;color:#6b7280;">${health.memory.rssMB} MB</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Process Uptime</td><td style="text-align:right;color:#6b7280;">${health.uptime.formatted}</td></tr>
      </table>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b;border-bottom:2px solid #8b5cf6;padding-bottom:8px;">User Metrics (24h)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;">Total Users</td><td style="text-align:right;font-weight:600;font-size:18px;color:#1e293b;">${users.totalUsers}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">New Signups (24h)</td><td style="text-align:right;font-weight:600;color:#3b82f6;">${users.newSignups24h}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email Verified (24h)</td><td style="text-align:right;font-weight:600;color:#22c55e;">${users.emailVerified24h}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Verification Rate</td><td style="text-align:right;font-weight:600;color:${users.verificationRate >= 70 ? '#22c55e' : users.verificationRate >= 40 ? '#eab308' : '#ef4444'};">${users.verificationRate}%</td></tr>
      </table>
      ${roleRows ? `
      <h3 style="margin:16px 0 8px;font-size:14px;color:#6b7280;">Role Distribution</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr style="background:#f9fafb;"><th style="padding:6px 12px;text-align:left;color:#6b7280;">Role</th><th style="padding:6px 12px;text-align:right;color:#6b7280;">Count</th></tr>
        ${roleRows}
      </table>` : ''}
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b;border-bottom:2px solid #f59e0b;padding-bottom:8px;">Content</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;">Total Books</td><td style="text-align:right;font-weight:600;color:#1e293b;">${content.totalBooks}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">New Submissions (24h)</td><td style="text-align:right;font-weight:600;color:#3b82f6;">${content.newSubmissions24h}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Active Sessions</td><td style="text-align:right;font-weight:600;color:#1e293b;">${content.activeSessions}</td></tr>
      </table>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1e293b;border-bottom:2px solid #10b981;padding-bottom:8px;">Service Status</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6b7280;">OpenAI API</td><td style="text-align:right;">${statusBadge(ai.openaiStatus)}</td></tr>
        ${ai.openaiError ? `<tr><td colspan="2" style="padding:2px 0 6px 12px;color:#ef4444;font-size:12px;">${ai.openaiError}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280;">Email Service</td><td style="text-align:right;">${statusBadge(email.configured)}</td></tr>
      </table>
    </div>

    <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
      <p>This is an automated report from 1001 Stories server.</p>
      <p>https://1001stories.seedsofempowerment.org</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized server-status cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting daily server status report collection');

    const [health, users, content, ai] = await Promise.all([
      collectHealthMetrics(),
      collectUserMetrics(),
      collectContentMetrics(),
      collectAIMetrics(),
    ]);

    const emailConfigured = isEmailServiceConfigured();

    const report: StatusReport = {
      generatedAt: new Date().toISOString(),
      health,
      users,
      content,
      ai,
      email: { configured: emailConfigured },
    };

    const reportDate = new Date().toISOString().split('T')[0];
    const html = buildReportHTML(report);

    const emailResult = await sendEmail({
      to: REPORT_RECIPIENT,
      subject: `[1001 Stories] Daily Status Report - ${reportDate}`,
      html,
    });

    logger.info('Server status report sent', {
      recipient: REPORT_RECIPIENT,
      emailSuccess: emailResult.success,
      dbStatus: health.database.status,
      totalUsers: users.totalUsers,
      newSignups: users.newSignups24h,
    });

    return NextResponse.json({
      success: true,
      timestamp: report.generatedAt,
      emailSent: emailResult.success,
      summary: {
        dbStatus: health.database.status,
        memoryUsage: `${health.memory.usagePercent}%`,
        totalUsers: users.totalUsers,
        newSignups24h: users.newSignups24h,
        verificationRate: `${users.verificationRate}%`,
        totalBooks: content.totalBooks,
        activeSessions: content.activeSessions,
        openaiStatus: ai.openaiStatus,
        emailConfigured,
      },
    });
  } catch (error) {
    logger.error('Server status report failed', error);
    return NextResponse.json(
      { error: 'Server status report failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
