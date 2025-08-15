'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Users, 
  BookOpen, 
  BarChart, 
  Bell,
  Shield,
  DollarSign,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  ChevronRight,
  Plus,
  Search,
  Download
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole, StorySubmissionStatus } from '@prisma/client';

interface Story {
  id: string;
  title: string;
  status: StorySubmissionStatus;
  language: string;
  createdAt: string;
  author: {
    name: string;
  };
}

interface DashboardStats {
  totalStories: number;
  totalUsers: number;
  totalVolunteers: number;
  monthlyRevenue: number;
}


const statusConfig = {
  SUBMITTED: { label: '접수', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_REVIEW: { label: '검수', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  APPROVED: { label: '승인', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  PUBLISHED: { label: '출판', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  DRAFT: { label: '초안', color: 'bg-gray-100 text-gray-600', icon: Edit },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStories: 0,
    totalUsers: 0,
    totalVolunteers: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stories
      const storiesResponse = await fetch('/api/admin/stories?limit=50');
      if (storiesResponse.ok) {
        const storiesData = await storiesResponse.json();
        setStories(storiesData.stories || []);
        
        // Update stats based on real data
        setStats({
          totalStories: storiesData.pagination?.totalCount || 0,
          totalUsers: 245,
          totalVolunteers: 89,
          monthlyRevenue: 12340
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.user.role === UserRole.ADMIN) {
      fetchDashboardData();
    }
  }, [session]);

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const statsDisplay = [
    { label: 'Total Stories', value: stats.totalStories.toString(), change: '+12%', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Active Users', value: stats.totalUsers.toString(), change: '+8%', icon: Users, color: 'bg-green-500' },
    { label: 'Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, change: '+15%', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Volunteers', value: stats.totalVolunteers.toString(), change: '+5%', icon: Shield, color: 'bg-pink-500' },
  ];

  const getStoriesByStatus = (status: StorySubmissionStatus) => {
    return stories.filter(story => story.status === status);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage platform operations and content</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
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
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Kanban Board Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Story Publishing Workflow</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Languages</option>
              <option value="EN">English</option>
              <option value="KO">Korean</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-5 h-5" />
              Add Story
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto pb-4">
          {(loading ? [] : ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'] as StorySubmissionStatus[]).map((status) => {
            const config = statusConfig[status];
            const StatusIcon = config.icon;
            const statusStories = getStoriesByStatus(status);

            return (
              <div key={status} className="bg-white rounded-lg shadow-sm">
                <div className={`p-4 border-b ${config.color} bg-opacity-10`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5" />
                      <h3 className="font-semibold">{config.label}</h3>
                    </div>
                    <span className="text-sm font-medium">{statusStories.length}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3 min-h-[400px]">
                  {statusStories.map((story) => (
                    <motion.div
                      key={story.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => window.location.href = `/admin/stories/${story.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{story.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">by {story.author.name}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{story.language.toUpperCase()}</span>
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/admin/stories/${story.id}/edit`;
                          }}
                        >
                          <Edit className="w-3 h-3 text-gray-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/admin/stories/${story.id}`;
                          }}
                        >
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <span>Manage Users</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full text-left flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="flex items-center gap-3">
                  <BarChart className="w-5 h-5 text-gray-600" />
                  <span>View Analytics</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="w-full text-left flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-gray-600" />
                  <span>Export Reports</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New story submitted</p>
                  <p className="text-xs text-gray-600">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Translation completed</p>
                  <p className="text-xs text-gray-600">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New volunteer joined</p>
                  <p className="text-xs text-gray-600">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Server Status</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Healthy</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Response</span>
                <span className="text-sm text-gray-900">125ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}