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
  Tag,
  Users,
  Building,
  Heart,
  Download,
  Mail,
  AlertCircle,
  BookOpen,
  Globe,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface ProgramApplication {
  id: string;
  programType: string;
  fullName: string;
  email: string;
  phone?: string;
  country: string;
  city: string;
  organizationName?: string;
  organizationType?: string;
  jobTitle?: string;
  experienceYears?: number;
  weeklyHours?: number;
  availableDays: string[];
  languages: string[];
  interests: string[];
  skills: string[];
  goals?: string;
  motivation?: string;
  status: string;
  priority: number;
  matchScore?: number;
  createdAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  applicant: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  assignedReviewer?: {
    id: string;
    name: string;
    email: string;
  };
  attachments: {
    id: string;
    filename: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    attachmentType: string;
    uploadedAt: string;
  }[];
  reviews: {
    id: string;
    status: string;
    score?: number;
    decision?: string;
    completedAt?: string;
    reviewer: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  statusHistory: {
    id: string;
    fromStatus?: string;
    toStatus: string;
    changedAt: string;
    reason?: string;
    changedBy?: {
      id: string;
      name: string;
    };
  }[];
}

const PROGRAM_TYPE_ICONS = {
  PARTNERSHIP_NETWORK: Building,
  ENGLISH_EDUCATION: BookOpen,
  MENTORSHIP: Users
};

const PROGRAM_TYPE_LABELS = {
  PARTNERSHIP_NETWORK: 'Partnership Network',
  ENGLISH_EDUCATION: 'English Education',
  MENTORSHIP: 'Mentorship'
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  ADDITIONAL_INFO_REQUESTED: 'bg-orange-100 text-orange-800',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WAITLISTED: 'bg-indigo-100 text-indigo-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800'
};

export default function ProgramsDashboard() {
  const { data: session, status } = useSession();
  const [applications, setApplications] = useState<ProgramApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    programType: '',
    assignedTo: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/login');
      return;
    }

    const userRole = session.user?.role;
    if (userRole !== UserRole.PROGRAM_LEAD && userRole !== UserRole.ADMIN) {
      redirect('/dashboard');
      return;
    }
  }, [session, status]);

  // Fetch applications
  useEffect(() => {
    fetchApplications();
  }, [filters, pagination.page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.programType && { programType: filters.programType }),
        ...(filters.assignedTo && { assignedTo: filters.assignedTo })
      });

      const response = await fetch(`/api/programs/applications/review?${params}`);
      if (!response.ok) throw new Error('Failed to fetch applications');

      const data = await response.json();
      setApplications(data.applications);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status === prev.status ? '' : status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAssignReviewer = async (applicationId: string, reviewerId: string) => {
    try {
      const response = await fetch('/api/programs/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          applicationId,
          reviewerId
        })
      });

      if (!response.ok) throw new Error('Failed to assign reviewer');

      await fetchApplications(); // Refresh data
    } catch (error) {
      console.error('Failed to assign reviewer:', error);
    }
  };

  const handleBulkAssign = async (reviewerId: string) => {
    if (selectedApplications.length === 0) return;

    try {
      const response = await fetch('/api/programs/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_assign',
          applicationIds: selectedApplications,
          bulkReviewerId: reviewerId
        })
      });

      if (!response.ok) throw new Error('Failed to bulk assign');

      setSelectedApplications([]);
      await fetchApplications(); // Refresh data
    } catch (error) {
      console.error('Failed to bulk assign:', error);
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => 
      prev.includes(applicationId)
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedApplications(prev => 
      prev.length === applications.length ? [] : applications.map(app => app.id)
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const userRole = session.user?.role;
  const canAssignReviewers = userRole === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Program Applications
          </h1>
          <p className="text-gray-600">
            Review and manage applications for our global programs
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {Object.entries(stats).map(([status, count]) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                filters.status === status
                  ? 'border-brand-primary bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleStatusFilter(status)}
            >
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-600 capitalize">
                {status.replace(/_/g, ' ').toLowerCase()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Type
              </label>
              <select
                value={filters.programType}
                onChange={(e) => setFilters(prev => ({ ...prev, programType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">All Programs</option>
                <option value="PARTNERSHIP_NETWORK">Partnership Network</option>
                <option value="ENGLISH_EDUCATION">English Education</option>
                <option value="MENTORSHIP">Mentorship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment
              </label>
              <select
                value={filters.assignedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">All Applications</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by name, email..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', programType: '', assignedTo: '', search: '' })}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && canAssignReviewers && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                {selectedApplications.length} application(s) selected
              </div>
              <div className="flex gap-2">
                <select
                  onChange={(e) => e.target.value && handleBulkAssign(e.target.value)}
                  className="px-3 py-1 text-sm border border-blue-300 rounded"
                  defaultValue=""
                >
                  <option value="">Assign to Reviewer...</option>
                  <option value={session.user.id}>Assign to Me</option>
                  {/* Add other reviewers here */}
                </select>
                <button
                  onClick={() => setSelectedApplications([])}
                  className="px-3 py-1 text-sm text-blue-700 hover:bg-blue-100 rounded"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {applications.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600">
                {filters.status || filters.programType || filters.assignedTo || filters.search
                  ? "Try adjusting your filters to see more applications."
                  : "Applications will appear here once they are submitted."}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center">
                  {canAssignReviewers && (
                    <input
                      type="checkbox"
                      checked={selectedApplications.length === applications.length}
                      onChange={toggleSelectAll}
                      className="mr-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                    />
                  )}
                  <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-500">
                    <div className="col-span-3">Applicant</div>
                    <div className="col-span-2">Program</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Assigned To</div>
                    <div className="col-span-2">Submitted</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
              </div>

              {/* Applications */}
              <div className="divide-y divide-gray-200">
                {applications.map((application) => {
                  const ProgramIcon = PROGRAM_TYPE_ICONS[application.programType as keyof typeof PROGRAM_TYPE_ICONS];
                  
                  return (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        {canAssignReviewers && (
                          <input
                            type="checkbox"
                            checked={selectedApplications.includes(application.id)}
                            onChange={() => toggleApplicationSelection(application.id)}
                            className="mr-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                          />
                        )}
                        
                        <div className="grid grid-cols-12 gap-4 w-full">
                          {/* Applicant */}
                          <div className="col-span-3">
                            <div className="flex items-center">
                              {application.applicant.image ? (
                                <img
                                  src={application.applicant.image}
                                  alt={application.fullName}
                                  className="w-8 h-8 rounded-full mr-3"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">{application.fullName}</div>
                                <div className="text-sm text-gray-500">{application.email}</div>
                                <div className="text-xs text-gray-400">{application.city}, {application.country}</div>
                              </div>
                            </div>
                          </div>

                          {/* Program */}
                          <div className="col-span-2">
                            <div className="flex items-center">
                              <ProgramIcon className="w-4 h-4 text-brand-primary mr-2" />
                              <span className="text-sm font-medium">
                                {PROGRAM_TYPE_LABELS[application.programType as keyof typeof PROGRAM_TYPE_LABELS]}
                              </span>
                            </div>
                            {application.matchScore && (
                              <div className="text-xs text-gray-500 mt-1">
                                Match: {Math.round(application.matchScore * 100)}%
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[application.status as keyof typeof STATUS_COLORS]
                            }`}>
                              {application.status.replace(/_/g, ' ')}
                            </span>
                            {application.priority < 3 && (
                              <Star className="w-3 h-3 text-yellow-500 ml-1 inline" />
                            )}
                          </div>

                          {/* Assigned To */}
                          <div className="col-span-2">
                            {application.assignedReviewer ? (
                              <div className="text-sm">
                                <div className="font-medium">{application.assignedReviewer.name}</div>
                                <div className="text-gray-500 text-xs">{application.assignedReviewer.email}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Unassigned</span>
                            )}
                          </div>

                          {/* Submitted */}
                          <div className="col-span-2">
                            <div className="text-sm text-gray-900">
                              {new Date(application.submittedAt || application.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.attachments.length} attachment(s)
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/programs/review/${application.id}`}
                                className="p-1 text-gray-600 hover:text-brand-primary rounded transition-colors"
                                title="Review Application"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              
                              {canAssignReviewers && !application.assignedReviewer && (
                                <button
                                  onClick={() => handleAssignReviewer(application.id, session.user.id)}
                                  className="p-1 text-gray-600 hover:text-brand-primary rounded transition-colors"
                                  title="Assign to Me"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                              )}

                              <button className="p-1 text-gray-600 hover:text-brand-primary rounded transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                      {pagination.totalCount} applications
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <span className="px-3 py-1 text-sm bg-brand-primary text-white rounded">
                        {pagination.page}
                      </span>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}