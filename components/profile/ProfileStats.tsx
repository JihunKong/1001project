'use client';

import { UserRole } from '@prisma/client';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ProfileStatsProps {
  stats: Record<string, number>;
  role: string;
}

const ROLE_STAT_LABELS: Record<string, Array<{ key: string; labelKey: string }>> = {
  WRITER: [
    { key: 'published', labelKey: 'profile.stats.writer.published' },
    { key: 'draft', labelKey: 'profile.stats.writer.draft' },
    { key: 'submitted', labelKey: 'profile.stats.writer.submitted' },
    { key: 'underReview', labelKey: 'profile.stats.writer.underReview' },
    { key: 'feedback', labelKey: 'profile.stats.writer.feedback' }
  ],
  TEACHER: [
    { key: 'classes', labelKey: 'profile.stats.teacher.classes' },
    { key: 'students', labelKey: 'profile.stats.teacher.students' },
    { key: 'assignedBooks', labelKey: 'profile.stats.teacher.assignedBooks' },
    { key: 'activeStudents', labelKey: 'profile.stats.teacher.active' }
  ],
  LEARNER: [
    { key: 'booksRead', labelKey: 'profile.stats.learner.booksRead' },
    { key: 'inProgress', labelKey: 'profile.stats.learner.inProgress' },
    { key: 'completedAssignments', labelKey: 'profile.stats.learner.completed' },
    { key: 'enrolledClasses', labelKey: 'profile.stats.learner.classes' }
  ],
  STORY_MANAGER: [
    { key: 'reviewedStories', labelKey: 'profile.stats.storyManager.reviewed' },
    { key: 'pendingReviews', labelKey: 'profile.stats.storyManager.pending' },
    { key: 'approvedStories', labelKey: 'profile.stats.storyManager.approved' },
    { key: 'needsRevision', labelKey: 'profile.stats.storyManager.revisions' }
  ],
  BOOK_MANAGER: [
    { key: 'formatDecisions', labelKey: 'profile.stats.bookManager.decisions' },
    { key: 'pendingDecisions', labelKey: 'profile.stats.bookManager.pending' },
    { key: 'approvedFormats', labelKey: 'profile.stats.bookManager.approved' }
  ],
  CONTENT_ADMIN: [
    { key: 'finalApprovals', labelKey: 'profile.stats.contentAdmin.approvals' },
    { key: 'pendingApprovals', labelKey: 'profile.stats.contentAdmin.pending' },
    { key: 'publishedContent', labelKey: 'profile.stats.contentAdmin.published' }
  ],
  INSTITUTION: [
    { key: 'totalTeachers', labelKey: 'profile.stats.institution.teachers' },
    { key: 'totalStudents', labelKey: 'profile.stats.institution.students' },
    { key: 'totalClasses', labelKey: 'profile.stats.institution.classes' },
    { key: 'activeClasses', labelKey: 'profile.stats.institution.active' }
  ],
  ADMIN: [
    { key: 'totalUsers', labelKey: 'profile.stats.admin.users' },
    { key: 'totalStories', labelKey: 'profile.stats.admin.stories' },
    { key: 'totalClasses', labelKey: 'profile.stats.admin.classes' },
    { key: 'pendingReviews', labelKey: 'profile.stats.admin.pending' }
  ]
};

export function ProfileStats({ stats, role }: ProfileStatsProps) {
  const { t } = useTranslation();
  const statItems = ROLE_STAT_LABELS[role] || [];

  if (statItems.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-[#E5E5EA] pt-4">
      <div className="grid grid-cols-2 gap-3">
        {statItems.map(({ key, labelKey }) => (
          <div
            key={key}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-[#E5E5EA]"
            style={{ backgroundColor: '#F9FAFB' }}
          >
            <span
              className="font-medium"
              style={{
                fontSize: '22px',
                lineHeight: 1,
                color: '#141414',
                fontWeight: 400
              }}
            >
              {stats[key] ?? 0}
            </span>
            <span
              className="text-center"
              style={{
                fontSize: '12px',
                color: '#636366',
                fontWeight: 400
              }}
            >
              {t(labelKey)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
