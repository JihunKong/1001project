'use client';

import { useTranslation } from 'react-i18next';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  BarChart,
  FileText,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import StudentAssessment from '@/components/teacher/StudentAssessment';

interface TeacherStats {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalStudents: number;
    activeClasses: number;
    assignmentsGraded: number;
    pendingAssignments: number;
    averageProgress: number;
    totalAssignments: number;
  };
  classes: Array<{
    id: string;
    name: string;
    students: number;
    averageProgress: number;
    pendingTasks: number;
  }>;
  recentActivity: Array<{
    id: string;
    studentName: string;
    action: string;
    details: any;
    timestamp: string;
  }>;
}

export default function TeacherDashboard() {
  const { t } = useTranslation('common');
  const { data: session, status } = useSession();
  const [teacherData, setTeacherData] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTeacherStats();
    }
  }, [status]);

  const fetchTeacherStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/teacher/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch teacher statistics');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTeacherData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching teacher stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  
  // Default empty data structure for new teachers
  const defaultData = {
    user: {
      name: session?.user?.name || 'Teacher',
      email: session?.user?.email || ''
    },
    stats: {
      totalStudents: 0,
      activeClasses: 0,
      assignmentsGraded: 0,
      pendingAssignments: 0,
      averageProgress: 0,
      totalAssignments: 0
    },
    classes: [],
    recentActivity: []
  };
  
  const data = teacherData || defaultData;
  
  // Upcoming tasks based on actual data
  const upcomingTasks = [
    { 
      id: 1, 
      task: data.stats.pendingAssignments > 0 
        ? `Grade ${data.stats.pendingAssignments} Pending Assignments` 
        : 'No pending assignments',
      dueDate: 'Today', 
      priority: data.stats.pendingAssignments > 5 ? 'high' : 'medium' 
    },
    { id: 2, task: 'Prepare Week Materials', dueDate: 'Tomorrow', priority: 'medium' },
    { id: 3, task: 'Parent-Teacher Conference', dueDate: 'Friday', priority: 'high' },
    { id: 4, task: 'Update Progress Reports', dueDate: 'Next Week', priority: 'low' }
  ];
  
  // Transform recent activity for display
  const displayActivity = data.recentActivity.map((activity, index) => {
    const getActivityType = (action: string) => {
      if (action.includes('complete') || action.includes('finish')) return 'completion';
      if (action.includes('submit') || action.includes('assignment')) return 'assignment';
      if (action.includes('achieve') || action.includes('streak')) return 'achievement';
      return 'help';
    };
    
    const timeDiff = activity.timestamp ? 
      new Date().getTime() - new Date(activity.timestamp).getTime() : 0;
    const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
    const daysAgo = Math.floor(hoursAgo / 24);
    
    const timeString = 
      hoursAgo < 1 ? 'Just now' :
      hoursAgo < 24 ? `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago` :
      `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    
    return {
      id: activity.id || String(index),
      student: activity.studentName,
      action: activity.action,
      time: timeString,
      type: getActivityType(activity.action)
    };
  });
  
  if (loading && status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your dashboard...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {data.user.name}!</p>
        </motion.div>
        
        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            {error}
          </motion.div>
        )}
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{data.stats.totalStudents}</span>
            </div>
            <p className="text-gray-600">Total Students</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{data.stats.activeClasses}</span>
            </div>
            <p className="text-gray-600">Active Classes</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{data.stats.assignmentsGraded}</span>
            </div>
            <p className="text-gray-600">Assignments Graded</p>
            {data.stats.pendingAssignments > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                +{data.stats.pendingAssignments} pending
              </p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{data.stats.averageProgress}%</span>
            </div>
            <p className="text-gray-600">Average Progress</p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classes Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
                <Link href="/classes" className="text-blue-600 hover:text-blue-700 font-medium">
                  Manage All
                </Link>
              </div>
              <div className="space-y-4">
                {data.classes.length > 0 ? (
                  data.classes.map((classItem) => (
                    <div key={classItem.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                          <p className="text-sm text-gray-600">
                            {classItem.students} student{classItem.students !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {classItem.pendingTasks > 0 && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            {classItem.pendingTasks} pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-grow bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${classItem.averageProgress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{classItem.averageProgress}% avg</span>
                        <Link
                          href={`/class/${classItem.id}`}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-2"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No classes yet</p>
                    <Link href="/classes/create" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                      Create your first class
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Recent Activity */}
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Recent Student Activity</h2>
              <div className="space-y-3">
                {displayActivity.length > 0 ? (
                  displayActivity.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'completion' ? 'bg-green-100' :
                        activity.type === 'assignment' ? 'bg-blue-100' :
                        activity.type === 'achievement' ? 'bg-yellow-100' :
                        'bg-red-100'
                      }`}>
                        {activity.type === 'completion' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {activity.type === 'assignment' && <FileText className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'achievement' && <Award className="w-4 h-4 text-yellow-600" />}
                        {activity.type === 'help' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.student}</span>
                        </p>
                        <p className="text-sm text-gray-600">{activity.action}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-1"
          >
            {/* Upcoming Tasks */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900">{task.task}</p>
                      <p className="text-xs text-gray-600">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/tasks" className="block mt-4 text-center text-blue-600 hover:text-blue-700 font-medium">
                View All Tasks
              </Link>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/assignments/create" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Create Assignment</span>
                </Link>
                <Link href="/students/progress" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <BarChart className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">View Progress Reports</span>
                </Link>
                <Link href="/messages" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Message Parents</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Student Assessment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <StudentAssessment />
        </motion.div>
      </div>
    </div>
  );
}