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
  Globe,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation('common');
  
  const roles = [
    {
      id: 'learner',
      title: t('roles.learner.title'),
      description: t('roles.learner.description'),
      icon: GraduationCap,
      color: 'bg-blue-500',
      href: '/dashboard/learner'
    },
    {
      id: 'teacher',
      title: t('roles.teacher.title'),
      description: t('roles.teacher.description'),
      icon: BookOpen,
      color: 'bg-green-500',
      href: '/dashboard/teacher'
    },
    {
      id: 'institution',
      title: t('roles.institution.title'),
      description: t('roles.institution.description'),
      icon: School,
      color: 'bg-purple-500',
      href: '/dashboard/institution'
    },
    {
      id: 'volunteer',
      title: t('roles.volunteer.title'),
      description: t('roles.volunteer.description'),
      icon: Heart,
      color: 'bg-red-500',
      href: '/volunteer'
    }
  ];
  
  const features = [
    {
      title: 'Global Stories',
      description: 'Access stories from children around the world',
      icon: Globe
    },
    {
      title: 'Interactive Learning',
      description: 'Engage with content through interactive features',
      icon: Sparkles
    },
    {
      title: 'Community Impact',
      description: 'Make a real difference in children\'s lives',
      icon: Users
    }
  ];
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">{t('hero.title')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('hero.subtitle')}
            </p>
            <Link
              href="#roles"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-300 rounded-full opacity-20 blur-xl"></div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Role Selection Section */}
      <section id="roles" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('roles.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('roles.subtitle')}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Link href={role.href}>
                  <div className="bg-white rounded-xl shadow-lg p-6 h-full cursor-pointer transition-all group-hover:shadow-xl">
                    <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 ${role.color} rounded-lg text-white`}>
                      <role.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {role.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {role.description}
                    </p>
                    <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Impact Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Seeds of Empowerment
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Every contribution plants seeds of hope and opportunity for children worldwide.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Stories Published</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">10,000+</div>
                <div className="text-gray-600">Children Reached</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-600">Countries</div>
              </div>
            </div>
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <Heart className="w-5 h-5" />
              Support Our Mission
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}