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
  ArrowRight,
  Star,
  ChevronRight,
  Zap,
  Award,
  Target,
  Rocket,
  Play
} from 'lucide-react';

export default function Home() {
  const { t } = useTranslation('common');
  
  // Always use actual dashboard routes - middleware handles authentication
  const dashboardPrefix = '/dashboard';
  
  const roles = [
    {
      id: 'learner',
      title: t('roles.learner.title'),
      description: t('roles.learner.description'),
      icon: GraduationCap,
      gradient: 'from-blue-400 to-blue-600',
      iconColor: 'text-blue-500',
      shadowColor: 'rgba(59, 130, 246, 0.3)',
      href: `${dashboardPrefix}/learner`,
      features: ['Interactive Stories', 'Progress Tracking', 'Achievements']
    },
    {
      id: 'teacher',
      title: t('roles.teacher.title'),
      description: t('roles.teacher.description'),
      icon: BookOpen,
      gradient: 'from-emerald-400 to-emerald-600',
      iconColor: 'text-emerald-500',
      shadowColor: 'rgba(52, 211, 153, 0.3)',
      href: `${dashboardPrefix}/teacher`,
      features: ['Classroom Tools', 'Student Analytics', 'Content Library']
    },
    {
      id: 'institution',
      title: t('roles.institution.title'),
      description: t('roles.institution.description'),
      icon: School,
      gradient: 'from-purple-400 to-purple-600',
      iconColor: 'text-purple-500',
      shadowColor: 'rgba(168, 85, 247, 0.3)',
      href: `${dashboardPrefix}/institution`,
      features: ['Program Management', 'Impact Reports', 'Global Network']
    },
    {
      id: 'volunteer',
      title: t('roles.volunteer.title'),
      description: t('roles.volunteer.description'),
      icon: Heart,
      gradient: 'from-rose-400 to-rose-600',
      iconColor: 'text-rose-500',
      shadowColor: 'rgba(244, 63, 94, 0.3)',
      href: `${dashboardPrefix}/volunteer`,
      features: ['Translation', 'Illustration', 'Mentorship']
    }
  ];
  
  const features = [
    {
      title: 'Global Stories',
      description: 'Access stories from children around the world',
      icon: Globe,
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Interactive Learning',
      description: 'Engage with content through interactive features',
      icon: Sparkles,
      gradient: 'from-indigo-400 to-indigo-600'
    },
    {
      title: 'Community Impact',
      description: 'Make a real difference in children\'s lives',
      icon: Users,
      gradient: 'from-purple-400 to-purple-600'
    }
  ];

  const stats = [
    { value: '500+', label: 'Stories Published', icon: BookOpen },
    { value: '10K+', label: 'Children Reached', icon: Users },
    { value: '50+', label: 'Countries', icon: Globe },
    { value: '100+', label: 'Volunteers', icon: Heart }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white">
      {/* Hero Section with hero image background */}
      <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
        {/* Hero background image */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-yellow-50/30 to-white" />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1920&h=1080&fit=crop)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-white/90" />
        </div>
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200 dark:border-indigo-800"
            >
              <Zap className="w-4 h-4" />
              Global Education Platform for Peace
              <ChevronRight className="w-4 h-4" />
            </motion.div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              <span className="block text-gray-900 mb-2">
                Empower Young Voices
              </span>
              <span className="text-brand-primary text-6xl sm:text-7xl lg:text-8xl font-bold">
                Inspire the World
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-brand-primary group">
                Join Our Community
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/library" className="btn-brand-secondary">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Stories
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-${feature.gradient.split('-')[1]}-500/25 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-lg">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-3xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-indigo-500" />
                  <div className="text-3xl sm:text-4xl font-bold text-brand-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Get Started Section */}
      <section id="get-started" className="py-24 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
              <Sparkles className="w-4 h-4" />
              Join Our Community
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Start Your Journey Today
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
              Discover amazing stories from children around the world. Whether you're here to learn, teach, volunteer, or support our mission, your journey begins with a single step.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-brand-primary group text-lg px-8 py-4">
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/library" className="btn-brand-secondary text-lg px-8 py-4">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Stories
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              Free to join • No commitment • Access granted instantly
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Impact/CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 sm:p-16 text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full">
              <Award className="w-4 h-4" />
              Seeds of Empowerment
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="text-brand-primary">Plant Seeds of Hope</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Every contribution plants seeds of hope and opportunity for children worldwide.
              Join us in creating a world where every child&apos;s voice is heard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/donate" className="btn-brand-primary group">
                <Heart className="w-5 h-5 mr-2" />
                Support Our Mission
                <Rocket className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
              <Link href="/volunteer" className="btn-brand-secondary">
                <Users className="w-5 h-5 mr-2" />
                Become a Volunteer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}