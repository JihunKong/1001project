import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  initiateParentalConsent,
  verifyKBAConsent,
  getDefaultConsentScopes,
} from '@/lib/coppa/parental-consent';
import { generateKBASession, getSessionStatus } from '@/lib/coppa/kba-questions';

const InitiateKBASchema = z.object({
  childUserId: z.string().min(1, 'Child user ID is required'),
  parentEmail: z.string().email('Valid parent email is required'),
  parentName: z.string().optional(),
  language: z.enum(['en', 'ko']).optional().default('en'),
});

const VerifyKBASchema = z.object({
  consentRecordId: z.string().min(1, 'Consent record ID is required'),
  kbaSessionId: z.string().min(1, 'KBA session ID is required'),
  answers: z.record(z.string(), z.number()),
});

const GetSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    if (action === 'initiate') {
      return handleInitiateKBA(body, ipAddress, userAgent);
    } else if (action === 'verify') {
      return handleVerifyKBA(body, ipAddress);
    } else if (action === 'refresh') {
      return handleRefreshSession(body);
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "initiate", "verify", or "refresh"' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Error in KBA verification API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleInitiateKBA(
  body: unknown,
  ipAddress: string | null,
  userAgent: string | null
) {
  let validatedData;
  try {
    validatedData = InitiateKBASchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: validatedData.childUserId },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.profile?.isMinor) {
    return NextResponse.json(
      { error: 'KBA verification is only required for minors' },
      { status: 400 }
    );
  }

  const result = await initiateParentalConsent({
    childUserId: validatedData.childUserId,
    parentEmail: validatedData.parentEmail,
    parentName: validatedData.parentName,
    verificationMethod: 'KBA',
    consentScope: getDefaultConsentScopes(),
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: 400 }
    );
  }

  logger.info('KBA session initiated', {
    childUserId: validatedData.childUserId,
    parentEmail: validatedData.parentEmail,
    consentRecordId: result.consentRecordId,
  });

  return NextResponse.json({
    success: true,
    consentRecordId: result.consentRecordId,
    kbaSession: result.kbaSession,
    message: 'KBA session created. Complete the questions within 15 minutes.',
    expiresIn: 15 * 60,
  });
}

async function handleVerifyKBA(body: unknown, ipAddress: string | null) {
  let validatedData;
  try {
    validatedData = VerifyKBASchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  const result = await verifyKBAConsent(
    validatedData.consentRecordId,
    validatedData.kbaSessionId,
    validatedData.answers,
    ipAddress || undefined
  );

  if (!result.success) {
    logger.warn('KBA verification failed', {
      consentRecordId: validatedData.consentRecordId,
      error: result.error,
      code: result.code,
    });

    return NextResponse.json(
      { error: result.error, code: result.code, success: false },
      { status: 400 }
    );
  }

  logger.info('KBA verification successful', {
    consentRecordId: validatedData.consentRecordId,
  });

  return NextResponse.json({
    success: true,
    message: 'Parental consent has been verified and granted.',
    consentRecordId: result.consentRecordId,
  });
}

async function handleRefreshSession(body: unknown) {
  let validatedData;
  try {
    validatedData = z.object({
      language: z.enum(['en', 'ko']).optional().default('en'),
    }).parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  const session = generateKBASession(validatedData.language);

  return NextResponse.json({
    success: true,
    sessionId: session.sessionId,
    questions: session.questions,
    expiresIn: 15 * 60,
    message: 'New KBA session created.',
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const status = getSessionStatus(sessionId);

    return NextResponse.json({
      valid: status.valid,
      expiresAt: status.expiresAt,
      attempts: status.attempts,
      maxAttempts: status.maxAttempts,
      remainingAttempts: status.maxAttempts - (status.attempts || 0),
    });
  } catch (error) {
    logger.error('Error checking KBA session status', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
