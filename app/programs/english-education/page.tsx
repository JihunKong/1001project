'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Users, Award, Globe, CheckCircle, Calendar, Target, Sparkles } from 'lucide-react';

export default function EnglishEducationEnrollmentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);

  const handleEnrollment = async () => {
    if (!session) {
      router.push('/login');
      return;
    }

    setIsEnrolling(true);
    
    // Simulate enrollment process
    setTimeout(() => {
      setEnrollmentSuccess(true);
      setIsEnrolling(false);
      
      // Redirect to learning dashboard after successful enrollment
      setTimeout(() => {
        router.push('/learn');
      }, 2000);
    }, 1500);
  };

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Adaptive Learning",
      description: "AI-powered content that adjusts to your reading level"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Expert Teachers",
      description: "Learn from certified ESL instructors worldwide"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Certificates",
      description: "Earn recognized certificates upon completion"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Community",
      description: "Connect with learners from around the world"
    }
  ];

  const curriculum = [
    { level: "Beginner", topics: ["Basic Vocabulary", "Simple Sentences", "Daily Conversations"], duration: "3 months" },
    { level: "Intermediate", topics: ["Grammar Structures", "Reading Comprehension", "Essay Writing"], duration: "4 months" },
    { level: "Advanced", topics: ["Academic Writing", "Literature Analysis", "Public Speaking"], duration: "5 months" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              English Education Program
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Transform your English skills with our comprehensive learning program
            </p>
            
            {session?.user?.role === 'LEARNER' || session?.user?.role === 'STUDENT' ? (
              <Link 
                href="/learn" 
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Go to My Learning Dashboard
              </Link>
            ) : (
              <button
                onClick={handleEnrollment}
                disabled={isEnrolling || enrollmentSuccess}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrollmentSuccess ? (
                  <>
                    <CheckCircle className="mr-2 w-5 h-5 text-green-600" />
                    Enrollment Successful! Redirecting...
                  </>
                ) : isEnrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                    Processing Enrollment...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-5 h-5" />
                    Enroll Now - It's Free!
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Why Choose Our Program?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Curriculum Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Structured Curriculum
          </h2>
          
          <div className="space-y-6">
            {curriculum.map((level, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <Target className="w-5 h-5 text-blue-600 mr-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        {level.level} Level
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {level.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">{level.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Take Assessment</h3>
            <p className="text-gray-600">
              We'll evaluate your current English level to personalize your learning path
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">Learn & Practice</h3>
            <p className="text-gray-600">
              Access tailored content, interactive exercises, and live sessions
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Monitor your improvement and earn certificates as you advance
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your English Journey?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of learners improving their English skills every day
          </p>
          
          {session?.user?.role === 'LEARNER' || session?.user?.role === 'STUDENT' ? (
            <Link 
              href="/learn" 
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105"
            >
              <BookOpen className="mr-2 w-5 h-5" />
              Access Your Learning Dashboard
            </Link>
          ) : (
            <button
              onClick={handleEnrollment}
              disabled={isEnrolling || enrollmentSuccess}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrollmentSuccess ? (
                <>
                  <CheckCircle className="mr-2 w-5 h-5 text-green-600" />
                  Enrollment Successful! Redirecting...
                </>
              ) : isEnrolling ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-2"></div>
                  Processing Enrollment...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-5 h-5" />
                  Start Learning for Free
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}