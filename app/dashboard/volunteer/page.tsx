'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Globe, 
  Award, 
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Upload,
  FileText,
  Star,
  Plus
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import PDFUploadForm from '@/components/volunteer/PDFUploadForm';
import SubmissionHistory from '@/components/volunteer/SubmissionHistory';

interface Stats {
  submissionsTotal: number;
  submissionsApproved: number;
  submissionsPublished: number;
  readersReached: number;
  totalContributions: number;
  rank: string;
  achievements: Array<{
    name: string;
    icon: string;
    earned: boolean;
    description: string;
  }>;
}

export default function VolunteerDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'submit' | 'history'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not logged in or not a volunteer
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.VOLUNTEER) {
    redirect('/dashboard');
  }

  // Fetch volunteer stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/volunteer/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching volunteer stats:', err);
        setError('Failed to load statistics');
        // Fallback to mock data if API fails
        setStats({
          submissionsTotal: 0,
          submissionsApproved: 0,
          submissionsPublished: 0,
          readersReached: 0,
          totalContributions: 0,
          rank: 'New Contributor',
          achievements: [
            { name: 'First Submission', icon: 'Award', earned: false, description: 'Submit your first story' },
            { name: 'Published Author', icon: 'BookOpen', earned: false, description: 'Have 3 stories published' },
            { name: 'Global Reach', icon: 'Globe', earned: false, description: 'Reach 1000+ readers' },
            { name: 'Prolific Writer', icon: 'FileText', earned: false, description: 'Submit 10 stories' }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Icon mapping
  const iconMap = {
    Award,
    BookOpen,
    Globe,
    FileText
  } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Volunteer Story Contributor</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {session.user.name || 'Volunteer'}! Share your stories with children worldwide.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('submit')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Submit Story
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                My Submissions
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                <span className="ml-2 text-gray-600">Loading your statistics...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Stats Grid */}
            {stats && !isLoading && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-green-600">+1</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.submissionsTotal}</p>
                <p className="text-xs text-gray-600">Total Submissions</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-xs text-green-600">+1</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.submissionsApproved}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-green-600">+1</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.submissionsPublished}</p>
                <p className="text-xs text-gray-600">Published</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  <span className="text-xs text-green-600">+47</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.readersReached.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Readers Reached</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-green-600">+12</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContributions}</p>
                <p className="text-xs text-gray-600">Total Impact</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm font-bold text-gray-900">{stats.rank}</p>
                <p className="text-xs text-gray-600">Current Rank</p>
              </motion.div>
            </div>

            {/* Get Started Section */}
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Stories</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                As a volunteer story contributor, you can upload completed PDF stories that will be reviewed and published for children around the world to enjoy. Each story you share helps make education more accessible and engaging.
              </p>
              <button
                onClick={() => setActiveTab('submit')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Submit Your First Story
              </button>
            </div>

            {/* Achievements Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Achievements</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.achievements.map((achievement) => {
                  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap];
                  return (
                    <div
                      key={achievement.name}
                      className={`p-4 rounded-lg border-2 ${
                        achievement.earned 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      }`}
                    >
                      <IconComponent className={`w-8 h-8 mb-2 ${
                        achievement.earned ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                      <h3 className="font-semibold text-sm text-gray-900">{achievement.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Community Impact */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Your Community Impact</h2>
              <p className="text-lg mb-6">
                Through your story contributions, you&apos;ve helped make education accessible to children worldwide. 
                Your stories have directly reached {stats.readersReached.toLocaleString()} readers!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <Globe className="w-8 h-8 mb-2" />
                  <p className="font-semibold">8 Countries Reached</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <BookOpen className="w-8 h-8 mb-2" />
                  <p className="font-semibold">{stats.submissionsPublished} Stories Published</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <Heart className="w-8 h-8 mb-2" />
                  <p className="font-semibold">{stats.readersReached.toLocaleString()} Children Inspired</p>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {activeTab === 'submit' && (
          <PDFUploadForm 
            onSuccess={(submissionId) => {
              setActiveTab('history');
            }}
            onCancel={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'history' && (
          <SubmissionHistory 
            onViewDetails={(submissionId) => {
              // Could navigate to detailed view
              console.log('View details for submission:', submissionId);
            }}
          />
        )}
      </div>
    </div>
  );
}