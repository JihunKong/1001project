'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  DollarSign,
  Download,
  Calendar,
  Filter,
  Eye,
  Clock,
  Globe,
  Star,
  Heart,
  Target
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalStories: number;
    totalRevenue: number;
    activeUsers: number;
    userGrowth: number;
    storyGrowth: number;
    revenueGrowth: number;
    activeUsersGrowth: number;
  };
  userMetrics: {
    newUsersLastMonth: number;
    userRetentionRate: number;
    averageSessionDuration: number;
    topUserRoles: Array<{ role: string; count: number; percentage: number }>;
  };
  contentMetrics: {
    storiesPublished: number;
    averageReadingTime: number;
    mostPopularStories: Array<{ title: string; views: number; language: string }>;
    languageDistribution: Array<{ language: string; count: number; percentage: number }>;
  };
  revenueMetrics: {
    monthlyRevenue: number;
    subscriptions: number;
    donations: number;
    conversionRate: number;
  };
  engagementMetrics: {
    totalPageViews: number;
    bounceRate: number;
    averagePagesPerSession: number;
    topPages: Array<{ page: string; views: number; percentage: number }>;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // For demo purposes, using mock data
      // In production, this would fetch from /api/admin/analytics
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 1247,
          totalStories: 89,
          totalRevenue: 24650,
          activeUsers: 432,
          userGrowth: 12.5,
          storyGrowth: 8.3,
          revenueGrowth: 15.7,
          activeUsersGrowth: 9.2
        },
        userMetrics: {
          newUsersLastMonth: 156,
          userRetentionRate: 78.5,
          averageSessionDuration: 24.3,
          topUserRoles: [
            { role: 'Learner', count: 987, percentage: 79.2 },
            { role: 'Volunteer', count: 189, percentage: 15.2 },
            { role: 'Teacher', count: 56, percentage: 4.5 },
            { role: 'Admin', count: 15, percentage: 1.2 }
          ]
        },
        contentMetrics: {
          storiesPublished: 89,
          averageReadingTime: 12.4,
          mostPopularStories: [
            { title: "Neema's Adventure", views: 1247, language: 'EN' },
            { title: "Martha's Journey", views: 986, language: 'EN' },
            { title: "Second Chance", views: 743, language: 'EN' },
            { title: "Angel Prayer", views: 567, language: 'KO' }
          ],
          languageDistribution: [
            { language: 'English', count: 56, percentage: 62.9 },
            { language: 'Korean', count: 21, percentage: 23.6 },
            { language: 'Spanish', count: 8, percentage: 9.0 },
            { language: 'French', count: 4, percentage: 4.5 }
          ]
        },
        revenueMetrics: {
          monthlyRevenue: 24650,
          subscriptions: 18900,
          donations: 5750,
          conversionRate: 3.2
        },
        engagementMetrics: {
          totalPageViews: 45280,
          bounceRate: 32.1,
          averagePagesPerSession: 4.7,
          topPages: [
            { page: '/library', views: 12450, percentage: 27.5 },
            { page: '/dashboard/learner', views: 8930, percentage: 19.7 },
            { page: '/shop', views: 6750, percentage: 14.9 },
            { page: '/demo', views: 5620, percentage: 12.4 }
          ]
        }
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overviewStats = [
    {
      label: 'Total Users',
      value: analyticsData.overview.totalUsers.toLocaleString(),
      change: analyticsData.overview.userGrowth,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      label: 'Total Stories',
      value: analyticsData.overview.totalStories.toLocaleString(),
      change: analyticsData.overview.storyGrowth,
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      label: 'Revenue',
      value: `$${analyticsData.overview.totalRevenue.toLocaleString()}`,
      change: analyticsData.overview.revenueGrowth,
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      label: 'Active Users',
      value: analyticsData.overview.activeUsers.toLocaleString(),
      change: analyticsData.overview.activeUsersGrowth,
      icon: Target,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive platform insights and metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${stat.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Metrics</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Users (Last Month)</span>
                <span className="font-semibold text-gray-900">{analyticsData.userMetrics.newUsersLastMonth}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">User Retention Rate</span>
                <span className="font-semibold text-gray-900">{analyticsData.userMetrics.userRetentionRate}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Session Duration</span>
                <span className="font-semibold text-gray-900">{analyticsData.userMetrics.averageSessionDuration}m</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">User Roles Distribution</h4>
              <div className="space-y-3">
                {analyticsData.userMetrics.topUserRoles.map((role, index) => (
                  <div key={role.role} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{role.role}</span>
                        <span className="font-medium">{role.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${role.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Content Metrics</h3>
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Stories Published</span>
                <span className="font-semibold text-gray-900">{analyticsData.contentMetrics.storiesPublished}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Reading Time</span>
                <span className="font-semibold text-gray-900">{analyticsData.contentMetrics.averageReadingTime}m</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Popular Stories</h4>
              <div className="space-y-3">
                {analyticsData.contentMetrics.mostPopularStories.map((story, index) => (
                  <div key={story.title} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{story.title}</p>
                      <p className="text-xs text-gray-500">{story.language}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{story.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Metrics</h3>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Revenue</span>
                <span className="font-semibold text-gray-900">${analyticsData.revenueMetrics.monthlyRevenue.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subscriptions</span>
                <span className="font-semibold text-gray-900">${analyticsData.revenueMetrics.subscriptions.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Donations</span>
                <span className="font-semibold text-gray-900">${analyticsData.revenueMetrics.donations.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-gray-900">{analyticsData.revenueMetrics.conversionRate}%</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">${(analyticsData.revenueMetrics.subscriptions).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">${(analyticsData.revenueMetrics.donations).toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Donations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Engagement Metrics</h3>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Page Views</span>
                <span className="font-semibold text-gray-900">{analyticsData.engagementMetrics.totalPageViews.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="font-semibold text-gray-900">{analyticsData.engagementMetrics.bounceRate}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Pages/Session</span>
                <span className="font-semibold text-gray-900">{analyticsData.engagementMetrics.averagePagesPerSession}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Top Pages</h4>
              <div className="space-y-3">
                {analyticsData.engagementMetrics.topPages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{page.page}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${page.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{page.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Language Distribution Chart */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Content Language Distribution</h3>
            <Globe className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {analyticsData.contentMetrics.languageDistribution.map((lang, index) => (
              <div key={lang.language} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="w-full h-full rounded-full border-4 border-gray-200">
                    <div
                      className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-pulse"
                      style={{
                        transform: `rotate(${(lang.percentage / 100) * 360}deg)`,
                        borderImage: `conic-gradient(#2563eb ${lang.percentage}%, transparent ${lang.percentage}%) 1`
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900">{lang.percentage}%</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900">{lang.language}</p>
                <p className="text-xs text-gray-600">{lang.count} stories</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}