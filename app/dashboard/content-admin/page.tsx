'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  BookOpen,
  FileText,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  Tag,
  Globe,
  Star,
  Zap,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface ContentSubmission {
  id: string;
  title: string;
  authorName: string;
  authorAge?: number;
  authorLocation?: string;
  summary: string;
  language: string;
  ageRange?: string;
  categories: string[];
  tags: string[];
  format: string;
  filePath: string;
  coverImagePath?: string;
  pageCount?: number;
  wordCount?: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    name: string;
    email: string;
  };
  storyManagerReviewer?: {
    name: string;
  };
  bookManagerReviewer?: {
    name: string;
  };
  publicationFormat: 'BOOK' | 'TEXT_ONLY';
  aiEnhancement: {
    imageGenerated: boolean;
    audioGenerated: boolean;
    enhancementStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    generatedImageUrl?: string;
    generatedAudioUrl?: string;
  };
  contentPolicyCheck: {
    status: 'PASSED' | 'FLAGGED' | 'PENDING';
    flags: string[];
    aiModerationScore: number;
  };
  readinessScore: number;
  estimatedPublishDate?: string;
  scheduledPublishDate?: string;
  feedbackCount: number;
  viewCount: number;
  rating?: number;
}

interface DashboardStats {
  totalSubmissions: number;
  pendingApproval: number;
  readyForPublish: number;
  published: number;
  flaggedContent: number;
  avgProcessingTime: number;
  publishedThisMonth: number;
  totalViews: number;
}

