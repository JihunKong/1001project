'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Palette,
  Mic,
  Camera,
  Globe,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
  Award,
  Lightbulb,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workshops - 1001 Stories',
  description: 'Join interactive workshops on storytelling, creative writing, illustration, and digital media creation.',
  keywords: 'workshops, creative writing, storytelling, illustration, digital media, education',
  openGraph: {
    title: 'Creative Workshops - 1001 Stories',
    description: 'Develop your creative skills through hands-on workshops led by industry experts.',
    url: 'https://1001stories.org/programs/workshops',
    type: 'website',
  },
};

export default function Workshops() {
  const { t } = useTranslation('common');

  const workshopCategories = [
    {
      title: 'Creative Writing',
      description: 'Master the art of storytelling with expert-led writing workshops',
      icon: BookOpen,
      color: 'blue',
      workshops: 12,
      nextDate: 'Dec 15, 2024'
    },
    {
      title: 'Illustration & Art',
      description: 'Learn digital and traditional illustration techniques for storytelling',
      icon: Palette,
      color: 'purple',
      workshops: 8,
      nextDate: 'Dec 18, 2024'
    },
    {
      title: 'Voice & Narration',
      description: 'Develop your voice acting and audio storytelling skills',
      icon: Mic,
      color: 'green',
      workshops: 6,
      nextDate: 'Dec 20, 2024'
    },
    {
      title: 'Digital Media',
      description: 'Create multimedia stories using modern digital tools',
      icon: Camera,
      color: 'orange',
      workshops: 10,
      nextDate: 'Dec 22, 2024'
    }
  ];

  const upcomingWorkshops = [
    {
      id: 1,
      title: 'Story Structure Masterclass',
      instructor: 'Dr. Sarah Johnson',
      instructorTitle: 'Published Author & Writing Coach',
      date: 'December 15, 2024',
      time: '10:00 AM - 12:00 PM PST',
      duration: '2 hours',
      type: 'Online',
      level: 'Intermediate',
      spots: 15,
      maxSpots: 20,
      price: 'Free',
      category: 'Creative Writing',
      description: 'Learn the fundamental elements of compelling story structure, from character development to plot pacing.',
      objectives: [
        'Understand three-act story structure',
        'Develop compelling characters',
        'Master scene transitions',
        'Practice story outlining techniques'
      ]
    },
    {
      id: 2,
      title: 'Digital Illustration for Children\'s Books',
      instructor: 'Maria Santos',
      instructorTitle: 'Children\'s Book Illustrator',
      date: 'December 18, 2024',
      time: '2:00 PM - 5:00 PM EST',
      duration: '3 hours',
      type: 'Online',
      level: 'Beginner',
      spots: 8,
      maxSpots: 12,
      price: '$25',
      category: 'Illustration',
      description: 'Create engaging illustrations for children\'s stories using digital tools and techniques.',
      objectives: [
        'Basic digital painting techniques',
        'Character design for children',
        'Color theory for young readers',
        'Creating cohesive illustration series'
      ]
    },
    {
      id: 3,
      title: 'Podcast Storytelling Workshop',
      instructor: 'James Wilson',
      instructorTitle: 'Audio Producer & Storyteller',
      date: 'December 20, 2024',
      time: '6:00 PM - 8:00 PM GMT',
      duration: '2 hours',
      type: 'Online',
      level: 'All Levels',
      spots: 12,
      maxSpots: 15,
      price: 'Free',
      category: 'Audio',
      description: 'Learn how to create compelling audio stories and develop your voice as a narrator.',
      objectives: [
        'Voice projection and clarity',
        'Recording setup and equipment',
        'Editing audio stories',
        'Building audience engagement'
      ]
    }
  ];

  const workshopFormats = [
    {
      icon: Globe,
      title: 'Online Workshops',
      description: 'Join from anywhere in the world with interactive live sessions',
      features: ['Global access', 'Recording available', 'Interactive tools', 'Flexible timing']
    },
    {
      icon: Users,
      title: 'In-Person Events',
      description: 'Hands-on workshops in major cities with networking opportunities',
      features: ['Face-to-face learning', 'Networking events', 'Art supplies included', 'Local community']
    },
    {
      icon: Calendar,
      title: 'Self-Paced Courses',
      description: 'Complete comprehensive courses on your own schedule',
      features: ['Learn at your pace', 'Lifetime access', 'Community forums', 'Certificate completion']
    }
  ];

  const benefits = [
    {
      icon: Lightbulb,
      title: 'Expert Instruction',
      description: 'Learn from published authors, professional illustrators, and industry experts'
    },
    {
      icon: Users,
      title: 'Global Community',
      description: 'Connect with creative minds from around the world and build lasting relationships'
    },
    {
      icon: Award,
      title: 'Certificates',
      description: 'Receive certificates of completion to showcase your new skills and achievements'
    },
    {
      icon: BookOpen,
      title: 'Practical Projects',
      description: 'Work on real projects that you can add to your portfolio or publish on our platform'
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
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-blue-100 rounded-full">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">Creative Workshops</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Develop your storytelling skills through hands-on workshops led by industry experts. 
              From creative writing to digital illustration, find the perfect workshop to enhance your creative journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#upcoming"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
              >
                Browse Workshops
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all">
                <PlayCircle className="w-5 h-5" />
                Watch Preview
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workshop Categories */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Workshop Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our diverse range of workshops designed to develop every aspect of creative storytelling.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workshopCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-gradient-to-br from-${category.color}-50 to-${category.color}-100 p-8 rounded-xl hover:shadow-lg transition-all cursor-pointer group`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 mb-6 bg-${category.color}-500 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  <category.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>{category.workshops} workshops</span>
                  <span className="text-blue-600 font-medium">Next: {category.nextDate}</span>
                </div>
                <div className="mt-4 flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                  Explore Workshops
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Workshops */}
      <section id="upcoming" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Upcoming Workshops
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Register now for our upcoming workshops and start developing your creative skills with expert guidance.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {upcomingWorkshops.map((workshop, index) => (
              <motion.div
                key={workshop.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {workshop.category}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                      {workshop.level}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {workshop.title}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="font-medium text-gray-700">{workshop.instructor}</div>
                    <div className="text-sm text-gray-600">{workshop.instructorTitle}</div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {workshop.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {workshop.date}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {workshop.time} ({workshop.duration})
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {workshop.type}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {workshop.spots}/{workshop.maxSpots} spots available
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">Learning Objectives:</div>
                    <div className="space-y-1">
                      {workshop.objectives.slice(0, 2).map((objective, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {objective}
                        </div>
                      ))}
                      {workshop.objectives.length > 2 && (
                        <div className="text-sm text-blue-600">+ {workshop.objectives.length - 2} more objectives</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-gray-900">
                      {workshop.price}
                    </div>
                    <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Register Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshop Formats */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Flexible Learning Formats
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the learning format that works best for your schedule and learning preferences.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {workshopFormats.map((format, index) => (
              <motion.div
                key={format.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-full">
                  <format.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {format.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {format.description}
                </p>
                <div className="space-y-2">
                  {format.features.map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Workshops?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our workshops provide more than just learning - they offer community, certification, and real-world application.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center bg-white p-6 rounded-xl shadow-md"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                  <benefit.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Your Creative Journey Today
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of creative minds who have enhanced their storytelling skills through our expert-led workshops. 
              Register now and take your creativity to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                <Calendar className="w-5 h-5" />
                Browse All Workshops
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white rounded-full hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Custom Workshop Request
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}