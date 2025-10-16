'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';

export default function HomePageHero() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-success-600 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/10"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)`
      }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="text-center">
          <ScrollAnimatedContainer animationType="slideUp" duration={800}>
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 text-sm font-medium mb-6">
                🌍 Global Education Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Discover Stories from
                <span className="block bg-gradient-to-r from-accent-300 to-secondary-300 bg-clip-text text-transparent">
                  Around the World
                </span>
              </h1>
            </div>
          </ScrollAnimatedContainer>

          <ScrollAnimatedContainer animationType="fadeIn" delay={400}>
            <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
              A global education platform that discovers, publishes, and shares stories
              from children in underserved communities.
              <span className="block mt-2 font-medium text-accent-200">
                Join us in building bridges through storytelling.
              </span>
            </p>
          </ScrollAnimatedContainer>

          <ScrollAnimatedContainer animationType="slideUp" delay={600}>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              {status === 'loading' ? (
                <div className="flex gap-4 justify-center">
                  <div className="w-48 h-14 bg-white/20 backdrop-blur-sm animate-pulse rounded-xl"></div>
                  <div className="w-48 h-14 bg-white/20 backdrop-blur-sm animate-pulse rounded-xl"></div>
                </div>
              ) : session ? (
                // Authenticated user CTAs
                <>
                  <button
                    onClick={handleDashboard}
                    className="btn btn-primary btn-lg bg-accent-400 hover:bg-accent-500 text-gray-900 font-bold px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                  >
                    Go to Dashboard
                  </button>
                  <Link
                    href="/library"
                    className="btn btn-outline btn-lg border-2 border-white/80 text-white hover:bg-white hover:text-gray-900 font-semibold px-10 py-4 rounded-xl backdrop-blur-sm bg-white/10 hover:bg-white transition-all duration-300 hover:scale-105"
                  >
                    Explore Stories
                  </Link>
                </>
              ) : (
                // Unauthenticated user CTAs
                <>
                  <Link
                    href="/signup"
                    className="btn btn-primary btn-lg bg-accent-400 hover:bg-accent-500 text-gray-900 font-bold px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                  >
                    Start Your Journey
                  </Link>
                  <Link
                    href="/library"
                    className="btn btn-outline btn-lg border-2 border-white/80 text-white hover:bg-white hover:text-gray-900 font-semibold px-10 py-4 rounded-xl backdrop-blur-sm bg-white/10 hover:bg-white transition-all duration-300 hover:scale-105"
                  >
                    Explore Stories
                  </Link>
                </>
              )}
            </div>
          </ScrollAnimatedContainer>

          {/* Trust Indicators */}
          <ScrollAnimatedContainer animationType="fadeIn" delay={800}>
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/70">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📚</span>
                <span className="text-sm font-medium">1000+ Stories</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <span className="text-sm font-medium">50+ Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <span className="text-sm font-medium">10K+ Learners</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💚</span>
                <span className="text-sm font-medium">Seeds of Empowerment</span>
              </div>
            </div>
          </ScrollAnimatedContainer>
        </div>
      </div>
    </div>
  );
}