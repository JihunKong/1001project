'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileText, 
  Settings, 
  PlayCircle, 
  Image, 
  VolumeX,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  Wand2,
  Eye,
  Edit,
  Calendar,
  User,
  Tag,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface BookSubmission {
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
  publicationFormat?: 'BOOK' | 'TEXT_ONLY';
  aiEnhancement: {
    imageGenerated: boolean;
    audioGenerated: boolean;
    enhancementStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  };
  feedbackCount: number;
  estimatedPublishDate?: string;
}

export default function BookManagerDashboard() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Redirect if not authorized
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== UserRole.BOOK_MANAGER) {
    redirect('/dashboard');
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/book-manager/submissions');
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
      case 'REVIEWED': return 'bg-blue-100 text-blue-800';
      case 'PENDING_COORDINATOR': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED_COORDINATOR': return 'bg-green-100 text-green-800';
      case 'PENDING_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'PUBLISHED': return 'bg-emerald-100 text-emerald-800';
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

  const getEnhancementStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
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
    REVIEWED: submissions.filter(s => s.status === 'REVIEWED').length,
    PENDING_COORDINATOR: submissions.filter(s => s.status === 'PENDING_COORDINATOR').length,
    APPROVED_COORDINATOR: submissions.filter(s => s.status === 'APPROVED_COORDINATOR').length,
    PENDING_ADMIN: submissions.filter(s => s.status === 'PENDING_ADMIN').length,
    PUBLISHED: submissions.filter(s => s.status === 'PUBLISHED').length,
  };

  const enhancementCounts = {
    pending: submissions.filter(s => s.aiEnhancement.enhancementStatus === 'PENDING').length,
    inProgress: submissions.filter(s => s.aiEnhancement.enhancementStatus === 'IN_PROGRESS').length,
    completed: submissions.filter(s => s.aiEnhancement.enhancementStatus === 'COMPLETED').length,
    failed: submissions.filter(s => s.aiEnhancement.enhancementStatus === 'FAILED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Book Manager Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage publication pipeline and AI enhancements</p>
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready for Review</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.REVIEWED}</p>
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Decision</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.PENDING_COORDINATOR}</p>
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wand2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Enhancement</p>
                <p className="text-2xl font-bold text-gray-900">{enhancementCounts.inProgress}</p>
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ready for Admin</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.APPROVED_COORDINATOR}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Enhancement Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">AI Enhancement Queue</span>
            </div>
            <div className="text-sm text-purple-700">
              <div>Pending: {enhancementCounts.pending}</div>
              <div>In Progress: {enhancementCounts.inProgress}</div>
              <div>Completed: {enhancementCounts.completed}</div>
              <div>Failed: {enhancementCounts.failed}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-emerald-900">Image Generation</span>
            </div>
            <div className="text-sm text-emerald-700">
              <div>Generated: {submissions.filter(s => s.aiEnhancement.imageGenerated).length}</div>
              <div>Pending: {submissions.filter(s => !s.aiEnhancement.imageGenerated).length}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <VolumeX className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Audio Generation</span>
            </div>
            <div className="text-sm text-blue-700">
              <div>Generated: {submissions.filter(s => s.aiEnhancement.audioGenerated).length}</div>
              <div>Pending: {submissions.filter(s => !s.aiEnhancement.audioGenerated).length}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-900">Publication Pipeline</span>
            </div>
            <div className="text-sm text-amber-700">
              <div>Books: {submissions.filter(s => s.publicationFormat === 'BOOK').length}</div>
              <div>Text Only: {submissions.filter(s => s.publicationFormat === 'TEXT_ONLY').length}</div>
            </div>
          </div>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="REVIEWED">Ready for Review ({statusCounts.REVIEWED})</option>
                <option value="PENDING_COORDINATOR">Pending Decision ({statusCounts.PENDING_COORDINATOR})</option>
                <option value="APPROVED_COORDINATOR">Approved ({statusCounts.APPROVED_COORDINATOR})</option>
                <option value="PENDING_ADMIN">Pending Admin ({statusCounts.PENDING_ADMIN})</option>
                <option value="PUBLISHED">Published ({statusCounts.PUBLISHED})</option>
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
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
                        {submission.publicationFormat && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                            {submission.publicationFormat === 'BOOK' ? 'Book Format' : 'Text Only'}
                          </span>
                        )}
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

                      {/* AI Enhancement Status */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getEnhancementStatusColor(submission.aiEnhancement.enhancementStatus)}`}>
                            AI: {submission.aiEnhancement.enhancementStatus.replace('_', ' ')}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <div className={`flex items-center gap-1 ${submission.aiEnhancement.imageGenerated ? 'text-green-600' : 'text-gray-400'}`}>
                            <Image className="w-4 h-4" />
                            <span>Image</span>
                            {submission.aiEnhancement.imageGenerated && <CheckCircle className="w-3 h-3" />}
                          </div>
                          
                          <div className={`flex items-center gap-1 ${submission.aiEnhancement.audioGenerated ? 'text-green-600' : 'text-gray-400'}`}>
                            <VolumeX className="w-4 h-4" />
                            <span>Audio</span>
                            {submission.aiEnhancement.audioGenerated && <CheckCircle className="w-3 h-3" />}
                          </div>
                        </div>
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
                        {submission.feedbackCount > 0 && (
                          <span>• {submission.feedbackCount} feedback(s)</span>
                        )}
                        {submission.estimatedPublishDate && (
                          <span>• Est. publish: {new Date(submission.estimatedPublishDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/dashboard/book-manager/manage/${submission.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Manage
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