import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import HomePage from '@/components/discovery/HomePage';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <HomePageNavigation />

      {/* Enhanced Homepage with Figma Design */}
      <HomePage
        personalizationEnabled={false}
        abTestConfig={{
          testName: 'homepage_v2',
          variants: [
            { name: 'default', weight: 0.5, config: {} },
            { name: 'hero_minimal', weight: 0.25, config: {} },
            { name: 'compact_grid', weight: 0.25, config: {} }
          ],
          targetMetric: 'signup_rate',
          startDate: new Date(),
          active: true
        }}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center mb-4">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary-400" />
                <span className="ml-2 text-lg sm:text-xl font-bold">1001 Stories</span>
              </div>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                Empowering education through global storytelling and cultural exchange.
              </p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="/about" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">About</Link></li>
                <li><Link href="/contact" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="/signup?role=learner" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">For Students</Link></li>
                <li><Link href="/signup?role=teacher" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">For Teachers</Link></li>
                <li><Link href="/signup?role=writer" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">For Writers</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
                <li><Link href="/help" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white focus:text-white focus:outline-none transition-colors duration-200">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-sm sm:text-base">
            <p>&copy; 2024 1001 Stories. All rights reserved. A Seeds of Empowerment initiative.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}