'use client';

import { UserRole } from '@prisma/client';

interface ProfileStatsProps {
  stats: Record<string, number>;
  role: string;
}

const ROLE_STAT_LABELS: Record<string, Array<{ key: string; label: string }>> = {
  WRITER: [
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'underReview', label: 'Under Review' },
    { key: 'feedback', label: 'Feedback' }
  ],
  TEACHER: [
    { key: 'classes', label: 'Classes' },
    { key: 'students', label: 'Students' },
    { key: 'assignedBooks', label: 'Assigned Books' },
    { key: 'activeStudents', label: 'Active' }
  ],
  LEARNER: [
    { key: 'booksRead', label: 'Books Read' },
    { key: 'inProgress', label: 'In Progress' },
    { key: 'completedAssignments', label: 'Completed' },
    { key: 'enrolledClasses', label: 'Classes' }
  ],
  STORY_MANAGER: [
    { key: 'reviewedStories', label: 'Reviewed' },
    { key: 'pendingReviews', label: 'Pending' },
    { key: 'approvedStories', label: 'Approved' },
    { key: 'needsRevision', label: 'Revisions' }
  ],
  BOOK_MANAGER: [
    { key: 'formatDecisions', label: 'Decisions' },
    { key: 'pendingDecisions', label: 'Pending' },
    { key: 'approvedFormats', label: 'Approved' }
  ],
  CONTENT_ADMIN: [
    { key: 'finalApprovals', label: 'Approvals' },
    { key: 'pendingApprovals', label: 'Pending' },
    { key: 'publishedContent', label: 'Published' }
  ],
  INSTITUTION: [
    { key: 'totalTeachers', label: 'Teachers' },
    { key: 'totalStudents', label: 'Students' },
    { key: 'totalClasses', label: 'Classes' },
    { key: 'activeClasses', label: 'Active' }
  ],
  ADMIN: [
    { key: 'totalUsers', label: 'Users' },
    { key: 'totalStories', label: 'Stories' },
    { key: 'totalClasses', label: 'Classes' },
    { key: 'pendingReviews', label: 'Pending' }
  ]
};

export function ProfileStats({ stats, role }: ProfileStatsProps) {
  const statItems = ROLE_STAT_LABELS[role] || [];

  if (statItems.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-[#E5E5EA] pt-4">
      <div className="grid grid-cols-2 gap-3">
        {statItems.map(({ key, label }) => (
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
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
