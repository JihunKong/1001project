'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ShoppingBag, 
  Heart, 
  Users,
  Star,
  TrendingUp,
  Settings,
  Crown
} from 'lucide-react';
import Link from 'next/link';

export default function UniversalDashboard() {
  const { data: session } = useSession();
  
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = session.user;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back{user.name ? `, ${user.name}` : ''}!
              </h1>
              <p className="text-gray-600">Your personal learning dashboard</p>
            </div>
{/* Role-specific Dashboard Links */}
            <div className="flex gap-2">
              {user.role === 'VOLUNTEER' && (
                <Link 
                  href="/dashboard/volunteer" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Volunteer Dashboard
                </Link>
              )}
              {user.role === 'EDITOR' && (
                <Link 
                  href="/dashboard/editor" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Editor Dashboard
                </Link>
              )}
              {user.role === 'PUBLISHER' && (
                <Link 
                  href="/dashboard/publisher" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Publisher Dashboard
                </Link>
              )}
              {user.role === 'STORY_MANAGER' && (
                <Link 
                  href="/dashboard/story-manager" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Story Manager
                </Link>
              )}
              {user.role === 'BOOK_MANAGER' && (
                <Link 
                  href="/dashboard/book-manager" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Book Manager
                </Link>
              )}
              {user.role === 'CONTENT_ADMIN' && (
                <Link 
                  href="/dashboard/content-admin" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Content Admin
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link 
                  href="/admin" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Story Library */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/library" className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Story Library</h3>
                    <p className="text-gray-600 text-sm">Discover amazing stories</p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Browse Stories</span>
                  <Star className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </motion.div>
          
          {/* Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/shop" className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Shop</h3>
                    <p className="text-gray-600 text-sm">Support our mission</p>
                  </div>
                </div>
                <div className="flex items-center text-green-600 font-medium">
                  <span>View Products</span>
                  <ShoppingBag className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </motion.div>
          
          {/* Donate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/donate" className="block group">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">Donate</h3>
                    <p className="text-gray-600 text-sm">Plant seeds of empowerment</p>
                  </div>
                </div>
                <div className="flex items-center text-red-600 font-medium">
                  <span>Make Impact</span>
                  <Heart className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/library" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Read Stories</span>
            </Link>
            <Link href="/shop" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingBag className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Shop</span>
            </Link>
            <Link href="/about" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">About Us</span>
            </Link>
            <Link href="/contact" className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-8 h-8 text-gray-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Contact</span>
            </Link>
          </div>
        </motion.div>

        {/* Feature Discovery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Discover More</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Want to contribute to our mission? We have opportunities for teachers, volunteers, and organizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Involved
            </Link>
            <Link href="/about" className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Learn More
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}