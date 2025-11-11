'use client';

import { useEffect, useState } from 'react';
import { ProfileActivityFeed } from './ProfileActivityFeed';
import ProfileAchievements from './ProfileAchievements';
import ProfileMonthlyStats from './ProfileMonthlyStats';
import ProfileChart from './ProfileChart';
import ProfileCurrentProjects from './ProfileCurrentProjects';

interface ProfileOverviewProps {
  user: any;
  role: string;
}

interface ProfileData {
  stats: {
    submissions?: { published: number; draft: number; submitted: number; underReview: number; needsRevision: number };
    reading?: { booksRead: number; hoursReading: number; currentlyReading: number };
    engagement?: { commentsPosted: number; achievementsEarned: number };
  };
  achievements: any[];
  currentProjects: any[];
  chartData: {
    submissionTrends?: any[];
    readingAnalytics?: any[];
    engagement?: any[];
  };
}

export function ProfileOverview({ user, role }: ProfileOverviewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await fetch('/api/profile/data');
        if (!response.ok) throw new Error('Failed to fetch profile data');
        const data = await response.json();
        setProfileData(data);
      } catch {
        // Error handling - data will be null
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12 text-gray-600">
        Failed to load profile data. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Achievements Section */}
      <ProfileAchievements achievements={profileData.achievements} />

      {/* Monthly Statistics */}
      <ProfileMonthlyStats stats={profileData.stats} />

      {/* Chart Visualization */}
      <ProfileChart data={profileData.chartData} role={role} />

      {/* Current Projects */}
      <ProfileCurrentProjects projects={profileData.currentProjects} userRole={role} />

      {/* Activity Feed */}
      <ProfileActivityFeed userId={user.id} />
    </div>
  );
}
