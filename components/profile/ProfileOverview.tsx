'use client';

import { ProfileActivityFeed } from './ProfileActivityFeed';

interface ProfileOverviewProps {
  user: any;
  role: string;
}

export function ProfileOverview({ user, role }: ProfileOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Activity Feed - available for all roles */}
      <ProfileActivityFeed userId={user.id} />

      {/* Role-specific sections would go here */}
      {/* Future: WriterAchievements, TeacherClasses, etc. */}
    </div>
  );
}
