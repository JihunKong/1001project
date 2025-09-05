'use client';

import { useTranslation } from 'react-i18next';
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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { t } = useTranslation('common');
  
  // Mock data - in production, this would come from your backend
  const teacherData = {
    name: 'Sarah Johnson',
    totalStudents: 32,
    activeClasses: 3,
    assignmentsGraded: 24,
    pendingAssignments: 8,
    averageProgress: 68
  };
  
  const classes = [
    {
      id: 1,
      name: 'English Literature - Grade 5A',
      students: 28,
      averageProgress: 72,
      nextLesson: 'Creative Writing Workshop',
      pendingTasks: 3
    },
    {
      id: 2,
      name: 'Reading Comprehension - Grade 4B',
      students: 25,
      averageProgress: 65,
      nextLesson: 'Understanding Characters',
      pendingTasks: 5
    },
    {
      id: 3,
      name: 'ESL Beginners',
      students: 15,
      averageProgress: 58,
      nextLesson: 'Basic Conversations',
      pendingTasks: 2
    }
  ];
  
  const recentActivity = [
    {
      id: 1,
      student: 'Emma Wilson',
      action: 'Completed Story: The Magic Garden',
      time: '2 hours ago',
      type: 'completion'
    },
    {
      id: 2,
      student: 'James Chen',
      action: 'Submitted Assignment: Book Report',
      time: '3 hours ago',
      type: 'assignment'
    },
    {
      id: 3,
      student: 'Sofia Martinez',
      action: 'Achieved 7-Day Streak',
      time: '5 hours ago',
      type: 'achievement'
    },
    {
      id: 4,
      student: 'Michael Brown',
      action: 'Needs help with vocabulary exercise',
      time: '1 day ago',
      type: 'help'
    }
  ];
  
  const upcomingTasks = [
    { id: 1, task: 'Grade Creative Writing Essays', dueDate: 'Today', priority: 'high' },
    { id: 2, task: 'Prepare Week 12 Materials', dueDate: 'Tomorrow', priority: 'medium' },
    { id: 3, task: 'Parent-Teacher Conference', dueDate: 'Friday', priority: 'high' },
    { id: 4, task: 'Update Progress Reports', dueDate: 'Next Week', priority: 'low' }
  ];
  
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
          <p className="text-gray-600">Welcome back, {teacherData.name}!</p>
        </motion.div>
        
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
              <span className="text-2xl font-bold text-gray-900">{teacherData.totalStudents}</span>
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
              <span className="text-2xl font-bold text-gray-900">{teacherData.activeClasses}</span>
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
              <span className="text-2xl font-bold text-gray-900">{teacherData.assignmentsGraded}</span>
            </div>
            <p className="text-gray-600">Assignments Graded</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{teacherData.averageProgress}%</span>
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
                {classes.map((classItem) => (
                  <div key={classItem.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                        <p className="text-sm text-gray-600">
                          {classItem.students} students • Next: {classItem.nextLesson}
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
                ))}
              </div>
              
              {/* Recent Activity */}
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Recent Student Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
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
                ))}
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
      </div>
    </div>
  );
}