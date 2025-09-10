'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Users, 
  Brain,
  Globe,
  Award,
  ChevronRight,
  Sparkles,
  Clock,
  BarChart,
  Search,
  Filter,
  UserPlus,
  GraduationCap,
  AlertCircle,
  Calendar,
  CheckCircle,
  PlayCircle,
  User
} from 'lucide-react';
import Link from 'next/link';

interface Assignment {
  id: string;
  type: string;
  title: string;
  description: string;
  book: {
    id: string;
    title: string;
    authorName: string;
    coverImage: string;
    summary: string;
    pageCount: number;
    language: string;
    category: string;
    isPremium: boolean;
  };
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
    code: string;
    subject: string;
  } | null;
  assignedAt: string;
  dueDate?: string;
  isRequired: boolean;
  allowDiscussion: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  isOverdue: boolean;
  progress: {
    currentPage: number;
    totalPages: number;
    percentComplete: number;
    lastReadAt: string | null;
    totalReadingTime: number;
  };
}

interface ClassEnrollment {
  id: string;
  classId: string;
  class: {
    id: string;
    code: string;
    name: string;
    subject: string;
    gradeLevel: string;
    teacher: {
      id: string;
      name: string;
      email: string;
    };
  };
  enrolledAt: string;
  status: string;
  grade: string | null;
  attendance: number;
  progress: number;
}

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'assignments' | 'progress' | 'classes'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({
    level: 'Beginner',
    storiesRead: 0,
    wordsLearned: 0,
    timeSpent: 0,
    currentStreak: 0
  });
  const [assignmentStats, setAssignmentStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?callbackUrl=/learn');
      return;
    }

    // Only allow learners/students to access this page
    const userRole = session.user?.role;
    if (userRole === 'TEACHER') {
      router.push('/dashboard/teacher');
      return;
    }
    
    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch assignments (which includes assigned books)
      const assignResponse = await fetch('/api/learn/assignments');
      if (assignResponse.ok) {
        const assignData = await assignResponse.json();
        setAssignments(assignData.assignments || []);
        setEnrollments(assignData.enrollments || []);
        setAssignmentStats(assignData.stats || assignmentStats);
      } else {
        const errorData = await assignResponse.json();
        setError(errorData.error || 'Failed to load assignments');
      }
      
      // Fetch user progress
      const progressResponse = await fetch('/api/learn/progress');
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserStats(progressData.stats || userStats);
      }
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <PlayCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  // Show class joining prompt if no enrollments
  if (!loading && enrollments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-blue-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to 1001 Stories Learning!
              </h1>
              
              <p className="text-gray-600 mb-8 text-lg">
                To start your learning journey, you need to join a class using the code provided by your teacher.
              </p>
              
              <div className="space-y-4">
                <Link
                  href="/learn/join"
                  className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  <UserPlus className="w-6 h-6 mr-3" />
                  Join a Class
                </Link>
                
                <p className="text-sm text-gray-500">
                  Don't have a class code? Contact your teacher for assistance.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with User Stats */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6 mb-6"
          >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome back, {session?.user?.name || 'Learner'}!
                </h1>
                <p className="text-gray-600">
                  Ready to continue your learning journey?
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-semibold">
                    Level: {userStats.level}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Target className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{assignmentStats.total}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Total Assignments</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">{assignmentStats.completed}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Clock className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">{Math.floor(userStats.timeSpent / 60)}h</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Reading Time</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">{userStats.currentStreak}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Day Streak</p>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
            >
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="flex flex-wrap border-b">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'assignments'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Target className="w-5 h-5 mr-2" />
                  <span>My Assignments</span>
                  {assignmentStats.total > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {assignmentStats.total}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'progress'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <BarChart className="w-5 h-5 mr-2" />
                  <span>Progress</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'classes'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span>My Classes</span>
                  {enrollments.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      {enrollments.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                  <motion.div
                    key="assignments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Your Reading Assignments
                      </h2>
                      <Link
                        href="/learn/join"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Another Class
                      </Link>
                    </div>
                    
                    {assignments.length > 0 ? (
                      <div className="grid gap-4">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Book Cover */}
                              <div className="flex-shrink-0">
                                <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                  {assignment.book.coverImage ? (
                                    <img
                                      src={assignment.book.coverImage}
                                      alt={assignment.book.title}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <BookOpen className="w-8 h-8 text-gray-400" />
                                  )}
                                </div>
                              </div>
                              
                              {/* Assignment Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">
                                      {assignment.book.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2">
                                      by {assignment.book.authorName}
                                    </p>
                                  </div>
                                  <span className={`px-3 py-1 text-xs rounded-full font-medium flex items-center ${getStatusColor(assignment.status)}`}>
                                    {getStatusIcon(assignment.status)}
                                    <span className="ml-1 capitalize">{assignment.status.replace('_', ' ')}</span>
                                  </span>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{Math.round(assignment.progress.percentComplete)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${assignment.progress.percentComplete}%` }}
                                    />
                                  </div>
                                </div>
                                
                                {/* Assignment Details */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                                  <span className="flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    {assignment.teacher.name}
                                  </span>
                                  {assignment.class && (
                                    <span className="flex items-center">
                                      <Users className="w-3 h-3 mr-1" />
                                      {assignment.class.name}
                                    </span>
                                  )}
                                  {assignment.dueDate && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {assignment.book.pageCount} pages
                                  </span>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                  <Link
                                    href={`/learn/read/${assignment.book.id}`}
                                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                  >
                                    {assignment.progress.percentComplete > 0 ? 'Continue Reading' : 'Start Reading'}
                                  </Link>
                                  <Link
                                    href={`/library/books/${assignment.book.id}`}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                  >
                                    Book Details
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                        <p className="text-gray-600 mb-4">
                          Your teacher will assign books for you to read here.
                        </p>
                        <Link
                          href="/learn/join"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Join a Class
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Your Learning Progress
                    </h2>
                    
                    {/* Progress Overview */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-medium text-gray-700 mb-4">Assignment Progress</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Completed</span>
                            <span className="text-sm font-medium">{assignmentStats.completed} / {assignmentStats.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${assignmentStats.total > 0 ? (assignmentStats.completed / assignmentStats.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-medium text-gray-700 mb-4">Reading Time</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Hours</span>
                            <span className="text-sm font-medium">{Math.floor(userStats.timeSpent / 60)}h {userStats.timeSpent % 60}m</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Current Streak</span>
                            <span className="text-sm font-medium">{userStats.currentStreak} days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Progress */}
                    {assignments.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-700 mb-4">Book Progress</h3>
                        <div className="space-y-3">
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-800">{assignment.book.title}</span>
                                <span className="text-sm text-gray-600">{Math.round(assignment.progress.percentComplete)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${assignment.progress.percentComplete}%` }}
                                />
                              </div>
                              {assignment.progress.lastReadAt && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Last read: {new Date(assignment.progress.lastReadAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Classes Tab */}
                {activeTab === 'classes' && (
                  <motion.div
                    key="classes"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Your Classes
                      </h2>
                      <Link
                        href="/learn/join"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Another Class
                      </Link>
                    </div>
                    
                    <div className="grid gap-4">
                      {enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="bg-white border border-gray-200 rounded-lg p-6"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-1">
                                {enrollment.class.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {enrollment.class.subject} • Grade {enrollment.class.gradeLevel}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Active
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Teacher</span>
                              <p className="font-medium text-gray-900">{enrollment.class.teacher.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Class Code</span>
                              <p className="font-mono font-medium text-gray-900">{enrollment.class.code}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Joined</span>
                              <p className="font-medium text-gray-900">{new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Progress</span>
                              <p className="font-medium text-gray-900">{Math.round(enrollment.progress)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/learn/ai-tutor"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">AI Study Helper</h3>
                  <p className="text-sm text-gray-600">Get help understanding difficult words and concepts</p>
                </div>
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
            </Link>
            <Link
              href="/learn/achievements"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Achievements</h3>
                  <p className="text-sm text-gray-600">View your reading badges and rewards</p>
                </div>
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
            </Link>
            <Link
              href="/learn/join"
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Join Class</h3>
                  <p className="text-sm text-gray-600">Enter a class code to join a new class</p>
                </div>
                <UserPlus className="w-8 h-8 text-blue-500" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}