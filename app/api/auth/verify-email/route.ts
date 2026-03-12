import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 'https://1001stories.seedsofempowerment.org';
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();

  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      logger.warn('Email verification attempted without token');
      return NextResponse.redirect(`${baseUrl}/verify-email?error=invalid`);
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      logger.warn('Email verification attempted with invalid token', { token: token.substring(0, 8) + '...' });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=invalid`);
    }

    if (verificationToken.expires < new Date()) {
      logger.warn('Email verification attempted with expired token', {
        identifier: verificationToken.identifier,
        expiredAt: verificationToken.expires
      });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=expired`);
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      logger.warn('Email verification attempted for non-existent user', {
        identifier: verificationToken.identifier
      });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${baseUrl}/verify-email?error=user-not-found`);
    }

    if (user.emailVerified) {
      logger.info('Email already verified', { userId: user.id });
      await prisma.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(`${baseUrl}/login?verified=already`);
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    logger.info('Email verified successfully', { userId: user.id, email: user.email });

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);

  } catch (error) {
    logger.error('Error during email verification', error);
    return NextResponse.redirect(`${baseUrl}/verify-email?error=server`);
  }
}