export default function ContentAdminDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterBy, setFilterBy] = useState('all');

  // Redirect if not authorized
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.CONTENT_ADMIN) {
    redirect('/dashboard');
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, statsRes] = await Promise.all([
        fetch('/api/content-admin/submissions'),
        fetch('/api/content-admin/stats')
      ]);
      
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.submissions || []);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED_COORDINATOR': return 'bg-teal-100 text-teal-800';
      case 'PENDING_ADMIN': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED_ADMIN': return 'bg-green-100 text-green-800';
      case 'PUBLISHED': return 'bg-emerald-100 text-emerald-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentPolicyColor = (status: string) => {
    switch (status) {
      case 'PASSED': return 'bg-green-100 text-green-800';
      case 'FLAGGED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredSubmissions = submissions.filter(submission => {
    let matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
    
    if (filterBy === 'flagged') {
      matchesStatus = submission.contentPolicyCheck.status === 'FLAGGED';
    } else if (filterBy === 'ready') {
      matchesStatus = submission.readinessScore >= 90 && submission.contentPolicyCheck.status === 'PASSED';
    } else if (filterBy === 'high-priority') {
      matchesStatus = submission.priority === 'HIGH';
    }
    
    const matchesSearch = submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const sortedSubmissions = filteredSubmissions.sort((a, b) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'priority':
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'readiness':
        return b.readinessScore - a.readinessScore;
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: submissions.length,
    APPROVED_COORDINATOR: submissions.filter(s => s.status === 'APPROVED_COORDINATOR').length,
    PENDING_ADMIN: submissions.filter(s => s.status === 'PENDING_ADMIN').length,
    APPROVED_ADMIN: submissions.filter(s => s.status === 'APPROVED_ADMIN').length,
    SCHEDULED: submissions.filter(s => s.status === 'SCHEDULED').length,
    PUBLISHED: submissions.filter(s => s.status === 'PUBLISHED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Crown className="w-8 h-8 text-teal-600" />
                  Content Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Final approval and content management</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/dashboard/content-admin/policies"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Content Policies
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border border-teal-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Clock className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-teal-700">Pending Approval</p>
                  <p className="text-2xl font-bold text-teal-900">{stats.pendingApproval}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Ready for Publish</p>
                  <p className="text-2xl font-bold text-green-900">{stats.readyForPublish}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700">Flagged Content</p>
                  <p className="text-2xl font-bold text-red-900">{stats.flaggedContent}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-700">Published This Month</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.publishedThisMonth}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Performance Metrics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Performance</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Processing Time</span>
                  <span className="font-medium">{stats.avgProcessingTime} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Published</span>
                  <span className="font-medium">{stats.published}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-medium">{stats.totalViews.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-gray-900">Quality Metrics</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">High Quality Stories</span>
                  <span className="font-medium">{submissions.filter(s => s.readinessScore >= 90).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">With AI Enhancement</span>
                  <span className="font-medium">{submissions.filter(s => s.aiEnhancement.enhancementStatus === 'COMPLETED').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Policy Compliant</span>
                  <span className="font-medium">{submissions.filter(s => s.contentPolicyCheck.status === 'PASSED').length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Global Impact</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Languages</span>
                  <span className="font-medium">{new Set(submissions.map(s => s.language)).size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Countries</span>
                  <span className="font-medium">{new Set(submissions.map(s => s.authorLocation).filter(Boolean)).size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Young Authors</span>
                  <span className="font-medium">{submissions.filter(s => s.authorAge && s.authorAge < 18).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="APPROVED_COORDINATOR">Ready for Review ({statusCounts.APPROVED_COORDINATOR})</option>
                <option value="PENDING_ADMIN">Pending Admin ({statusCounts.PENDING_ADMIN})</option>
                <option value="APPROVED_ADMIN">Approved ({statusCounts.APPROVED_ADMIN})</option>
                <option value="SCHEDULED">Scheduled ({statusCounts.SCHEDULED})</option>
                <option value="PUBLISHED">Published ({statusCounts.PUBLISHED})</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Content</option>
                <option value="flagged">Flagged Content</option>
                <option value="ready">Ready to Publish</option>
                <option value="high-priority">High Priority</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="priority">Sort by Priority</option>
                <option value="readiness">Sort by Readiness</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading submissions...</p>
            </div>
          ) : sortedSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submissions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedSubmissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {submission.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                          {submission.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReadinessColor(submission.readinessScore)}`}>
                          {submission.readinessScore}% Ready
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{submission.authorName}</span>
                          {submission.authorAge && <span>({submission.authorAge})</span>}
                        </div>
                        {submission.authorLocation && (
                          <span>{submission.authorLocation}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="capitalize">{submission.format}</span>
                        {submission.wordCount && <span>{submission.wordCount} words</span>}
                        {submission.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{submission.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{submission.summary}</p>

                      {/* Quality Indicators */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getContentPolicyColor(submission.contentPolicyCheck.status)}`}>
                          Policy: {submission.contentPolicyCheck.status}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          Moderation Score: {(submission.contentPolicyCheck.aiModerationScore * 100).toFixed(0)}%
                        </div>

                        {submission.contentPolicyCheck.flags.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{submission.contentPolicyCheck.flags.length} flags</span>
                          </div>
                        )}

                        <div className="text-xs text-gray-600">
                          Format: {submission.publicationFormat === 'BOOK' ? 'Book' : 'Text Only'}
                        </div>

                        {submission.aiEnhancement.enhancementStatus === 'COMPLETED' && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Zap className="w-3 h-3" />
                            <span>AI Enhanced</span>
                          </div>
                        )}
                      </div>

                      {submission.categories.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div className="flex gap-1">
                            {submission.categories.slice(0, 3).map((category, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {category}
                              </span>
                            ))}
                            {submission.categories.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                +{submission.categories.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Submitted by {submission.submittedBy.name}</span>
                        {submission.storyManagerReviewer && (
                          <span>• Story Reviewer: {submission.storyManagerReviewer.name}</span>
                        )}
                        {submission.bookManagerReviewer && (
                          <span>• Book Manager: {submission.bookManagerReviewer.name}</span>
                        )}
                        {submission.viewCount > 0 && (
                          <span>• {submission.viewCount} views</span>
                        )}
                        {submission.scheduledPublishDate && (
                          <span>• Scheduled: {new Date(submission.scheduledPublishDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/dashboard/content-admin/review/${submission.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Review
                      </Link>
                      
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}