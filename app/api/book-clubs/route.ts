import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { userHasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { z } from 'zod';

const createBookClubSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  bookId: z.string(),
  classId: z.string().optional(),
  maxMembers: z.number().min(2).max(50).default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isPublic: z.boolean().default(false),
});

const joinBookClubSchema = z.object({
  clubId: z.string(),
  joinCode: z.string().optional(),
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
    const filter = searchParams.get('filter') || 'all';
    const bookId = searchParams.get('bookId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (filter === 'my-clubs') {
      whereClause.members = {
        some: {
          userId: session.user.id,
        },
      };
    } else if (filter === 'created') {
      whereClause.creatorId = session.user.id;
    } else if (filter === 'public') {
      whereClause.isPublic = true;
    }

    if (bookId) {
      whereClause.bookId = bookId;
    }

    const [clubs, totalCount] = await prisma.$transaction([
      prisma.bookClub.findMany({
        where: whereClause,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
              coverImage: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
          members: {
            where: {
              userId: session.user.id,
            },
            select: {
              role: true,
              joinedAt: true,
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
      prisma.bookClub.count({ where: whereClause }),
    ]);

    const formattedClubs = clubs.map(club => ({
      ...club,
      isMember: club.members.length > 0,
      memberRole: club.members[0]?.role || null,
      canJoin: !club.members.length && (!club.maxMembers || club._count.members < club.maxMembers),
    }));

    return NextResponse.json({
      clubs: formattedClubs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching book clubs:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch book clubs' },
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
    
    if (body.clubId) {
      const joinData = joinBookClubSchema.parse(body);
      
      const club = await prisma.bookClub.findUnique({
        where: { id: joinData.clubId },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!club) {
        return NextResponse.json(
          { error: 'Book club not found' },
          { status: 404 }
        );
      }

      if (!club.isPublic && club.joinCode !== joinData.joinCode) {
        return NextResponse.json(
          { error: 'Invalid join code' },
          { status: 403 }
        );
      }

      if (club.maxMembers && club._count.members >= club.maxMembers) {
        return NextResponse.json(
          { error: 'Book club is full' },
          { status: 400 }
        );
      }

      const existingMember = await prisma.bookClubMember.findUnique({
        where: {
          clubId_userId: {
            clubId: joinData.clubId,
            userId: session.user.id,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'You are already a member of this book club' },
          { status: 400 }
        );
      }

      const member = await prisma.bookClubMember.create({
        data: {
          clubId: joinData.clubId,
          userId: session.user.id,
          role: 'MEMBER',
        },
      });

      await prisma.notification.create({
        data: {
          userId: club.creatorId,
          type: 'SYSTEM' as const,
          title: 'New Member Joined',
          message: `${session.user.name || session.user.email} joined your book club "${club.name}"`,
          data: {
            clubId: club.id,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully joined book club',
        member,
      });

    } else {
      if (!userHasPermission(session, PERMISSIONS.BOOKCLUB_CREATE)) {
        return NextResponse.json(
          { error: 'You do not have permission to create book clubs' },
          { status: 403 }
        );
      }

      const createData = createBookClubSchema.parse(body);

      const book = await prisma.book.findUnique({
        where: { id: createData.bookId },
        select: {
          id: true,
          title: true,
          isPublished: true,
        },
      });

      if (!book || !book.isPublished) {
        return NextResponse.json(
          { error: 'Book not found or not published' },
          { status: 404 }
        );
      }

      const joinCode = createData.isPublic 
        ? undefined 
        : Math.random().toString(36).substring(2, 8).toUpperCase();

      const club = await prisma.bookClub.create({
        data: {
          name: createData.name,
          description: createData.description,
          bookId: createData.bookId,
          classId: createData.classId,
          creatorId: session.user.id,
          maxMembers: createData.maxMembers,
          startDate: createData.startDate ? new Date(createData.startDate) : new Date(),
          endDate: createData.endDate ? new Date(createData.endDate) : null,
          isPublic: createData.isPublic,
          joinCode,
          settings: {
            allowDiscussion: true,
            requireApproval: false,
            showProgress: true,
          },
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              authorName: true,
            },
          },
        },
      });

      await prisma.bookClubMember.create({
        data: {
          clubId: club.id,
          userId: session.user.id,
          role: 'MODERATOR',
        },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'BOOK_CLUB_CREATED',
          entity: 'BOOK_CLUB',
          entityId: club.id,
          metadata: {
            clubName: club.name,
            bookTitle: club.book.title,
          },
        },
      });

      return NextResponse.json({
        success: true,
        club,
        joinCode,
      });
    }

  } catch (error) {
    console.error('Error with book club:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process book club request' },
      { status: 500 }
    );
  }
}