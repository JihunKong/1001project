import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const workflowSettingsSchema = z.object({
  defaultMode: z.enum(['SIMPLE', 'STANDARD']).default('STANDARD'),
  allowModeOverride: z.boolean().default(false),
  reviewDeadlineHours: z.number().min(1).max(168).default(48),
  revisionDeadlineDays: z.number().min(1).max(30).default(7),
  reminderIntervalHours: z.number().min(1).max(72).default(24),
  escalationRoles: z.array(z.string()).optional(),
  enableAutoEscalation: z.boolean().default(true),
  enableSLATracking: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['EMAIL', 'WEBHOOK', 'SLACK'])).optional(),
  webhookUrl: z.string().url().optional(),
  slackWebhookUrl: z.string().url().optional()
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

    const allowedRoles: UserRole[] = ['CONTENT_ADMIN', 'ADMIN'];
    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let settings = await prisma.workflowSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      settings = await prisma.workflowSettings.create({
        data: {
          defaultMode: 'STANDARD',
          allowModeOverride: false,
          reviewDeadlineHours: 48,
          revisionDeadlineDays: 7,
          reminderIntervalHours: 24,
          escalationRoles: ['CONTENT_ADMIN', 'ADMIN'],
          enableAutoEscalation: true,
          enableSLATracking: true,
          notificationChannels: ['EMAIL'],
          createdBy: user.id
        }
      });
    }

    const slaStats = await prisma.auditEvent.groupBy({
      by: ['eventType'],
      where: {
        eventType: {
          in: ['SLA_VIOLATION', 'SLA_WARNING', 'SLA_ESCALATION']
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _count: true
    });

    const workflowStats = await prisma.book.groupBy({
      by: ['publishingMode'],
      _count: true
    });

    return NextResponse.json({
      settings,
      stats: {
        slaViolations: slaStats.find(s => s.eventType === 'SLA_VIOLATION')?._count || 0,
        slaWarnings: slaStats.find(s => s.eventType === 'SLA_WARNING')?._count || 0,
        slaEscalations: slaStats.find(s => s.eventType === 'SLA_ESCALATION')?._count || 0,
        simpleWorkflows: workflowStats.find(s => s.publishingMode === 'SIMPLE')?._count || 0,
        standardWorkflows: workflowStats.find(s => s.publishingMode === 'STANDARD')?._count || 0
      }
    });

  } catch (error) {
    console.error('Workflow settings fetch error:', error);
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
    const validatedData = workflowSettingsSchema.parse(body);

    const existingSettings = await prisma.workflowSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let settings;
    if (existingSettings) {
      settings = await prisma.workflowSettings.update({
        where: { id: existingSettings.id },
        data: {
          ...validatedData,
          updatedAt: new Date()
        }
      });
    } else {
      settings = await prisma.workflowSettings.create({
        data: {
          ...validatedData,
          createdBy: user.id
        }
      });
    }

    await prisma.auditEvent.create({
      data: {
        eventType: 'SETTINGS_UPDATED',
        actorId: user.id,
        action: 'UPDATE_WORKFLOW_SETTINGS',
        metadata: {
          previousSettings: existingSettings,
          newSettings: settings
        }
      }
    });

    if (validatedData.defaultMode !== existingSettings?.defaultMode && !validatedData.allowModeOverride) {
      const booksToUpdate = await prisma.book.count({
        where: {
          publishingMode: {
            not: validatedData.defaultMode
          }
        }
      });

      if (booksToUpdate > 0) {
        await prisma.book.updateMany({
          where: {
            publishingMode: {
              not: validatedData.defaultMode
            }
          },
          data: {
            publishingMode: validatedData.defaultMode
          }
        });

        await prisma.auditEvent.create({
          data: {
            eventType: 'BULK_MODE_UPDATE',
            actorId: user.id,
            action: 'UPDATE_PUBLISHING_MODE',
            metadata: {
              booksUpdated: booksToUpdate,
              newMode: validatedData.defaultMode
            }
          }
        });
      }
    }

    return NextResponse.json({
      ok: true,
      settings,
      message: 'Workflow settings updated successfully'
    });

  } catch (error) {
    console.error('Workflow settings update error:', error);
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

export async function POST(request: NextRequest) {
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

    const { action } = await request.json();

    if (action === 'reset') {
      await prisma.workflowSettings.deleteMany({});
      
      const newSettings = await prisma.workflowSettings.create({
        data: {
          defaultMode: 'STANDARD',
          allowModeOverride: false,
          reviewDeadlineHours: 48,
          revisionDeadlineDays: 7,
          reminderIntervalHours: 24,
          escalationRoles: ['CONTENT_ADMIN', 'ADMIN'],
          enableAutoEscalation: true,
          enableSLATracking: true,
          notificationChannels: ['EMAIL'],
          createdBy: user.id
        }
      });

      await prisma.auditEvent.create({
        data: {
          eventType: 'SETTINGS_RESET',
          actorId: user.id,
          action: 'RESET_WORKFLOW_SETTINGS',
          metadata: {
            resetTo: 'defaults'
          }
        }
      });

      return NextResponse.json({
        ok: true,
        settings: newSettings,
        message: 'Workflow settings reset to defaults'
      });
    }

    if (action === 'migrate') {
      const booksWithoutMode = await prisma.book.updateMany({
        where: {
          publishingMode: null
        },
        data: {
          publishingMode: 'STANDARD'
        }
      });

      return NextResponse.json({
        ok: true,
        migrated: booksWithoutMode.count,
        message: `Migrated ${booksWithoutMode.count} books to STANDARD mode`
      });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Workflow settings action error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}