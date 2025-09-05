'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  ChevronRight,
  FileText,
  BarChart,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function DemoTeacherDashboard() {
  const { t } = useTranslation('common');
  
  // Demo data
  const demoData = {
    name: 'Demo Teacher',
    totalStudents: 25,
    activeAssignments: 3,
    completionRate: 78,
    weeklyProgress: 15
  };
  
  const demoClasses = [
    {
      id: 1,
      name: 'Morning Class A',
      students: 12,
      nextLesson: 'Chapter 5: Adventures',
      progress: 65
    },
    {
      id: 2,
      name: 'Afternoon Class B',
      students: 13,
      nextLesson: 'Chapter 3: Cultures',
      progress: 45
    }
  ];
  
  const recentActivities = [
    { student: 'Sarah J.', action: 'Completed Story: The Rainbow Bridge', time: '2 hours ago' },
    { student: 'Mike L.', action: 'Started Quiz: Chapter 4', time: '3 hours ago' },
    { student: 'Emma K.', action: 'Submitted Assignment', time: '5 hours ago' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Demo Mode Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-200 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Demo Mode - This is a preview with sample data
              </span>
            </div>
            <Link 
              href="/signup"
              className="bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              Sign Up for Full Access
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Teacher Dashboard (Demo)
          </h1>
          <p className="text-gray-600">Welcome to the demo teacher experience!</p>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.totalStudents}</span>
            </div>
            <p className="text-gray-600">Total Students</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.activeAssignments}</span>
            </div>
            <p className="text-gray-600">Active Assignments</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <BarChart className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{demoData.completionRate}%</span>
            </div>
            <p className="text-gray-600">Completion Rate</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 relative"
          >
            <div className="absolute top-2 right-2 text-xs text-gray-400">Demo</div>
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">+{demoData.weeklyProgress}%</span>
            </div>
            <p className="text-gray-600">Weekly Progress</p>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                My Classes (Sample)
              </h2>
              <div className="space-y-4">
                {demoClasses.map((cls) => (
                  <div key={cls.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                      Demo Content
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <span className="text-sm text-gray-600">{cls.students} students</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Next: {cls.nextLesson}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${cls.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{cls.progress}%</span>
                    </div>
                    <button
                      className="mt-3 p-2 bg-gray-400 text-white rounded-lg cursor-not-allowed w-full flex items-center justify-center"
                      disabled
                    >
                      View Class (Sign up for access)
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">
                  Sign up to create and manage real classes!
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Activity (Sample)
              </h2>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Award className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900">{activity.student}</p>
                      <p className="text-xs text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}