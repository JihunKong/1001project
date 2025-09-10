'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Filter,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowRight,
  Star,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import Link from 'next/link';

interface Submission {
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
  currentReviewer?: {
    name: string;
  };
  feedbackCount: number;
  lastFeedback?: {
    message: string;
    createdAt: string;
  };
}

export default function StoryManagerDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Redirect if not authorized
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.STORY_MANAGER) {
    redirect('/dashboard');
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/story-manager/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED': return 'bg-blue-100 text-blue-800';
      case 'PENDING_COORDINATOR': return 'bg-purple-100 text-purple-800';
      case 'APPROVED_COORDINATOR': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
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
      default:
        return 0;
    }
  });

  const statusCounts = {
    all: submissions.length,
    PENDING_REVIEW: submissions.filter(s => s.status === 'PENDING_REVIEW').length,
    REVIEWED: submissions.filter(s => s.status === 'REVIEWED').length,
    PENDING_COORDINATOR: submissions.filter(s => s.status === 'PENDING_COORDINATOR').length,
    APPROVED_COORDINATOR: submissions.filter(s => s.status === 'APPROVED_COORDINATOR').length,
    REJECTED: submissions.filter(s => s.status === 'REJECTED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Story Manager Dashboard</h1>
                <p className="text-gray-600 mt-1">Review and approve story submissions</p>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.PENDING_REVIEW}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.REVIEWED}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.APPROVED_COORDINATOR}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="PENDING_REVIEW">Pending Review ({statusCounts.PENDING_REVIEW})</option>
                <option value="REVIEWED">Reviewed ({statusCounts.REVIEWED})</option>
                <option value="PENDING_COORDINATOR">Pending Coordinator ({statusCounts.PENDING_COORDINATOR})</option>
                <option value="APPROVED_COORDINATOR">Approved ({statusCounts.APPROVED_COORDINATOR})</option>
                <option value="REJECTED">Rejected ({statusCounts.REJECTED})</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading submissions...</p>
            </div>
          ) : sortedSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{submission.summary}</p>

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

                      {submission.lastFeedback && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Latest Feedback</span>
                            <span className="text-xs text-blue-600">
                              {new Date(submission.lastFeedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 line-clamp-2">
                            {submission.lastFeedback.message}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Submitted by {submission.submittedBy.name}</span>
                        {submission.currentReviewer && (
                          <span>• Reviewer: {submission.currentReviewer.name}</span>
                        )}
                        {submission.feedbackCount > 0 && (
                          <span>• {submission.feedbackCount} feedback(s)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/dashboard/story-manager/review/${submission.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
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