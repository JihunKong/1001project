import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      logger.warn('Email verification attempted without token');
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      logger.warn('Email verification attempted with invalid token', { token: token.substring(0, 8) + '...' });
      return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url));
    }

    if (verificationToken.expires < new Date()) {
      logger.warn('Email verification attempted with expired token', {
        identifier: verificationToken.identifier,
        expiredAt: verificationToken.expires
      });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL('/verify-email?error=expired', request.url));
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      logger.warn('Email verification attempted for non-existent user', {
        identifier: verificationToken.identifier
      });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL('/verify-email?error=user-not-found', request.url));
    }

    if (user.emailVerified) {
      logger.info('Email already verified', { userId: user.id });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL('/login?verified=already', request.url));
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    logger.info('Email verified successfully', { userId: user.id, email: user.email });

    return NextResponse.redirect(new URL('/login?verified=true', request.url));

  } catch (error) {
    logger.error('Error during email verification', error);
    return NextResponse.redirect(new URL('/verify-email?error=server', request.url));
  }
}
