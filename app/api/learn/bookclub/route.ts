import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Get or create book club for this book
    let bookClub = await prisma.bookClub.findFirst({
      where: {
        bookId: bookId,
        isActive: true,
        isPublic: true,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        posts: {
          where: {
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
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });

    // If no book club exists, create one
    if (!bookClub) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { title: true }
      });

      if (!book) {
        return NextResponse.json(
          { success: false, error: 'Book not found' },
          { status: 404 }
        );
      }

      bookClub = await prisma.bookClub.create({
        data: {
          bookId: bookId,
          creatorId: session.user.id,
          name: `${book.title} Book Club`,
          description: `Discussion forum for ${book.title}`,
          isActive: true,
          isPublic: true,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          },
          posts: []
        }
      });

      // Automatically add creator as a member
      await prisma.bookClubMember.create({
        data: {
          clubId: bookClub.id,
          userId: session.user.id,
          role: 'MODERATOR'
        }
      });
    }

    // Check if current user is a member
    const isMember = await prisma.bookClubMember.findUnique({
      where: {
        clubId_userId: {
          clubId: bookClub.id,
          userId: session.user.id
        }
      }
    });

    // Transform posts for API response
    const discussions = bookClub.posts.map(post => ({
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
      data: {
        clubId: bookClub.id,
        name: bookClub.name,
        description: bookClub.description,
        memberCount: bookClub.members.length,
        isMember: !!isMember,
        discussions
      }
    });
  } catch (error) {
    console.error('Error fetching book club:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book club' },
      { status: 500 }
    );
  }
}