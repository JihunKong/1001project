import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDiscussionSchema = z.object({
  clubId: z.string(),
  content: z.string().min(1).max(5000),
});

const replySchema = z.object({
  parentId: z.string(),
  content: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');
    const discussionId = searchParams.get('discussionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (discussionId) {
      const discussion = await prisma.bookClubPost.findUnique({
        where: { id: discussionId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              parent: {
                select: {
                  id: true,
                  content: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      if (!discussion) {
        return NextResponse.json(
          { error: 'Discussion not found' },
          { status: 404 }
        );
      }

      const isMember = await prisma.bookClubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: discussion.clubId,
            userId: session.user.id,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member to view discussions' },
          { status: 403 }
        );
      }

      // Note: viewCount tracking could be added later if needed
      // For now, just return the discussion as-is

      return NextResponse.json({
        discussion,
      });
    }

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      );
    }

    const isMember = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: session.user.id,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to view discussions' },
        { status: 403 }
      );
    }

    const [discussions, totalCount] = await prisma.$transaction([
      prisma.bookClubPost.findMany({
        where: { clubId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
          replies: {
            select: {
              id: true,
              createdAt: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.bookClubPost.count({ where: { clubId } }),
    ]);

    return NextResponse.json({
      discussions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching discussions:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (body.parentId) {
      const replyData = replySchema.parse(body);

      const parentPost = await prisma.bookClubPost.findUnique({
        where: { id: replyData.parentId },
        select: {
          id: true,
          clubId: true,
          userId: true,
        },
      });

      if (!parentPost) {
        return NextResponse.json(
          { error: 'Parent post not found' },
          { status: 404 }
        );
      }

      const isMember = await prisma.bookClubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: parentPost.clubId,
            userId: session.user.id,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member to reply' },
          { status: 403 }
        );
      }

      const reply = await prisma.bookClubPost.create({
        data: {
          clubId: parentPost.clubId,
          userId: session.user.id,
          content: replyData.content,
          parentId: replyData.parentId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (parentPost.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: parentPost.userId,
            type: 'SYSTEM' as const,
            title: 'New Reply',
            message: `${session.user.name || 'Someone'} replied to your discussion`,
            data: {
              discussionId: parentPost.id,
              replyId: reply.id,
            },
          },
        });
      }

      return NextResponse.json({
        success: true,
        reply,
      });

    } else {
      const discussionData = createDiscussionSchema.parse(body);

      const isMember = await prisma.bookClubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: discussionData.clubId,
            userId: session.user.id,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member to create discussions' },
          { status: 403 }
        );
      }

      const discussion = await prisma.bookClubPost.create({
        data: {
          clubId: discussionData.clubId,
          userId: session.user.id,
          content: discussionData.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      });

      const clubMembers = await prisma.bookClubMember.findMany({
        where: {
          clubId: discussionData.clubId,
          userId: { not: session.user.id },
        },
        select: {
          userId: true,
        },
      });

      if (clubMembers.length > 0) {
        const notifications = clubMembers.map(member => ({
          userId: member.userId,
          type: 'SYSTEM' as const,
          title: 'New Discussion',
          message: `${session.user.name || 'A member'} started a new discussion`,
          data: {
            clubId: discussionData.clubId,
            discussionId: discussion.id,
          },
        })) as Array<{
          userId: string;
          type: 'SYSTEM';
          title: string;
          message: string;
          data: any;
        }>;

        await prisma.notification.createMany({
          data: notifications,
        });
      }

      return NextResponse.json({
        success: true,
        discussion,
      });
    }

  } catch (error) {
    console.error('Error creating discussion/reply:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create discussion/reply' },
      { status: 500 }
    );
  }
}