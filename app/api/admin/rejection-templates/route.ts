import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['CONTENT', 'FORMAT', 'POLICY', 'QUALITY', 'LANGUAGE', 'OTHER']),
  message: z.string().min(10).max(2000),
  applicableRoles: z.array(z.string()).min(1),
  isActive: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedRoles: UserRole[] = [
      'STORY_MANAGER',
      'BOOK_MANAGER',
      'CONTENT_ADMIN',
      'ADMIN'
    ];

    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    const category = url.searchParams.get('category');

    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }

    if (category) {
      where.category = category;
    }

    if (user.role !== 'ADMIN') {
      where.applicableRoles = {
        has: user.role
      };
    }

    const templates = await prisma.rejectionTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            feedback: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { usageCount: 'desc' },
        { name: 'asc' }
      ]
    });

    const categoryCounts = await prisma.rejectionTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: true
    });

    return NextResponse.json({
      templates,
      stats: {
        total: templates.length,
        categories: categoryCounts,
        mostUsed: templates.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          usageCount: t.usageCount
        }))
      }
    });

  } catch (error) {
    console.error('Templates fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedRoles: UserRole[] = ['CONTENT_ADMIN', 'ADMIN'];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    const existingTemplate = await prisma.rejectionTemplate.findFirst({
      where: {
        name: validatedData.name,
        category: validatedData.category
      }
    });

    if (existingTemplate) {
      return NextResponse.json({
        error: 'Template with this name and category already exists'
      }, { status: 400 });
    }

    const template = await prisma.rejectionTemplate.create({
      data: {
        ...validatedData,
        createdBy: user.id
      }
    });

    await prisma.auditEvent.create({
      data: {
        eventType: 'TEMPLATE_CREATED',
        actorId: user.id,
        action: 'CREATE_REJECTION_TEMPLATE',
        metadata: {
          templateId: template.id,
          templateName: template.name,
          category: template.category
        }
      }
    });

    return NextResponse.json({
      ok: true,
      template,
      message: 'Rejection template created successfully'
    });

  } catch (error) {
    console.error('Template creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const allowedRoles: UserRole[] = ['CONTENT_ADMIN', 'ADMIN'];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        error: 'Template ID is required'
      }, { status: 400 });
    }

    const existingTemplate = await prisma.rejectionTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json({
        error: 'Template not found'
      }, { status: 404 });
    }

    const validatedData = templateSchema.partial().parse(updateData);

    const template = await prisma.rejectionTemplate.update({
      where: { id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    });

    await prisma.auditEvent.create({
      data: {
        eventType: 'TEMPLATE_UPDATED',
        actorId: user.id,
        action: 'UPDATE_REJECTION_TEMPLATE',
        metadata: {
          templateId: template.id,
          previousData: existingTemplate,
          newData: template
        }
      }
    });

    return NextResponse.json({
      ok: true,
      template,
      message: 'Rejection template updated successfully'
    });

  } catch (error) {
    console.error('Template update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: 'Template ID is required'
      }, { status: 400 });
    }

    const template = await prisma.rejectionTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            feedback: true
          }
        }
      }
    });

    if (!template) {
      return NextResponse.json({
        error: 'Template not found'
      }, { status: 404 });
    }

    if (template._count.feedback > 0) {
      await prisma.rejectionTemplate.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      await prisma.auditEvent.create({
        data: {
          eventType: 'TEMPLATE_DEACTIVATED',
          actorId: user.id,
          action: 'DEACTIVATE_REJECTION_TEMPLATE',
          metadata: {
            templateId: template.id,
            templateName: template.name,
            reason: 'Has existing feedback references'
          }
        }
      });

      return NextResponse.json({
        ok: true,
        message: 'Template deactivated (has existing usage)'
      });
    } else {
      await prisma.rejectionTemplate.delete({
        where: { id }
      });

      await prisma.auditEvent.create({
        data: {
          eventType: 'TEMPLATE_DELETED',
          actorId: user.id,
          action: 'DELETE_REJECTION_TEMPLATE',
          metadata: {
            templateId: template.id,
            templateName: template.name
          }
        }
      });

      return NextResponse.json({
        ok: true,
        message: 'Template deleted successfully'
      });
    }

  } catch (error) {
    console.error('Template deletion error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}