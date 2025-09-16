import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const ageGroup = searchParams.get('ageGroup');
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      status: 'PUBLISHED' // Only show published text stories
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (language && language !== 'all') {
      where.language = language;
    }
    
    if (ageGroup && ageGroup !== 'all') {
      where.ageRange = ageGroup;
    }
    
    // Get total count
    const totalCount = await prisma.textSubmission.count({ where });
    
    // Get text stories
    const textStories = await prisma.textSubmission.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        },
        publishedBooks: {
          select: {
            id: true
          }
        }
      }
    });
    
    // Transform to match Book interface
    const books = textStories.map(story => ({
      id: story.id,
      title: story.title,
      subtitle: null,
      summary: story.summary,
      authorName: story.author.name || 'Anonymous',
      authorAge: null,
      authorLocation: null,
      language: story.language || 'en',
      category: story.category ? [story.category] : [],
      tags: story.tags || [],
      ageRange: story.ageRange,
      readingTime: Math.ceil((story.contentMd?.length || 0) / 1000), // Rough estimate
      coverImage: null,
      isFeatured: false,
      featured: false,
      rating: null,
      accessLevel: 'full' as const,
      viewCount: 0,
      downloadCount: 0,
      createdAt: story.createdAt.toISOString(),
      hasAccess: true,
      // Text-specific fields
      wordCount: story.contentMd?.split(/\s+/).length || 0,
      status: story.status,
      revisionNo: story.revisionNo
    }));
    
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: skip + limit < totalCount,
      limit
    };
    
    return NextResponse.json({
      books,
      pagination
    });
    
  } catch (error) {
    console.error('Error fetching text stories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch text stories' },
      { status: 500 }
    );
  }
}