'use client';

import { useState } from 'react';
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
import { UserRole } from '@prisma/client';

// Story submission statuses matching the enum in schema
type StoryStatus = 'PENDING' | 'IN_REVIEW' | 'IN_TRANSLATION' | 'IN_ILLUSTRATION' | 'IN_EDITING' | 'PUBLISHED' | 'REJECTED';

interface Story {
  id: string;
  title: string;
  author: string;
  submittedDate: string;
  status: StoryStatus;
  language: string;
  assignee?: string;
  priority: 'low' | 'medium' | 'high';
}

// Mock data for demonstration
const mockStories: Story[] = [
  { id: '1', title: 'The Magic Garden', author: 'Sarah Kim', submittedDate: '2024-01-15', status: 'PENDING', language: 'EN', priority: 'high' },
  { id: '2', title: 'My Village Story', author: 'John Doe', submittedDate: '2024-01-14', status: 'IN_REVIEW', language: 'KO', assignee: 'Reviewer A', priority: 'medium' },
  { id: '3', title: 'Adventures in Math', author: 'Jane Smith', submittedDate: '2024-01-13', status: 'IN_TRANSLATION', language: 'EN', assignee: 'Translator B', priority: 'low' },
  { id: '4', title: 'The Friendly Dragon', author: 'Mike Lee', submittedDate: '2024-01-12', status: 'IN_ILLUSTRATION', language: 'EN', assignee: 'Artist C', priority: 'high' },
  { id: '5', title: 'Learning Together', author: 'Emma Park', submittedDate: '2024-01-11', status: 'IN_EDITING', language: 'KO', assignee: 'Editor D', priority: 'medium' },
  { id: '6', title: 'Ocean Adventures', author: 'Tom Chen', submittedDate: '2024-01-10', status: 'PUBLISHED', language: 'EN', priority: 'low' },
];

const statusConfig = {
  PENDING: { label: '접수', color: 'bg-gray-100 text-gray-800', icon: Clock },
  IN_REVIEW: { label: '검수', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  IN_TRANSLATION: { label: '번역', color: 'bg-purple-100 text-purple-800', icon: Globe },
  IN_ILLUSTRATION: { label: '일러스트', color: 'bg-pink-100 text-pink-800', icon: Edit },
  IN_EDITING: { label: '편집', color: 'bg-yellow-100 text-yellow-800', icon: Edit },
  PUBLISHED: { label: '출판', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: '반려', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stories, setStories] = useState(mockStories);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');

  // Redirect if not admin
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  const stats = [
    { label: 'Total Stories', value: '1,234', change: '+12%', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Active Users', value: '5,678', change: '+8%', icon: Users, color: 'bg-green-500' },
    { label: 'Revenue', value: '$45,678', change: '+15%', icon: DollarSign, color: 'bg-purple-500' },
    { label: 'Volunteers', value: '234', change: '+5%', icon: Shield, color: 'bg-pink-500' },
  ];

  const getStoriesByStatus = (status: StoryStatus) => {
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
          {stats.map((stat, index) => (
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
          {(['PENDING', 'IN_REVIEW', 'IN_TRANSLATION', 'IN_ILLUSTRATION', 'IN_EDITING', 'PUBLISHED'] as StoryStatus[]).map((status) => {
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
                      className="bg-gray-50 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragEnd={() => {
                        // Simple drag logic - in production, use a proper DnD library
                        console.log('Drag ended');
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{story.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          story.priority === 'high' ? 'bg-red-100 text-red-600' :
                          story.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {story.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">by {story.author}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{story.language}</span>
                        <span>{story.submittedDate}</span>
                      </div>
                      {story.assignee && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-gray-600">Assigned to: {story.assignee}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Edit className="w-3 h-3 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded">
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