'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Globe, Users, ArrowRight, Play, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroSectionProps {
  abTestVariant?: string;
  onEngagement?: (metrics: any) => void;
}

const EnhancedHeroSection: React.FC<HeroSectionProps> = ({
  abTestVariant = 'default',
  onEngagement
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const heroSlides = [
    {
      id: 1,
      title: "Discover Stories That Connect Cultures",
      subtitle: "Explore authentic narratives from around the world, bridging cultures through the power of storytelling",
      image: "https://1001-stories-books.s3.us-east-2.amazonaws.com/media/hero-classroom.jpg",
      stats: "1,000+ Stories",
      featured: "Featured: Children's Tales from 7 Continents"
    },
    {
      id: 2,
      title: "Learn Through Global Storytelling",
      subtitle: "Educational adventures that open minds and hearts to diverse cultures and perspectives",
      image: "https://1001-stories-books.s3.us-east-2.amazonaws.com/media/hero-classroom-2.jpg",
      stats: "500+ Teachers",
      featured: "Featured: AI-Powered Learning Assistance"
    },
    {
      id: 3,
      title: "Share Your Cultural Heritage",
      subtitle: "Join our community of storytellers preserving and sharing cultural wisdom for future generations",
      image: "https://1001-stories-books.s3.us-east-2.amazonaws.com/media/hero-classroom-3.jpg",
      stats: "200+ Contributors",
      featured: "Featured: Stories from Underserved Communities"
    }
  ];

  const achievements = [
    { icon: Globe, label: "Global Reach", value: "50+ Countries" },
    { icon: BookOpen, label: "Stories Published", value: "1,000+" },
    { icon: Users, label: "Active Learners", value: "10,000+" },
    { icon: Heart, label: "Lives Impacted", value: "25,000+" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCTAClick = (ctaType: string) => {
    onEngagement?.({
      storyId: 'hero_cta',
      sessionId: Date.now().toString(),
      timestamp: new Date(),
      eventType: 'click',
      metadata: { ctaType, slide: currentSlide },
      abTestVariant,
      conversionFunnel: 'homepage_to_discovery'
    });
  };

  const currentHero = heroSlides[currentSlide];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-soe-green-50 via-white to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-soe-green-100/20 to-transparent"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/20 to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-4 h-4 bg-soe-green-400 rounded-full opacity-60"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-40 right-20 w-6 h-6 bg-blue-400 rounded-full opacity-40"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-32 left-1/4 w-3 h-3 bg-purple-400 rounded-full opacity-50"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-screen py-20">

          {/* Left Column - Content */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 bg-soe-green-100 text-soe-green-800 rounded-full text-sm font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Star className="w-4 h-4 mr-2 text-soe-green-600" />
              {currentHero?.featured}
            </motion.div>

            {/* Main Headline */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentSlide}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6 }}
              >
                {currentHero.title}
              </motion.h1>
            </AnimatePresence>

            {/* Subtitle */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`subtitle-${currentSlide}`}
                className="text-xl text-gray-600 leading-relaxed max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {currentHero.subtitle}
              </motion.p>
            </AnimatePresence>

            {/* Stats */}
            <motion.div
              className="flex items-center space-x-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-3xl font-bold text-soe-green-600">
                {currentHero.stats}
              </div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500">Trusted by educators worldwide</span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/signup"
                onClick={() => handleCTAClick('primary_cta')}
                className="inline-flex items-center justify-center px-8 py-4 bg-soe-green-400 hover:bg-soe-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={() => {
                  setIsVideoPlaying(true);
                  handleCTAClick('watch_demo');
                }}
                className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-soe-green-400 text-soe-green-600 hover:bg-soe-green-50 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </motion.div>

            {/* Achievement Stats */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <achievement.icon className="w-8 h-8 text-soe-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{achievement.value}</div>
                  <div className="text-sm text-gray-600">{achievement.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Main Hero Image */}
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide}
                  src={currentHero.image}
                  alt={currentHero.title}
                  className="w-full h-96 object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.8 }}
                />
              </AnimatePresence>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

              {/* Play Button Overlay */}
              <motion.button
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsVideoPlaying(true)}
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-soe-green-600 ml-1" />
                </div>
              </motion.button>
            </div>

            {/* Floating Cards */}
            <motion.div
              className="absolute -top-8 -right-8 bg-white rounded-xl shadow-lg p-4 max-w-48"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-soe-green-100 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-soe-green-600" />
                </div>
                <span className="font-semibold text-sm">Global Impact</span>
              </div>
              <p className="text-xs text-gray-600">Stories from 50+ countries connecting young minds worldwide</p>
            </motion.div>

            <motion.div
              className="absolute -bottom-8 -left-8 bg-white rounded-xl shadow-lg p-4 max-w-48"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-sm">AI-Powered</span>
              </div>
              <p className="text-xs text-gray-600">Intelligent learning assistance for every student&apos;s journey</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <motion.div
          className="flex justify-center space-x-2 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-soe-green-400 w-8' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              className="bg-white rounded-lg p-6 max-w-4xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">1001 Stories Platform Demo</h3>
              <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  src="https://1001-stories-books.s3.us-east-2.amazonaws.com/media/1001StoriesWinner.mov"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="mt-4 px-6 py-2 bg-soe-green-400 text-white rounded-lg hover:bg-soe-green-500 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default EnhancedHeroSection;