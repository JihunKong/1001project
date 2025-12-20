import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendLocalizedVerificationEmail } from '@/lib/email';
import { getLanguagePreferenceFromHeaders, SupportedLanguage } from '@/lib/i18n/language-cookie';

const RESEND_RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 1,
  message: 'Please wait before requesting another verification email'
};

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, RESEND_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accounts: {
          select: { provider: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a verification email will be sent' },
        { status: 200 }
      );
    }

    const hasOAuthAccount = user.accounts.some(acc =>
      acc.provider === 'google' || acc.provider === 'github'
    );

    if (hasOAuthAccount) {
      return NextResponse.json(
        { success: true, message: 'If an account exists, a verification email will be sent' },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: 'Email is already verified' },
        { status: 200 }
      );
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: normalizedEmail }
    });

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    const cookieHeader = request.headers.get('cookie');
    const language = getLanguagePreferenceFromHeaders(cookieHeader) as SupportedLanguage;

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;

    await sendLocalizedVerificationEmail(normalizedEmail, verificationUrl, language);

    logger.info('Verification email resent', { email: normalizedEmail, language });

    return NextResponse.json(
      { success: true, message: 'Verification email sent' },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Error resending verification email', error);
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
