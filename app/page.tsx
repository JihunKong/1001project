import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import EnhancedHeroSection from '@/components/ui/EnhancedHeroSection';
import FeatureGrid from '@/components/landing/FeatureGrid';
import ProgramSections from '@/components/landing/ProgramSections';
import FooterCTA from '@/components/landing/FooterCTA';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <HomePageNavigation />

      {/* Hero Section */}
      <EnhancedHeroSection />

      {/* Feature Cards */}
      <FeatureGrid />

      {/* Program Sections */}
      <ProgramSections />

      {/* Footer CTA */}
      <FooterCTA />

      {/* Footer */}
      <footer className="bg-[#8FD0AA] text-white py-12">
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            {/* Logo and Tagline */}
            <div className="space-y-6">
              <div className="flex items-center">
                <BookOpen className="h-7 w-7 text-[#608A3A]" />
                <span
                  className="ml-2 text-[#608A3A] font-semibold"
                  style={{ fontFamily: 'Poppins', fontSize: '24px', lineHeight: '36px' }}
                >
                  1001 Stories
                </span>
              </div>

              <p
                className="text-[#FAFAFA]"
                style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 500, lineHeight: '38px' }}
              >
                Empowering young voices and inspiring the world through stories.
              </p>

              {/* Social Icons */}
              <div className="relative w-[136px] h-[32px]">
                <Image
                  src="/landing/social-icons.svg"
                  alt="Social media icons"
                  width={136}
                  height={32}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Spacer */}
            <div></div>

            {/* Contact */}
            <div className="space-y-4">
              <h3
                className="text-[#FAFAFA] font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                Contact
              </h3>
              <div className="space-y-2">
                <a
                  href="mailto:info@1001stories.org"
                  className="block text-[#FAFAFA] hover:underline"
                  style={{ fontFamily: 'Inter', fontSize: '16px', fontWeight: 500, lineHeight: '19px' }}
                >
                  info@1001stories.org
                </a>
                <Link
                  href="/contact"
                  className="block text-[#FAFAFA] hover:underline"
                  style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 400, lineHeight: '24px' }}
                >
                  Contact Form
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#FAFAFA] mb-6"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p
              className="text-[#FAFAFA] font-semibold"
              style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
            >
              ©2024 1001 Stories. All rights reserved
            </p>
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-[#FAFAFA] hover:underline font-semibold"
                style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '24px' }}
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}