'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BookOpen, Search, Globe, Users, Star, Award, ArrowRight } from 'lucide-react';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';

export default function LibraryLandingPage() {
  const { data: session } = useSession();

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: '22+ Stories from 6 Countries',
      description: 'Discover authentic stories from children in Tanzania, India, Mexico, Palestine, Rwanda, and Uganda.',
      color: 'text-blue-600'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: '12 Languages Available',
      description: 'Access stories in multiple languages including English, Spanish, French, Arabic, Hindi, and more.',
      color: 'text-green-600'
    },
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Advanced Search & Filters',
      description: 'Find the perfect story with filters for age range, difficulty level, educational themes, and more.',
      color: 'text-purple-600'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Age-Appropriate Content',
      description: 'Stories categorized by age (5-8, 9-12, 13-18) and reading difficulty levels.',
      color: 'text-orange-600'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Educational Categories',
      description: 'Stories organized by themes like Perseverance, Problem Solving, Empathy, and more.',
      color: 'text-yellow-600'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Curated Collections',
      description: 'Featured stories, premium content, and teacher-recommended selections.',
      color: 'text-pink-600'
    }
  ];

  const stats = [
    { value: '22+', label: 'Published Stories' },
    { value: '6', label: 'Countries' },
    { value: '12', label: 'Languages' },
    { value: '7', label: 'Educational Themes' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ScrollAnimatedContainer animationType="fadeIn" duration={800}>
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-6" />
              <h1 className="text-5xl font-bold mb-4">
                Discover Stories from Around the World
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                The 1001 Stories Library brings you authentic narratives from children in underserved communities,
                fostering empathy, understanding, and global connections through the power of storytelling.
              </p>
              <div className="flex justify-center gap-4">
                {!session ? (
                  <>
                    <Link
                      href="/signup"
                      className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      Get Started Free
                    </Link>
                    <Link
                      href="/login"
                      className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/dashboard/writer/library"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg inline-flex items-center gap-2"
                  >
                    Browse Library
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </ScrollAnimatedContainer>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <ScrollAnimatedContainer key={index} animationType="slideUp" delay={index * 100}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </ScrollAnimatedContainer>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ScrollAnimatedContainer animationType="fadeIn">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Reader
            </h2>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto">
              Our library is designed to make discovering and reading stories effortless and enjoyable for students, teachers, and writers alike.
            </p>
          </div>
        </ScrollAnimatedContainer>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollAnimatedContainer key={index} animationType="slideUp" delay={index * 100}>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
                <div className={`${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-900">
                  {feature.description}
                </p>
              </div>
            </ScrollAnimatedContainer>
          ))}
        </div>
      </div>

      {/* Educational Themes */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <ScrollAnimatedContainer animationType="fadeIn">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                7 Educational Themes
              </h2>
              <p className="text-xl text-gray-900">
                Stories organized by important life lessons and values
              </p>
            </div>
          </ScrollAnimatedContainer>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {['Perseverance', 'Problem Solving', 'Courage & Self-Advocacy', 'Empathy & Compassion', 'Responsibility & Ethics', 'Relationships & Communication', 'Learning & Growth'].map((theme, index) => (
              <ScrollAnimatedContainer key={index} animationType="slideUp" delay={index * 50}>
                <div className="bg-white rounded-lg p-4 shadow-md text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="text-sm font-medium text-gray-900">{theme}</div>
                </div>
              </ScrollAnimatedContainer>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <ScrollAnimatedContainer animationType="fadeIn">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Explore Global Stories?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of readers discovering authentic narratives from around the world.
            </p>
            <div className="flex justify-center gap-4">
              {!session ? (
                <>
                  <Link
                    href="/signup"
                    className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard/writer/library"
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg inline-flex items-center gap-2"
                >
                  Go to Library
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </ScrollAnimatedContainer>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-900">
            All stories are published with permission from the authors. Revenue supports the Seeds of Empowerment program.
          </p>
        </div>
      </div>
    </div>
  );
}
