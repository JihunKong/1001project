import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ParentalConsentStatus } from '@prisma/client';
import { z } from 'zod';
import { validateConsentToken } from '@/lib/coppa';
import { logger } from '@/lib/logger';

const ConsentActionSchema = z.object({
  token: z.string().min(32, 'Invalid consent token'),
  action: z.enum(['approve', 'deny']),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const action = searchParams.get('action');

    if (!token || !action) {
      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=missing_params', request.url)
      );
    }

    let validatedData;
    try {
      validatedData = ConsentActionSchema.parse({ token, action });
    } catch {
      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=invalid_params', request.url)
      );
    }

    if (!validateConsentToken(validatedData.token)) {
      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=invalid_token', request.url)
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        parentalConsentToken: validatedData.token,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=consent_not_found', request.url)
      );
    }

    if (profile.parentalConsentStatus !== ParentalConsentStatus.PENDING) {
      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=already_processed', request.url)
      );
    }

    if (profile.parentalConsentTokenExp && new Date() > profile.parentalConsentTokenExp) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          parentalConsentStatus: ParentalConsentStatus.EXPIRED,
          parentalConsentToken: null,
          parentalConsentTokenExp: null,
        }
      });

      return NextResponse.redirect(
        new URL('/parental-consent/error?reason=expired', request.url)
      );
    }

    if (validatedData.action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { id: profile.id },
          data: {
            parentalConsentStatus: ParentalConsentStatus.GRANTED,
            parentalConsentDate: new Date(),
            parentalConsentRequired: false,
            parentalConsentToken: null,
            parentalConsentTokenExp: null,
            coppaCompliant: true,
          }
        });

        await tx.user.update({
          where: { id: profile.userId },
          data: {
            emailVerified: new Date(),
          }
        });
      });

      logger.info('Parental consent granted', {
        userId: profile.userId,
        childEmail: profile.user.email,
        parentEmail: profile.parentEmail
      });

      return NextResponse.redirect(
        new URL('/parental-consent/success?status=approved', request.url)
      );
    } else {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          parentalConsentStatus: ParentalConsentStatus.DENIED,
          parentalConsentDate: new Date(),
          parentalConsentToken: null,
          parentalConsentTokenExp: null,
        }
      });

      logger.info('Parental consent denied', {
        userId: profile.userId,
        childEmail: profile.user.email,
        parentEmail: profile.parentEmail
      });

      return NextResponse.redirect(
        new URL('/parental-consent/success?status=denied', request.url)
      );
    }

  } catch (error) {
    logger.error('Error processing parental consent', error);
    return NextResponse.redirect(
      new URL('/parental-consent/error?reason=server_error', request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let validatedData;
    try {
      validatedData = ConsentActionSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (!validateConsentToken(validatedData.token)) {
      return NextResponse.json(
        { error: 'Invalid or expired consent token' },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        parentalConsentToken: validatedData.token,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Consent request not found or already processed' },
        { status: 404 }
      );
    }

    if (profile.parentalConsentStatus !== ParentalConsentStatus.PENDING) {
      return NextResponse.json(
        { error: 'Consent request has already been processed' },
        { status: 409 }
      );
    }

    if (profile.parentalConsentTokenExp && new Date() > profile.parentalConsentTokenExp) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          parentalConsentStatus: ParentalConsentStatus.EXPIRED,
          parentalConsentToken: null,
          parentalConsentTokenExp: null,
        }
      });

      return NextResponse.json(
        { error: 'Consent request has expired' },
        { status: 410 }
      );
    }

    if (validatedData.action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.profile.update({
          where: { id: profile.id },
          data: {
            parentalConsentStatus: ParentalConsentStatus.GRANTED,
            parentalConsentDate: new Date(),
            parentalConsentRequired: false,
            parentalConsentToken: null,
            parentalConsentTokenExp: null,
            coppaCompliant: true,
          }
        });

        await tx.user.update({
          where: { id: profile.userId },
          data: {
            emailVerified: new Date(),
          }
        });
      });

      logger.info('Parental consent granted via API', {
        userId: profile.userId,
        childEmail: profile.user.email
      });

      return NextResponse.json({
        message: 'Parental consent granted successfully',
        status: 'approved',
        childName: profile.user.name,
        childEmail: profile.user.email,
      }, { status: 200 });
    } else {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          parentalConsentStatus: ParentalConsentStatus.DENIED,
          parentalConsentDate: new Date(),
          parentalConsentToken: null,
          parentalConsentTokenExp: null,
        }
      });

      logger.info('Parental consent denied via API', {
        userId: profile.userId,
        childEmail: profile.user.email
      });

      return NextResponse.json({
        message: 'Parental consent denied',
        status: 'denied',
        childName: profile.user.name,
      }, { status: 200 });
    }

  } catch (error) {
    logger.error('Error processing parental consent API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
