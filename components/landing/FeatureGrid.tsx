'use client';

import React from 'react';
import { Globe, Brain, Users, PenTool, BookOpen, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
}

const features: Feature[] = [
  {
    icon: Globe,
    title: 'Global Storytelling',
    description: 'Connect with stories from children worldwide, bridging cultures through authentic narratives and shared experiences.',
    ctaText: 'Explore Stories',
    ctaLink: '/discover'
  },
  {
    icon: Brain,
    title: 'AI-Enhanced Learning',
    description: 'Word explanations, interactive Q&A, and intelligent content parsing tailored to each student&apos;s proficiency level.',
    ctaText: 'Learn More',
    ctaLink: '/features/ai-learning'
  },
  {
    icon: Users,
    title: 'Teacher Tools',
    description: 'Assign books, track student progress, manage classes, and provide personalized learning support.',
    ctaText: 'For Teachers',
    ctaLink: '/signup?role=teacher'
  },
  {
    icon: PenTool,
    title: 'Writer Community',
    description: 'Submit stories, receive feedback from editors, and publish your work to inspire young readers globally.',
    ctaText: 'Start Writing',
    ctaLink: '/signup?role=writer'
  }
];

const FeatureGrid: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Empowering Global Education
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how 1001 Stories transforms learning through cultural storytelling,
            AI-powered tools, and a vibrant global community.
          </p>
        </motion.div>

        {/* Feature Grid: 3-col desktop, 2-col tablet, 1-col mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-full p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-xl hover:border-primary-300 transition-all duration-300">
                {/* Icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary-200 transition-colors">
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-5 leading-relaxed">
                  {feature.description}
                </p>

                {/* Optional CTA Link */}
                {feature.ctaLink && (
                  <Link
                    href={feature.ctaLink}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium group-hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  >
                    {feature.ctaText || 'Learn More'}
                    <svg
                      className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}

          {/* Extra Features - Optional */}
          <motion.div
            className="group md:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: features.length * 0.1 }}
          >
            <div className="h-full p-6 sm:p-8 bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-2xl hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-xl flex items-center justify-center mb-5">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" aria-hidden="true" />
              </div>

              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Interactive Reading
              </h3>

              <p className="text-gray-700 mb-5 leading-relaxed">
                Engage with stories through discussion threads, vocabulary support, and collaborative book clubs.
              </p>

              <Link
                href="/library"
                className="inline-flex items-center text-primary-700 hover:text-primary-800 font-medium group-hover:underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              >
                Explore Library
                <svg
                  className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
