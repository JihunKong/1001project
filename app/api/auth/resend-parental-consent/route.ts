import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ParentalConsentStatus } from '@prisma/client';
import { generateConsentToken, getConsentTokenExpiration, generateParentalConsentData } from '@/lib/coppa';
import { EmailService } from '@/lib/notifications/EmailService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.isMinor) {
      return NextResponse.json({ error: 'Parental consent not required for this account' }, { status: 400 });
    }

    if (profile.parentalConsentStatus === ParentalConsentStatus.GRANTED) {
      return NextResponse.json({ error: 'Parental consent already granted' }, { status: 400 });
    }

    if (!profile.parentEmail) {
      return NextResponse.json({ error: 'No parent email on file' }, { status: 400 });
    }

    const consentToken = generateConsentToken();
    const expirationDate = getConsentTokenExpiration();

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        parentalConsentToken: consentToken,
        parentalConsentTokenExp: expirationDate,
        parentalConsentStatus: ParentalConsentStatus.PENDING,
      },
    });

    const age = profile.dateOfBirth
      ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    const consentData = generateParentalConsentData(
      profile.user.name || 'Child',
      profile.user.email || '',
      age,
      profile.parentEmail,
      consentToken
    );

    try {
      const emailService = new EmailService();
      await emailService.sendParentalConsentEmail({
        parentEmail: profile.parentEmail,
        parentName: profile.parentName || undefined,
        childName: profile.user.name || 'Your child',
        childEmail: profile.user.email || '',
        childAge: age,
        consentUrl: consentData.consentUrl,
        expirationDate,
      });

      logger.info('Parental consent email resent', {
        userId: session.user.id,
        parentEmail: profile.parentEmail,
      });
    } catch (emailError) {
      logger.error('Failed to resend parental consent email', emailError);
      return NextResponse.json({ error: 'Failed to send email. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Parental consent email sent successfully',
      expiresAt: expirationDate,
    });
  } catch (error) {
    logger.error('Error resending parental consent', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
