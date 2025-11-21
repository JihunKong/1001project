import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AccountType } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { accountType, ageGroup, country, language, interests } = body;

    if (!accountType || !ageGroup || !interests || interests.length === 0) {
      return NextResponse.json(
        { error: 'Missing required onboarding data' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.profile) {
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: {
          accountType: accountType as AccountType,
          ageGroup,
          country,
          interests,
          onboardingCompleted: true,
        },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: user.id,
          accountType: accountType as AccountType,
          ageGroup,
          country,
          interests,
          onboardingCompleted: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
