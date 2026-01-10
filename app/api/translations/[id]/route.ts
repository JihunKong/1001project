import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const ADMIN_ROLES = ['ADMIN', 'CONTENT_ADMIN'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const translation = await prisma.translation.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            summary: true,
            content: true,
            authorName: true,
            coverImage: true,
            language: true
          }
        },
        translator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!translation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    return NextResponse.json({ translation });
  } catch (error) {
    logger.error('Error fetching translation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, summary, content, status, humanReviewed, qualityScore } = body;

    const existingTranslation = await prisma.translation.findUnique({
      where: { id }
    });

    if (!existingTranslation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (humanReviewed !== undefined) {
      updateData.humanReviewed = humanReviewed;
      if (humanReviewed) {
        updateData.reviewedAt = new Date();
      }
    }
    if (qualityScore !== undefined) updateData.qualityScore = qualityScore;

    if (status === 'PUBLISHED' && existingTranslation.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const translation = await prisma.translation.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        humanReviewed: true,
        qualityScore: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Translation updated successfully',
      translation
    });
  } catch (error) {
    logger.error('Error updating translation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user || !ADMIN_ROLES.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingTranslation = await prisma.translation.findUnique({
      where: { id }
    });

    if (!existingTranslation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }

    await prisma.translation.delete({ where: { id } });

    return NextResponse.json({
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting translation', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
