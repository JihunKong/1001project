import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyLinkToken } from '@/lib/auth-link-token';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      logger.warn('Link account request without token');
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const payload = verifyLinkToken(token);

    if (!payload) {
      logger.security('Invalid or expired link token');
      return NextResponse.json(
        { error: 'Invalid or expired token. Please try signing in again.' },
        { status: 401 }
      );
    }

    const { userId, email, provider, providerAccountId, accessToken, refreshToken, expiresAt, tokenType, scope, idToken } = payload;

    // Verify the user still exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.error('Link account failed - user not found', { userId, email });
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Check if account is already linked
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        provider,
      },
    });

    if (existingAccount) {
      logger.info('Account already linked', { userId, provider });
      return NextResponse.json(
        { message: 'Account already linked', alreadyLinked: true },
        { status: 200 }
      );
    }

    // Create the account link
    await prisma.account.create({
      data: {
        userId,
        type: 'oauth',
        provider,
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        token_type: tokenType,
        scope,
        id_token: idToken,
      },
    });

    // Update user's emailVerified if not already verified (Google verifies email)
    if (!user.emailVerified && provider === 'google') {
      await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
      });
    }

    logger.auth('Account linked successfully', { userId, email, provider });

    return NextResponse.json(
      { message: 'Account linked successfully', success: true },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Link account error', error);
    return NextResponse.json(
      { error: 'Failed to link account. Please try again.' },
      { status: 500 }
    );
  }
}
