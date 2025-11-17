'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import HomePageNavigation from '@/components/ui/HomePageNavigation';
import EnhancedHeroSection from '@/components/ui/EnhancedHeroSection';
import MissionVisionSection from '@/components/landing/MissionVisionSection';
import ProgramSections from '@/components/landing/ProgramSections';
import OutcomeStatistics from '@/components/landing/OutcomeStatistics';
import FooterCTA from '@/components/landing/FooterCTA';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <HomePageNavigation />

      {/* Hero Section */}
      <EnhancedHeroSection />

      {/* Mission/Vision Section */}
      <MissionVisionSection />

      {/* Program Sections */}
      <ProgramSections />

      {/* Outcome Statistics */}
      <OutcomeStatistics />

      {/* Footer CTA */}
      <FooterCTA />

      {/* Footer */}
      <footer
        className="py-12"
        style={{
          background: '#8FD0AA'
        }}
      >
        <div className="max-w-[1240px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8">
            {/* Logo and Tagline */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="w-7 h-7"
                  style={{ color: '#608A3A' }}
                />
                <span
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#608A3A',
                    lineHeight: '36px'
                  }}
                >
                  1001 Stories
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#FAFAFA',
                  lineHeight: '38px'
                }}
              >
                {t('footer.tagline')}
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
            <div />

            {/* Contact */}
            <div className="space-y-4">
              <h3
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.contact')}
              </h3>

              <div className="space-y-2">
                <a
                  href="mailto:info@1001stories.org"
                  className="block hover:underline"
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#FAFAFA',
                    lineHeight: '19px'
                  }}
                >
                  info@1001stories.org
                </a>

                <Link
                  href="/contact"
                  className="block hover:underline"
                  style={{
                    fontFamily: 'Poppins',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#FAFAFA',
                    lineHeight: '24px'
                  }}
                >
                  {t('footer.contactForm')}
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{
              borderTop: '1px solid #FAFAFA'
            }}
          />

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              style={{
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 600,
                color: '#FAFAFA',
                lineHeight: '24px'
              }}
            >
              {t('footer.copyright')}
            </p>

            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="hover:underline"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.privacy')}
              </Link>

              <Link
                href="/terms"
                className="hover:underline"
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#FAFAFA',
                  lineHeight: '24px'
                }}
              >
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
