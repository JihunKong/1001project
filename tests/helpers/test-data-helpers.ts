import { PrismaClient } from '@prisma/client';
import { TextSubmissionStatus } from './workflow-helpers';

const prisma = new PrismaClient();

export interface CreateSubmissionOptions {
  title: string;
  content: string;
  authorId: string;
  status?: TextSubmissionStatus;
  storyManagerId?: string;
  bookManagerId?: string;
  contentAdminId?: string;
}

export interface TestSubmission {
  id: string;
  title: string;
  content: string;
  status: TextSubmissionStatus;
  authorId: string;
}

async function createTestSubmission(
  options: CreateSubmissionOptions
): Promise<TestSubmission> {
  console.log(`📝 Creating test submission: "${options.title}"`);

  const submission = await prisma.textSubmission.create({
    data: {
      title: options.title,
      content: options.content,
      authorId: options.authorId,
      status: options.status || 'DRAFT',
      storyManagerId: options.storyManagerId,
      bookManagerId: options.bookManagerId,
      contentAdminId: options.contentAdminId,
      submittedAt: options.status && options.status !== 'DRAFT' ? new Date() : null,
    },
  });

  console.log(`✅ Test submission created: ${submission.id}`);

  return {
    id: submission.id,
    title: submission.title,
    content: submission.content,
    status: submission.status as TextSubmissionStatus,
    authorId: submission.authorId,
  };
}

async function updateSubmissionStatus(
  submissionId: string,
  status: TextSubmissionStatus,
  additionalData?: {
    storyManagerId?: string;
    bookManagerId?: string;
    contentAdminId?: string;
    publishedAt?: Date;
  }
): Promise<void> {
  console.log(`🔄 Updating submission ${submissionId} status to ${status}`);

  await prisma.textSubmission.update({
    where: { id: submissionId },
    data: {
      status,
      ...additionalData,
      submittedAt: status !== 'DRAFT' && !additionalData?.publishedAt ? new Date() : undefined,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
    },
  });

  console.log(`✅ Status updated to ${status}`);
}

async function cleanupTestSubmissions(
  authorId?: string,
  titlePattern?: string
): Promise<number> {
  console.log('🧹 Cleaning up test submissions...');

  const whereClause: any = {};

  if (authorId) {
    whereClause.authorId = authorId;
  }

  if (titlePattern) {
    whereClause.title = {
      contains: titlePattern,
    };
  }

  if (Object.keys(whereClause).length === 0) {
    whereClause.title = {
      startsWith: 'Test Story',
    };
  }

  const deleted = await prisma.textSubmission.deleteMany({
    where: whereClause,
  });

  console.log(`✅ Deleted ${deleted.count} test submissions`);

  return deleted.count;
}

async function seedSubmissionWithStatus(
  title: string,
  authorId: string,
  status: TextSubmissionStatus,
  assignments?: {
    storyManagerId?: string;
    bookManagerId?: string;
    contentAdminId?: string;
  }
): Promise<TestSubmission> {
  console.log(`🌱 Seeding submission with status ${status}: "${title}"`);

  const content = `This is a test submission content for "${title}". ` +
    `It has been seeded with status: ${status}. ` +
    `This content is auto-generated for testing purposes and should meet ` +
    `the minimum character requirement of 100 characters for valid submissions. ` +
    `Additional details can be added as needed for specific test scenarios.`;

  const submission = await createTestSubmission({
    title,
    content,
    authorId,
    status,
    storyManagerId: assignments?.storyManagerId,
    bookManagerId: assignments?.bookManagerId,
    contentAdminId: assignments?.contentAdminId,
  });

  if (status !== 'DRAFT' && status !== 'PENDING') {
    await createWorkflowHistory(submission.id, 'DRAFT', 'PENDING', authorId);
  }

  if (status === 'STORY_REVIEW' || status === 'STORY_APPROVED') {
    await createWorkflowHistory(
      submission.id,
      'PENDING',
      'STORY_REVIEW',
      assignments?.storyManagerId || authorId
    );
  }

  if (status === 'STORY_APPROVED' || status === 'FORMAT_REVIEW' || status === 'CONTENT_REVIEW') {
    await createWorkflowHistory(
      submission.id,
      'STORY_REVIEW',
      'STORY_APPROVED',
      assignments?.storyManagerId || authorId
    );
  }

  if (status === 'FORMAT_REVIEW' || status === 'CONTENT_REVIEW') {
    await createWorkflowHistory(
      submission.id,
      'STORY_APPROVED',
      'FORMAT_REVIEW',
      assignments?.bookManagerId || authorId
    );
  }

  if (status === 'CONTENT_REVIEW') {
    await createWorkflowHistory(
      submission.id,
      'FORMAT_REVIEW',
      'CONTENT_REVIEW',
      assignments?.bookManagerId || authorId
    );
  }

  if (status === 'PUBLISHED') {
    await createWorkflowHistory(
      submission.id,
      'CONTENT_REVIEW',
      'PUBLISHED',
      assignments?.contentAdminId || authorId
    );
  }

  console.log(`✅ Submission seeded with status ${status}`);

  return submission;
}

async function createWorkflowHistory(
  submissionId: string,
  fromStatus: TextSubmissionStatus,
  toStatus: TextSubmissionStatus,
  performedById: string,
  notes?: string
): Promise<void> {
  await prisma.workflowHistory.create({
    data: {
      textSubmissionId: submissionId,
      fromStatus,
      toStatus,
      performedById,
      notes,
    },
  });

  console.log(`📜 Workflow history created: ${fromStatus} → ${toStatus}`);
}

async function getTestUserIdByRole(role: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        contains: role.toLowerCase(),
      },
      AND: {
        email: {
          contains: '@test.1001stories.org',
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (user) {
    console.log(`✅ Found test user: ${user.email} (${user.role})`);
    return user.id;
  }

  console.log(`⚠️  Test user not found for role: ${role}`);
  return null;
}

async function cleanupWorkflowHistory(submissionId?: string): Promise<number> {
  console.log('🧹 Cleaning up workflow history...');

  const whereClause: any = submissionId ? { textSubmissionId: submissionId } : {};

  const deleted = await prisma.workflowHistory.deleteMany({
    where: whereClause,
  });

  console.log(`✅ Deleted ${deleted.count} workflow history entries`);

  return deleted.count;
}

async function getSubmissionsByStatus(
  status: TextSubmissionStatus,
  limit: number = 10
): Promise<TestSubmission[]> {
  console.log(`🔍 Fetching submissions with status ${status} (limit: ${limit})`);

  const submissions = await prisma.textSubmission.findMany({
    where: { status },
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      authorId: true,
    },
  });

  console.log(`✅ Found ${submissions.length} submissions`);

  return submissions.map((sub) => ({
    id: sub.id,
    title: sub.title,
    content: sub.content,
    status: sub.status as TextSubmissionStatus,
    authorId: sub.authorId,
  }));
}

async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
  console.log('✅ Prisma disconnected');
}

export {
  prisma,
  createTestSubmission,
  updateSubmissionStatus,
  cleanupTestSubmissions,
  seedSubmissionWithStatus,
  createWorkflowHistory,
  getTestUserIdByRole,
  cleanupWorkflowHistory,
  getSubmissionsByStatus,
  disconnectPrisma,
};
