'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  Globe, 
  TrendingUp,
  Eye,
  BookOpen,
  Star,
  User,
  Calendar,
  Upload
} from 'lucide-react';

export default function PublisherDashboard() {
  const { data: session, status } = useSession();

  // Redirect if not logged in or not a publisher
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== UserRole.PUBLISHER) {
    redirect('/dashboard');
  }

  const stats = {
    pendingApproval: 7,
    published: 45,
    totalReaders: 12500,
    thisMonth: 15
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Publisher Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {session.user.name || 'Publisher'}! Approve stories for publication.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-6 h-6 text-orange-600" />
              <span className="text-xs text-orange-600">+2</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              <span className="text-xs text-green-600">+3</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
            <p className="text-sm text-gray-600">Published</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-blue-600">+450</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalReaders.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Readers</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            <p className="text-sm text-gray-600">This Month</p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <FileText className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-medium text-gray-900">Review for Publication</h3>
              <p className="text-sm text-gray-600">Stories ready for final approval</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Upload className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-medium text-gray-900">Publish Stories</h3>
              <p className="text-sm text-gray-600">Make approved stories live</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <Globe className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-medium text-gray-900">Published Library</h3>
              <p className="text-sm text-gray-600">View all published stories</p>
            </button>
          </div>
        </div>

        {/* Publication Queue Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publication Queue</h2>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Publication workflow coming soon!</p>
            <p className="text-sm">Integration with the story submission system is in progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}