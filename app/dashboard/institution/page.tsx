'use client';

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  Globe, 
  TrendingUp,
  Award,
  BarChart3,
  Calendar,
  DollarSign,
  Target,
  Activity,
  MapPin,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';
import Link from 'next/link';

export default function InstitutionDashboard() {
  const { t } = useTranslation('common');
  
  // Mock data - in production, this would come from your backend
  const institutionData = {
    name: 'Bright Future Academy',
    type: 'K-12 School',
    location: 'Seoul, South Korea',
    totalStudents: 450,
    totalTeachers: 28,
    activePrograms: 6,
    completionRate: 78,
    monthlyBudget: 5000,
    budgetUsed: 3200,
    partnerSince: '2023'
  };
  
  const programs = [
    {
      id: 1,
      name: 'ESL Foundation Program',
      enrolled: 120,
      completion: 82,
      status: 'active',
      nextMilestone: 'Mid-term Assessment',
      daysLeft: 15
    },
    {
      id: 2,
      name: 'Global Stories Initiative',
      enrolled: 200,
      completion: 75,
      status: 'active',
      nextMilestone: 'Story Publication',
      daysLeft: 7
    },
    {
      id: 3,
      name: 'Cultural Exchange Program',
      enrolled: 80,
      completion: 60,
      status: 'active',
      nextMilestone: 'Partner School Meeting',
      daysLeft: 3
    },
    {
      id: 4,
      name: 'Digital Literacy Workshop',
      enrolled: 50,
      completion: 90,
      status: 'ending',
      nextMilestone: 'Graduation Ceremony',
      daysLeft: 2
    }
  ];
  
  const impactMetrics = [
    {
      metric: 'Stories Published',
      value: 142,
      change: '+12%',
      trend: 'up'
    },
    {
      metric: 'Student Engagement',
      value: '85%',
      change: '+5%',
      trend: 'up'
    },
    {
      metric: 'Parent Satisfaction',
      value: '92%',
      change: '+3%',
      trend: 'up'
    },
    {
      metric: 'Teacher Adoption',
      value: '78%',
      change: '-2%',
      trend: 'down'
    }
  ];
  
  const volunteers = [
    {
      id: 1,
      name: 'Maria Garcia',
      role: 'Story Translator',
      hours: 45,
      avatar: '/api/placeholder/40/40',
      status: 'active'
    },
    {
      id: 2,
      name: 'John Smith',
      role: 'Illustration Mentor',
      hours: 32,
      avatar: '/api/placeholder/40/40',
      status: 'active'
    },
    {
      id: 3,
      name: 'Yuki Tanaka',
      role: 'Reading Coach',
      hours: 28,
      avatar: '/api/placeholder/40/40',
      status: 'active'
    },
    {
      id: 4,
      name: 'Ahmed Hassan',
      role: 'Tech Support',
      hours: 20,
      avatar: '/api/placeholder/40/40',
      status: 'pending'
    }
  ];
  
  const upcomingEvents = [
    {
      id: 1,
      title: 'Quarterly Board Meeting',
      date: 'Dec 15, 2024',
      type: 'meeting'
    },
    {
      id: 2,
      title: 'Student Story Showcase',
      date: 'Dec 18, 2024',
      type: 'event'
    },
    {
      id: 3,
      title: 'Teacher Training Workshop',
      date: 'Dec 22, 2024',
      type: 'training'
    },
    {
      id: 4,
      title: 'Year-End Impact Report Due',
      date: 'Dec 31, 2024',
      type: 'deadline'
    }
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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Institution Dashboard
              </h1>
              <p className="text-gray-600">{institutionData.name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {institutionData.location}
                </span>
                <span>Partner since {institutionData.partnerSince}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Settings
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{institutionData.totalStudents}</span>
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
              <span className="text-2xl font-bold text-gray-900">{institutionData.totalTeachers}</span>
            </div>
            <p className="text-gray-600">Active Teachers</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">{institutionData.activePrograms}</span>
            </div>
            <p className="text-gray-600">Active Programs</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{institutionData.completionRate}%</span>
            </div>
            <p className="text-gray-600">Completion Rate</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <span className="text-lg font-bold text-gray-900">
                ${institutionData.budgetUsed}/${institutionData.monthlyBudget}
              </span>
            </div>
            <p className="text-gray-600">Monthly Budget</p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{ width: `${(institutionData.budgetUsed / institutionData.monthlyBudget) * 100}%` }}
              />
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Programs Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Programs</h2>
                <Link href="/programs" className="text-blue-600 hover:text-blue-700 font-medium">
                  Manage All
                </Link>
              </div>
              <div className="space-y-4">
                {programs.map((program) => (
                  <div key={program.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{program.name}</h3>
                        <p className="text-sm text-gray-600">
                          {program.enrolled} enrolled • Next: {program.nextMilestone}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        program.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {program.status === 'ending' ? `Ending in ${program.daysLeft} days` : program.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${program.completion}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{program.completion}%</span>
                      <Link
                        href={`/program/${program.id}`}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors ml-2"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Impact Metrics */}
              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Impact Metrics</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {impactMetrics.map((item) => (
                  <div key={item.metric} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{item.metric}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className={`text-sm mt-1 ${
                      item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.change}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Active Volunteers */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Active Volunteers</h2>
                <Link href="/volunteers" className="text-blue-600 hover:text-blue-700 text-sm">
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {volunteers.map((volunteer) => (
                  <div key={volunteer.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900">{volunteer.name}</p>
                      <p className="text-xs text-gray-600">{volunteer.role} • {volunteer.hours}h</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${
                      volunteer.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      event.type === 'meeting' ? 'bg-blue-100' :
                      event.type === 'event' ? 'bg-purple-100' :
                      event.type === 'training' ? 'bg-green-100' :
                      'bg-red-100'
                    }`}>
                      <Calendar className={`w-4 h-4 ${
                        event.type === 'meeting' ? 'text-blue-600' :
                        event.type === 'event' ? 'text-purple-600' :
                        event.type === 'training' ? 'text-green-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-600">{event.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/programs/create" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Start New Program</span>
                </Link>
                <Link href="/volunteers/invite" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Invite Volunteers</span>
                </Link>
                <Link href="/reports/impact" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Generate Impact Report</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}