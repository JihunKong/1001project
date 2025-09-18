import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.BOOK_MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const submissionId = params.id;

    const submission = await prisma.textSubmission.findUnique({
      where: { id: submissionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        class: {
          select: {
            name: true,
            teacher: {
              select: {
                name: true
              }
            }
          }
        },
        workflowTransitions: {
          include: {
            performedBy: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Check if submission is in APPROVED status (ready for book manager review)
    if (submission.status !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Submission is not ready for format decision' 
      }, { status: 400 });
    }

    return NextResponse.json({
      submission: {
        id: submission.id,
        title: submission.title,
        contentMd: submission.contentMd,
        chaptersJson: submission.chaptersJson,
        summary: submission.summary,
        authorId: submission.authorId,
        authorRole: submission.authorRole,
        source: submission.source,
        classId: submission.classId,
        status: submission.status,
        revisionNo: submission.revisionNo,
        language: submission.language,
        ageRange: submission.ageRange,
        category: submission.category,
        tags: submission.tags,
        reviewNotes: submission.reviewNotes,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
        author: submission.author,
        class: submission.class,
        workflowTransitions: submission.workflowTransitions.map(transition => ({
          id: transition.id,
          fromStatus: transition.fromStatus,
          toStatus: transition.toStatus,
          comment: transition.comment,
          createdAt: transition.createdAt.toISOString(),
          performedBy: transition.performedBy
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching text submission:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch submission' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}