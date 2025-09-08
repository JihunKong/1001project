import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clubId } = params;
    const { content, parentId } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Verify the club exists and user is a member
    const bookClub = await prisma.bookClub.findUnique({
      where: { id: clubId }
    });

    if (!bookClub) {
      return NextResponse.json(
        { success: false, error: 'Book club not found' },
        { status: 404 }
      );
    }

    // Check if user is a member (or auto-join them)
    let member = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: clubId,
          userId: session.user.id
        }
      }
    });

    if (!member) {
      // Auto-join user to the club
      member = await prisma.bookClubMember.create({
        data: {
          clubId: clubId,
          userId: session.user.id,
          role: 'MEMBER'
        }
      });
    }

    // Create the post
    const post = await prisma.bookClubPost.create({
      data: {
        clubId: clubId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    });

    // Transform for API response
    const responseData = {
      id: post.id,
      userId: post.userId,
      author: post.user.name || 'Anonymous',
      authorImage: post.user.image,
      content: post.content,
      createdAt: post.createdAt,
      likes: post.likes,
      comments: post.replies.map(reply => ({
        id: reply.id,
        userId: reply.userId,
        author: reply.user.name || 'Anonymous',
        authorImage: reply.user.image,
        content: reply.content,
        createdAt: reply.createdAt,
        likes: reply.likes,
      }))
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { clubId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { clubId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const skip = (page - 1) * pageSize;

    // Get posts for the club
    const posts = await prisma.bookClubPost.findMany({
      where: {
        clubId: clubId,
        parentId: null, // Only get top-level posts
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    });

    // Get total count for pagination
    const total = await prisma.bookClubPost.count({
      where: {
        clubId: clubId,
        parentId: null,
      }
    });

    // Transform posts for API response
    const data = posts.map(post => ({
      id: post.id,
      userId: post.userId,
      author: post.user.name || 'Anonymous',
      authorImage: post.user.image,
      content: post.content,
      createdAt: post.createdAt,
      likes: post.likes,
      comments: post.replies.map(reply => ({
        id: reply.id,
        userId: reply.userId,
        author: reply.user.name || 'Anonymous',
        authorImage: reply.user.image,
        content: reply.content,
        createdAt: reply.createdAt,
        likes: reply.likes,
      }))
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}