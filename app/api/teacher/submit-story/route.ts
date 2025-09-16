import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, StorySubmissionStatus, Priority } from '@prisma/client';
import { z } from 'zod';

const submitStorySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(100, 'Story content must be at least 100 characters').max(50000, 'Story content too long'),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(1000, 'Summary too long'),
  language: z.string().min(2, 'Language is required').max(5, 'Invalid language code'),
  category: z.string().max(50).optional(),
  ageGroup: z.string().max(20).optional(),
  tags: z.string().max(200).optional(),
  studentName: z.string().max(100).optional(),
  source: z.literal('classroom'),
});

// POST: Submit a text story on behalf of a class
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers can submit stories through this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can submit stories through this endpoint' },
        { status: 403 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = submitStorySchema.parse(body);

    // Get teacher's active classes to associate with submission
    const teacherClasses = await prisma.class.findMany({
      where: {
        teacherId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      }
    });

    // Process tags
    const tagsArray = validatedData.tags 
      ? validatedData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Create the story submission
    const submission = await prisma.storySubmission.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        summary: validatedData.summary,
        language: validatedData.language,
        category: validatedData.category || 'Classroom Story',
        ageGroup: validatedData.ageGroup || 'Not Specified',
        status: StorySubmissionStatus.SUBMITTED,
        priority: Priority.MEDIUM,
        tags: tagsArray,
        authorId: session.user.id,
        // Store additional metadata in editorial notes
        editorialNotes: JSON.stringify({
          source: 'classroom',
          teacherId: session.user.id,
          teacherName: session.user.name,
          studentName: validatedData.studentName,
          submittedAt: new Date().toISOString(),
          classIds: teacherClasses.map(c => c.id),
          classNames: teacherClasses.map(c => c.name),
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Create workflow history entry
    await prisma.workflowHistory.create({
      data: {
        submissionId: submission.id,
        status: StorySubmissionStatus.SUBMITTED,
        userId: session.user.id,
        notes: `Story submitted by teacher ${session.user.name} on behalf of their class${validatedData.studentName ? ` (Student: ${validatedData.studentName})` : ''}.`,
        metadata: {
          source: 'classroom',
          teacherId: session.user.id,
          studentName: validatedData.studentName,
        }
      }
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'STORY_SUBMITTED_BY_TEACHER',
        details: {
          submissionId: submission.id,
          title: validatedData.title,
          source: 'classroom',
          studentName: validatedData.studentName,
          wordCount: validatedData.content.split(/\s+/).length,
        },
      }
    });

    // If there are active classes, create notifications for relevant users
    if (teacherClasses.length > 0) {
      // Find story managers who should be notified
      const storyManagers = await prisma.user.findMany({
        where: {
          role: UserRole.STORY_MANAGER,
          isActive: true,
        },
        select: { id: true }
      });

      // Create notifications for story managers
      if (storyManagers.length > 0) {
        await prisma.notification.createMany({
          data: storyManagers.map(manager => ({
            userId: manager.id,
            type: 'SUBMISSION_RECEIVED',
            title: 'New Classroom Story Submission',
            message: `Teacher ${session.user.name} has submitted a new story: "${validatedData.title}"`,
            data: {
              submissionId: submission.id,
              teacherId: session.user.id,
              source: 'classroom',
            }
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Story "${validatedData.title}" has been submitted successfully and is now in review.`,
      submissionId: submission.id,
      submission: {
        id: submission.id,
        title: submission.title,
        status: submission.status,
        priority: submission.priority,
        createdAt: submission.createdAt,
        wordCount: validatedData.content.split(/\s+/).length,
      }
    });

  } catch (error) {
    console.error('Error submitting story:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid submission data', 
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit story. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Get teacher's story submissions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only teachers can access this endpoint
    if (session.user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get all submissions by this teacher
    const submissions = await prisma.storySubmission.findMany({
      where: {
        authorId: session.user.id,
        // Filter for classroom submissions by checking editorial notes
        editorialNotes: {
          contains: '"source":"classroom"',
        }
      },
      include: {
        feedback: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        workflowHistory: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format submissions with additional computed fields
    const formattedSubmissions = submissions.map(submission => {
      const metadata = submission.editorialNotes 
        ? JSON.parse(submission.editorialNotes) 
        : {};
      
      return {
        id: submission.id,
        title: submission.title,
        summary: submission.summary,
        status: submission.status,
        priority: submission.priority,
        category: submission.category,
        ageGroup: submission.ageGroup,
        language: submission.language,
        tags: submission.tags,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        wordCount: submission.content.split(/\s+/).length,
        studentName: metadata.studentName,
        latestFeedback: submission.feedback[0] || null,
        statusHistory: submission.workflowHistory,
        canEdit: submission.status === StorySubmissionStatus.DRAFT || 
                 submission.status === StorySubmissionStatus.REJECTED,
      };
    });

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      count: formattedSubmissions.length,
    });

  } catch (error) {
    console.error('Error fetching teacher submissions:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}