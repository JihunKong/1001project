'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  School, 
  Heart,
  ArrowRight,
  AlertCircle,
  Home,
  Play
} from 'lucide-react';

export default function DemoHub() {
  const { t } = useTranslation('common');
  
  const demoRoles = [
    {
      id: 'learner',
      title: t('roles.learner.title'),
      description: 'Explore the learner experience with sample courses and progress tracking',
      icon: GraduationCap,
      gradient: 'from-blue-400 to-blue-600',
      iconColor: 'text-blue-500',
      shadowColor: 'rgba(59, 130, 246, 0.3)',
      href: '/demo/learner',
      features: ['Sample Courses', 'Mock Progress', 'Demo Achievements']
    },
    {
      id: 'teacher',
      title: t('roles.teacher.title'),
      description: 'Experience classroom management with sample students and content',
      icon: BookOpen,
      gradient: 'from-emerald-400 to-emerald-600',
      iconColor: 'text-emerald-500',
      shadowColor: 'rgba(52, 211, 153, 0.3)',
      href: '/demo/teacher',
      features: ['Sample Classroom', 'Mock Students', 'Demo Analytics']
    },
    {
      id: 'institution',
      title: t('roles.institution.title'),
      description: 'Preview program management and reporting capabilities',
      icon: School,
      gradient: 'from-purple-400 to-purple-600',
      iconColor: 'text-purple-500',
      shadowColor: 'rgba(168, 85, 247, 0.3)',
      href: '/demo/institution',
      features: ['Program Overview', 'Sample Reports', 'Demo Network']
    },
    {
      id: 'volunteer',
      title: t('roles.volunteer.title'),
      description: 'See how volunteers contribute through translation and illustration',
      icon: Heart,
      gradient: 'from-rose-400 to-rose-600',
      iconColor: 'text-rose-500',
      shadowColor: 'rgba(244, 63, 94, 0.3)',
      href: '/demo/volunteer',
      features: ['Sample Projects', 'Mock Tasks', 'Demo Community']
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-900/50 dark:to-gray-900">
      {/* Demo Mode Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Demo Mode - Explore with sample data
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
              <Link 
                href="/signup"
                className="bg-yellow-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Sign Up for Full Access
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              <Play className="w-4 h-4" />
              Demo Experience
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Explore the Platform
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose a role to explore its features with sample data. No signup required!
            </p>
          </motion.div>
          
          {/* Demo Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {demoRoles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative"
              >
                <Link href={role.href}>
                  <div className="glass-card glass-card-hover rounded-2xl p-8 h-full relative overflow-hidden">
                    {/* Demo Badge */}
                    <div className="absolute top-4 right-4 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">
                      DEMO
                    </div>
                    
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    {/* Icon */}
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700"
                      style={{ boxShadow: `0 10px 30px -10px ${role.shadowColor}` }}
                    >
                      <role.icon className={`w-8 h-8 ${role.iconColor}`} />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {role.title} Demo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {role.description}
                    </p>
                    
                    {/* Demo Features */}
                    <ul className="space-y-2 mb-6">
                      {role.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {/* CTA */}
                    <div className={`flex items-center font-semibold bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all duration-300`}>
                      Try Demo
                      <ArrowRight className="w-5 h-5 ml-2 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                What to Expect in Demo Mode
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Sample Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All content is fictional and for demonstration purposes only
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Limited Features
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Some advanced features require a full account
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No Data Saved
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your demo interactions are not saved or tracked
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Ready to join our community?
                </p>
                <Link 
                  href="/signup"
                  className="btn-primary inline-flex items-center"
                >
                  Create Your Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}