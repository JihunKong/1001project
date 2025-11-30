import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { TeacherResourceType } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resource = await prisma.teacherResource.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const favorite = await prisma.teacherResourceFavorite.findUnique({
      where: {
        userId_resourceId: {
          userId: session.user.id,
          resourceId: id,
        },
      },
    });

    await prisma.teacherResource.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...resource,
      isFavorited: !!favorite,
    });
  } catch (error) {
    console.error('Error fetching teacher resource:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher resource' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resource = await prisma.teacherResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const allowedRoles = ['ADMIN', 'CONTENT_ADMIN'];
    const isOwner = resource.authorId === session.user.id;
    const isAdmin = allowedRoles.includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, subject, grade, fileUrl, fileSize, duration, thumbnailUrl, isPublished } = body;

    const updatedResource = await prisma.teacherResource.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type: type as TeacherResourceType }),
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(fileUrl && { fileUrl }),
        ...(fileSize !== undefined && { fileSize }),
        ...(duration !== undefined && { duration }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(updatedResource);
  } catch (error) {
    console.error('Error updating teacher resource:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resource = await prisma.teacherResource.findUnique({
      where: { id },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const allowedRoles = ['ADMIN', 'CONTENT_ADMIN'];
    const isOwner = resource.authorId === session.user.id;
    const isAdmin = allowedRoles.includes(session.user.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.teacherResource.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher resource' },
      { status: 500 }
    );
  }
}
