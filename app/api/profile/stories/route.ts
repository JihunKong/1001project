import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const submissions = await prisma.textSubmission.findMany({
      where: {
        authorId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        content: true
      }
    });

    const stories = submissions.map((submission) => {
      const wordCount = submission.content
        ? submission.content.split(/\s+/).filter(word => word.length > 0).length
        : 0;

      return {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        createdAt: submission.createdAt.toISOString(),
        wordCount
      };
    });

    return NextResponse.json(
      { stories },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
