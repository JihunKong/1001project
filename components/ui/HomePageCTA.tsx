'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ScrollAnimatedContainer from '@/components/ui/ScrollAnimatedContainer';

export default function HomePageCTA() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="bg-soe-green-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-96 h-8 bg-gray-200 bg-opacity-30 animate-pulse rounded mx-auto mb-4"></div>
          <div className="w-80 h-6 bg-gray-200 bg-opacity-30 animate-pulse rounded mx-auto mb-8"></div>
          <div className="w-48 h-12 bg-gray-200 bg-opacity-30 animate-pulse rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-soe-green-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {session ? (
          // Authenticated user CTA
          <>
            <ScrollAnimatedContainer animationType="slideUp" delay={200}>
              <h2 className="text-3xl font-bold text-white mb-4">
                Welcome Back to Your Learning Journey!
              </h2>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="fadeIn" delay={400}>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Continue exploring stories, managing your content, or dive into your personalized dashboard.
              </p>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="scaleIn" delay={600}>
              <button
                onClick={handleDashboard}
                className="bg-soe-yellow-400 hover:bg-soe-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                Go to Your Dashboard
              </button>
            </ScrollAnimatedContainer>
          </>
        ) : (
          // Unauthenticated user CTA
          <>
            <ScrollAnimatedContainer animationType="slideUp" delay={200}>
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Change the World Through Stories?
              </h2>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="fadeIn" delay={400}>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of students, teachers, and writers who are making
                education accessible for everyone, everywhere.
              </p>
            </ScrollAnimatedContainer>
            <ScrollAnimatedContainer animationType="scaleIn" delay={600}>
              <Link
                href="/signup"
                className="bg-soe-yellow-400 hover:bg-soe-yellow-500 text-black px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-110 hover:shadow-lg"
              >
                Join 1001 Stories Today
              </Link>
            </ScrollAnimatedContainer>
          </>
        )}
      </div>
    </div>
  );
}