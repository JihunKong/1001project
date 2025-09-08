'use client';

import Link from 'next/link';
import { BookOpen, Users, Brain, Sparkles, Award, Globe } from 'lucide-react';

export default function EnglishEducationInfo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              English Education Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering learners worldwide with AI-powered adaptive learning, 
              interactive content, and personalized education experiences.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* For Students */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">For Students</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Access 30+ curated stories and educational materials</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>AI-adapted content for your reading level</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Interactive vocabulary and comprehension exercises</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Track your progress and achievements</span>
                </li>
              </ul>
            </div>

            {/* For Teachers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">For Teachers</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Create and manage virtual classrooms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Assign reading materials and homework</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Monitor student progress in real-time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Upload and share custom materials</span>
                </li>
              </ul>
            </div>

            {/* AI Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">AI-Powered Learning</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Upstage AI text adaptation for age levels</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>AI tutor for vocabulary questions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Smart content recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Automated comprehension assessments</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-xl p-8 mb-12 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Choose Our Platform?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Sparkles className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Adaptive Learning</h3>
                <p className="text-blue-100">Content automatically adjusts to each student's reading level</p>
              </div>
              <div className="text-center">
                <Globe className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Global Stories</h3>
                <p className="text-blue-100">Learn from diverse stories from children around the world</p>
              </div>
              <div className="text-center">
                <Award className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Free Access</h3>
                <p className="text-blue-100">All educational content is completely free - no premium features</p>
              </div>
            </div>
          </div>

          {/* Sample Content Preview */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sample Materials Available</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">📚 Featured Stories</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• A Girl Comes to Stanford</li>
                  <li>• Angel's Prayer</li>
                  <li>• The Story of Neema</li>
                  <li>• Never Give Up</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">📖 Reading Levels</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Beginner (Ages 8-10)</li>
                  <li>• Intermediate (Ages 11-14)</li>
                  <li>• Advanced (Ages 15+)</li>
                  <li>• Custom adaptation available</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-gray-600 mb-8">
              Join thousands of students and teachers already using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Sign Up Free
              </Link>
              <Link
                href="/login?callbackUrl=/programs/english-education"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Login to Continue
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <Link
                href="/programs"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Programs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}