import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface RoleStats {
  [key: string]: number;
}

export async function calculateStats(userId: string, role: UserRole): Promise<RoleStats> {
  switch (role) {
    case 'WRITER':
      return await getWriterStats(userId);

    case 'TEACHER':
      return await getTeacherStats(userId);

    case 'LEARNER':
      return await getLearnerStats(userId);

    case 'STORY_MANAGER':
      return await getStoryManagerStats(userId);

    case 'BOOK_MANAGER':
      return await getBookManagerStats(userId);

    case 'CONTENT_ADMIN':
      return await getContentAdminStats(userId);

    case 'INSTITUTION':
      return await getInstitutionStats(userId);

    case 'ADMIN':
      return await getAdminStats(userId);

    default:
      return {};
  }
}

async function getWriterStats(userId: string): Promise<RoleStats> {
  const [published, draft, submitted, underReview, feedback] = await Promise.all([
    prisma.textSubmission.count({
      where: { authorId: userId, status: 'PUBLISHED' }
    }),
    prisma.textSubmission.count({
      where: { authorId: userId, status: 'DRAFT' }
    }),
    prisma.textSubmission.count({
      where: { authorId: userId, status: 'PENDING' }
    }),
    prisma.textSubmission.count({
      where: {
        authorId: userId,
        status: { in: ['STORY_REVIEW', 'FORMAT_REVIEW', 'CONTENT_REVIEW'] }
      }
    }),
    prisma.textSubmission.count({
      where: { authorId: userId, status: 'NEEDS_REVISION' }
    })
  ]);

  return {
    published,
    draft,
    submitted,
    underReview,
    feedback
  };
}

async function getTeacherStats(userId: string): Promise<RoleStats> {
  const [classes, students, assignedBooks, activeStudents] = await Promise.all([
    prisma.class.count({
      where: { teacherId: userId, isActive: true }
    }),
    prisma.classEnrollment.count({
      where: {
        class: { teacherId: userId },
        status: 'ACTIVE'
      }
    }),
    prisma.classEnrollment.count({
      where: {
        class: { teacherId: userId }
      }
    }),
    prisma.classEnrollment.count({
      where: {
        class: { teacherId: userId },
        status: 'ACTIVE'
      }
    })
  ]);

  return {
    classes,
    students,
    assignedBooks: 0,
    activeStudents
  };
}

async function getLearnerStats(userId: string): Promise<RoleStats> {
  const [booksRead, inProgress, completedAssignments, enrolledClasses] = await Promise.all([
    prisma.readingProgress.count({
      where: { userId, isCompleted: true }
    }),
    prisma.readingProgress.count({
      where: { userId, isCompleted: false }
    }),
    prisma.submission.count({
      where: { studentId: userId, status: 'GRADED' }
    }),
    prisma.classEnrollment.count({
      where: { studentId: userId, status: 'ACTIVE' }
    })
  ]);

  return {
    booksRead,
    inProgress,
    completedAssignments,
    enrolledClasses
  };
}

async function getStoryManagerStats(userId: string): Promise<RoleStats> {
  const [reviewedStories, pendingReviews, approvedStories, needsRevision] = await Promise.all([
    prisma.textSubmission.count({
      where: { storyManagerId: userId }
    }),
    prisma.textSubmission.count({
      where: {
        storyManagerId: userId,
        status: { in: ['PENDING', 'STORY_REVIEW'] }
      }
    }),
    prisma.textSubmission.count({
      where: {
        storyManagerId: userId,
        status: 'STORY_APPROVED'
      }
    }),
    prisma.textSubmission.count({
      where: {
        storyManagerId: userId,
        status: 'NEEDS_REVISION'
      }
    })
  ]);

  return {
    reviewedStories,
    pendingReviews,
    approvedStories,
    needsRevision
  };
}

async function getBookManagerStats(userId: string): Promise<RoleStats> {
  const [formatDecisions, pendingDecisions, approvedFormats] = await Promise.all([
    prisma.textSubmission.count({
      where: { bookManagerId: userId }
    }),
    prisma.textSubmission.count({
      where: {
        bookManagerId: userId,
        status: 'FORMAT_REVIEW'
      }
    }),
    prisma.textSubmission.count({
      where: {
        bookManagerId: userId,
        status: { in: ['CONTENT_REVIEW', 'APPROVED', 'PUBLISHED'] }
      }
    })
  ]);

  return {
    formatDecisions,
    pendingDecisions,
    approvedFormats
  };
}

async function getContentAdminStats(userId: string): Promise<RoleStats> {
  const [finalApprovals, pendingApprovals, publishedContent] = await Promise.all([
    prisma.textSubmission.count({
      where: { contentAdminId: userId }
    }),
    prisma.textSubmission.count({
      where: {
        contentAdminId: userId,
        status: 'CONTENT_REVIEW'
      }
    }),
    prisma.textSubmission.count({
      where: {
        contentAdminId: userId,
        status: 'PUBLISHED'
      }
    })
  ]);

  return {
    finalApprovals,
    pendingApprovals,
    publishedContent
  };
}

async function getInstitutionStats(userId: string): Promise<RoleStats> {
  const institutionAdmin = await prisma.institution.findFirst({
    where: { admins: { some: { id: userId } } },
    select: { id: true }
  });

  if (!institutionAdmin) {
    return {
      totalTeachers: 0,
      totalStudents: 0,
      totalClasses: 0,
      activeClasses: 0
    };
  }

  const [totalTeachers, totalStudents, totalClasses, activeClasses] = await Promise.all([
    prisma.user.count({
      where: {
        institutionTeacherOf: { some: { id: institutionAdmin.id } }
      }
    }),
    prisma.classEnrollment.count({
      where: {
        class: { institutionId: institutionAdmin.id }
      }
    }),
    prisma.class.count({
      where: { institutionId: institutionAdmin.id }
    }),
    prisma.class.count({
      where: { institutionId: institutionAdmin.id, isActive: true }
    })
  ]);

  return {
    totalTeachers,
    totalStudents,
    totalClasses,
    activeClasses
  };
}

async function getAdminStats(userId: string): Promise<RoleStats> {
  const [totalUsers, totalStories, totalClasses, pendingReviews] = await Promise.all([
    prisma.user.count(),
    prisma.textSubmission.count(),
    prisma.class.count(),
    prisma.textSubmission.count({
      where: {
        status: { in: ['PENDING', 'STORY_REVIEW', 'FORMAT_REVIEW', 'CONTENT_REVIEW'] }
      }
    })
  ]);

  return {
    totalUsers,
    totalStories,
    totalClasses,
    pendingReviews
  };
}
