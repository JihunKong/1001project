import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const AmendmentRequestSchema = z.object({
  childId: z.string().min(1, 'Child ID is required'),
  recordType: z.string().min(1, 'Record type is required'),
  recordId: z.string().min(1, 'Record ID is required'),
  currentValue: z.record(z.unknown()),
  requestedValue: z.record(z.unknown()),
  reason: z.string().min(10, 'Please provide a detailed reason for the amendment'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = AmendmentRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const parentRelation = await prisma.parentChildRelation.findFirst({
      where: {
        parentUserId: session.user.id,
        childUserId: validatedData.childId,
        isActive: true,
        verified: true,
      },
    });

    if (!parentRelation) {
      return NextResponse.json(
        { error: 'You do not have rights to request amendments for this student' },
        { status: 403 }
      );
    }

    const appealDeadline = new Date();
    appealDeadline.setDate(appealDeadline.getDate() + 45);

    const amendmentRequest = await prisma.amendmentRequest.create({
      data: {
        requesterId: session.user.id,
        studentId: validatedData.childId,
        recordType: validatedData.recordType,
        recordId: validatedData.recordId,
        currentValue: validatedData.currentValue as Prisma.InputJsonValue,
        requestedValue: validatedData.requestedValue as Prisma.InputJsonValue,
        reason: validatedData.reason,
        status: 'PENDING',
        appealDeadline,
      },
    });

    logger.info('Amendment request created', {
      requestId: amendmentRequest.id,
      requesterId: session.user.id,
      studentId: validatedData.childId,
      recordType: validatedData.recordType,
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'SYSTEM',
        title: 'Amendment Request Submitted',
        message: `Your request to amend ${validatedData.recordType} record has been submitted. You will be notified of the decision within 45 days.`,
        data: { amendmentRequestId: amendmentRequest.id },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Amendment request submitted successfully',
      request: {
        id: amendmentRequest.id,
        status: amendmentRequest.status,
        appealDeadline: amendmentRequest.appealDeadline,
      },
      ferpaNotice: {
        message:
          'Under FERPA, the school must decide your request within a reasonable time but not more than 45 days. If denied, you have the right to a hearing.',
        expectedResponseBy: appealDeadline,
      },
    });
  } catch (error) {
    logger.error('Error creating amendment request', error);
    return NextResponse.json(
      { error: 'Failed to create amendment request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const requestId = searchParams.get('requestId');

    if (requestId) {
      const amendmentRequest = await prisma.amendmentRequest.findUnique({
        where: { id: requestId },
      });

      if (!amendmentRequest) {
        return NextResponse.json(
          { error: 'Amendment request not found' },
          { status: 404 }
        );
      }

      if (amendmentRequest.requesterId !== session.user.id) {
        return NextResponse.json(
          { error: 'You do not have access to this request' },
          { status: 403 }
        );
      }

      return NextResponse.json({ request: amendmentRequest });
    }

    const where: { requesterId: string; studentId?: string } = {
      requesterId: session.user.id,
    };

    if (childId) {
      where.studentId = childId;
    }

    const requests = await prisma.amendmentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error('Error fetching amendment requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch amendment requests' },
      { status: 500 }
    );
  }
}
