'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock,
  ChevronLeft,
  Plus,
  BarChart3,
  Filter,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import BookAssignmentPanel from '@/components/teacher/BookAssignmentPanel';

interface AssignmentStats {
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageCompletionRate: number;
  activeStudents: number;
  booksAssigned: number;
}

interface AssignmentSummary {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  assignedAt: string;
  dueDate: string | null;
  isRequired: boolean;
  assignedCount: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number;
}

export default function TeacherAssignmentsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AssignmentStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0,
    averageCompletionRate: 0,
    activeStudents: 0,
    booksAssigned: 0
  });
  
  const [assignmentSummaries, setAssignmentSummaries] = useState<AssignmentSummary[]>([]);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAssignmentStats();
    }
  }, [status]);

  const fetchAssignmentStats = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would have a specific stats endpoint
      // For now, we'll use the existing assign-book endpoint and calculate stats
      const response = await fetch('/api/teacher/assign-book');
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignment data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const assignments = result.data.recentAssignments || [];
        const students = result.data.students || [];
        const books = result.data.books || [];
        
        // Calculate mock stats based on available data
        const mockStats: AssignmentStats = {
          totalAssignments: assignments.length,
          completedAssignments: Math.floor(assignments.length * 0.7), // 70% completion rate
          overdueAssignments: Math.floor(assignments.length * 0.1), // 10% overdue
          averageCompletionRate: 75,
          activeStudents: students.length,
          booksAssigned: new Set(assignments.map((a: any) => a.bookTitle)).size
        };
        
        setStats(mockStats);
        
        // Group assignments by book for summary view
        const bookAssignmentMap = new Map<string, any>();
        assignments.forEach((assignment: any) => {
          const key = assignment.bookTitle;
          if (!bookAssignmentMap.has(key)) {
            bookAssignmentMap.set(key, {
              id: assignment.id,
              bookTitle: assignment.bookTitle,
              bookAuthor: assignment.bookAuthor,
              assignedAt: assignment.assignedAt,
              dueDate: assignment.dueDate,
              isRequired: assignment.isRequired,
              assignments: []
            });
          }
          bookAssignmentMap.get(key).assignments.push(assignment);
        });
        
        const summaries: AssignmentSummary[] = Array.from(bookAssignmentMap.values()).map(book => ({
          id: book.id,
          bookTitle: book.bookTitle,
          bookAuthor: book.bookAuthor,
          assignedAt: book.assignedAt,
          dueDate: book.dueDate,
          isRequired: book.isRequired,
          assignedCount: book.assignments.length,
          completedCount: Math.floor(book.assignments.length * 0.7), // Mock completion
          overdueCount: Math.floor(book.assignments.length * 0.1), // Mock overdue
          completionRate: 70 + Math.floor(Math.random() * 25) // Random completion rate 70-95%
        }));
        
        setAssignmentSummaries(summaries);
      }
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort assignments
  const filteredAssignments = assignmentSummaries
    .filter(assignment => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'overdue') return assignment.overdueCount > 0;
      if (filterStatus === 'completed') return assignment.completionRate === 100;
      if (filterStatus === 'active') return assignment.completionRate < 100 && assignment.overdueCount === 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'completion') {
        return b.completionRate - a.completionRate;
      }
      if (sortBy === 'assigned') {
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (showCreateAssignment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setShowCreateAssignment(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Assignments
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
            <p className="text-gray-600">Assign books to your students and track their progress</p>
          </div>

          <BookAssignmentPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Management</h1>
              <p className="text-gray-600">Track and manage book assignments for your students</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/teacher"
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowCreateAssignment(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Assignment
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</span>
            </div>
            <p className="text-gray-600">Total Assignments</p>
            <p className="text-xs text-gray-500 mt-1">{stats.booksAssigned} unique books</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.completedAssignments}</span>
            </div>
            <p className="text-gray-600">Completed</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalAssignments > 0 ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100) : 0}% completion rate
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overdueAssignments}</span>
            </div>
            <p className="text-gray-600">Overdue</p>
            <p className="text-xs text-gray-500 mt-1">Requires attention</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.activeStudents}</span>
            </div>
            <p className="text-gray-600">Active Students</p>
            <p className="text-xs text-gray-500 mt-1">Across all classes</p>
          </motion.div>
        </div>

        {/* Filters and Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Assignments</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="completion">Sort by Completion Rate</option>
                  <option value="assigned">Sort by Date Assigned</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredAssignments.length} of {assignmentSummaries.length} assignments
            </div>
          </div>
        </motion.div>

        {/* Assignments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          {filteredAssignments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900">Book</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Assigned</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Due Date</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Progress</th>
                    <th className="text-left p-6 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{assignment.bookTitle}</h3>
                            <p className="text-sm text-gray-600 mb-1">by {assignment.bookAuthor}</p>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                assignment.isRequired
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {assignment.isRequired ? 'Required' : 'Optional'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            {assignment.assignedCount} student{assignment.assignedCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        {assignment.dueDate ? (
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(assignment.dueDate) > new Date() 
                                ? `${Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                                : 'Overdue'
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">No due date</span>
                        )}
                      </td>
                      
                      <td className="p-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {assignment.completedCount}/{assignment.assignedCount} completed
                            </span>
                            <span className="font-medium text-gray-900">
                              {assignment.completionRate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${assignment.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          {assignment.overdueCount > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">{assignment.overdueCount} overdue</span>
                            </div>
                          )}
                          {assignment.completionRate === 100 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs">Complete</span>
                            </div>
                          )}
                          {assignment.completionRate < 100 && assignment.overdueCount === 0 && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">In Progress</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No assignments yet' : `No ${filterStatus} assignments`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterStatus === 'all' 
                  ? 'Create your first book assignment to get started.'
                  : 'Try adjusting your filters to see more assignments.'
                }
              </p>
              {filterStatus === 'all' && (
                <button
                  onClick={() => setShowCreateAssignment(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create First Assignment
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}