import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let streak = await prisma.readingStreak.findUnique({
      where: { userId: session.user.id },
    });

    if (!streak) {
      streak = await prisma.readingStreak.create({
        data: {
          userId: session.user.id,
          currentStreak: 0,
          longestStreak: 0,
          totalReadDays: 0,
        },
      });
    }

    let currentStreak = streak.currentStreak;
    if (streak.lastReadDate) {
      const lastRead = new Date(streak.lastReadDate);
      if (!isToday(lastRead) && !isYesterday(lastRead)) {
        currentStreak = 0;
      }
    }

    const readAlreadyToday = streak.lastReadDate ? isToday(new Date(streak.lastReadDate)) : false;

    return NextResponse.json({
      currentStreak,
      longestStreak: streak.longestStreak,
      totalReadDays: streak.totalReadDays,
      lastReadDate: streak.lastReadDate,
      readAlreadyToday,
    });
  } catch (error) {
    console.error('Error fetching reading streak:', error);
    return NextResponse.json({ error: 'Failed to fetch reading streak' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action !== 'record') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const existingStreak = await prisma.readingStreak.findUnique({
      where: { userId: session.user.id },
    });

    const now = new Date();

    if (!existingStreak) {
      const streak = await prisma.readingStreak.create({
        data: {
          userId: session.user.id,
          currentStreak: 1,
          longestStreak: 1,
          totalReadDays: 1,
          lastReadDate: now,
        },
      });

      return NextResponse.json({
        streak,
        message: 'Reading streak started!',
        isNewStreak: true,
      });
    }

    if (existingStreak.lastReadDate && isToday(new Date(existingStreak.lastReadDate))) {
      return NextResponse.json({
        streak: existingStreak,
        message: 'Already recorded reading for today',
        alreadyRecorded: true,
      });
    }

    let newCurrentStreak: number;
    let streakContinued = false;

    if (existingStreak.lastReadDate && isYesterday(new Date(existingStreak.lastReadDate))) {
      newCurrentStreak = existingStreak.currentStreak + 1;
      streakContinued = true;
    } else {
      newCurrentStreak = 1;
    }

    const newLongestStreak = Math.max(newCurrentStreak, existingStreak.longestStreak);

    const streak = await prisma.readingStreak.update({
      where: { userId: session.user.id },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        totalReadDays: existingStreak.totalReadDays + 1,
        lastReadDate: now,
      },
    });

    return NextResponse.json({
      streak,
      message: streakContinued
        ? `Great! ${newCurrentStreak} day streak!`
        : 'New reading streak started!',
      streakContinued,
      isNewRecord: newCurrentStreak === newLongestStreak && newCurrentStreak > 1,
    });
  } catch (error) {
    console.error('Error recording reading streak:', error);
    return NextResponse.json({ error: 'Failed to record reading streak' }, { status: 500 });
  }
}
